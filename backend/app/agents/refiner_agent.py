# File: backend/app/agents/refiner_agent.py
# Feature 10: Refiner Agent - Hybrid refinement of failed outputs
# Phase 1: LLM rewrites weak sections using critic feedback
# Phase 2: Targeted data re-gathering for concrete data gaps
# Phase 3: Programmatic fixes for enums/numeric validity

from typing import Dict, Any, List
import os
import json
from datetime import datetime
from dotenv import load_dotenv
from groq import Groq
from sqlalchemy.orm import Session

from app.utils.logger import logger
from app.models.idea import StructuredIdea
from app.models.validation import ValidationSession
from app.services.enhanced_web_search import EnhancedWebSearchService
from app.services.competitor_scraper import CompetitorPricingScraper
from app.services.enhanced_review_scraper import EnhancedReviewScraper
from app.config import settings

load_dotenv()


class RefinerAgent:
    """
    Hybrid Refiner Agent.

    When the Critic Agent scores outputs below threshold:
    1. LLM rewrites weak sections (preserving strong ones)
    2. Targeted data re-gathering fills concrete gaps (missing $, sources, reviews)
    3. Programmatic fixes normalize enums and numeric ranges

    Result overwrites the original in ValidationSession.results.
    """

    def __init__(self):
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            raise ValueError("GROQ_API_KEY not found")

        self.client = Groq(api_key=api_key)
        self.web_search = EnhancedWebSearchService()
        self.competitor_scraper = CompetitorPricingScraper()
        self.review_scraper = EnhancedReviewScraper()
        self.max_iterations = settings.MAX_REFINEMENT_ITERATIONS

        logger.info("🔧 Refiner Agent initialized")

    # -------------------------------------------------------------------------
    # Main orchestrator
    # -------------------------------------------------------------------------

    def refine_all(self, idea_id: int, db: Session) -> Dict[str, Any]:
        """
        Orchestrate refinement of all failed outputs for an idea.
        Loads evaluation, refines each failed section, saves back to DB.
        """
        logger.info("=" * 70)
        logger.info(f"🔧 STARTING REFINEMENT FOR IDEA #{idea_id}")
        logger.info("=" * 70)

        # Load idea
        idea = db.query(StructuredIdea).filter(StructuredIdea.id == idea_id).first()
        if not idea:
            raise ValueError(f"Idea #{idea_id} not found")

        structured_idea = idea.structured_data

        # Load latest validation session
        session = db.query(ValidationSession).filter(
            ValidationSession.structured_idea_id == idea_id
        ).order_by(ValidationSession.created_at.desc()).first()

        if not session or not session.results:
            raise ValueError("No validation results found")

        if not session.quality_evaluation:
            raise ValueError("No quality evaluation found. Run quality check first.")

        quality_eval = session.quality_evaluation
        evaluations = quality_eval.get('evaluations', {})
        results = dict(session.results)  # copy

        # Check iteration count
        existing_log = quality_eval.get('refinement_log', {})
        iteration = existing_log.get('iteration', 0) + 1
        if iteration > self.max_iterations:
            raise ValueError(f"Max refinement iterations ({self.max_iterations}) reached")

        # Track what we refine
        refinement_log = {
            'iteration': iteration,
            'market_validation': {'refined': False},
            'competitor_analysis': {'refined': False}
        }

        # Refine market validation if it failed
        market_eval = evaluations.get('market_validation', {})
        if results.get('market_validation') and not market_eval.get('passed', True):
            logger.info("🔧 Refining market validation...")
            refined_market = self.refine_market_validation(
                original_output=results['market_validation'],
                evaluation=market_eval,
                structured_idea=structured_idea
            )
            results['market_validation'] = refined_market
            refinement_log['market_validation'] = {
                'refined': True,
                'original_score': market_eval.get('overall_score'),
                'issues_addressed': len(market_eval.get('programmatic_checks', {}).get('issues_summary', []))
            }
            logger.info("✅ Market validation refined")

        # Refine competitor analysis if it failed
        comp_eval = evaluations.get('competitor_analysis', {})
        if results.get('competitor_analysis') and not comp_eval.get('passed', True):
            logger.info("🔧 Refining competitor analysis...")
            refined_comp = self.refine_competitor_analysis(
                original_output=results['competitor_analysis'],
                evaluation=comp_eval,
                structured_idea=structured_idea
            )
            results['competitor_analysis'] = refined_comp
            refinement_log['competitor_analysis'] = {
                'refined': True,
                'original_score': comp_eval.get('overall_score'),
                'issues_addressed': len(comp_eval.get('programmatic_checks', {}).get('issues_summary', []))
            }
            logger.info("✅ Competitor analysis refined")

        # Save refined results back to DB
        session.results = results
        quality_eval['refinement_log'] = refinement_log
        quality_eval['refined_at'] = datetime.utcnow().isoformat()
        session.quality_evaluation = quality_eval
        db.commit()

        logger.info("=" * 70)
        logger.info(f"🔧 REFINEMENT COMPLETE (iteration {iteration})")
        logger.info("=" * 70)

        return {
            'status': 'refined',
            'iteration': iteration,
            'refinement_log': refinement_log,
            'message': 'Refinement complete. Run quality check again to verify improvements.'
        }

    # -------------------------------------------------------------------------
    # Market validation refinement
    # -------------------------------------------------------------------------

    def refine_market_validation(
        self,
        original_output: Dict[str, Any],
        evaluation: Dict[str, Any],
        structured_idea: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Refine market validation: LLM rewrite + data re-gathering + fixes."""

        # Phase 1: LLM rewrite of weak sections
        rewritten = self._llm_rewrite(original_output, evaluation, 'market_validation')
        merged = self._merge(original_output, rewritten)

        # Phase 2: Targeted data re-gathering
        gaps = self._identify_data_gaps(evaluation, 'market_validation')
        if gaps:
            logger.info(f"  Filling {len(gaps)} data gaps...")
            patch = self._fill_market_gaps(gaps, structured_idea, merged)
            merged = self._apply_patch(merged, patch)

        # Phase 3: Programmatic fixes
        merged = self._fix_market_validity(merged)

        merged['_refined'] = True
        return merged

    # -------------------------------------------------------------------------
    # Competitor analysis refinement
    # -------------------------------------------------------------------------

    def refine_competitor_analysis(
        self,
        original_output: Dict[str, Any],
        evaluation: Dict[str, Any],
        structured_idea: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Refine competitor analysis: LLM rewrite + data re-gathering + fixes."""

        # Phase 1: LLM rewrite of weak sections
        rewritten = self._llm_rewrite(original_output, evaluation, 'competitor_analysis')
        merged = self._merge(original_output, rewritten)

        # Phase 2: Targeted data re-gathering
        gaps = self._identify_data_gaps(evaluation, 'competitor_analysis')
        if gaps:
            logger.info(f"  Filling {len(gaps)} data gaps...")
            patch = self._fill_competitor_gaps(gaps, structured_idea, merged)
            merged = self._apply_patch(merged, patch)

        merged['_refined'] = True
        return merged

    # -------------------------------------------------------------------------
    # Phase 1: LLM Rewrite
    # -------------------------------------------------------------------------

    def _llm_rewrite(
        self,
        original: Dict[str, Any],
        evaluation: Dict[str, Any],
        output_type: str
    ) -> Dict[str, Any]:
        """Ask LLM to rewrite weak sections based on critic feedback."""

        weaknesses = evaluation.get('weaknesses', [])
        improvements = evaluation.get('required_improvements', [])
        issues = evaluation.get('programmatic_checks', {}).get('issues_summary', [])
        score = evaluation.get('overall_score', 0)

        weaknesses_text = "\n".join(f"- {w}" for w in weaknesses) or "- None listed"
        improvements_text = "\n".join(f"- {i}" for i in improvements) or "- None listed"
        issues_text = "\n".join(f"- {i}" for i in issues[:10]) or "- None found"

        if output_type == 'market_validation':
            type_instructions = """SPECIFIC FIXES REQUIRED:
- TAM, SAM, SOM: Each MUST have a specific dollar amount (e.g., "$4.5B") AND a source citation (e.g., "Source: Grand View Research, 2024")
- market_growth_rate: Must have a specific percentage AND source
- evidence: Each item must cite a specific report/study name and year
- target_segments: At least 2 segments, each with segment name, market size, pain_points list, willingness_to_pay
- revenue_potential: All estimates must have specific dollar amounts with calculation reasoning
- confidence_score: Must be a float between 0.0 and 1.0
- market_demand: Must be exactly "high", "medium", or "low"
- recommendation: Must be exactly "Proceed", "Pivot", or "Stop" """
        else:
            type_instructions = """SPECIFIC FIXES REQUIRED:
- Each competitor must have: name, overview (>20 chars), key_features (>=2 items), pricing_model, price_range with dollar amounts
- review_summary: Each competitor needs average_rating (1-5), total_reviews (number), top_complaints, top_praises
- customer_sentiment: Must be exactly "positive", "mixed", or "negative"
- gap_analysis: At least 2 items, each with gap, impact (high/medium/low), your_opportunity, evidence
- differentiation_opportunities: At least 2 items with priority (high/medium/low)
- strategic_recommendations: At least 2 items with recommendation, category, rationale, priority
- feature_comparison_matrix: At least 3 features with boolean coverage for each competitor"""

        prompt = f"""You are a quality improvement specialist. A market research output scored {score}/10 and needs improvement.

ORIGINAL OUTPUT:
{json.dumps(original, indent=2)[:5000]}

WEAKNESSES FOUND:
{weaknesses_text}

REQUIRED IMPROVEMENTS:
{improvements_text}

DATA QUALITY ISSUES (automated checks):
{issues_text}

{type_instructions}

RULES:
1. PRESERVE all sections that are already strong — do not remove good data
2. IMPROVE only the weak sections identified above
3. Add specific numbers with dollar signs where missing
4. Add source citations (report name, year) where missing
5. Keep the EXACT SAME JSON structure as the input
6. Return the COMPLETE improved JSON — not just the changed parts

Return ONLY valid JSON (same structure as input):"""

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=4000
            )

            response_text = response.choices[0].message.content.strip()

            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]

            result = json.loads(response_text.strip())
            logger.info("  Phase 1 (LLM rewrite): success")
            return result

        except Exception as e:
            logger.error(f"  Phase 1 (LLM rewrite) failed: {e}")
            return {}

    # -------------------------------------------------------------------------
    # Phase 2: Identify and fill data gaps
    # -------------------------------------------------------------------------

    def _identify_data_gaps(self, evaluation: Dict[str, Any], output_type: str) -> List[Dict]:
        """Parse programmatic checks to find concrete data gaps."""
        gaps = []
        prog = evaluation.get('programmatic_checks', {})
        breakdown = prog.get('breakdown', {})

        if output_type == 'market_validation':
            specificity = breakdown.get('data_specificity', {})
            checks = specificity.get('checks', {})
            for field, has_data in checks.items():
                if not has_data:
                    gaps.append({'type': 'missing_number', 'field': field})

            citations = breakdown.get('source_citations', {})
            for field in citations.get('uncited_fields', []):
                gaps.append({'type': 'missing_source', 'field': field})

            arrays = breakdown.get('array_depth', {})
            if arrays.get('evidence', 0) < 3:
                gaps.append({'type': 'insufficient_evidence'})

            sources = breakdown.get('data_source_diversity', {})
            if sources.get('sources_used', 0) < 3:
                gaps.append({'type': 'low_source_diversity'})

        elif output_type == 'competitor_analysis':
            coverage = breakdown.get('competitor_coverage', {})
            if coverage.get('score', 0) < 0.6:
                gaps.append({'type': 'incomplete_competitors'})

            reviews = breakdown.get('review_data_quality', {})
            if reviews.get('score', 0) < 0.6:
                gaps.append({'type': 'missing_reviews'})

            price = breakdown.get('price_data', {})
            if price.get('score', 0) < 0.6:
                gaps.append({'type': 'missing_pricing'})

            gap_depth = breakdown.get('gap_analysis_depth', {})
            if gap_depth.get('score', 0) < 0.6:
                gaps.append({'type': 'shallow_gap_analysis'})

        return gaps

    def _fill_market_gaps(
        self,
        gaps: List[Dict],
        structured_idea: Dict[str, Any],
        current: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Fill market validation data gaps using web search."""
        patch = {}
        problem = structured_idea.get('problem_statement', '')
        target = structured_idea.get('target_audience', '')

        for gap in gaps:
            try:
                if gap['type'] == 'missing_number':
                    field = gap['field']
                    query = f"{problem} {target} {field.replace('_', ' ')} market size 2024 dollars"
                    results = self.web_search.search(query, num_results=3)
                    if results:
                        snippets = ' '.join([r.get('snippet', '') for r in results])
                        source = results[0].get('title', 'Web Research')
                        current_val = str(current.get(field, ''))
                        if snippets and len(snippets) > 20:
                            patch[field] = f"{current_val} - Updated: {snippets[:200]} (Source: {source})"
                            logger.info(f"    Filled {field} with web data")

                elif gap['type'] == 'missing_source':
                    field = gap['field']
                    current_val = str(current.get(field, ''))
                    query = f"{field.replace('_', ' ')} {problem} market research report"
                    results = self.web_search.search(query, num_results=2)
                    if results:
                        source = results[0].get('title', '')
                        if source and source not in current_val:
                            patch[field] = f"{current_val} (Source: {source})"
                            logger.info(f"    Added source citation to {field}")

                elif gap['type'] == 'insufficient_evidence':
                    query = f"{problem} {target} market evidence statistics data"
                    results = self.web_search.search(query, num_results=5)
                    new_evidence = []
                    for r in results:
                        snippet = r.get('snippet', '')
                        source = r.get('title', r.get('source', ''))
                        if snippet and len(snippet) > 20:
                            new_evidence.append(f"{snippet[:150]} (Source: {source})")

                    existing = current.get('evidence', [])
                    if isinstance(existing, list) and new_evidence:
                        patch['evidence'] = (existing + new_evidence)[:8]
                        logger.info(f"    Added {len(new_evidence)} evidence items")

            except Exception as e:
                logger.warning(f"    Gap fill failed for {gap}: {e}")

        return patch

    def _fill_competitor_gaps(
        self,
        gaps: List[Dict],
        structured_idea: Dict[str, Any],
        current: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Fill competitor analysis data gaps using scraping services."""
        patch = {}
        competitors = current.get('competitor_comparison', [])
        if not isinstance(competitors, list):
            return patch

        for gap in gaps:
            try:
                if gap['type'] == 'missing_pricing':
                    updated_comps = list(competitors)
                    for i, comp in enumerate(updated_comps):
                        if not isinstance(comp, dict):
                            continue
                        name = comp.get('name', '')
                        price_range = str(comp.get('price_range', ''))
                        if name and '$' not in price_range:
                            scraped = self.competitor_scraper.scrape_competitor(name)
                            if scraped and scraped.get('pricing'):
                                updated_comps[i] = dict(comp)
                                updated_comps[i]['price_range'] = scraped.get('pricing', price_range)
                                updated_comps[i]['pricing_model'] = scraped.get('pricing_model', comp.get('pricing_model', ''))
                                logger.info(f"    Updated pricing for {name}")
                    patch['competitor_comparison'] = updated_comps

                elif gap['type'] == 'missing_reviews':
                    updated_comps = list(competitors)
                    for i, comp in enumerate(updated_comps):
                        if not isinstance(comp, dict):
                            continue
                        name = comp.get('name', '')
                        review = comp.get('review_summary', {})
                        if not isinstance(review, dict) or not review.get('total_reviews'):
                            scraped = self.review_scraper.scrape_reviews_via_search(name)
                            if scraped and scraped.get('reviews'):
                                updated_comps[i] = dict(comp)
                                updated_comps[i]['review_summary'] = {
                                    'average_rating': scraped.get('average_rating', 0),
                                    'total_reviews': scraped.get('review_count', 0),
                                    'top_complaints': scraped.get('negative_themes', [])[:3],
                                    'top_praises': scraped.get('positive_themes', [])[:3],
                                    'switching_reasons': scraped.get('switching_reasons', ['Price', 'Features'])
                                }
                                logger.info(f"    Updated reviews for {name}")
                    patch['competitor_comparison'] = updated_comps

                elif gap['type'] == 'incomplete_competitors':
                    updated_comps = list(competitors)
                    for i, comp in enumerate(updated_comps):
                        if not isinstance(comp, dict):
                            continue
                        name = comp.get('name', '')
                        overview = comp.get('overview', '')
                        if name and (not overview or len(overview) < 20):
                            results = self.web_search.search(f"{name} company overview features pricing", num_results=3)
                            if results:
                                snippet = results[0].get('snippet', '')
                                updated_comps[i] = dict(comp)
                                updated_comps[i]['overview'] = snippet[:300] if snippet else overview
                                logger.info(f"    Enriched overview for {name}")
                    patch['competitor_comparison'] = updated_comps

            except Exception as e:
                logger.warning(f"    Gap fill failed for {gap}: {e}")

        return patch

    # -------------------------------------------------------------------------
    # Phase 3: Programmatic fixes
    # -------------------------------------------------------------------------

    def _fix_market_validity(self, output: Dict[str, Any]) -> Dict[str, Any]:
        """Fix numeric and enum validity issues."""
        conf = output.get('confidence_score')
        if not isinstance(conf, (int, float)) or conf < 0 or conf > 1:
            if isinstance(conf, (int, float)) and conf > 1:
                output['confidence_score'] = round(conf / 10.0, 2)
            else:
                output['confidence_score'] = 0.5

        demand = str(output.get('market_demand', '')).lower()
        if demand not in ['high', 'medium', 'low']:
            conf_val = output.get('confidence_score', 0.5)
            if conf_val >= 0.7:
                output['market_demand'] = 'high'
            elif conf_val >= 0.4:
                output['market_demand'] = 'medium'
            else:
                output['market_demand'] = 'low'

        rec = str(output.get('recommendation', ''))
        if rec not in ['Proceed', 'Pivot', 'Stop']:
            rec_lower = rec.lower()
            if 'proceed' in rec_lower or 'go' in rec_lower or 'yes' in rec_lower:
                output['recommendation'] = 'Proceed'
            elif 'stop' in rec_lower or 'no' in rec_lower or 'abandon' in rec_lower:
                output['recommendation'] = 'Stop'
            else:
                output['recommendation'] = 'Pivot'

        return output

    # -------------------------------------------------------------------------
    # Merge helpers
    # -------------------------------------------------------------------------

    def _merge(self, original: Dict[str, Any], rewritten: Dict[str, Any]) -> Dict[str, Any]:
        """Deep merge rewritten output with original. Prefer more complete values."""
        if not isinstance(rewritten, dict) or not rewritten:
            return dict(original)

        merged = dict(original)

        for key, new_val in rewritten.items():
            old_val = merged.get(key)

            if isinstance(new_val, dict) and isinstance(old_val, dict):
                merged[key] = self._merge(old_val, new_val)
            elif isinstance(new_val, list) and isinstance(old_val, list):
                if len(new_val) >= len(old_val):
                    merged[key] = new_val
            elif isinstance(new_val, str) and isinstance(old_val, str):
                if len(new_val.strip()) > len(old_val.strip()):
                    merged[key] = new_val
            elif new_val is not None:
                merged[key] = new_val

        return merged

    def _apply_patch(self, output: Dict[str, Any], patch: Dict[str, Any]) -> Dict[str, Any]:
        """Apply a patch dict on top of the output. Patch values always win."""
        result = dict(output)
        for key, val in patch.items():
            if val is not None:
                result[key] = val
        return result
