# # File: backend/app/agents/market_validator_with_rag.py
# # Feature 7: Market Validation with COMPLETE RAG Integration

# from typing import Dict, Any
# import os
# from dotenv import load_dotenv
# from groq import Groq
# from app.utils.logger import logger
# from app.services.web_search_service import WebSearchService
# from app.services.faiss_service import FAISSService

# load_dotenv()


# class MarketValidatorAgent:
#     """
#     Feature 7: Market Validation with Complete RAG
    
#     Data Sources:
#     1. Web Search - Real-time market data from Google
#     2. FAISS Vector DB - Stored research documents
#     3. AI Analysis - Llama 3.3 synthesis
#     """
    
#     def __init__(self):
#         api_key = os.getenv('GROQ_API_KEY')
#         if not api_key:
#             raise ValueError("GROQ_API_KEY not found")
#         self.client = Groq(api_key=api_key)
        
#         # Initialize RAG services
#         self.web_search = WebSearchService()
#         self.faiss = FAISSService()
        
#         logger.info("Market Validator initialized with RAG capabilities")
    
#     def validate_market(
#         self, 
#         structured_idea: Dict[str, Any],
#         use_web_search: bool = True,
#         use_faiss: bool = True
#     ) -> Dict[str, Any]:
#         """
#         Validate market with REAL DATA from multiple sources.
        
#         Args:
#             structured_idea: Structured startup idea
#             use_web_search: Use real-time web search
#             use_faiss: Use FAISS vector database
            
#         Returns:
#             Comprehensive market validation with real data
#         """
#         logger.info("Starting market validation with RAG...")
        
#         # 1. Gather real data from multiple sources
#         research_data = self._gather_research_data(
#             structured_idea, 
#             use_web_search, 
#             use_faiss
#         )
        
#         # 2. Build context
#         context = self._build_detailed_context(structured_idea)
        
#         # 3. Create enhanced prompt with real data
#         prompt = self._create_validation_prompt(context, research_data)
        
#         # 4. Get AI analysis
#         try:
#             response = self.client.chat.completions.create(
#                 model="llama-3.3-70b-versatile",
#                 messages=[{"role": "user", "content": prompt}],
#                 temperature=0.3,
#                 max_tokens=3000
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
            
#             # Add data source metadata
#             validation_result['data_sources'] = {
#                 'web_search_used': use_web_search,
#                 'faiss_used': use_faiss,
#                 'research_quality': 'high' if (use_web_search or use_faiss) else 'estimated'
#             }
            
#             logger.info(f"✅ Market validation complete with RAG")
#             logger.info(f"   Demand: {validation_result.get('market_demand')}")
#             logger.info(f"   Data sources: Web={use_web_search}, FAISS={use_faiss}")
            
#             return validation_result
            
#         except json.JSONDecodeError as e:
#             logger.error(f"JSON parse error: {e}")
#             return self._get_fallback_result()
            
#         except Exception as e:
#             logger.error(f"Error in market validation: {e}")
#             return self._get_fallback_result()
    
#     def _gather_research_data(
#         self, 
#         structured_idea: Dict[str, Any],
#         use_web_search: bool,
#         use_faiss: bool
#     ) -> str:
#         """Gather research data from all available sources."""
#         research_sections = []
        
#         # 1. Web Search Data (Real-time)
#         if use_web_search:
#             logger.info("📡 Gathering real-time web search data...")
#             try:
#                 web_data = self.web_search.gather_comprehensive_data(structured_idea)
#                 if web_data and web_data != "":
#                     research_sections.append("=== REAL-TIME WEB SEARCH DATA ===")
#                     research_sections.append(web_data)
#                     logger.info("✅ Web search data gathered")
#             except Exception as e:
#                 logger.error(f"Web search error: {e}")
        
#         # 2. FAISS Vector Database (Stored Documents)
#         if use_faiss:
#             logger.info("📚 Searching FAISS vector database...")
#             try:
#                 faiss_data = self.faiss.search_market_data(structured_idea)
#                 if faiss_data and "not available" not in faiss_data.lower():
#                     research_sections.append("\n=== STORED RESEARCH DOCUMENTS (FAISS) ===")
#                     research_sections.append(faiss_data)
#                     logger.info("✅ FAISS data retrieved")
#                 else:
#                     logger.info("ℹ️  FAISS database empty or unavailable")
#             except Exception as e:
#                 logger.error(f"FAISS error: {e}")
        
#         # Compile all research
#         if research_sections:
#             return "\n\n".join(research_sections)
#         else:
#             return "No external research data available. Providing analysis based on general knowledge."
    
#     def _create_validation_prompt(self, context: str, research_data: str) -> str:
#         """Create comprehensive validation prompt with real data."""
        
#         data_quality_note = ""
#         if "REAL-TIME WEB SEARCH DATA" in research_data:
#             data_quality_note = "⚠️ CRITICAL: Use the REAL data from web search. These are ACTUAL statistics from live sources."
        
#         return f"""You are a senior market research analyst. Provide COMPREHENSIVE market validation using REAL DATA provided below.

# STARTUP DETAILS:
# {context}

# {data_quality_note}

# RESEARCH DATA (USE THIS REAL DATA):
# {research_data}

