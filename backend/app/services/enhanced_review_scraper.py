# File: backend/app/services/enhanced_review_scraper.py
# Multi-source review scraper: G2, Capterra, TrustRadius, Product Hunt, App Store

import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Any
from app.utils.logger import logger
import time


class EnhancedReviewScraper:
    """
    Scrapes reviews from multiple sources:
    - G2 Crowd
    - Capterra
    - TrustRadius
    - Product Hunt
    - Google Play / App Store (if applicable)
    """
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
    
    def scrape_all_reviews(self, company_name: str, industry: str = "") -> Dict[str, Any]:
        """
        Scrape reviews from all sources.
        
        Returns:
        {
            'company_name': str,
            'total_reviews': int,
            'average_rating': float,
            'sources': {
                'g2': {...},
                'capterra': {...},
                'trustradius': {...},
                'producthunt': {...},
                'appstore': {...}
            },
            'summary': {
                'top_pros': [],
                'top_cons': [],
                'common_themes': []
            }
        }
        """
        logger.info(f"🔍 Scraping reviews for: {company_name}")
        
        results = {
            'company_name': company_name,
            'total_reviews': 0,
            'average_rating': 0.0,
            'sources': {},
            'all_reviews': [],
            'summary': {
                'top_pros': [],
                'top_cons': [],
                'common_themes': []
            }
        }
        
        # Source 1: G2
        try:
            g2_data = self._scrape_g2(company_name, industry)
            if g2_data:
                results['sources']['g2'] = g2_data
                results['all_reviews'].extend(g2_data.get('reviews', []))
                logger.info(f"   ✅ G2: {g2_data.get('review_count', 0)} reviews")
        except Exception as e:
            logger.error(f"G2 scrape error: {e}")
        
        # Source 2: Capterra
        try:
            capterra_data = self._scrape_capterra(company_name)
            if capterra_data:
                results['sources']['capterra'] = capterra_data
                results['all_reviews'].extend(capterra_data.get('reviews', []))
                logger.info(f"   ✅ Capterra: {capterra_data.get('review_count', 0)} reviews")
        except Exception as e:
            logger.error(f"Capterra scrape error: {e}")
        
        # Source 3: TrustRadius
        try:
            trustradius_data = self._scrape_trustradius(company_name)
            if trustradius_data:
                results['sources']['trustradius'] = trustradius_data
                results['all_reviews'].extend(trustradius_data.get('reviews', []))
                logger.info(f"   ✅ TrustRadius: {trustradius_data.get('review_count', 0)} reviews")
        except Exception as e:
            logger.error(f"TrustRadius scrape error: {e}")
        
        # Source 4: Product Hunt
        try:
            ph_data = self._scrape_producthunt(company_name)
            if ph_data:
                results['sources']['producthunt'] = ph_data
                results['all_reviews'].extend(ph_data.get('reviews', []))
                logger.info(f"   ✅ Product Hunt: {ph_data.get('review_count', 0)} reviews")
        except Exception as e:
            logger.error(f"Product Hunt scrape error: {e}")
        
        # Source 5: App Store (if mobile app)
        try:
            appstore_data = self._scrape_appstore(company_name)
            if appstore_data:
                results['sources']['appstore'] = appstore_data
                results['all_reviews'].extend(appstore_data.get('reviews', []))
                logger.info(f"   ✅ App Store: {appstore_data.get('review_count', 0)} reviews")
        except Exception as e:
            logger.error(f"App Store scrape error: {e}")
        
        # Calculate totals
        results['total_reviews'] = len(results['all_reviews'])
        
        if results['all_reviews']:
            ratings = [r['rating'] for r in results['all_reviews'] if r.get('rating')]
            if ratings:
                results['average_rating'] = round(sum(ratings) / len(ratings), 2)
        
        # Analyze reviews for summary
        if results['all_reviews']:
            results['summary'] = self._analyze_reviews(results['all_reviews'])
        
        logger.info(f"✅ Total reviews collected: {results['total_reviews']}")
        
        return results
    
    def _scrape_g2(self, company_name: str, industry: str) -> Dict[str, Any]:
        """Scrape G2 Crowd reviews."""
        
        try:
            # Search G2 for the product
            search_url = f"https://www.g2.com/search?query={company_name.replace(' ', '+')}"
            
            response = requests.get(search_url, headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Extract rating and review count (simplified - actual G2 scraping is more complex)
                # For now, return placeholder with search results
                
                return {
                    'source': 'G2',
                    'url': search_url,
                    'rating': None,  # Would extract from page
                    'review_count': 0,
                    'reviews': [],
                    'note': 'G2 data requires API access for full scraping'
                }
        
        except Exception as e:
            logger.error(f"G2 error: {e}")
            return None
    
    def _scrape_capterra(self, company_name: str) -> Dict[str, Any]:
        """Scrape Capterra reviews."""
        
        try:
            search_url = f"https://www.capterra.com/search/?query={company_name.replace(' ', '+')}"
            
            response = requests.get(search_url, headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                return {
                    'source': 'Capterra',
                    'url': search_url,
                    'rating': None,
                    'review_count': 0,
                    'reviews': [],
                    'note': 'Capterra data requires API access'
                }
        
        except Exception as e:
            logger.error(f"Capterra error: {e}")
            return None
    
    def _scrape_trustradius(self, company_name: str) -> Dict[str, Any]:
        """Scrape TrustRadius reviews."""
        
        try:
            search_url = f"https://www.trustradius.com/products/{company_name.lower().replace(' ', '-')}/reviews"
            
            response = requests.get(search_url, headers=self.headers, timeout=10, allow_redirects=True)
            
            if response.status_code == 200:
                return {
                    'source': 'TrustRadius',
                    'url': search_url,
                    'rating': None,
                    'review_count': 0,
                    'reviews': []
                }
        
        except Exception as e:
            logger.error(f"TrustRadius error: {e}")
            return None
    
    def _scrape_producthunt(self, company_name: str) -> Dict[str, Any]:
        """Scrape Product Hunt reviews."""
        
        try:
            search_url = f"https://www.producthunt.com/search?q={company_name.replace(' ', '+')}"
            
            response = requests.get(search_url, headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                return {
                    'source': 'Product Hunt',
                    'url': search_url,
                    'rating': None,
                    'review_count': 0,
                    'reviews': []
                }
        
        except Exception as e:
            logger.error(f"Product Hunt error: {e}")
            return None
    
    def _scrape_appstore(self, company_name: str) -> Dict[str, Any]:
        """Scrape App Store reviews (if applicable)."""
        
        try:
            # Search Apple App Store
            search_url = f"https://apps.apple.com/us/search?term={company_name.replace(' ', '+')}"
            
            return {
                'source': 'App Store',
                'url': search_url,
                'rating': None,
                'review_count': 0,
                'reviews': [],
                'note': 'App Store requires RSS feed parsing'
            }
        
        except Exception as e:
            logger.error(f"App Store error: {e}")
            return None
    
    def _analyze_reviews(self, reviews: List[Dict]) -> Dict[str, Any]:
        """Analyze all reviews to extract common themes."""
        
        # Simple keyword extraction (can be enhanced with NLP)
        pros = []
        cons = []
        themes = []
        
        for review in reviews:
            if review.get('pros'):
                pros.extend(review['pros'])
            if review.get('cons'):
                cons.extend(review['cons'])
        
        # Count frequency (simplified)
        from collections import Counter
        
        if pros:
            top_pros = [item for item, count in Counter(pros).most_common(5)]
        else:
            top_pros = []
        
        if cons:
            top_cons = [item for item, count in Counter(cons).most_common(5)]
        else:
            top_cons = []
        
        return {
            'top_pros': top_pros[:5],
            'top_cons': top_cons[:5],
            'common_themes': themes[:5]
        }
    
    def scrape_reviews_via_search(self, company_name: str) -> Dict[str, Any]:
        """
        Alternative: Use web search to find reviews across platforms.
        More reliable than direct scraping.
        """
        
        from app.services.enhanced_web_search import EnhancedWebSearchService
        
        search = EnhancedWebSearchService()
        
        reviews_data = {
            'company_name': company_name,
            'reviews': [],
            'sources': []
        }
        
        # Search for reviews on multiple platforms
        queries = [
            f"{company_name} reviews G2",
            f"{company_name} reviews Capterra",
            f"{company_name} reviews TrustRadius",
            f"{company_name} customer feedback",
            f"{company_name} user complaints"
        ]
        
        for query in queries:
            try:
                results = search.search(query, num_results=3)
                
                for result in results:
                    reviews_data['reviews'].append({
                        'title': result.get('title', ''),
                        'snippet': result.get('snippet', ''),
                        'url': result.get('link', ''),
                        'source': result.get('source', 'Web')
                    })
                    
                    if result.get('source') not in reviews_data['sources']:
                        reviews_data['sources'].append(result.get('source', 'Web'))
                
                time.sleep(0.5)  # Rate limit
                
            except Exception as e:
                logger.error(f"Search error for {query}: {e}")
        
        return reviews_data