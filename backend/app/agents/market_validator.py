# # File: backend/app/agents/market_validator_with_universal_rag.py
# # Market Validator that AUTO-BUILDS knowledge for ANY domain

# from typing import Dict, Any
# import os
# from dotenv import load_dotenv
# from groq import Groq
# from app.utils.logger import logger

# # Import ALL enhancement services
# from app.services.enhanced_web_search import EnhancedWebSearchService
# from app.services.competitor_scraper import CompetitorPricingScraper
# from app.services.reddit_analyzer import RedditPainPointAnalyzer
# from app.services.crunchbase_service import CrunchbaseService
# from app.services.faiss_service import FAISSService
# from app.services.universal_knowledge_builder import UniversalKnowledgeBuilder

# load_dotenv()


# class MarketValidatorAgent:
#     """
#     ULTIMATE Market Validator with UNIVERSAL RAG.
    
#     Key Feature: Works for ANY domain automatically!
    
#     Process:
#     1. User submits idea (ANY domain)
#     2. Auto-builds domain-specific knowledge pack
#     3. Uses 6 data sources for validation
#     4. Returns comprehensive analysis
#     """
    
#     def __init__(self):
#         api_key = os.getenv('GROQ_API_KEY')
#         if not api_key:
#             raise ValueError("GROQ_API_KEY not found")
        
#         self.client = Groq(api_key=api_key)
        
#         # Initialize ALL services
#         self.web_search = EnhancedWebSearchService()
#         self.competitor_scraper = CompetitorPricingScraper()
#         self.reddit_analyzer = RedditPainPointAnalyzer()
#         self.crunchbase = CrunchbaseService()
#         self.faiss = FAISSService()
#         self.knowledge_builder = UniversalKnowledgeBuilder()  # NEW!
        
#         logger.info("🚀 Market Validator initialized with UNIVERSAL RAG")
    
#     def validate_market(
#         self, 
#         structured_idea: Dict[str, Any],
#         use_web_search: bool = True,
#         use_crunchbase: bool = True,
#         use_pricing_scraper: bool = True,
#         use_reddit: bool = True,
#         use_faiss: bool = True
#     ) -> Dict[str, Any]:
#         """
#         Complete market validation with UNIVERSAL knowledge building.
#         """
#         logger.info("=" * 70)
#         logger.info("🎯 STARTING UNIVERSAL MARKET VALIDATION")
#         logger.info("=" * 70)
        
#         # STEP 1: Auto-build domain knowledge (if needed)
#         if use_faiss:
#             logger.info("🤖 Auto-building domain knowledge...")
#             knowledge_info = self.knowledge_builder.auto_build_for_idea(structured_idea)
#             logger.info(f"✅ Knowledge pack ready: {knowledge_info['industry']}")
#             logger.info(f"   📦 {knowledge_info['documents_indexed']} documents")
#             logger.info(f"   📊 Coverage: {knowledge_info['coverage']}")
        
#         # STEP 2: Gather research from ALL sources
#         research_data = self._gather_all_research(
#             structured_idea,
#             use_web_search,
#             use_crunchbase,
#             use_pricing_scraper,
#             use_reddit,
#             use_faiss
#         )
        
#         # STEP 3: Build context and prompt
#         context = self._build_context(structured_idea)
#         prompt = self._create_ultimate_prompt(context, research_data)
        
#         # STEP 4: Get AI analysis
#         try:
#             logger.info("🤖 Synthesizing with AI (Llama 3.3)...")
            
#             response = self.client.chat.completions.create(
#                 model="llama-3.3-70b-versatile",
#                 messages=[{"role": "user", "content": prompt}],
#                 temperature=0.3,
#                 max_tokens=3500
#             )
            
#             response_text = response.choices[0].message.content.strip()
            
#             # Clean markdown
#             if response_text.startswith('```'):
#                 response_text = response_text.split('```')[1]
#                 if response_text.startswith('json'):
#                     response_text = response_text[4:]
#                 response_text = response_text.strip()
            
#             import json
#             validation_result = json.loads(response_text)
            
#             # Add metadata
#             validation_result['data_sources'] = {
#                 'web_search_used': use_web_search,
#                 'crunchbase_used': use_crunchbase,
#                 'pricing_scraper_used': use_pricing_scraper,
#                 'reddit_used': use_reddit,
#                 'faiss_used': use_faiss,
#                 'research_quality': 'ultimate',
#                 'enhancement_level': 'universal',
#                 'knowledge_pack': knowledge_info if use_faiss else None
#             }
            
