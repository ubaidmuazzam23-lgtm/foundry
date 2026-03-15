# File: backend/app/agents/critic_agent.py
# Feature 9: Quality Evaluation (Critic Agent)
# Prevents low-quality outputs by scoring them using rubrics
# Uses PROGRAMMATIC pre-checks + LLM evaluation for honest scoring

from typing import Dict, Any, List
import os
import re
from dotenv import load_dotenv
from groq import Groq
from app.utils.logger import logger
import json

load_dotenv()

# Regex patterns for data verification
DOLLAR_PATTERN = re.compile(
    r'\$\s*[\d,]+(?:\.\d+)?\s*(?:B|b|M|m|K|k|billion|million|thousand|trillion|T)?'
)
PERCENT_PATTERN = re.compile(r'[\d.]+\s*%')
SOURCE_KEYWORDS = re.compile(
    r'(?:source|according to|per |from |report|research|study|survey|'
    r'statista|gartner|idc|mckinsey|grand view|fortune business|'
    r'marketsandmarkets|cb insights|crunchbase|pitchbook|forrester|'
    r'deloitte|bain|bcg|accenture|euromonitor|ibisworld|'
    r'20[12]\d)',
    re.IGNORECASE
)
PRICE_RANGE_PATTERN = re.compile(r'\$\s*\d+')

# Required fields for each output type
REQUIRED_MARKET_FIELDS = [
    'market_demand', 'tam', 'sam', 'som', 'market_growth_rate',
    'confidence_score', 'recommendation', 'target_segments',
    'evidence', 'competitive_landscape', 'revenue_potential', 'go_to_market'
]

REQUIRED_COMPETITOR_FIELDS = [
    'competitor_comparison', 'gap_analysis', 'differentiation_opportunities',
    'feature_comparison_matrix', 'strategic_recommendations',
    'executive_summary', 'positioning_map'
]