# YOUR TASK:
# Analyze the market using the REAL DATA PROVIDED ABOVE. Do not make up numbers - use the actual data from the research.

# Provide analysis covering:
# 1. TAM/SAM/SOM with SPECIFIC numbers from the research
# 2. Market growth rate from actual sources
# 3. Customer segments (3-5) with real pain points
# 4. Evidence from the research data (cite sources)
# 5. Competitive landscape (real competitors found in research)
# 6. Revenue potential based on real market data
# 7. Go-to-market strategy
# 8. Opportunities and risks

# CRITICAL RULES:
# - CITE THE RESEARCH DATA provided above
# - Use ACTUAL numbers from the research, not made-up estimates
# - If data is limited, state it clearly
# - Prioritize real sources over estimates
# - Include source names when citing data

# Respond with ONLY valid JSON:
# {{
#   "market_demand": "high|medium|low",
#   "tam": "STRING - Total market with $ amount from research",
#   "sam": "STRING - Serviceable market from research",
#   "som": "STRING - Year 1 target from research",
#   "market_growth_rate": "STRING - Growth % from research",
#   "market_size": "STRING - Detailed breakdown",
#   "target_segments": [
#     {{
#       "segment": "Segment name",
#       "size": "Size from research",
#       "pain_points": ["pain 1", "pain 2"],
#       "willingness_to_pay": "Price range"
#     }}
#   ],
#   "evidence": [
#     "Evidence point 1 with source citation",
#     "Evidence point 2 with source"
#   ],
#   "opportunities": ["opportunity 1", "opportunity 2"],
#   "concerns": ["concern 1", "concern 2"],
#   "competitive_landscape": {{
#     "direct_competitors": ["Competitor 1 from research"],
#     "indirect_competitors": ["Alternative 1"],
#     "market_position": "Positioning",
#     "competitive_advantage": "Key differentiators"
#   }},
#   "revenue_potential": {{
#     "year_1_estimate": "STRING - $X based on research",
#     "year_3_estimate": "STRING - $Y projection",
#     "avg_customer_value": "STRING - $Z per customer",
#     "reasoning": "How estimated using real data"
#   }},
#   "go_to_market": {{
#     "recommended_strategy": "Strategy based on research",
#     "target_first": "Which segment",
#     "pricing_strategy": "Pricing model",
#     "key_metrics": ["Metric 1", "Metric 2"]
#   }},
#   "confidence_score": 0.0-1.0,
#   "recommendation": "Proceed|Pivot|Stop",
#   "reasoning": "Detailed explanation using research data"
# }}

# JSON:"""
    
#     def _build_detailed_context(self, structured_idea: Dict[str, Any]) -> str:
#         """Build comprehensive context."""
#         context_parts = []
        
#         if structured_idea.get('problem_statement'):
#             context_parts.append(f"PROBLEM: {structured_idea['problem_statement']}")
#         if structured_idea.get('solution_description'):
#             context_parts.append(f"SOLUTION: {structured_idea['solution_description']}")
#         if structured_idea.get('target_audience'):
#             context_parts.append(f"TARGET: {structured_idea['target_audience']}")
#         if structured_idea.get('market_size_estimate'):
#             context_parts.append(f"USER'S ESTIMATE: {structured_idea['market_size_estimate']}")
#         if structured_idea.get('competitors') and structured_idea['competitors']:
#             comps = ', '.join(structured_idea['competitors']) if isinstance(structured_idea['competitors'], list) else structured_idea['competitors']
#             context_parts.append(f"KNOWN COMPETITORS: {comps}")
#         if structured_idea.get('unique_value_proposition'):
#             context_parts.append(f"VALUE PROP: {structured_idea['unique_value_proposition']}")
#         if structured_idea.get('business_model'):
#             context_parts.append(f"BUSINESS MODEL: {structured_idea['business_model']}")
#         if structured_idea.get('key_features') and structured_idea['key_features']:
#             features = ', '.join(structured_idea['key_features']) if isinstance(structured_idea['key_features'], list) else structured_idea['key_features']
#             context_parts.append(f"FEATURES: {features}")
        
#         return "\n".join(context_parts)
    
#     def _get_fallback_result(self) -> Dict[str, Any]:
#         """Return fallback result if validation fails."""
#         return {
#             "market_demand": "unknown",
#             "tam": "Unable to estimate - validation failed",
#             "sam": "Unable to estimate",
#             "som": "Unable to estimate",
#             "market_growth_rate": "Unknown",
#             "market_size": "Unable to assess - system error",
#             "target_segments": [],
#             "evidence": ["Automated validation failed - manual review required"],
#             "opportunities": [],
#             "concerns": ["System error during validation"],
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
#                 "recommended_strategy": "Conduct manual research",
#                 "target_first": "Unknown",
#                 "pricing_strategy": "Unknown",
#                 "key_metrics": []
#             },
#             "confidence_score": 0.0,
#             "recommendation": "Pivot",
#             "reasoning": "Automated validation failed. Manual market research required.",
#             "data_sources": {
#                 "web_search_used": False,
#                 "faiss_used": False,
#                 "research_quality": "none"
#             }
#         }