#             logger.info("=" * 70)
#             logger.info("✅ UNIVERSAL VALIDATION COMPLETE")
#             logger.info(f"   Industry: {knowledge_info.get('industry', 'N/A')}")
#             logger.info(f"   Market Demand: {validation_result.get('market_demand', 'N/A')}")
#             logger.info(f"   Recommendation: {validation_result.get('recommendation', 'N/A')}")
#             logger.info(f"   Confidence: {validation_result.get('confidence_score', 0) * 100:.0f}%")
#             logger.info("=" * 70)
            
#             return validation_result
            
#         except json.JSONDecodeError as e:
#             logger.error(f"JSON parse error: {e}")
#             return self._get_fallback_result()
            
#         except Exception as e:
#             logger.error(f"Validation error: {e}")
#             return self._get_fallback_result()
    
#     def _gather_all_research(
#         self,
#         structured_idea: Dict[str, Any],
#         use_web: bool,
#         use_crunchbase: bool,
#         use_scraper: bool,
#         use_reddit: bool,
#         use_faiss: bool
#     ) -> str:
#         """Gather research from ALL sources."""
        
#         research_sections = []
        
#         problem = structured_idea.get('problem_statement', '')
#         target = structured_idea.get('target_audience', '')
#         competitors = structured_idea.get('competitors', [])
#         if not isinstance(competitors, list):
#             competitors = [competitors] if competitors else []
        
#         # === SOURCE 1: Enhanced Web Search (12 queries) ===
#         if use_web:
#             logger.info("📡 Gathering web search data...")
#             try:
#                 web_data = self.web_search.gather_comprehensive_data(structured_idea)
#                 if web_data:
#                     research_sections.append("=" * 70)
#                     research_sections.append("WEB SEARCH DATA (12 targeted queries)")
#                     research_sections.append("=" * 70)
#                     research_sections.append(web_data)
#             except Exception as e:
#                 logger.error(f"Web search error: {e}")
        
#         # === SOURCE 2: FAISS Knowledge Base (AUTO-BUILT) ===
#         if use_faiss:
#             logger.info("📚 Searching domain knowledge base...")
#             try:
#                 faiss_data = self.faiss.search_market_data(structured_idea)
#                 if faiss_data and "not available" not in faiss_data.lower():
#                     research_sections.append("\n" + "=" * 70)
#                     research_sections.append("DOMAIN KNOWLEDGE BASE (Auto-Built)")
#                     research_sections.append("=" * 70)
#                     research_sections.append(faiss_data)
#             except Exception as e:
#                 logger.error(f"FAISS error: {e}")
        
#         # === SOURCE 3: Crunchbase ===
#         if use_crunchbase and competitors:
#             logger.info("💼 Getting Crunchbase data...")
#             try:
#                 crunchbase_data = self.crunchbase.get_multiple_companies(competitors)
#                 if crunchbase_data:
#                     formatted = self.crunchbase.format_crunchbase_data(crunchbase_data)
#                     research_sections.append("\n" + "=" * 70)
#                     research_sections.append(formatted)
#             except Exception as e:
#                 logger.error(f"Crunchbase error: {e}")
        
#         # === SOURCE 4: Competitor Pricing ===
#         if use_scraper and competitors:
#             logger.info("💰 Scraping competitor pricing...")
#             try:
#                 scraped_data = self.competitor_scraper.scrape_multiple_competitors(competitors)
#                 if scraped_data:
#                     formatted = self.competitor_scraper.format_pricing_data(scraped_data)
#                     research_sections.append("\n" + "=" * 70)
#                     research_sections.append(formatted)
#             except Exception as e:
#                 logger.error(f"Scraping error: {e}")
        
#         # === SOURCE 5: Reddit Insights ===
#         if use_reddit and target:
#             logger.info("🗣️  Analyzing Reddit discussions...")
#             try:
#                 reddit_data = self.reddit_analyzer.analyze_pain_points(target, problem)
#                 if reddit_data['posts_analyzed'] > 0:
#                     formatted = self.reddit_analyzer.format_reddit_data(reddit_data)
#                     research_sections.append("\n" + "=" * 70)
#                     research_sections.append(formatted)
#             except Exception as e:
#                 logger.error(f"Reddit error: {e}")
        
#         if research_sections:
#             return "\n\n".join(research_sections)
#         else:
#             return "Limited research data available."
    
#     def _create_ultimate_prompt(self, context: str, research_data: str) -> str:
#         """Create comprehensive validation prompt."""
        
#         return f"""You are a senior market research analyst with COMPREHENSIVE real-time data.

# STARTUP IDEA:
# {context}

# COMPREHENSIVE RESEARCH DATA:
# {research_data}

# CRITICAL: This research includes:
# - Live web search results
# - Auto-built domain-specific knowledge base
# - Real competitor data
# - Actual customer pain points
# - Industry-specific insights

# YOU MUST:
# 1. Use EXACT numbers from research (not estimates)
# 2. Cite SPECIFIC sources with quotes
# 3. Base TAM/SAM/SOM on REAL market data
# 4. Reference ACTUAL competitors found
# 5. Include REAL customer pain points

