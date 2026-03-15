# File: backend/app/services/crunchbase_service.py
# Crunchbase API integration for real company/funding data

import os
import requests
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from app.utils.logger import logger

load_dotenv()


class CrunchbaseService:
    """
    Crunchbase API integration for:
    - Company funding data
    - Valuation information
    - Employee counts
    - Investor information
    - Acquisition history
    
    API: https://data.crunchbase.com/docs
    Cost: $49/month for basic API access
    """
    
    def __init__(self):
        self.api_key = os.getenv('CRUNCHBASE_API_KEY')
        if not self.api_key:
            logger.warning("CRUNCHBASE_API_KEY not found - Crunchbase integration disabled")
        
        self.base_url = "https://api.crunchbase.com/api/v4"
        self.headers = {
            'X-cb-user-key': self.api_key,
            'Content-Type': 'application/json'
        }
    
    def get_company_data(self, company_name: str) -> Optional[Dict[str, Any]]:
        """
        Get comprehensive company data from Crunchbase.
        
        Returns:
            {
                'name': 'ClassDojo',
                'total_funding': '$66M',
                'last_funding_round': 'Series C',
                'valuation': '$350M',
                'employee_count': 200,
                'founded_year': 2011,
                'headquarters': 'San Francisco, CA',
                'investors': ['General Catalyst', 'Reach Capital'],
                'description': '...'
            }
        """
        if not self.api_key:
            return None
        
        logger.info(f"🔍 Fetching Crunchbase data for: {company_name}")
        
        try:
            # Search for organization
            org_uuid = self._search_organization(company_name)
            
            if not org_uuid:
                logger.warning(f"Company not found in Crunchbase: {company_name}")
                return None
            
            # Get detailed data
            company_data = self._get_organization_details(org_uuid)
            
            if company_data:
                logger.info(f"✅ Retrieved Crunchbase data for {company_name}")
            
            return company_data
            
        except Exception as e:
            logger.error(f"Crunchbase API error for {company_name}: {e}")
            return None
    
    def get_multiple_companies(self, company_names: List[str]) -> List[Dict[str, Any]]:
        """Get data for multiple companies."""
        results = []
        
        for company in company_names[:3]:  # Limit to 3 to save API calls
            data = self.get_company_data(company)
            if data:
                results.append(data)
        
        return results
    
    def _search_organization(self, company_name: str) -> Optional[str]:
        """Search for organization and return UUID."""
        
        endpoint = f"{self.base_url}/autocompletes"
        
        params = {
            'query': company_name,
            'collection_ids': 'organizations',
            'limit': 1
        }
        
        try:
            response = requests.get(
                endpoint,
                headers=self.headers,
                params=params,
                timeout=10
            )
            
            if response.status_code != 200:
                logger.error(f"Crunchbase search error: {response.status_code}")
                return None
            
            data = response.json()
            
            entities = data.get('entities', [])
            
            if entities:
                return entities[0].get('uuid')
            
            return None
            
        except Exception as e:
            logger.error(f"Error searching Crunchbase: {e}")
            return None
    
    def _get_organization_details(self, org_uuid: str) -> Dict[str, Any]:
        """Get detailed organization data."""
        
        endpoint = f"{self.base_url}/entities/organizations/{org_uuid}"
        
        # Specify fields to retrieve
        params = {
            'field_ids': ','.join([
                'identifier',
                'short_description',
                'num_employees_enum',
                'founded_on',
                'website',
                'categories',
                'location_identifiers',
                'funding_total',
                'last_funding_type',
                'num_funding_rounds',
                'investor_identifiers',
                'acquisitions',
                'ipo_status',
                'revenue_range',
                'valuation'
            ]),
            'card_ids': 'fields,funding_rounds,investors'
        }
        
        try:
            response = requests.get(
                endpoint,
                headers=self.headers,
                params=params,
                timeout=10
            )
            
            if response.status_code != 200:
                logger.error(f"Crunchbase details error: {response.status_code}")
                return {}
            
            data = response.json()
            properties = data.get('properties', {})
            cards = data.get('cards', {})
            
            # Parse employee count
            employee_range = properties.get('num_employees_enum', '')
            employee_count = self._parse_employee_count(employee_range)
            
            # Get investors
            investors_data = cards.get('investors', [])
            investors = [inv.get('investor_identifier', {}).get('value', '') 
                        for inv in investors_data[:5]]
            
            # Get funding rounds
            funding_rounds = cards.get('funding_rounds', [])
            last_round = funding_rounds[0] if funding_rounds else {}
            
            # Build result
            result = {
                'name': properties.get('identifier', {}).get('value', ''),
                'description': properties.get('short_description', ''),
                'total_funding': self._format_currency(properties.get('funding_total', {}).get('value', 0)),
                'last_funding_round': last_round.get('identifier', {}).get('value', 'Unknown'),
                'last_funding_type': properties.get('last_funding_type', 'Unknown'),
                'num_funding_rounds': properties.get('num_funding_rounds', 0),
                'employee_count': employee_count,
                'founded_year': properties.get('founded_on', {}).get('value', '')[:4] if properties.get('founded_on') else 'Unknown',
                'website': properties.get('website', {}).get('value', ''),
                'headquarters': self._format_location(properties.get('location_identifiers', [])),
                'investors': investors,
                'ipo_status': properties.get('ipo_status', 'Private'),
                'revenue_range': properties.get('revenue_range', 'Not disclosed'),
                'categories': [cat.get('value', '') for cat in properties.get('categories', [])[:3]]
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting organization details: {e}")
            return {}
    
    def _parse_employee_count(self, employee_enum: str) -> str:
        """Parse employee count enum to readable string."""
        
        ranges = {
            'c_00001_00010': '1-10',
            'c_00011_00050': '11-50',
            'c_00051_00100': '51-100',
            'c_00101_00250': '101-250',
            'c_00251_00500': '251-500',
            'c_00501_01000': '501-1000',
            'c_01001_05000': '1001-5000',
            'c_05001_10000': '5001-10000',
            'c_10001_max': '10000+'
        }
        
        return ranges.get(employee_enum, 'Unknown')
    
    def _format_currency(self, amount: int) -> str:
        """Format currency amount."""
        
        if amount >= 1_000_000_000:
            return f"${amount / 1_000_000_000:.1f}B"
        elif amount >= 1_000_000:
            return f"${amount / 1_000_000:.0f}M"
        elif amount >= 1_000:
            return f"${amount / 1_000:.0f}K"
        else:
            return f"${amount}"
    
    def _format_location(self, location_identifiers: List) -> str:
        """Format location from identifiers."""
        
        if not location_identifiers:
            return 'Unknown'
        
        locations = []
        for loc in location_identifiers[:2]:
            value = loc.get('value', '')
            if value:
                locations.append(value)
        
        return ', '.join(locations) if locations else 'Unknown'
    
    def format_crunchbase_data(self, companies_data: List[Dict[str, Any]]) -> str:
        """Format Crunchbase data for AI consumption."""
        
        if not companies_data:
            return "No Crunchbase data available (API key may be missing or companies not found)"
        
        formatted = ["=== CRUNCHBASE COMPANY INTELLIGENCE ===\n"]
        
        for company in companies_data:
            formatted.append(f"\n{company.get('name', 'Unknown Company')}:")
            formatted.append(f"  Description: {company.get('description', 'N/A')}")
            formatted.append(f"  Total Funding: {company.get('total_funding', 'N/A')}")
            formatted.append(f"  Last Round: {company.get('last_funding_round', 'N/A')} ({company.get('last_funding_type', 'N/A')})")
            formatted.append(f"  Employees: {company.get('employee_count', 'N/A')}")
            formatted.append(f"  Founded: {company.get('founded_year', 'N/A')}")
            formatted.append(f"  Headquarters: {company.get('headquarters', 'N/A')}")
            formatted.append(f"  Website: {company.get('website', 'N/A')}")
            formatted.append(f"  Status: {company.get('ipo_status', 'N/A')}")
            
            if company.get('investors'):
                formatted.append(f"  Key Investors: {', '.join(company['investors'][:3])}")
            
            if company.get('categories'):
                formatted.append(f"  Categories: {', '.join(company['categories'])}")
            
            formatted.append("")
        
        return "\n".join(formatted)