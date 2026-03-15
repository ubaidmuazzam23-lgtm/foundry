# File: backend/app/services/enhanced_web_search.py
# Enhanced web search with 8-12 targeted queries for deep market research

import os
import json
from typing import List, Dict, Any
from dotenv import load_dotenv
import requests
from app.utils.logger import logger

load_dotenv()


class EnhancedWebSearchService:
    """
    Enhanced web search service with targeted, granular queries.
    
    Improvements over basic search:
    - 8-12 queries instead of 4
    - More specific query construction
    - Extracts pricing, case studies, benchmarks
    - Industry-specific searches
    """
    
    def __init__(self):
        self.serp_api_key = os.getenv('SERP_API_KEY')
        if not self.serp_api_key:
            logger.warning("SERP_API_KEY not found - enhanced web search disabled")
        self.base_url = "https://serpapi.com/search"
    
    def search(self, query: str, num_results: int = 5) -> List[Dict[str, Any]]:
        """Execute a single search query."""
        if not self.serp_api_key:
            return []
        
        try:
            params = {
                "q": query,
                "api_key": self.serp_api_key,
                "num": num_results,
                "engine": "google"
            }
            
            response = requests.get(self.base_url, params=params, timeout=10)
            
            if response.status_code != 200:
                logger.error(f"Search API error: {response.status_code}")
                return []
            
            data = response.json()
            
            results = []
            for item in data.get('organic_results', [])[:num_results]:
                results.append({
                    'title': item.get('title', ''),
                    'snippet': item.get('snippet', ''),
                    'link': item.get('link', ''),
                    'source': item.get('source', '')
                })
            
            logger.info(f"✅ Found {len(results)} results for: {query[:60]}...")
            return results
            
        except Exception as e:
            logger.error(f"Search error: {e}")
            return []
    
    def gather_comprehensive_data(self, structured_idea: Dict[str, Any]) -> str:
        """
        Enhanced comprehensive search with 8-12 targeted queries.
        """
        logger.info("🔍 Starting ENHANCED web search (8-12 queries)...")
        
        # Extract key info
        problem = structured_idea.get('problem_statement', '')
        solution = structured_idea.get('solution_description', '')
        target_audience = structured_idea.get('target_audience', '')
        competitors = structured_idea.get('competitors', [])
        if isinstance(competitors, list):
            competitor_list = competitors
        else:
            competitor_list = [competitors] if competitors else []
        
        # Determine industry
        industry = self._extract_industry(problem, solution, target_audience)
        
        # Build solution keywords
        solution_keywords = self._extract_solution_keywords(solution)
        
        research_sections = []
        
        # === QUERY SET 1: Market Size (3 queries) ===
        logger.info("📊 Phase 1: Market Size Research")
        
        # Q1: Total Addressable Market
        tam_query = f"{industry} market size TAM total addressable market 2024 2025"
        tam_results = self.search(tam_query, num_results=3)
        if tam_results:
            research_sections.append("=== MARKET SIZE - TAM ===")
            research_sections.append(self._format_results(tam_results))
        
        # Q2: Specific segment market size
        segment_query = f"{target_audience} {solution_keywords} market size spending budget 2024"
        segment_results = self.search(segment_query, num_results=3)
        if segment_results:
            research_sections.append("\n=== MARKET SIZE - TARGET SEGMENT ===")
            research_sections.append(self._format_results(segment_results))
        
        # Q3: Market growth and forecast
        growth_query = f"{industry} market growth rate CAGR forecast 2024 2025 2026"
        growth_results = self.search(growth_query, num_results=3)
        if growth_results:
            research_sections.append("\n=== MARKET GROWTH & FORECAST ===")
            research_sections.append(self._format_results(growth_results))
        
        # === QUERY SET 2: Competition (3 queries) ===
        logger.info("⚔️  Phase 2: Competitive Intelligence")
        
        # Q4: Direct competitors
        comp_query = f"{solution_keywords} {target_audience} software companies vendors competitors 2024"
        comp_results = self.search(comp_query, num_results=4)
        if comp_results:
            research_sections.append("\n=== COMPETITORS - DIRECT ===")
            research_sections.append(self._format_results(comp_results))
        
        # Q5: Competitor pricing (if we have names)
        if competitor_list:
            pricing_query = f"{competitor_list[0]} pricing plans cost per user enterprise"
            pricing_results = self.search(pricing_query, num_results=3)
            if pricing_results:
                research_sections.append("\n=== COMPETITOR PRICING ===")
                research_sections.append(self._format_results(pricing_results))
        
        # Q6: Market share and positioning
        position_query = f"{industry} market share leaders top companies 2024"
        position_results = self.search(position_query, num_results=3)
        if position_results:
            research_sections.append("\n=== MARKET LEADERS & SHARE ===")
            research_sections.append(self._format_results(position_results))
        
        # === QUERY SET 3: Customer Research (3 queries) ===
        logger.info("👥 Phase 3: Customer Insights")
        
        # Q7: Customer pain points
        pain_query = f"{target_audience} challenges problems pain points {problem} survey report"
        pain_results = self.search(pain_query, num_results=3)
        if pain_results:
            research_sections.append("\n=== CUSTOMER PAIN POINTS ===")
            research_sections.append(self._format_results(pain_results))
        
        # Q8: Customer spending behavior
        spending_query = f"{target_audience} technology spending budget allocation {industry} 2024"
        spending_results = self.search(spending_query, num_results=3)
        if spending_results:
            research_sections.append("\n=== CUSTOMER SPENDING PATTERNS ===")
            research_sections.append(self._format_results(spending_results))
        
        # Q9: Adoption trends
        adoption_query = f"{target_audience} {solution_keywords} adoption rate statistics trends"
        adoption_results = self.search(adoption_query, num_results=3)
        if adoption_results:
            research_sections.append("\n=== ADOPTION & TRENDS ===")
            research_sections.append(self._format_results(adoption_results))
        
        # === QUERY SET 4: Industry Intelligence (3 queries) ===
        logger.info("📈 Phase 4: Industry Analysis")
        
        # Q10: Industry trends
        trends_query = f"{industry} trends 2024 2025 emerging technologies innovations"
        trends_results = self.search(trends_query, num_results=3)
        if trends_results:
            research_sections.append("\n=== INDUSTRY TRENDS ===")
            research_sections.append(self._format_results(trends_results))
        
        # Q11: Investment and funding
        funding_query = f"{industry} venture capital investment funding 2024 startups"
        funding_results = self.search(funding_query, num_results=3)
        if funding_results:
            research_sections.append("\n=== INVESTMENT & FUNDING ===")
            research_sections.append(self._format_results(funding_results))
        
        # Q12: Case studies and ROI
        roi_query = f"{solution_keywords} {target_audience} case study ROI results success story"
        roi_results = self.search(roi_query, num_results=3)
        if roi_results:
            research_sections.append("\n=== CASE STUDIES & ROI ===")
            research_sections.append(self._format_results(roi_results))
        
        compiled_research = "\n\n".join(research_sections)
        
        logger.info(f"✅ Enhanced web search complete - {len(research_sections)} data sections gathered")
        return compiled_research
    
    def _format_results(self, results: List[Dict]) -> str:
        """Format search results into readable text."""
        formatted = []
        for i, r in enumerate(results, 1):
            formatted.append(f"[{i}] {r['title']}")
            formatted.append(f"    {r['snippet']}")
            formatted.append(f"    Source: {r.get('source', 'Unknown')}")
            formatted.append(f"    URL: {r.get('link', '')}")
            formatted.append("")
        return "\n".join(formatted)
    
    def _extract_industry(self, problem: str, solution: str, target: str) -> str:
        """Extract industry from context."""
        text = f"{problem} {solution} {target}".lower()
        
        industries = {
            'education technology': ['school', 'education', 'student', 'teacher', 'edtech', 'learning', 'classroom'],
            'restaurant technology': ['restaurant', 'food', 'dining', 'kitchen', 'hospitality', 'foodservice'],
            'healthcare technology': ['health', 'medical', 'patient', 'doctor', 'hospital', 'clinic', 'healthcare'],
            'financial technology': ['finance', 'banking', 'payment', 'money', 'fintech', 'trading', 'investment'],
            'e-commerce': ['ecommerce', 'retail', 'shopping', 'store', 'marketplace', 'seller'],
            'human resources technology': ['hr', 'recruiting', 'hiring', 'employee', 'workforce', 'talent'],
            'real estate technology': ['real estate', 'property', 'housing', 'rental', 'proptech'],
            'logistics technology': ['logistics', 'shipping', 'delivery', 'supply chain', 'warehouse'],
            'marketing technology': ['marketing', 'advertising', 'martech', 'campaign', 'brand'],
            'sales technology': ['sales', 'crm', 'pipeline', 'deal', 'salestech']
        }
        
        for industry, keywords in industries.items():
            if any(keyword in text for keyword in keywords):
                return industry
        
        return 'technology'
    
    def _extract_solution_keywords(self, solution: str) -> str:
        """Extract key solution terms for better queries."""
        solution_lower = solution.lower()
        
        # Extract important nouns
        keywords = []
        
        key_terms = [
            'platform', 'software', 'app', 'tool', 'system', 'service',
            'saas', 'dashboard', 'analytics', 'automation', 'ai', 'ml',
            'tracking', 'monitoring', 'management', 'communication',
            'collaboration', 'reporting', 'integration'
        ]
        
        for term in key_terms:
            if term in solution_lower:
                keywords.append(term)
        
        # Take first 50 chars if no keywords found
        if not keywords:
            words = solution.split()[:5]
            return ' '.join(words)
        
        return ' '.join(keywords[:3])