# Respond with ONLY valid JSON:
# {{
#   "market_demand": "high|medium|low",
#   "tam": "STRING with $ and SOURCE",
#   "sam": "STRING with $ and SOURCE",
#   "som": "STRING with $ and reasoning",
#   "market_growth_rate": "% CAGR with SOURCE",
#   "market_size": "Detailed breakdown with numbers",
#   "target_segments": [
#     {{
#       "segment": "Name",
#       "size": "Size with data",
#       "pain_points": ["Real pain from research"],
#       "willingness_to_pay": "Price range"
#     }}
#   ],
#   "evidence": ["Evidence with SOURCE citation"],
#   "opportunities": ["Opportunity based on gaps"],
#   "concerns": ["Real concern with impact"],
#   "competitive_landscape": {{
#     "direct_competitors": ["Real names"],
#     "indirect_competitors": ["Alternatives"],
#     "market_position": "Positioning",
#     "competitive_advantage": "Advantage"
#   }},
#   "revenue_potential": {{
#     "year_1_estimate": "$ with calculation",
#     "year_3_estimate": "$ projection",
#     "avg_customer_value": "$ based on data",
#     "reasoning": "How calculated"
#   }},
#   "go_to_market": {{
#     "recommended_strategy": "GTM strategy",
#     "target_first": "Which segment",
#     "pricing_strategy": "Model based on data",
#     "key_metrics": ["Metric 1", "Metric 2"]
#   }},
#   "confidence_score": 0.0-1.0,
#   "recommendation": "Proceed|Pivot|Stop",
#   "reasoning": "Detailed reasoning citing sources"
# }}

# JSON:"""
    
#     def _build_context(self, idea: Dict[str, Any]) -> str:
#         """Build idea context."""
#         parts = []
        
#         fields = {
#             'problem_statement': 'PROBLEM',
#             'solution_description': 'SOLUTION',
#             'target_audience': 'TARGET',
#             'market_size_estimate': "USER'S ESTIMATE",
#             'competitors': 'KNOWN COMPETITORS',
#             'unique_value_proposition': 'VALUE PROP',
#             'business_model': 'BUSINESS MODEL',
#             'key_features': 'FEATURES'
#         }
        
#         for field, label in fields.items():
#             value = idea.get(field)
#             if value and value != [] and value != "":
#                 if isinstance(value, list):
#                     parts.append(f"{label}: {', '.join(value)}")
#                 else:
#                     parts.append(f"{label}: {value}")
        
#         return "\n".join(parts)
    
#     def _get_fallback_result(self) -> Dict[str, Any]:
#         """Fallback if validation fails."""
#         return {
#             "market_demand": "unknown",
#             "tam": "Unable to estimate",
#             "sam": "Unable to estimate",
#             "som": "Unable to estimate",
#             "market_growth_rate": "Unknown",
#             "market_size": "Validation failed",
#             "target_segments": [],
#             "evidence": ["Automated validation failed"],
#             "opportunities": [],
#             "concerns": ["System error"],
#             "competitive_landscape": {
#                 "direct_competitors": [],
#                 "indirect_competitors": [],
#                 "market_position": "Unknown",
#                 "competitive_advantage": "Requires analysis"
#             },
#             "revenue_potential": {
#                 "year_1_estimate": "Unknown",
#                 "year_3_estimate": "Unknown",
#                 "avg_customer_value": "Unknown",
#                 "reasoning": "Validation failed"
#             },
#             "go_to_market": {
#                 "recommended_strategy": "Manual research required",
#                 "target_first": "Unknown",
#                 "pricing_strategy": "Unknown",
#                 "key_metrics": []
#             },
#             "confidence_score": 0.0,
#             "recommendation": "Pivot",
#             "reasoning": "Automated validation failed.",
#             "data_sources": {
#                 "web_search_used": False,
#                 "crunchbase_used": False,
#                 "pricing_scraper_used": False,
#                 "reddit_used": False,
#                 "faiss_used": False,
#                 "research_quality": "none",
#                 "enhancement_level": "failed"
#             }
#         }

# File: backend/app/agents/market_validator_with_universal_rag.py
# GPT-4o mini — 4 focused calls, guaranteed JSON, zero empty fields

from typing import Dict, Any, List
import os
import json
from dotenv import load_dotenv
from openai import OpenAI
from app.utils.logger import logger

from app.services.enhanced_web_search import EnhancedWebSearchService
from app.services.competitor_scraper import CompetitorPricingScraper
from app.services.reddit_analyzer import RedditPainPointAnalyzer
from app.services.crunchbase_service import CrunchbaseService
from app.services.faiss_service import FAISSService
from app.services.universal_knowledge_builder import UniversalKnowledgeBuilder

load_dotenv()

