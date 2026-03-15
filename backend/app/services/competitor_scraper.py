# File: backend/app/services/competitor_scraper.py
# Scrapes competitor pricing pages and extracts pricing information

import requests
from bs4 import BeautifulSoup
from typing import Dict, List, Any, Optional
import re
from app.utils.logger import logger


class CompetitorPricingScraper:
    """
    Scrapes competitor websites for pricing information.
    
    Features:
    - Finds pricing pages via search
    - Extracts pricing tiers
    - Identifies features per plan
    - Gets trial/demo info
    """
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
    
    def scrape_competitor(self, competitor_name: str, website_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Scrape pricing and feature information for a competitor.
        
        Args:
            competitor_name: Name of competitor
            website_url: Optional website URL (will search if not provided)
            
        Returns:
            {
                'competitor': 'ClassDojo',
                'pricing_url': 'https://...',
                'pricing_tiers': [...],
                'features': [...],
                'trial_info': '...'
            }
        """
        logger.info(f"🔍 Scraping competitor: {competitor_name}")
        
        try:
            # Find pricing page
            pricing_url = self._find_pricing_page(competitor_name, website_url)
            
            if not pricing_url:
                logger.warning(f"Could not find pricing page for {competitor_name}")
                return self._empty_result(competitor_name)
            
            # Scrape the page
            html = self._fetch_page(pricing_url)
            
            if not html:
                return self._empty_result(competitor_name)
            
            # Extract pricing info
            soup = BeautifulSoup(html, 'html.parser')
            
            pricing_tiers = self._extract_pricing_tiers(soup)
            features = self._extract_features(soup)
            trial_info = self._extract_trial_info(soup)
            
            result = {
                'competitor': competitor_name,
                'pricing_url': pricing_url,
                'pricing_tiers': pricing_tiers,
                'features': features,
                'trial_info': trial_info,
                'scraped_successfully': True
            }
            
            logger.info(f"✅ Scraped {competitor_name}: {len(pricing_tiers)} tiers, {len(features)} features")
            return result
            
        except Exception as e:
            logger.error(f"Error scraping {competitor_name}: {e}")
            return self._empty_result(competitor_name)
    
    def scrape_multiple_competitors(self, competitors: List[str]) -> List[Dict[str, Any]]:
        """Scrape multiple competitors."""
        results = []
        
        for competitor in competitors[:3]:  # Limit to 3 to avoid rate limits
            result = self.scrape_competitor(competitor)
            results.append(result)
        
        return results
    
    def _find_pricing_page(self, competitor_name: str, website_url: Optional[str] = None) -> Optional[str]:
        """Find the pricing page URL."""
        
        # Common pricing URL patterns
        if website_url:
            base_url = website_url.rstrip('/')
            pricing_paths = [
                '/pricing',
                '/plans',
                '/plans-pricing',
                '/pricing-plans',
                '/buy',
                '/purchase',
                '/get-started'
            ]
            
            # Try common paths
            for path in pricing_paths:
                url = f"{base_url}{path}"
                try:
                    response = requests.head(url, headers=self.headers, timeout=5, allow_redirects=True)
                    if response.status_code == 200:
                        logger.info(f"Found pricing page: {url}")
                        return url
                except:
                    continue
        
        # Try Google search
        search_query = f"{competitor_name} pricing plans site:*.com"
        # Note: This would require SerpAPI in production
        # For now, construct likely URL
        
        # Guess common domain
        domain = competitor_name.lower().replace(' ', '')
        likely_url = f"https://www.{domain}.com/pricing"
        
        return likely_url
    
    def _fetch_page(self, url: str) -> Optional[str]:
        """Fetch HTML content of a page."""
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                return response.text
            else:
                logger.warning(f"HTTP {response.status_code} for {url}")
                return None
                
        except Exception as e:
            logger.error(f"Error fetching {url}: {e}")
            return None
    
    def _extract_pricing_tiers(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extract pricing tiers from page."""
        tiers = []
        
        # Look for common pricing tier patterns
        
        # Method 1: Look for price elements
        price_elements = soup.find_all(text=re.compile(r'\$\d+'))
        
        for price_el in price_elements[:5]:  # Limit to 5
            price_text = price_el.strip()
            
            # Extract number
            price_match = re.search(r'\$(\d+(?:,\d{3})*(?:\.\d{2})?)', price_text)
            
            if price_match:
                price = price_match.group(1)
                
                # Try to find tier name (parent or nearby element)
                parent = price_el.find_parent()
                tier_name = "Unknown Plan"
                
                if parent:
                    # Look for headers nearby
                    header = parent.find(['h1', 'h2', 'h3', 'h4'])
                    if header:
                        tier_name = header.get_text().strip()
                
                # Look for billing period
                billing = "per month"
                if 'year' in price_text.lower() or 'annual' in price_text.lower():
                    billing = "per year"
                elif 'week' in price_text.lower():
                    billing = "per week"
                
                tiers.append({
                    'name': tier_name,
                    'price': f"${price}",
                    'billing': billing,
                    'raw_text': price_text
                })
        
        # Method 2: Look for pricing cards/sections
        pricing_sections = soup.find_all(['div', 'section'], class_=re.compile(r'(pricing|plan|tier)', re.I))
        
        for section in pricing_sections[:3]:
            tier_name = "Plan"
            price = "Contact Sales"
            
            # Find heading
            heading = section.find(['h2', 'h3', 'h4'])
            if heading:
                tier_name = heading.get_text().strip()
            
            # Find price
            price_el = section.find(text=re.compile(r'\$\d+'))
            if price_el:
                price = price_el.strip()
            
            if tier_name and price:
                tiers.append({
                    'name': tier_name,
                    'price': price,
                    'billing': 'per month',
                    'raw_text': section.get_text()[:200]
                })
        
        # Deduplicate
        seen = set()
        unique_tiers = []
        for tier in tiers:
            key = (tier['name'], tier['price'])
            if key not in seen:
                seen.add(key)
                unique_tiers.append(tier)
        
        return unique_tiers[:5]  # Max 5 tiers
    
    def _extract_features(self, soup: BeautifulSoup) -> List[str]:
        """Extract feature list."""
        features = []
        
        # Look for feature lists
        feature_lists = soup.find_all(['ul', 'ol'])
        
        for ul in feature_lists[:3]:
            items = ul.find_all('li')
            for item in items[:10]:
                feature_text = item.get_text().strip()
                if len(feature_text) > 10 and len(feature_text) < 200:
                    features.append(feature_text)
        
        return features[:15]  # Max 15 features
    
    def _extract_trial_info(self, soup: BeautifulSoup) -> str:
        """Extract free trial or demo information."""
        
        # Look for trial-related text
        trial_keywords = ['free trial', 'trial', 'demo', 'free', 'no credit card']
        
        text = soup.get_text().lower()
        
        for keyword in trial_keywords:
            if keyword in text:
                # Extract sentence containing the keyword
                sentences = text.split('.')
                for sentence in sentences:
                    if keyword in sentence:
                        return sentence.strip()[:200]
        
        return "No trial information found"
    
    def _empty_result(self, competitor_name: str) -> Dict[str, Any]:
        """Return empty result structure."""
        return {
            'competitor': competitor_name,
            'pricing_url': None,
            'pricing_tiers': [],
            'features': [],
            'trial_info': 'Could not scrape pricing information',
            'scraped_successfully': False
        }
    
    def format_pricing_data(self, scraped_data: List[Dict[str, Any]]) -> str:
        """Format scraped pricing data for AI consumption."""
        
        if not scraped_data:
            return "No competitor pricing data available"
        
        formatted = ["=== COMPETITOR PRICING INTELLIGENCE ===\n"]
        
        for comp_data in scraped_data:
            if not comp_data['scraped_successfully']:
                formatted.append(f"\n{comp_data['competitor']}: Unable to scrape pricing")
                continue
            
            formatted.append(f"\n{comp_data['competitor']}:")
            formatted.append(f"URL: {comp_data['pricing_url']}")
            
            if comp_data['pricing_tiers']:
                formatted.append("\nPricing Tiers:")
                for tier in comp_data['pricing_tiers']:
                    formatted.append(f"  - {tier['name']}: {tier['price']} {tier['billing']}")
            
            if comp_data['features']:
                formatted.append(f"\nKey Features ({len(comp_data['features'])} found):")
                for feature in comp_data['features'][:5]:
                    formatted.append(f"  • {feature}")
            
            if comp_data['trial_info']:
                formatted.append(f"\nTrial: {comp_data['trial_info']}")
            
            formatted.append("")
        
        return "\n".join(formatted)