class CriticAgent:
    """
    Quality Evaluation Agent (Critic)

    Uses a two-layer scoring system:
    1. Programmatic checks (40%) - verifies hard facts: field presence,
       real $ numbers, source citations, data depth
    2. LLM evaluation (60%) - scores subjective quality: actionability,
       realism, strategic value

    Final score = 0.4 * programmatic + 0.6 * llm
    """

    def __init__(self, threshold: float = 7.0):
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            raise ValueError("GROQ_API_KEY not found")

        self.client = Groq(api_key=api_key)
        self.threshold = threshold

        logger.info(f"🔍 Critic Agent initialized (threshold: {threshold})")

    # -------------------------------------------------------------------------
    # Helper methods
    # -------------------------------------------------------------------------

    def _safe_get(self, data: dict, *keys, default=None):
        """Safely traverse nested dict keys."""
        current = data
        for key in keys:
            if isinstance(current, dict):
                current = current.get(key, default)
            else:
                return default
        return current

    def _has_dollar_amount(self, text: str) -> bool:
        """Check if text contains a real dollar amount like $4.5B."""
        if not isinstance(text, str):
            return False
        return bool(DOLLAR_PATTERN.search(text))

    def _has_percentage(self, text: str) -> bool:
        """Check if text contains a percentage like 12.5%."""
        if not isinstance(text, str):
            return False
        return bool(PERCENT_PATTERN.search(text))

    def _has_source_citation(self, text: str) -> bool:
        """Check if text references a source."""
        if not isinstance(text, str):
            return False
        return bool(SOURCE_KEYWORDS.search(text))

    def _is_non_empty(self, value) -> bool:
        """Check if a value is present and non-empty."""
        if value is None:
            return False
        if isinstance(value, str):
            return len(value.strip()) > 0
        if isinstance(value, (list, dict)):
            return len(value) > 0
        return True

    # -------------------------------------------------------------------------
    # Programmatic checks - Market Validation
    # -------------------------------------------------------------------------

    def _programmatic_check_market_validation(self, output: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run concrete data quality checks on market validation output.
        Returns a score breakdown with issues found.
        """
        issues = []

        # --- Dimension 1: Field Presence (weight 0.20) ---
        present_count = 0
        missing_fields = []
        for field in REQUIRED_MARKET_FIELDS:
            if self._is_non_empty(output.get(field)):
                present_count += 1
            else:
                missing_fields.append(field)
                issues.append(f"Missing required field: {field}")

        # Also check nested object sub-keys
        for nested in ['competitive_landscape', 'revenue_potential', 'go_to_market']:
            obj = output.get(nested)
            if isinstance(obj, dict) and len([v for v in obj.values() if self._is_non_empty(v)]) < 2:
                issues.append(f"{nested} has fewer than 2 populated sub-fields")

        field_presence_score = present_count / len(REQUIRED_MARKET_FIELDS)

        # --- Dimension 2: Data Specificity (weight 0.20) ---
        specificity_checks = {
            'tam': self._has_dollar_amount(str(output.get('tam', ''))),
            'sam': self._has_dollar_amount(str(output.get('sam', ''))),
            'som': self._has_dollar_amount(str(output.get('som', ''))),
            'market_growth_rate': self._has_percentage(str(output.get('market_growth_rate', ''))),
            'year_1_estimate': self._has_dollar_amount(str(self._safe_get(output, 'revenue_potential', 'year_1_estimate', default=''))),
            'year_3_estimate': self._has_dollar_amount(str(self._safe_get(output, 'revenue_potential', 'year_3_estimate', default=''))),
            'avg_customer_value': self._has_dollar_amount(str(self._safe_get(output, 'revenue_potential', 'avg_customer_value', default=''))),
        }

        specific_count = sum(1 for v in specificity_checks.values() if v)
        for field, passed in specificity_checks.items():
            if not passed:
                issues.append(f"{field} has no specific number (missing $ or %)")

        data_specificity_score = specific_count / len(specificity_checks)

        # --- Dimension 3: Source Citations (weight 0.20) ---
        citation_fields = ['tam', 'sam', 'som', 'market_growth_rate']
        cited_count = 0
        uncited_fields = []

        for field in citation_fields:
            if self._has_source_citation(str(output.get(field, ''))):
                cited_count += 1
            else:
                uncited_fields.append(field)

        # Check evidence array items for citations
        evidence = output.get('evidence', [])
        evidence_cited = 0
        if isinstance(evidence, list):
            for item in evidence:
                if self._has_source_citation(str(item)):
                    evidence_cited += 1

        total_citation_items = len(citation_fields) + max(len(evidence), 1)
        total_cited = cited_count + evidence_cited

        if uncited_fields:
            issues.append(f"No source citation in: {', '.join(uncited_fields)}")
        if isinstance(evidence, list) and evidence_cited < len(evidence):
            issues.append(f"Only {evidence_cited}/{len(evidence)} evidence items cite sources")

        source_citations_score = total_cited / total_citation_items if total_citation_items > 0 else 0

        # --- Dimension 4: Array Depth (weight 0.15) ---
        segments = output.get('target_segments', [])
        evidence_list = output.get('evidence', [])
        direct_comp = self._safe_get(output, 'competitive_landscape', 'direct_competitors', default=[])

        segment_score = min(1.0, len(segments) / 2) if isinstance(segments, list) else 0
        evidence_score = min(1.0, len(evidence_list) / 3) if isinstance(evidence_list, list) else 0
        competitor_score = min(1.0, len(direct_comp) / 2) if isinstance(direct_comp, list) else 0

        # Check segment completeness
        segment_complete = 0
        if isinstance(segments, list):
            for seg in segments:
                if isinstance(seg, dict) and all(self._is_non_empty(seg.get(k)) for k in ['segment', 'size', 'pain_points']):
                    segment_complete += 1
        segment_quality = segment_complete / max(len(segments), 1)

        array_depth_score = (segment_score + evidence_score + competitor_score + segment_quality) / 4

        if isinstance(segments, list) and len(segments) < 2:
            issues.append(f"Only {len(segments)} target segments (need at least 2)")
        if isinstance(evidence_list, list) and len(evidence_list) < 3:
            issues.append(f"Only {len(evidence_list)} evidence items (need at least 3)")
        if isinstance(direct_comp, list) and len(direct_comp) < 2:
            issues.append(f"Only {len(direct_comp)} direct competitors listed (need at least 2)")

        # --- Dimension 5: Numeric Validity (weight 0.10) ---
        validity_checks = []

        conf = output.get('confidence_score')
        if isinstance(conf, (int, float)) and 0.0 <= conf <= 1.0:
            validity_checks.append(True)
        else:
            validity_checks.append(False)
            issues.append(f"confidence_score ({conf}) not in valid range 0.0-1.0")

        demand = output.get('market_demand', '')
        if str(demand).lower() in ['high', 'medium', 'low']:
            validity_checks.append(True)
        else:
            validity_checks.append(False)
            issues.append(f"market_demand '{demand}' not a valid enum (high/medium/low)")

        rec = output.get('recommendation', '')
        if str(rec) in ['Proceed', 'Pivot', 'Stop']:
            validity_checks.append(True)
        else:
            validity_checks.append(False)
            issues.append(f"recommendation '{rec}' not a valid enum (Proceed/Pivot/Stop)")

        numeric_validity_score = sum(1 for v in validity_checks if v) / len(validity_checks)

        # --- Dimension 6: Data Source Diversity (weight 0.15) ---
        data_sources = output.get('data_sources', {})
        if isinstance(data_sources, dict):
            source_flags = ['web_search_used', 'crunchbase_used', 'pricing_scraper_used', 'reddit_used', 'faiss_used']
            sources_used = sum(1 for flag in source_flags if data_sources.get(flag, False))
            data_source_score = sources_used / len(source_flags)
            if sources_used < 3:
                issues.append(f"Only {sources_used}/5 data sources used")
        else:
            data_source_score = 0.0
            issues.append("No data_sources tracking found")

        # --- Combined Programmatic Score ---
        programmatic_01 = (
            0.20 * field_presence_score +
            0.20 * data_specificity_score +
            0.20 * source_citations_score +
            0.15 * array_depth_score +
            0.10 * numeric_validity_score +
            0.15 * data_source_score
        )
        programmatic_score = round(programmatic_01 * 10, 1)

        return {
            'programmatic_score': programmatic_score,
            'breakdown': {
                'field_presence': {'score': round(field_presence_score, 2), 'present': present_count, 'total': len(REQUIRED_MARKET_FIELDS), 'missing': missing_fields},
                'data_specificity': {'score': round(data_specificity_score, 2), 'checks': {k: v for k, v in specificity_checks.items()}},
                'source_citations': {'score': round(source_citations_score, 2), 'cited': total_cited, 'total': total_citation_items, 'uncited_fields': uncited_fields},
                'array_depth': {'score': round(array_depth_score, 2), 'segments': len(segments) if isinstance(segments, list) else 0, 'evidence': len(evidence_list) if isinstance(evidence_list, list) else 0},
                'numeric_validity': {'score': round(numeric_validity_score, 2)},
                'data_source_diversity': {'score': round(data_source_score, 2), 'sources_used': sources_used if isinstance(data_sources, dict) else 0},
            },
            'issues_summary': issues
        }

    # -------------------------------------------------------------------------
    # Programmatic checks - Competitor Analysis
    # -------------------------------------------------------------------------

    def _programmatic_check_competitor_analysis(self, output: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run concrete data quality checks on competitor analysis output.
        Returns a score breakdown with issues found.
        """
        issues = []

        # --- Dimension 1: Competitor Coverage (weight 0.25) ---
        competitors = output.get('competitor_comparison', [])
        if not isinstance(competitors, list):
            competitors = []

        num_competitors = len(competitors)
        if num_competitors < 3:
            issues.append(f"Only {num_competitors} competitors analyzed (need at least 3)")

        complete_competitors = 0
        for comp in competitors:
            if not isinstance(comp, dict):
                continue
            has_name = self._is_non_empty(comp.get('name'))
            has_overview = isinstance(comp.get('overview', ''), str) and len(comp.get('overview', '')) > 20
            has_features = isinstance(comp.get('key_features', []), list) and len(comp.get('key_features', [])) >= 2
            has_pricing = self._is_non_empty(comp.get('pricing_model'))
            has_price = self._has_dollar_amount(str(comp.get('price_range', '')))

            if all([has_name, has_overview, has_features, has_pricing]):
                complete_competitors += 1
            else:
                name = comp.get('name', 'Unknown')
                if not has_overview:
                    issues.append(f"{name}: overview too short or missing")
                if not has_features:
                    issues.append(f"{name}: fewer than 2 key features")
                if not has_price:
                    issues.append(f"{name}: no dollar amount in price_range")

        coverage_score = min(1.0, complete_competitors / 3)

        # --- Dimension 2: Review Data Quality (weight 0.20) ---
        good_reviews = 0
        for comp in competitors:
            if not isinstance(comp, dict):
                continue
            review = comp.get('review_summary', {})
            if not isinstance(review, dict):
                continue

            has_rating = isinstance(review.get('average_rating'), (int, float)) and 0 < review.get('average_rating', 0) <= 5
            has_count = isinstance(review.get('total_reviews'), (int, float)) and review.get('total_reviews', 0) > 0
            has_complaints = isinstance(review.get('top_complaints', []), list) and len(review.get('top_complaints', [])) >= 1
            has_praises = isinstance(review.get('top_praises', []), list) and len(review.get('top_praises', [])) >= 1

            sentiment = comp.get('customer_sentiment', '')
            valid_sentiment = str(sentiment).lower() in ['positive', 'mixed', 'negative']

            checks_passed = sum([has_rating, has_count, has_complaints, has_praises, valid_sentiment])
            if checks_passed >= 4:
                good_reviews += 1
            else:
                name = comp.get('name', 'Unknown')
                if not has_rating:
                    issues.append(f"{name}: missing or invalid average_rating")
                if not has_count:
                    issues.append(f"{name}: missing total_reviews count")

        review_score = good_reviews / max(len(competitors), 1)

        # --- Dimension 3: Price Data Presence (weight 0.15) ---
        priced_competitors = 0
        for comp in competitors:
            if not isinstance(comp, dict):
                continue
            has_price = self._has_dollar_amount(str(comp.get('price_range', '')))
            has_price_score = isinstance(comp.get('estimated_price_score'), (int, float)) and 1 <= comp.get('estimated_price_score', 0) <= 10
            has_model = self._is_non_empty(comp.get('pricing_model')) and str(comp.get('pricing_model', '')).lower() not in ['n/a', 'unknown', '']

            if sum([has_price, has_price_score, has_model]) >= 2:
                priced_competitors += 1

        price_score = priced_competitors / max(len(competitors), 1)
        if priced_competitors < len(competitors):
            issues.append(f"Only {priced_competitors}/{len(competitors)} competitors have proper pricing data")

        # --- Dimension 4: Gap Analysis Depth (weight 0.20) ---
        gaps = output.get('gap_analysis', [])
        diff_opps = output.get('differentiation_opportunities', [])
        strat_recs = output.get('strategic_recommendations', [])

        if not isinstance(gaps, list):
            gaps = []
        if not isinstance(diff_opps, list):
            diff_opps = []
        if not isinstance(strat_recs, list):
            strat_recs = []

        gap_count = 0
        for gap in gaps:
            if isinstance(gap, dict) and self._is_non_empty(gap.get('gap')) and self._is_non_empty(gap.get('your_opportunity')):
                gap_count += 1

        diff_count = 0
        for opp in diff_opps:
            if isinstance(opp, dict) and self._is_non_empty(opp.get('opportunity')) and opp.get('priority', '').lower() in ['high', 'medium', 'low']:
                diff_count += 1

        rec_count = 0
        for rec in strat_recs:
            if isinstance(rec, dict) and self._is_non_empty(rec.get('recommendation')) and self._is_non_empty(rec.get('rationale')):
                rec_count += 1

        gap_sub = min(1.0, gap_count / 2)
        diff_sub = min(1.0, diff_count / 2)
        rec_sub = min(1.0, rec_count / 2)

        gap_analysis_score = (gap_sub + diff_sub + rec_sub) / 3

        if gap_count < 2:
            issues.append(f"Only {gap_count} complete gap analysis items (need at least 2)")
        if diff_count < 2:
            issues.append(f"Only {diff_count} differentiation opportunities (need at least 2)")
        if rec_count < 2:
            issues.append(f"Only {rec_count} strategic recommendations (need at least 2)")

        # --- Dimension 5: Feature Matrix Completeness (weight 0.20) ---
        matrix = output.get('feature_comparison_matrix', {})
        if not isinstance(matrix, dict):
            matrix = {}

        features = matrix.get('features', [])
        coverage = matrix.get('competitor_coverage', {})

        if not isinstance(features, list):
            features = []
        if not isinstance(coverage, dict):
            coverage = {}

        has_features = len(features) >= 3
        has_coverage = len(coverage) >= max(len(competitors), 1)

        # Check that boolean arrays match feature count
        matrix_valid = 0
        for _, bools in coverage.items():
            if isinstance(bools, list) and len(bools) == len(features):
                matrix_valid += 1

        matrix_consistency = matrix_valid / max(len(coverage), 1)

        feature_matrix_score = (
            (1.0 if has_features else min(1.0, len(features) / 3)) +
            (1.0 if has_coverage else 0.0) +
            matrix_consistency
        ) / 3

        if not has_features:
            issues.append(f"Feature matrix has only {len(features)} features (need at least 3)")
        if not has_coverage:
            issues.append("Feature matrix missing competitor coverage entries")

        # --- Combined Programmatic Score ---
        programmatic_01 = (
            0.25 * coverage_score +
            0.20 * review_score +
            0.15 * price_score +
            0.20 * gap_analysis_score +
            0.20 * feature_matrix_score
        )
        programmatic_score = round(programmatic_01 * 10, 1)

        return {
            'programmatic_score': programmatic_score,
            'breakdown': {
                'competitor_coverage': {'score': round(coverage_score, 2), 'complete': complete_competitors, 'total': num_competitors},
                'review_data_quality': {'score': round(review_score, 2), 'with_reviews': good_reviews, 'total': len(competitors)},
                'price_data': {'score': round(price_score, 2), 'with_pricing': priced_competitors, 'total': len(competitors)},
                'gap_analysis_depth': {'score': round(gap_analysis_score, 2), 'gaps': gap_count, 'diff_opps': diff_count, 'recommendations': rec_count},
                'feature_matrix': {'score': round(feature_matrix_score, 2), 'features': len(features), 'coverage_entries': len(coverage)},
            },
            'issues_summary': issues
        }

    # -------------------------------------------------------------------------
    # Evaluation methods (programmatic + LLM combined)
    # -------------------------------------------------------------------------

    def evaluate_market_validation(self, validation_output: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate market validation quality using programmatic checks + LLM.
        Final score = 0.4 * programmatic + 0.6 * llm
        """
        logger.info("=" * 70)
        logger.info("🔍 EVALUATING MARKET VALIDATION QUALITY")
        logger.info("=" * 70)

        # Step 1: Programmatic pre-checks
        prog_result = self._programmatic_check_market_validation(validation_output)
        prog_score = prog_result['programmatic_score']

        logger.info(f"📊 Programmatic score: {prog_score}/10")
        for issue in prog_result['issues_summary'][:5]:
            logger.info(f"  ⚠ {issue}")

        # Step 2: Build LLM prompt with programmatic findings
        issues_text = "\n".join(f"- {i}" for i in prog_result['issues_summary']) if prog_result['issues_summary'] else "- No issues found"

        prompt = f"""You are a strict quality evaluator for startup market validation reports.

VALIDATION OUTPUT TO EVALUATE:
{json.dumps(validation_output, indent=2)[:6000]}

AUTOMATED DATA QUALITY FINDINGS (programmatic score: {prog_score}/10):
{issues_text}

The automated checks above verified real data presence. DO NOT ignore these findings.
If the automated checks found missing fields or vague data, reflect that in your scoring.

Evaluate this market validation on a scale of 1-10 using these criteria:

RUBRIC (each worth 2 points):
1. EVIDENCE QUALITY (2 pts): Is every claim backed by specific data/sources?
2. SPECIFICITY (2 pts): Are market size, TAM, SAM estimates specific numbers?
3. COMPLETENESS (2 pts): All required sections present with substance?
4. ACTIONABILITY (2 pts): Can founder act on these insights with clear next steps?
5. REALISM (2 pts): Are estimates realistic, conservative, and well-reasoned?

RESPOND WITH JSON ONLY:
{{
  "overall_score": <number 1-10>,
  "rubric_scores": {{
    "evidence_quality": {{"score": <0-2>, "feedback": "<text>"}},
    "specificity": {{"score": <0-2>, "feedback": "<text>"}},
    "completeness": {{"score": <0-2>, "feedback": "<text>"}},
    "actionability": {{"score": <0-2>, "feedback": "<text>"}},
    "realism": {{"score": <0-2>, "feedback": "<text>"}}
  }},
  "strengths": ["<strength1>", "<strength2>"],
  "weaknesses": ["<weakness1>", "<weakness2>"],
  "required_improvements": ["<improvement1>", "<improvement2>"]
}}

JSON:"""

        # Step 3: Get LLM evaluation
        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=2000
            )

            response_text = response.choices[0].message.content.strip()

            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]

            evaluation = json.loads(response_text.strip())
            llm_score = float(evaluation.get('overall_score', 5.0))

        except Exception as e:
            logger.error(f"LLM evaluation error: {e}")
            evaluation = self._get_fallback_evaluation('market_validation')
            llm_score = 5.0

        # Step 4: Combine scores
        final_score = round(0.4 * prog_score + 0.6 * llm_score, 1)

        evaluation['overall_score'] = final_score
        evaluation['score_breakdown'] = {
            'programmatic_score': prog_score,
            'llm_score': llm_score,
            'weights': {'programmatic': 0.4, 'llm': 0.6},
            'formula': '0.4 * programmatic + 0.6 * llm'
        }
        evaluation['programmatic_checks'] = prog_result
        evaluation['agent_type'] = 'market_validation'
        evaluation['threshold'] = self.threshold
        evaluation['passed'] = final_score >= self.threshold

        status = "✅ PASSED" if evaluation['passed'] else "❌ REJECTED"
        logger.info(f"Score: {final_score}/10 (prog: {prog_score}, llm: {llm_score}) - {status}")

        if not evaluation['passed']:
            logger.warning(f"Below threshold ({self.threshold}). Needs refinement.")
            for improvement in evaluation.get('required_improvements', []):
                logger.warning(f"  - {improvement}")

        return evaluation

    def evaluate_competitor_analysis(self, analysis_output: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate competitor analysis quality using programmatic checks + LLM.
        Final score = 0.4 * programmatic + 0.6 * llm
        """
        logger.info("=" * 70)
        logger.info("🔍 EVALUATING COMPETITOR ANALYSIS QUALITY")
        logger.info("=" * 70)

        # Step 1: Programmatic pre-checks
        prog_result = self._programmatic_check_competitor_analysis(analysis_output)
        prog_score = prog_result['programmatic_score']

        logger.info(f"📊 Programmatic score: {prog_score}/10")
        for issue in prog_result['issues_summary'][:5]:
            logger.info(f"  ⚠ {issue}")

        # Step 2: Build LLM prompt with programmatic findings
        issues_text = "\n".join(f"- {i}" for i in prog_result['issues_summary']) if prog_result['issues_summary'] else "- No issues found"

        prompt = f"""You are a strict quality evaluator for competitor analysis reports.

COMPETITOR ANALYSIS TO EVALUATE:
{json.dumps(analysis_output, indent=2)[:6000]}

AUTOMATED DATA QUALITY FINDINGS (programmatic score: {prog_score}/10):
{issues_text}

The automated checks above verified real data presence. DO NOT ignore these findings.
If the automated checks found missing data or incomplete analysis, reflect that in your scoring.

Evaluate this competitor analysis on a scale of 1-10:

RUBRIC (each worth 2 points):
1. DEPTH (2 pts): How thoroughly are competitors analyzed? (pricing, features, reviews)
2. ACCURACY (2 pts): Are facts verifiable and specific, not speculation?
3. DIFFERENTIATION (2 pts): Clear gaps/opportunities with actionable strategies?
4. COMPLETENESS (2 pts): All major competitors covered with full data?
5. STRATEGIC VALUE (2 pts): Can founder use this to win with clear execution plan?

RESPOND WITH JSON ONLY:
{{
  "overall_score": <number 1-10>,
  "rubric_scores": {{
    "depth": {{"score": <0-2>, "feedback": "<text>"}},
    "accuracy": {{"score": <0-2>, "feedback": "<text>"}},
    "differentiation": {{"score": <0-2>, "feedback": "<text>"}},
    "completeness": {{"score": <0-2>, "feedback": "<text>"}},
    "strategic_value": {{"score": <0-2>, "feedback": "<text>"}}
  }},
  "strengths": ["<strength1>", "<strength2>"],
  "weaknesses": ["<weakness1>", "<weakness2>"],
  "required_improvements": ["<improvement1>", "<improvement2>"]
}}

JSON:"""

        # Step 3: Get LLM evaluation
        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=2000
            )

            response_text = response.choices[0].message.content.strip()

            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]

            evaluation = json.loads(response_text.strip())
            llm_score = float(evaluation.get('overall_score', 5.0))

        except Exception as e:
            logger.error(f"LLM evaluation error: {e}")
            evaluation = self._get_fallback_evaluation('competitor_analysis')
            llm_score = 5.0

        # Step 4: Combine scores
        final_score = round(0.4 * prog_score + 0.6 * llm_score, 1)

        evaluation['overall_score'] = final_score
        evaluation['score_breakdown'] = {
            'programmatic_score': prog_score,
            'llm_score': llm_score,
            'weights': {'programmatic': 0.4, 'llm': 0.6},
            'formula': '0.4 * programmatic + 0.6 * llm'
        }
        evaluation['programmatic_checks'] = prog_result
        evaluation['agent_type'] = 'competitor_analysis'
        evaluation['threshold'] = self.threshold
        evaluation['passed'] = final_score >= self.threshold

        status = "✅ PASSED" if evaluation['passed'] else "❌ REJECTED"
        logger.info(f"Score: {final_score}/10 (prog: {prog_score}, llm: {llm_score}) - {status}")

        if not evaluation['passed']:
            logger.warning(f"Below threshold ({self.threshold}). Needs refinement.")
            for improvement in evaluation.get('required_improvements', []):
                logger.warning(f"  - {improvement}")

        return evaluation

    # -------------------------------------------------------------------------
    # Generic & batch evaluation (unchanged)
    # -------------------------------------------------------------------------

    def evaluate_generic_output(
        self,
        output: Dict[str, Any],
        agent_type: str,
        custom_rubric: Dict[str, str] = None
    ) -> Dict[str, Any]:
        """Evaluate any agent output using custom or default rubric."""
        logger.info(f"🔍 Evaluating {agent_type} output")

        if custom_rubric:
            rubric_text = "\n".join([f"{k}: {v}" for k, v in custom_rubric.items()])
        else:
            rubric_text = """
            1. Completeness (2 pts): All required fields present?
            2. Specificity (2 pts): Claims are specific, not vague?
            3. Evidence (2 pts): Backed by data/sources?
            4. Actionability (2 pts): Can user act on this?
            5. Quality (2 pts): Professional, well-structured?
            """

        prompt = f"""Evaluate this output on a 1-10 scale.

OUTPUT:
{json.dumps(output, indent=2)[:5000]}

RUBRIC:
{rubric_text}

Respond with JSON including overall_score, rubric_scores, strengths, weaknesses, required_improvements.

JSON:"""

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=1500
            )

            response_text = response.choices[0].message.content.strip()

            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]

            evaluation = json.loads(response_text.strip())
            evaluation['agent_type'] = agent_type
            evaluation['threshold'] = self.threshold
            evaluation['passed'] = evaluation.get('overall_score', 0) >= self.threshold

            return evaluation

        except Exception as e:
            logger.error(f"Evaluation error: {e}")
            return self._get_fallback_evaluation(agent_type)

    def batch_evaluate(self, outputs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Evaluate multiple outputs in batch."""
        logger.info(f"🔍 Batch evaluating {len(outputs)} outputs")

        evaluations = []

        for idx, output in enumerate(outputs, 1):
            logger.info(f"Evaluating {idx}/{len(outputs)}")

            agent_type = output.get('agent_type', 'unknown')

            if agent_type == 'market_validation':
                eval_result = self.evaluate_market_validation(output)
            elif agent_type == 'competitor_analysis':
                eval_result = self.evaluate_competitor_analysis(output)
            else:
                eval_result = self.evaluate_generic_output(output, agent_type)

            evaluations.append(eval_result)

        passed = sum(1 for e in evaluations if e.get('passed', False))
        failed = len(evaluations) - passed

        logger.info("=" * 70)
        logger.info(f"✅ Passed: {passed}/{len(evaluations)}")
        logger.info(f"❌ Failed: {failed}/{len(evaluations)}")
        logger.info("=" * 70)

        return evaluations

    # -------------------------------------------------------------------------
    # Helpers
    # -------------------------------------------------------------------------

    def _get_fallback_evaluation(self, agent_type: str) -> Dict[str, Any]:
        """Fallback evaluation if AI fails."""
        return {
            'overall_score': 5.0,
            'passed': False,
            'agent_type': agent_type,
            'threshold': self.threshold,
            'rubric_scores': {},
            'strengths': ['Evaluation failed - manual review required'],
            'weaknesses': ['Could not evaluate automatically'],
            'required_improvements': ['Manual quality review needed'],
            'error': 'Automatic evaluation failed'
        }

    def get_improvement_summary(self, evaluation: Dict[str, Any]) -> str:
        """Generate human-readable improvement summary."""
        if evaluation.get('passed'):
            score_info = evaluation.get('score_breakdown', {})
            prog = score_info.get('programmatic_score', '?')
            llm = score_info.get('llm_score', '?')
            return f"✅ Quality check passed ({evaluation.get('overall_score')}/10) [prog: {prog}, llm: {llm}]"

        improvements = evaluation.get('required_improvements', [])
        weaknesses = evaluation.get('weaknesses', [])

        score_info = evaluation.get('score_breakdown', {})
        prog = score_info.get('programmatic_score', '?')
        llm = score_info.get('llm_score', '?')

        summary = f"❌ Quality check failed ({evaluation.get('overall_score')}/10) [prog: {prog}, llm: {llm}]\n\n"
        summary += "Required Improvements:\n"
        for imp in improvements:
            summary += f"  • {imp}\n"

        if weaknesses:
            summary += "\nWeaknesses:\n"
            for weak in weaknesses:
                summary += f"  • {weak}\n"

        # Include programmatic issues
        prog_checks = evaluation.get('programmatic_checks', {})
        prog_issues = prog_checks.get('issues_summary', [])
        if prog_issues:
            summary += "\nData Quality Issues:\n"
            for issue in prog_issues:
                summary += f"  • {issue}\n"

        return summary