MODEL = "gpt-4o-mini"


class MarketValidatorAgent:
    """
    4-call GPT-4o mini market validator.
    Each call focuses on 3 frameworks — clean JSON, no empty fields.

    Call 1 — Market Sizing + TAM/SAM/SOM + Industry Trends
    Call 2 — Customer Segments + SWOT + Competitive Landscape
    Call 3 — Revenue Projections + Unit Economics
    Call 4 — Risk Assessment + GTM Strategy + Strategic Options + 90-day Actions
    """

    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment")

        self.client = OpenAI(api_key=api_key)

        self.web_search         = EnhancedWebSearchService()
        self.competitor_scraper = CompetitorPricingScraper()
        self.reddit_analyzer    = RedditPainPointAnalyzer()
        self.crunchbase         = CrunchbaseService()
        self.faiss              = FAISSService()
        self.knowledge_builder  = UniversalKnowledgeBuilder()

        logger.info("✅ MarketValidatorAgent ready — GPT-4o mini 4-call split")

    # ─────────────────────────────────────────────────────────────────────────
    # PUBLIC ENTRY POINT
    # ─────────────────────────────────────────────────────────────────────────

    def validate_market(
        self,
        structured_idea: Dict[str, Any],
        use_web_search: bool = True,
        use_crunchbase: bool = True,
        use_pricing_scraper: bool = True,
        use_reddit: bool = True,
        use_faiss: bool = True,
    ) -> Dict[str, Any]:

        logger.info("=" * 70)
        logger.info("🚀 STARTING 4-CALL GPT-4o mini MARKET VALIDATION")
        logger.info("=" * 70)

        # Step 1: build domain knowledge
        knowledge_info: Dict[str, Any] = {}
        if use_faiss:
            logger.info("📚 Building domain knowledge...")
            try:
                knowledge_info = self.knowledge_builder.auto_build_for_idea(structured_idea)
                logger.info(f"   ✅ {knowledge_info.get('industry')} — {knowledge_info.get('documents_indexed')} docs")
            except Exception as e:
                logger.warning(f"Knowledge builder failed (non-fatal): {e}")

        # Step 2: gather all research once — shared across all 4 calls
        research = self._gather_research(
            structured_idea,
            use_web_search, use_crunchbase,
            use_pricing_scraper, use_reddit, use_faiss,
        )
        context = self._build_context(structured_idea)
        logger.info(f"📊 Research gathered: {len(research):,} chars")

        # Step 3: run 4 focused LLM calls sequentially
        call_results: Dict[str, Any] = {}
        calls = [
            ("call_1", self._call_1_market_sizing,    "Call 1 — Market Sizing + TAM + Trends"),
            ("call_2", self._call_2_segments_swot,    "Call 2 — Segments + SWOT + Competitive"),
            ("call_3", self._call_3_revenue_finance,  "Call 3 — Revenue + Unit Economics"),
            ("call_4", self._call_4_risk_gtm_strategy,"Call 4 — Risk + GTM + Strategy"),
        ]

        total_cost = 0.0
        for key, fn, label in calls:
            logger.info(f"🤖 {label}...")
            result, cost = fn(context, research)
            call_results[key] = result
            total_cost += cost
            logger.info(f"   ✅ Done — ${cost:.4f}")

        logger.info(f"💰 Total cost this run: ${total_cost:.4f}")

        # Step 4: merge into one flat dict
        final = self._merge(call_results)

        final["data_sources"] = {
            "web_search_used":      use_web_search,
            "crunchbase_used":      use_crunchbase,
            "pricing_scraper_used": use_pricing_scraper,
            "reddit_used":          use_reddit,
            "faiss_used":           use_faiss,
            "research_quality":     "ultimate",
            "enhancement_level":    "gpt4o-mini-4call",
            "total_cost_usd":       round(total_cost, 4),
            "knowledge_pack":       knowledge_info if use_faiss else None,
        }

        logger.info("=" * 70)
        logger.info("✅ VALIDATION COMPLETE")
        logger.info(f"   Demand:         {final.get('market_demand')}")
        logger.info(f"   Recommendation: {final.get('recommendation')}")
        logger.info(f"   Confidence:     {final.get('confidence_score', 0) * 100:.0f}%")
        logger.info(f"   Total cost:     ${total_cost:.4f}")
        logger.info("=" * 70)

        return final

    # ─────────────────────────────────────────────────────────────────────────
    # CALL 1 — Market Sizing + TAM/SAM/SOM + Industry Trends
    # ─────────────────────────────────────────────────────────────────────────

    def _call_1_market_sizing(self, context: str, research: str):
        prompt = f"""You are a McKinsey market sizing expert.
Using ONLY the research data below, produce JSON for market sizing and industry trends.
Use exact figures from the research with source citations.
If a specific number is not in the research, make a reasonable estimate and label it "(estimated)".
TAM/SAM/SOM values in tam_cagr_5yr must be realistic dollar figures in millions.

STARTUP IDEA:
{context}

RESEARCH DATA:
{research}

Return ONLY this JSON object:
{{
  "market_demand": "high|medium|low",
  "tam": "$ figure with source",
  "sam": "$ figure with source",
  "som": "$ figure with reasoning",
  "market_growth_rate": "X% CAGR with source",
  "market_size": "Detailed 2-3 paragraph narrative with specific data points and citations",
  "tam_top_down": "Top-down: global market scoped to this segment with figures",
  "tam_bottom_up": "Bottom-up: unit_price × total_customers = TAM figure",
  "tam_cagr_5yr": [
    {{"year": "Year 1", "value": 0.0}},
    {{"year": "Year 2", "value": 0.0}},
    {{"year": "Year 3", "value": 0.0}},
    {{"year": "Year 4", "value": 0.0}},
    {{"year": "Year 5", "value": 0.0}}
  ],
  "industry_trends": [
    {{
      "trend": "Specific trend name",
      "impact_score": 8,
      "timeframe": "0-1yr",
      "category": "Tech|Regulatory|Consumer|Financial|Social|Environmental",
      "so_what": "What this means specifically for this startup"
    }}
  ],
  "confidence_score": 0.75,
  "recommendation": "Proceed|Pivot|Stop",
  "reasoning": "Detailed reasoning citing specific data from research"
}}"""

        return self._call_llm(prompt, "call_1")

    # ─────────────────────────────────────────────────────────────────────────
    # CALL 2 — Customer Segments + SWOT + Competitive Landscape
    # ─────────────────────────────────────────────────────────────────────────

    def _call_2_segments_swot(self, context: str, research: str):
        prompt = f"""You are a world-class consumer researcher and competitive analyst.
Using ONLY the research data below, produce JSON for customer segments, SWOT, and competitive landscape.
Base ALL findings on the research. For Porter's forces, score each 1-10 with reasoning.

STARTUP IDEA:
{context}

RESEARCH DATA:
{research}

Return ONLY this JSON object:
{{
  "target_segments": [
    {{
      "segment": "Segment name",
      "size": "Market size with data",
      "size_pct": 35,
      "demographics": "Age, income, education, job title, location",
      "psychographics": "Values, lifestyle, personality traits",
      "pain_points": ["Specific pain from research", "Another real pain point"],
      "goals": "What success looks like for this segment",
      "buying_behavior": "How they discover, evaluate, and purchase",
      "objections": ["Objection 1 from research", "Objection 2", "Objection 3"],
      "trigger_events": "What moment makes them actively search for this solution",
      "willingness_to_pay": "$ range with reasoning"
    }}
  ],
  "evidence": ["Evidence point with source citation"],
  "opportunities": ["Specific market gap or opportunity from research"],
  "concerns": ["Specific concern with estimated business impact"],
  "swot": {{
    "strengths":     [{{"point": "Strength statement", "evidence": "Source from research"}}],
    "weaknesses":    [{{"point": "Weakness statement", "evidence": "Honest assessment"}}],
    "opportunities": [{{"point": "Opportunity statement", "evidence": "Market signal from research"}}],
    "threats":       [{{"point": "Threat statement", "evidence": "Competitive signal from research"}}],
    "so_strategy": "How top strength exploits top opportunity",
    "wt_risk": "Worst weakness combined with worst threat"
  }},
  "competitive_landscape": {{
    "direct_competitors": [
      {{
        "name": "Competitor name",
        "funding": "$ funding or 'Not disclosed'",
        "pricing": "Pricing model and range",
        "weakness": "Key exploitable gap"
      }}
    ],
    "indirect_competitors": ["Alternative solution"],
    "market_position": "Where this startup sits vs the field",
    "competitive_advantage": "Sustainable moat",
    "porter_supplier_power": {{"score": 4, "reasoning": "Why this score"}},
    "porter_buyer_power":    {{"score": 6, "reasoning": "Why this score"}},
    "porter_rivalry":        {{"score": 7, "reasoning": "Why this score"}},
    "porter_substitutes":    {{"score": 5, "reasoning": "Why this score"}},
    "porter_new_entry":      {{"score": 6, "reasoning": "Why this score"}}
  }}
}}"""

        return self._call_llm(prompt, "call_2")

    # ─────────────────────────────────────────────────────────────────────────
    # CALL 3 — Revenue Projections + Unit Economics
    # ─────────────────────────────────────────────────────────────────────────

    def _call_3_revenue_finance(self, context: str, research: str):
        prompt = f"""You are a VP of Finance and pricing strategy expert.
Using the research data below, produce realistic revenue projections and unit economics.
CRITICAL RULES:
- CAGR must be between 15% and 120% for early-stage startups. Never above 200%.
- Base all pricing on actual competitor pricing found in research.
- Show your calculation in reasoning: customers × ACV × growth = revenue.
- All revenue figures are in millions USD (e.g. 0.5 = $500k, 2.0 = $2M).
- Best case = base × 1.4, worst case = base × 0.6.

STARTUP IDEA:
{context}

RESEARCH DATA:
{research}

Return ONLY this JSON object:
{{
  "revenue_potential": {{
    "year_1_estimate": "$ figure with calculation",
    "year_3_estimate": "$ figure with calculation",
    "avg_customer_value": "$ based on competitor pricing from research",
    "cagr": 45.0,
    "projection": [
      {{"year": "Year 1", "revenue": 0.5,  "growth_pct": 0.0}},
      {{"year": "Year 2", "revenue": 1.2,  "growth_pct": 140.0}},
      {{"year": "Year 3", "revenue": 2.8,  "growth_pct": 133.0}},
      {{"year": "Year 4", "revenue": 5.2,  "growth_pct": 85.0}},
      {{"year": "Year 5", "revenue": 8.9,  "growth_pct": 71.0}}
    ],
    "scenario_best": [
      {{"year": "Year 1", "revenue": 0.7}},
      {{"year": "Year 2", "revenue": 1.7}},
      {{"year": "Year 3", "revenue": 3.9}},
      {{"year": "Year 4", "revenue": 7.3}},
      {{"year": "Year 5", "revenue": 12.5}}
    ],
    "scenario_base": [
      {{"year": "Year 1", "revenue": 0.5}},
      {{"year": "Year 2", "revenue": 1.2}},
      {{"year": "Year 3", "revenue": 2.8}},
      {{"year": "Year 4", "revenue": 5.2}},
      {{"year": "Year 5", "revenue": 8.9}}
    ],
    "scenario_worst": [
      {{"year": "Year 1", "revenue": 0.3}},
      {{"year": "Year 2", "revenue": 0.7}},
      {{"year": "Year 3", "revenue": 1.7}},
      {{"year": "Year 4", "revenue": 3.1}},
      {{"year": "Year 5", "revenue": 5.3}}
    ],
    "reasoning": "Step-by-step: Year 1 = X customers × $Y ACV = $Z. CAGR based on comparable startups in this space."
  }},
  "unit_economics": {{
    "cac": 150.0,
    "cac_by_channel": [
      {{"channel": "SEO / Content", "cac": 80.0}},
      {{"channel": "Paid Social",   "cac": 220.0}},
      {{"channel": "Referral",      "cac": 45.0}}
    ],
    "ltv": 900.0,
    "ltv_cac_ratio": 6.0,
    "payback_months": 8,
    "gross_margin_pct": 72.0,
    "avg_contract_value": 1200.0,
    "churn_rate_pct": 8.0,
    "assumptions": "All key assumptions with justification from research data"
  }}
}}

IMPORTANT: Replace all example numbers above with numbers calculated from the research data.
The example numbers are just to show the correct format."""

        return self._call_llm(prompt, "call_3")

    # ─────────────────────────────────────────────────────────────────────────
    # CALL 4 — Risk + GTM + Strategy + 90-day Actions
    # ─────────────────────────────────────────────────────────────────────────

    def _call_4_risk_gtm_strategy(self, context: str, research: str):
        prompt = f"""You are a Deloitte risk partner, McKinsey GTM strategist, and HBS strategy professor.
Using the research data below, produce risk assessment, GTM plan, and strategic options.
Every item must be specific to this startup — not generic advice.

STARTUP IDEA:
{context}

RESEARCH DATA:
{research}

Return ONLY this JSON object:
{{
  "risks": [
    {{
      "name": "Specific risk name",
      "category": "Market|Operational|Financial|Regulatory|Reputational",
      "probability": 3,
      "impact": 4,
      "score": 12,
      "warning_indicator": "Specific early warning signal",
      "mitigation": "Specific mitigation action"
    }}
  ],
  "go_to_market": {{
    "recommended_strategy": "Specific GTM strategy",
    "target_first": "Which segment and exact reason why based on research",
    "pricing_strategy": "Pricing model with specific numbers from competitor research",
    "pricing_tiers": [
      {{"tier": "Starter", "price": "$X/mo", "features": ["Feature A", "Feature B"]}},
      {{"tier": "Growth",  "price": "$Y/mo", "features": ["Everything in Starter", "Feature C"]}},
      {{"tier": "Pro",     "price": "$Z/mo", "features": ["Everything in Growth",  "Feature D"]}}
    ],
    "entry_mode": "Direct|Partnership|Licensing|Acquisition",
    "localization_needs": "Specific adaptations needed",
    "roadmap_12mo": [
      {{"month_range": "Month 1-2",  "milestone": "Specific measurable milestone"}},
      {{"month_range": "Month 3-4",  "milestone": "Specific measurable milestone"}},
      {{"month_range": "Month 5-6",  "milestone": "Specific measurable milestone"}},
      {{"month_range": "Month 7-9",  "milestone": "Specific measurable milestone"}},
      {{"month_range": "Month 10-12","milestone": "Specific measurable milestone"}}
    ],
    "key_metrics": ["Metric 1", "Metric 2", "Metric 3", "Metric 4", "Metric 5"],
    "customer_journey": [
      {{"stage": "Awareness",     "users": 10000, "conversion_pct": 5.0,  "actions": "What they do", "pain": "Friction point",  "opportunity": "How to improve"}},
      {{"stage": "Consideration", "users": 500,   "conversion_pct": 40.0, "actions": "What they do", "pain": "Friction point",  "opportunity": "How to improve"}},
      {{"stage": "Decision",      "users": 200,   "conversion_pct": 60.0, "actions": "What they do", "pain": "Friction point",  "opportunity": "How to improve"}},
      {{"stage": "Onboarding",    "users": 120,   "conversion_pct": 85.0, "actions": "What they do", "pain": "Friction point",  "opportunity": "How to improve"}},
      {{"stage": "Retention",     "users": 102,   "conversion_pct": 92.0, "actions": "What they do", "pain": "Churn signal",    "opportunity": "How to improve"}},
      {{"stage": "Advocacy",      "users": 30,    "conversion_pct": 29.0, "actions": "What they do", "pain": "Low referral",    "opportunity": "Referral program"}}
    ]
  }},
  "strategy_options": [
    {{
      "label": "Option A — Conservative",
      "approach": "Specific approach for this startup",
      "investment_required": "$X–$Y",
      "timeline": "X months to breakeven",
      "expected_outcome": "Specific outcome with numbers",
      "key_risks": ["Risk 1", "Risk 2"],
      "radar": {{"market_coverage": 3, "speed": 4, "resources": 2, "risk": 2, "revenue_potential": 4, "sustainability": 9}}
    }},
    {{
      "label": "Option B — Balanced",
      "approach": "Specific approach for this startup",
      "investment_required": "$X–$Y",
      "timeline": "X months to breakeven",
      "expected_outcome": "Specific outcome with numbers",
      "key_risks": ["Risk 1", "Risk 2"],
      "radar": {{"market_coverage": 6, "speed": 6, "resources": 5, "risk": 5, "revenue_potential": 7, "sustainability": 7}}
    }},
    {{
      "label": "Option C — Aggressive",
      "approach": "Specific approach for this startup",
      "investment_required": "$X–$Y",
      "timeline": "X months to breakeven",
      "expected_outcome": "Specific outcome with numbers",
      "key_risks": ["Risk 1", "Risk 2"],
      "radar": {{"market_coverage": 9, "speed": 9, "resources": 9, "risk": 9, "revenue_potential": 10, "sustainability": 4}}
    }}
  ],
  "priority_actions_90d": [
    {{"rank": 1, "action": "Specific action", "why": "Why this matters based on research"}},
    {{"rank": 2, "action": "Specific action", "why": "Why this matters based on research"}},
    {{"rank": 3, "action": "Specific action", "why": "Why this matters based on research"}},
    {{"rank": 4, "action": "Specific action", "why": "Why this matters based on research"}},
    {{"rank": 5, "action": "Specific action", "why": "Why this matters based on research"}}
  ]
}}"""

        return self._call_llm(prompt, "call_4")

    # ─────────────────────────────────────────────────────────────────────────
    # LLM CALLER — response_format json_object = guaranteed valid JSON
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
                                "You are a senior market research analyst. "
                                "Always respond with valid JSON only. "
                                "Never truncate output. "
                                "Never add markdown fences or text outside the JSON. "
                                "Never omit keys — use 'Insufficient data' for unknown string fields, "
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
                logger.error(f"{label} failed after {retries + 1} attempts — returning empty dict")
                return {}, 0.0

        return {}, 0.0

    # ─────────────────────────────────────────────────────────────────────────
    # MERGE — flatten all 4 call results into one dict
    # ─────────────────────────────────────────────────────────────────────────

    def _merge(self, r: Dict[str, Any]) -> Dict[str, Any]:
        c1 = r.get("call_1", {})
        c2 = r.get("call_2", {})
        c3 = r.get("call_3", {})
        c4 = r.get("call_4", {})

        return {
            # Call 1
            "market_demand":      c1.get("market_demand",      "unknown"),
            "tam":                c1.get("tam",                "Insufficient data"),
            "sam":                c1.get("sam",                "Insufficient data"),
            "som":                c1.get("som",                "Insufficient data"),
            "market_growth_rate": c1.get("market_growth_rate", "Insufficient data"),
            "market_size":        c1.get("market_size",        "Insufficient data"),
            "tam_top_down":       c1.get("tam_top_down",       "Insufficient data"),
            "tam_bottom_up":      c1.get("tam_bottom_up",      "Insufficient data"),
            "tam_cagr_5yr":       c1.get("tam_cagr_5yr",       []),
            "industry_trends":    c1.get("industry_trends",    []),
            "confidence_score":   c1.get("confidence_score",   0.0),
            "recommendation":     c1.get("recommendation",     "Pivot"),
            "reasoning":          c1.get("reasoning",          ""),
            # Call 2
            "target_segments":        c2.get("target_segments",       []),
            "evidence":               c2.get("evidence",              []),
            "opportunities":          c2.get("opportunities",         []),
            "concerns":               c2.get("concerns",              []),
            "swot":                   c2.get("swot",                  {}),
            "competitive_landscape":  c2.get("competitive_landscape", {}),
            # Call 3
            "revenue_potential": c3.get("revenue_potential", {}),
            "unit_economics":    c3.get("unit_economics",    {}),
            # Call 4
            "risks":                c4.get("risks",                []),
            "go_to_market":         c4.get("go_to_market",         {}),
            "strategy_options":     c4.get("strategy_options",     []),
            "priority_actions_90d": c4.get("priority_actions_90d", []),
        }

    # ─────────────────────────────────────────────────────────────────────────
    # RESEARCH GATHERING
    # ─────────────────────────────────────────────────────────────────────────

    def _gather_research(
        self,
        structured_idea: Dict[str, Any],
        use_web: bool,
        use_crunchbase: bool,
        use_scraper: bool,
        use_reddit: bool,
        use_faiss: bool,
    ) -> str:
        sections: List[str] = []

        problem     = structured_idea.get("problem_statement", "")
        target      = structured_idea.get("target_audience",   "")
        competitors = structured_idea.get("competitors", [])
        if not isinstance(competitors, list):
            competitors = [competitors] if competitors else []

        if use_web:
            logger.info("📡 Web search...")
            try:
                data = self.web_search.gather_comprehensive_data(structured_idea)
                if data:
                    sections.append("=== WEB SEARCH DATA ===\n" + data)
            except Exception as e:
                logger.warning(f"Web search failed: {e}")

        if use_faiss:
            logger.info("📚 FAISS knowledge base...")
            try:
                data = self.faiss.search_market_data(structured_idea)
                if data and "not available" not in data.lower():
                    sections.append("=== DOMAIN KNOWLEDGE BASE ===\n" + data)
            except Exception as e:
                logger.warning(f"FAISS failed: {e}")

        if use_crunchbase and competitors:
            logger.info("💼 Crunchbase...")
            try:
                data = self.crunchbase.get_multiple_companies(competitors)
                if data:
                    sections.append("=== CRUNCHBASE DATA ===\n" + self.crunchbase.format_crunchbase_data(data))
            except Exception as e:
                logger.warning(f"Crunchbase failed: {e}")

        if use_scraper and competitors:
            logger.info("💰 Competitor pricing...")
            try:
                data = self.competitor_scraper.scrape_multiple_competitors(competitors)
                if data:
                    sections.append("=== COMPETITOR PRICING ===\n" + self.competitor_scraper.format_pricing_data(data))
            except Exception as e:
                logger.warning(f"Scraper failed: {e}")

        if use_reddit and target:
            logger.info("🗣️  Reddit...")
            try:
                data = self.reddit_analyzer.analyze_pain_points(target, problem)
                if data["posts_analyzed"] > 0:
                    sections.append("=== REDDIT INSIGHTS ===\n" + self.reddit_analyzer.format_reddit_data(data))
            except Exception as e:
                logger.warning(f"Reddit failed: {e}")

        return "\n\n".join(sections) if sections else "No external research data available."

    # ─────────────────────────────────────────────────────────────────────────
    # CONTEXT BUILDER
    # ─────────────────────────────────────────────────────────────────────────

    def _build_context(self, idea: Dict[str, Any]) -> str:
        fields = {
            "problem_statement":        "PROBLEM",
            "solution_description":     "SOLUTION",
            "target_audience":          "TARGET AUDIENCE",
            "market_size_estimate":     "USER'S MARKET ESTIMATE",
            "competitors":              "KNOWN COMPETITORS",
            "unique_value_proposition": "VALUE PROPOSITION",
            "business_model":           "BUSINESS MODEL",
            "key_features":             "KEY FEATURES",
        }
        parts = []
        for field, label in fields.items():
            value = idea.get(field)
            if value and value != [] and value != "":
                parts.append(f"{label}: {', '.join(value) if isinstance(value, list) else value}")
        return "\n".join(parts)