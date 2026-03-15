# File: backend/app/services/web_search_service.py
# Real-time web search for market validation

import os
import json
from typing import List, Dict, Any
from dotenv import load_dotenv
import requests
from app.utils.logger import logger

load_dotenv()


class WebSearchService:
    """
    Service for performing web searches to gather real market data.
    Uses SerpAPI for Google search results.
    """
    
    def __init__(self):
        self.serp_api_key = os.getenv('SERP_API_KEY')
        if not self.serp_api_key:
            logger.warning("SERP_API_KEY not found - web search disabled")
        self.base_url = "https://serpapi.com/search"
    
    def search_market_data(self, query: str, num_results: int = 5) -> List[Dict[str, Any]]:
        """
        Search for market data using Google.
        
        Args:
            query: Search query
            num_results: Number of results to return
            
        Returns:
            List of search results with title, snippet, link
        """
        if not self.serp_api_key:
            logger.warning("Web search skipped - no API key")
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
            
            logger.info(f"Found {len(results)} search results for: {query}")
            return results
            
        except Exception as e:
            logger.error(f"Search error: {e}")
            return []
    
    def search_market_size(self, industry: str, target_audience: str) -> str:
        """Search for market size data."""
        query = f"{industry} market size {target_audience} 2024 statistics"
        results = self.search_market_data(query, num_results=3)
        
        if not results:
            return "No market size data found"
        
        # Compile snippets
        data = "\n".join([
            f"- {r['title']}: {r['snippet']} (Source: {r['source']})"
            for r in results
        ])
        
        return f"Market Size Data:\n{data}"
    
    def search_competitors(self, industry: str, solution: str) -> str:
        """Search for competitor information."""
        query = f"{solution} {industry} competitors companies alternatives"
        results = self.search_market_data(query, num_results=3)
        
        if not results:
            return "No competitor data found"
        
        data = "\n".join([
            f"- {r['title']}: {r['snippet']}"
            for r in results
        ])
        
        return f"Competitor Data:\n{data}"
    
    def search_market_trends(self, industry: str) -> str:
        """Search for market trends and growth."""
        query = f"{industry} market trends growth rate forecast 2024-2026"
        results = self.search_market_data(query, num_results=3)
        
        if not results:
            return "No trend data found"
        
        data = "\n".join([
            f"- {r['title']}: {r['snippet']}"
            for r in results
        ])
        
        return f"Market Trends:\n{data}"
    
    def search_customer_insights(self, target_audience: str, problem: str) -> str:
        """Search for customer pain points and insights."""
        query = f"{target_audience} challenges pain points {problem} survey report"
        results = self.search_market_data(query, num_results=3)
        
        if not results:
            return "No customer insight data found"
        
        data = "\n".join([
            f"- {r['title']}: {r['snippet']}"
            for r in results
        ])
        
        return f"Customer Insights:\n{data}"
    
    def gather_comprehensive_data(self, structured_idea: Dict[str, Any]) -> str:
        """
        Gather comprehensive market data for validation.
        
        Returns formatted string with all research data.
        """
        logger.info("Gathering comprehensive market data via web search...")
        
        problem = structured_idea.get('problem_statement', '')
        solution = structured_idea.get('solution_description', '')
        target_audience = structured_idea.get('target_audience', '')
        
        # Determine industry from context
        industry = self._extract_industry(problem, solution, target_audience)
        
        research_data = []
        
        # 1. Market Size
        market_size_data = self.search_market_size(industry, target_audience)
        research_data.append(market_size_data)
        
        # 2. Competitors
        competitor_data = self.search_competitors(industry, solution)
        research_data.append(competitor_data)
        
        # 3. Market Trends
        trend_data = self.search_market_trends(industry)
        research_data.append(trend_data)
        
        # 4. Customer Insights
        customer_data = self.search_customer_insights(target_audience, problem)
        research_data.append(customer_data)
        
        compiled_research = "\n\n".join(research_data)
        
        logger.info("✅ Web search research completed")
        return compiled_research
    
    def _extract_industry(self, problem: str, solution: str, target: str) -> str:
        """Extract industry from context."""
        text = f"{problem} {solution} {target}".lower()
        
        # Simple keyword matching
        if any(word in text for word in ['school', 'education', 'student', 'teacher', 'edtech']):
            return 'education technology'
        elif any(word in text for word in ['restaurant', 'food', 'dining', 'kitchen']):
            return 'restaurant technology'
        elif any(word in text for word in ['health', 'medical', 'patient', 'doctor']):
            return 'healthcare technology'
        elif any(word in text for word in ['finance', 'banking', 'payment', 'money']):
            return 'fintech'
        elif any(word in text for word in ['ecommerce', 'retail', 'shopping', 'store']):
            return 'e-commerce'
        else:
            return 'technology'