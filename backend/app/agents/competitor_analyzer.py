# File: backend/app/agents/competitor_analyzer_ENHANCED.py
# GPT-4o mini — native web search + 3 focused analysis calls
# ZERO SERP API — no EnhancedWebSearchService, no CompetitorPricingScraper,
#                  no EnhancedReviewScraper, no CrunchbaseService

from typing import Dict, Any, List, Tuple
import os
import json
from dotenv import load_dotenv
from openai import OpenAI
from app.utils.logger import logger
from app.db.session import get_db

load_dotenv()

MODEL        = "gpt-4o-mini"               # analysis calls — json_object mode
MODEL_SEARCH = "gpt-4o-mini-search-preview" # web search calls — live web access


class CompetitorAnalyzerAgent:
    """
    Zero-SERP competitor analyzer.

    Step 0 — GPT web search → discover real competitors
    Step 1 — GPT web search → deep intel on each competitor
    Step 2 — Call 1: competitor deep analysis (features, pricing, reviews, S/W)
    Step 3 — Call 2: gap analysis + differentiation + feature matrix
    Step 4 — Call 3: migration + positioning map + strategic recommendations

    All web research done via GPT-4o mini's native web_search tool.
    No SERP API, no scraper, no Crunchbase needed.
    """

    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment")

        self.client = OpenAI(api_key=api_key)
        logger.info("✅ CompetitorAnalyzerAgent ready — GPT-4o mini + native web search (zero SERP)")

    # ─────────────────────────────────────────────────────────────────────────
    # PUBLIC ENTRY POINT
    # ─────────────────────────────────────────────────────────────────────────

    def analyze_competitors(self, structured_idea_id: int) -> Dict[str, Any]:

        logger.info("=" * 70)
        logger.info("🔍 STARTING COMPETITOR ANALYSIS — GPT web search, zero SERP")
        logger.info("=" * 70)

        # Step 1: load idea from DB
        idea, market_validation = self._get_idea_and_validation(structured_idea_id)
        if not idea:
            logger.error("Idea not found")
            return self._fallback()

        context = self._build_idea_context(idea)
        problem  = getattr(idea, "problem_statement",    "") or ""
        solution = getattr(idea, "solution_description", "") or ""
        target   = getattr(idea, "target_audience",      "") or ""

        # Also check structured_data
        if hasattr(idea, "structured_data") and idea.structured_data:
            problem  = problem  or idea.structured_data.get("problem_statement",    "")
            solution = solution or idea.structured_data.get("solution_description", "")
            target   = target   or idea.structured_data.get("target_audience",      "")

        # Step 2: discover competitors via GPT web search
        logger.info("🌐 Step 0 — Discovering competitors via GPT web search...")
        competitors, discovery_cost = self._discover_competitors(
            problem, solution, target, market_validation, idea
        )

        if not competitors:
            logger.error("Could not discover any competitors")
            return {"error": "Could not find competitors for this idea"}

        logger.info(f"✅ Discovered {len(competitors)} competitors: {competitors}")

        # Step 3: gather deep intel on each competitor via GPT web search
        logger.info("🌐 Step 1 — Gathering deep intel via GPT web search...")
        intel, intel_cost = self._gather_intel_via_gpt(competitors, problem, solution, target)

        logger.info(f"📦 Intel gathered for {len(intel)} competitors")

        # Step 4: 3 focused analysis calls
        total_cost = discovery_cost + intel_cost
        results: Dict[str, Any] = {}

        calls = [
            ("call_1", self._call_1_competitor_analysis,  "Call 1 — Deep Analysis"),
            ("call_2", self._call_2_gaps_differentiation,  "Call 2 — Gaps + Differentiation"),
            ("call_3", self._call_3_migration_positioning, "Call 3 — Migration + Positioning + Strategy"),
        ]

        for key, fn, label in calls:
            logger.info(f"🤖 {label}...")
            result, cost = fn(context, intel)
            results[key] = result
            total_cost += cost
            logger.info(f"   ✅ Done — ${cost:.4f}")

        logger.info(f"💰 Total cost this run: ${total_cost:.4f}")

        final = self._merge(results)
        final["_meta"] = {
            "total_cost_usd":       round(total_cost, 4),
            "competitors_analysed": len(intel),
            "competitors":          competitors,
        }

        logger.info("=" * 70)
        logger.info(f"✅ COMPETITOR ANALYSIS COMPLETE — ${total_cost:.4f}")
        logger.info("=" * 70)

        return final

    # ─────────────────────────────────────────────────────────────────────────
    # STEP 0 — Discover competitors via GPT web search
    # ─────────────────────────────────────────────────────────────────────────

    def _discover_competitors(
        self,
        problem: str,
        solution: str,
        target: str,
        market_validation: Dict,
        idea: Any,
    ) -> Tuple[List[str], float]:
        """
        Use GPT-4o mini native web search to find real, current competitors.
        Also merges any names already known from DB / user input.
        """

        # Seed with known names first
        known: List[str] = []

        # From user-entered idea data
        for attr in ["competitors"]:
            val = getattr(idea, attr, None)
            if val:
                if isinstance(val, list):
                    known.extend(val)
                elif isinstance(val, str):
                    known.extend([v.strip() for v in val.split(",") if v.strip()])

        if hasattr(idea, "structured_data") and idea.structured_data:
            sd = idea.structured_data.get("competitors", [])
            if isinstance(sd, list):
                known.extend(sd)
            elif isinstance(sd, str):
                known.extend([v.strip() for v in sd.split(",") if v.strip()])

        # From market validation DB
        if market_validation:
            landscape = market_validation.get("competitive_landscape", {})
            for key in ["direct_competitors", "indirect_competitors"]:
                for c in landscape.get(key, []):
                    if isinstance(c, dict):
                        name = c.get("name", "").strip()
                        if name:
                            known.append(name)
                    elif isinstance(c, str) and c.strip():
                        known.append(c.strip())

        known = [c for c in known if c and c.lower() not in {"no idea", "unknown", "n/a", "none", "tbd"}]
        known = list(dict.fromkeys(known))
        logger.info(f"   Known from DB/user: {known}")

        # Now use GPT web search to find MORE real competitors
        search_prompt = f"""Search the web and find the top 8 real, specific competitor companies or products for this startup idea.

Startup idea:
- Problem: {problem}
- Solution: {solution}  
- Target users: {target}

Already known competitors (do NOT repeat these): {', '.join(known) if known else 'none'}

Search for:
1. "{solution} alternatives competitors"
2. "best apps for {target} {problem[:50]}"
3. "top companies in {solution[:50]} market 2024"

Rules:
- Only real, specific company/product names
- No generic terms like "various companies"
- Include both big players and startups
- Focus on companies that directly compete

After searching, end your response with ONLY this JSON block:
{{"competitors": ["Company1", "Company2", "Company3", "Company4", "Company5", "Company6", "Company7", "Company8"]}}"""

        try:
            response = self.client.chat.completions.create(
                model=MODEL_SEARCH,
                web_search_options={},
                messages=[
                    {
                        "role": "system",
                        "content": "You are a market research analyst. Search the web and find real competitor companies. Always end your response with a JSON block containing the competitor names.",
                    },
                    {"role": "user", "content": search_prompt},
                ],
                max_tokens=1000,
            )

            full_text = response.choices[0].message.content or ""
            logger.info(f"   🌐 Discovery raw response (first 300 chars): {full_text[:300]}")

            # Parse JSON from response
            discovered = self._extract_json_list(full_text, "competitors")

            usage = response.usage
            cost  = (usage.prompt_tokens * 0.00000015) + (usage.completion_tokens * 0.0000006)
            logger.info(f"   🌐 GPT discovered: {discovered} | ${cost:.4f}")

            # Merge known + discovered, deduplicate
            all_competitors = known + [c for c in discovered if c not in known]
            all_competitors = list(dict.fromkeys(all_competitors))[:8]

            return all_competitors, cost

        except Exception as e:
            logger.error(f"   Competitor discovery failed: {e}")
            # Fall back to known list if GPT search fails
            return known[:8] if known else [], 0.0

    # ─────────────────────────────────────────────────────────────────────────
    # STEP 1 — Gather deep intel via GPT web search
    # ─────────────────────────────────────────────────────────────────────────

    def _gather_intel_via_gpt(
        self,
        competitors: List[str],
        problem: str,
        solution: str,
        target: str,
    ) -> Tuple[List[Dict], float]:
        """
        Single GPT web search call to gather intel on ALL competitors at once.
        More efficient than one call per competitor.
        """

        names_str = ", ".join(competitors)

        prompt = f"""Search the web and gather detailed intelligence on these competitors: {names_str}

Context — I'm building: {solution} for {target} solving: {problem}

For EACH competitor, search and find:
1. What they do, key features, target customers
2. Pricing (free tier? monthly cost? enterprise?)
3. Funding amount and stage
4. Customer reviews — what users love and hate
5. Key weaknesses and complaints

After searching, end your response with ONLY this JSON block (no other text after it):
{{
  "competitors_intel": [
    {{
      "name": "Competitor name",
      "description": "What they do in 2 sentences",
      "key_features": ["feature 1", "feature 2", "feature 3"],
      "pricing": "Free / $X per month / Enterprise pricing details",
      "funding": "Total funding amount and stage or bootstrapped",
      "founded": "Year",
      "employees": "Approximate headcount",
      "target_customers": "Who they serve",
      "top_praises": ["What users love from reviews"],
      "top_complaints": ["What users hate from reviews"],
      "known_weaknesses": ["Specific product or business weaknesses"]
    }}
  ]
}}"""

        try:
            response = self.client.chat.completions.create(
                model=MODEL_SEARCH,
                web_search_options={},
                messages=[
                    {
                        "role": "system",
                        "content": "You are a competitive intelligence analyst. Search the web thoroughly for each competitor. End your response with a JSON block containing the competitors_intel array.",
                    },
                    {"role": "user", "content": prompt},
                ],
                max_tokens=4000,
            )

            full_text = response.choices[0].message.content or ""
            logger.info(f"   🌐 Intel raw response (first 300 chars): {full_text[:300]}")

            usage = response.usage
            cost  = (usage.prompt_tokens * 0.00000015) + (usage.completion_tokens * 0.0000006)
            logger.info(f"   🌐 Intel gathered | ${cost:.4f}")

            # Parse the intel
            intel_raw = self._extract_json_key(full_text, "competitors_intel")
            if intel_raw and isinstance(intel_raw, list):
                logger.info(f"   ✅ Got intel for {len(intel_raw)} competitors")
                return intel_raw, cost

            # If JSON parsing failed, return basic structure with names
            logger.warning("   Intel JSON parse failed — using raw text as fallback")
            return [{"name": c, "raw_intel": full_text[:500]} for c in competitors], cost

        except Exception as e:
            logger.error(f"Intel gathering failed: {e}")
            return [{"name": c} for c in competitors], 0.0

    # ─────────────────────────────────────────────────────────────────────────
    # CALL 1 — Competitor Deep Analysis
    # ─────────────────────────────────────────────────────────────────────────

    def _call_1_competitor_analysis(self, context: str, intel: List[Dict]):
        intel_str = json.dumps(intel, indent=2)

        prompt = f"""You are a senior competitive intelligence analyst.
Using the competitor research data below, produce a deep structured analysis.

YOUR STARTUP:
{context}

COMPETITOR RESEARCH (from web):
{intel_str}

Return ONLY this JSON object:
{{
  "competitor_comparison": [
    {{
      "name": "Competitor name",
      "overview": "2-3 sentence description",
      "founded": "Year",
      "key_features": ["Feature 1", "Feature 2", "Feature 3"],
      "pricing_model": "Freemium|Subscription|One-time|Enterprise",
      "price_range": "$X/mo or free or enterprise",
      "estimated_price_score": 5,
      "estimated_feature_score": 7,
      "estimated_market_share": "X% or estimated",
      "funding_stage": "Seed|Series A|Series B|Public|Bootstrapped",
      "total_funding": "$ amount or bootstrapped",
      "target_customers": "Who they serve",
      "strengths": ["Specific strength with evidence"],
      "weaknesses": ["Specific weakness from reviews"],
      "customer_sentiment": "positive|mixed|negative",
      "review_summary": {{
        "average_rating": 4.2,
        "total_reviews": 150,
        "top_complaints": ["Real complaint"],
        "top_praises": ["Real praise"],
        "switching_reasons": ["Why customers leave"]
      }}
    }}
  ],
  "executive_summary": "2-3 sentence overview of the competitive landscape"
}}"""

        return self._call_llm(prompt, "call_1")

    # ─────────────────────────────────────────────────────────────────────────
    # CALL 2 — Gap Analysis + Differentiation + Feature Matrix
    # ─────────────────────────────────────────────────────────────────────────

    def _call_2_gaps_differentiation(self, context: str, intel: List[Dict]):
        intel_str   = json.dumps(intel, indent=2)
        comp_names  = [c.get("name", "") for c in intel if c.get("name")]

        prompt = f"""You are a product strategy expert.
Using the competitor research below, identify market gaps, differentiation opportunities, and build a feature matrix.

YOUR STARTUP:
{context}

COMPETITOR RESEARCH:
{intel_str}

Return ONLY this JSON object:
{{
  "gap_analysis": [
    {{
      "gap": "Specific gap ALL competitors miss",
      "impact": "high|medium|low",
      "your_opportunity": "Specific way to capitalise",
      "evidence": "Which competitors and what shows this gap"
    }}
  ],
  "differentiation_opportunities": [
    {{
      "opportunity": "Specific differentiation strategy",
      "competitor_weakness": "Who has this weakness and evidence",
      "your_advantage": "Your specific edge",
      "implementation": "Concrete steps to execute",
      "priority": "high|medium|low"
    }}
  ],
  "feature_comparison_matrix": {{
    "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5", "Feature 6"],
    "competitor_coverage": {{
      "YourProduct": [true, true, true, true, true, true],
      {', '.join([f'"{name}": [true, false, true, false, true, false]' for name in comp_names[:6]])}
    }}
  }}
}}

IMPORTANT: feature_comparison_matrix must include "YourProduct" key.
Base all true/false on actual research — not guesses."""

        return self._call_llm(prompt, "call_2")

    # ─────────────────────────────────────────────────────────────────────────
    # CALL 3 — Migration + Positioning + Strategy
    # ─────────────────────────────────────────────────────────────────────────

    def _call_3_migration_positioning(self, context: str, intel: List[Dict]):
        intel_str  = json.dumps(intel, indent=2)
        comp_names = [c.get("name", "") for c in intel if c.get("name")]

        prompt = f"""You are a customer success strategist and market positioning expert.
Using the competitor research below, produce migration analysis, positioning map, and strategic recommendations.

YOUR STARTUP:
{context}

COMPETITOR RESEARCH:
{intel_str}

Return ONLY this JSON object:
{{
  "migration_analysis": {{
    "switching_patterns": {{
      "total_switches_found": 5,
      "common_reasons": [
        {{
          "competitor": "Competitor name",
          "reason": "Specific reason from research/reviews"
        }}
      ]
    }},
    "interview_questions": [
      {{
        "question": "Specific question to ask switchers",
        "purpose": "What insight this reveals",
        "competitor": "Which competitor this targets"
      }}
    ],
    "onboarding_improvements": [
      {{
        "improvement": "Specific improvement based on competitor weaknesses",
        "rationale": "Why this helps win switchers",
        "priority": "high|medium|low"
      }}
    ]
  }},
  "positioning_map": {{
    "positions": [
      {{
        "name": "Competitor or Your Product",
        "price_score": 5,
        "feature_score": 7,
        "market_share_estimate": 10,
        "positioning": "premium|premium_value|budget|overpriced",
        "is_you": false
      }}
    ],
    "axes": {{
      "x_axis": {{"label": "Price", "min": 0, "max": 10, "description": "Low → High"}},
      "y_axis": {{"label": "Features", "min": 0, "max": 10, "description": "Basic → Advanced"}}
    }},
    "quadrants": {{
      "top_left":    {{"label": "Premium Value", "description": "Advanced features, affordable price"}},
      "top_right":   {{"label": "Premium",       "description": "Advanced features, high price"}},
      "bottom_left": {{"label": "Budget",        "description": "Basic features, low price"}},
      "bottom_right":{{"label": "Overpriced",    "description": "Basic features, high price"}}
    }},
    "recommended_position": "top_left",
    "rationale": "Why this position maximises differentiation"
  }},
  "strategic_recommendations": [
    {{
      "recommendation": "Specific actionable recommendation",
      "category": "Product|Pricing|Marketing|Sales|Partnerships",
      "rationale": "Why based on research",
      "priority": "high|medium|low",
      "timeline": "X months",
      "competitors_affected": ["Competitor name"],
      "expected_impact": "Specific outcome"
    }}
  ]
}}

CRITICAL for positioning_map.positions:
- Include ALL these competitors: {', '.join(comp_names)}
- Include your startup with "is_you": true, name "Your Product"
- price_score and feature_score 1-10 based on real pricing/feature data
- YourProduct should target the premium_value quadrant (high features, competitive price)"""

        return self._call_llm(prompt, "call_3")

    # ─────────────────────────────────────────────────────────────────────────
    # LLM CALLER — guaranteed JSON
    # ─────────────────────────────────────────────────────────────────────────

    def _call_llm(self, prompt: str, label: str, retries: int = 2):
        """Returns (result_dict, cost_usd)"""
        for attempt in range(retries + 1):
            try:
                response = self.client.chat.completions.create(
                    model=MODEL,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are a senior competitive intelligence analyst. "
                                "Always respond with valid JSON only. "
                                "Never truncate. Never add markdown. "
                                "Never omit keys — use 'Not found' for unknown strings, "
                                "0 for unknown numbers, [] for unknown arrays."
                            ),
                        },
                        {"role": "user", "content": prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.2,
                    max_tokens=4000,
                )

                raw    = response.choices[0].message.content.strip()
                result = json.loads(raw)
                usage  = response.usage
                cost   = (usage.prompt_tokens * 0.00000015) + (usage.completion_tokens * 0.0000006)

                logger.info(
                    f"   {label}: {usage.prompt_tokens} in + "
                    f"{usage.completion_tokens} out = "
                    f"{usage.total_tokens} tokens | ${cost:.4f}"
                )
                return result, cost

            except json.JSONDecodeError as e:
                logger.warning(f"{label} attempt {attempt + 1} JSON error: {e}")
            except Exception as e:
                logger.error(f"{label} attempt {attempt + 1} error: {e}")

            if attempt == retries:
                logger.error(f"{label} failed after {retries + 1} attempts")
                return {}, 0.0

        return {}, 0.0

    # ─────────────────────────────────────────────────────────────────────────
    # MERGE
    # ─────────────────────────────────────────────────────────────────────────

    def _merge(self, r: Dict[str, Any]) -> Dict[str, Any]:
        c1 = r.get("call_1", {})
        c2 = r.get("call_2", {})
        c3 = r.get("call_3", {})

        return {
            "competitor_comparison":         c1.get("competitor_comparison",        []),
            "executive_summary":             c1.get("executive_summary",            ""),
            "gap_analysis":                  c2.get("gap_analysis",                 []),
            "differentiation_opportunities": c2.get("differentiation_opportunities",[]),
            "feature_comparison_matrix":     c2.get("feature_comparison_matrix",    {}),
            "migration_analysis":            c3.get("migration_analysis",           {}),
            "positioning_map":               c3.get("positioning_map",              {}),
            "strategic_recommendations":     c3.get("strategic_recommendations",    []),
        }

    # ─────────────────────────────────────────────────────────────────────────
    # JSON HELPERS
    # ─────────────────────────────────────────────────────────────────────────

    def _extract_json_list(self, text: str, key: str) -> List:
        """Extract a list from JSON embedded in text."""
        try:
            # Try direct parse first
            data = json.loads(text)
            return data.get(key, [])
        except Exception:
            pass
        try:
            # Find JSON block in text
            start = text.find("{")
            end   = text.rfind("}") + 1
            if start >= 0 and end > start:
                data = json.loads(text[start:end])
                return data.get(key, [])
        except Exception:
            pass
        return []

    def _extract_json_key(self, text: str, key: str):
        """Extract any value from JSON embedded in text."""
        try:
            data = json.loads(text)
            return data.get(key)
        except Exception:
            pass
        try:
            start = text.find("{")
            end   = text.rfind("}") + 1
            if start >= 0 and end > start:
                data = json.loads(text[start:end])
                return data.get(key)
        except Exception:
            pass
        return None

    # ─────────────────────────────────────────────────────────────────────────
    # DB HELPERS
    # ─────────────────────────────────────────────────────────────────────────

    def _get_idea_and_validation(self, idea_id: int):
        db = next(get_db())
        try:
            from app.models.idea import StructuredIdea
            from app.models.validation import ValidationSession

            idea = db.query(StructuredIdea).filter(StructuredIdea.id == idea_id).first()
            if not idea:
                return None, None

            session = (
                db.query(ValidationSession)
                .filter(ValidationSession.structured_idea_id == idea_id)
                .order_by(ValidationSession.created_at.desc())
                .first()
            )

            market_validation = None
            if session and session.results:
                market_validation = session.results.get("market_validation")

            return idea, market_validation
        finally:
            db.close()

    def _build_idea_context(self, idea: Any) -> str:
        parts = []
        fields = [
            ("problem_statement",        "PROBLEM"),
            ("solution_description",     "SOLUTION"),
            ("target_audience",          "TARGET"),
            ("unique_value_proposition", "VALUE PROP"),
            ("business_model",           "BUSINESS MODEL"),
        ]
        for attr, label in fields:
            # Try direct attribute first
            val = getattr(idea, attr, None)
            # Then try structured_data
            if not val and hasattr(idea, "structured_data") and idea.structured_data:
                val = idea.structured_data.get(attr, "")
            if val:
                parts.append(f"{label}: {val}")
        return "\n".join(parts)

    # ─────────────────────────────────────────────────────────────────────────
    # FALLBACK
    # ─────────────────────────────────────────────────────────────────────────

    def _fallback(self) -> Dict[str, Any]:
        return {
            "competitor_comparison":         [],
            "executive_summary":             "Analysis failed — please retry",
            "gap_analysis":                  [],
            "differentiation_opportunities": [],
            "feature_comparison_matrix":     {"features": [], "competitor_coverage": {}},
            "migration_analysis": {
                "switching_patterns":      {"total_switches_found": 0, "common_reasons": []},
                "interview_questions":     [],
                "onboarding_improvements": [],
            },
            "positioning_map": {
                "positions": [],
                "axes": {
                    "x_axis": {"label": "Price",    "min": 0, "max": 10, "description": "Low → High"},
                    "y_axis": {"label": "Features", "min": 0, "max": 10, "description": "Basic → Advanced"},
                },
                "quadrants":             {},
                "recommended_position":  "top_left",
                "rationale":             "Analysis failed — please retry",
            },
            "strategic_recommendations": [],
        }