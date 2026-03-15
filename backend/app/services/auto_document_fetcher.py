# File: backend/app/services/auto_document_fetcher.py
# Automatic Industry Report Fetcher
# Downloads PDFs from web without user intervention

import os
import requests
import hashlib
from typing import List, Dict, Optional
from serpapi import GoogleSearch
from app.utils.logger import logger
from datetime import datetime
import time


class AutoDocumentFetcher:
    """
    Automatically fetches and downloads industry reports from the web.
    
    Features:
    - Searches for domain-specific reports using SerpAPI
    - Downloads PDFs from research sites
    - Handles known industry sources
    - Validates and caches documents
    """
    
    def __init__(self, serpapi_key: str, download_dir: str = "/tmp/rag_docs"):
        self.serpapi_key = serpapi_key
        self.download_dir = download_dir
        
        # Create download directory
        os.makedirs(download_dir, exist_ok=True)
        
        # Cache to avoid re-downloading
        self.download_cache = {}
        
        logger.info("📥 Auto Document Fetcher initialized")
    
    def fetch_industry_reports(
        self, 
        domain: str, 
        year: int = 2024,
        max_docs: int = 6
    ) -> List[Dict]:
        """
        Automatically fetch relevant industry reports for domain.
        
        Args:
            domain: Industry domain (edtech, fintech, saas, etc.)
            year: Target year for reports (default: 2024)
            max_docs: Maximum documents to download (default: 6)
        
        Returns:
            List of downloaded document info dicts
        """
        
        logger.info(f"📥 Auto-fetching {domain} industry reports...")
        
        downloaded_files = []
        
        # Define search queries for this domain
        search_queries = self._get_search_queries(domain, year)
        
        for query in search_queries:
            if len(downloaded_files) >= max_docs:
                break
            
            try:
                logger.info(f"   🔍 Searching: {query[:70]}...")
                
                # Search for PDFs
                results = self._search_pdfs(query)
                
                # Download top results
                for result in results[:2]:  # Top 2 per query
                    if len(downloaded_files) >= max_docs:
                        break
                    
                    url = result.get('link', '')
                    
                    if self._is_valid_pdf_url(url):
                        # Download PDF
                        file_info = self._download_pdf(
                            url=url,
                            title=result.get('title', 'Unknown'),
                            query=query
                        )
                        
                        if file_info:
                            downloaded_files.append(file_info)
                            logger.info(f"      ✅ Downloaded: {file_info['title'][:60]}...")
                
                # Rate limiting
                time.sleep(1)
                
            except Exception as e:
                logger.warning(f"   ⚠️ Search failed for: {query[:50]}... - {e}")
                continue
        
        logger.info(f"   📥 Total documents downloaded: {len(downloaded_files)}")
        
        # Also try known sources
        known_sources = self._fetch_known_sources(domain, year)
        downloaded_files.extend(known_sources)
        
        return downloaded_files[:max_docs]
    
    def _get_search_queries(self, domain: str, year: int) -> List[str]:
        """Generate search queries for domain."""
        
        base_queries = [
            f"{domain} benchmarks {year} filetype:pdf",
            f"{domain} market analysis {year} filetype:pdf",
            f"{domain} pricing study {year} filetype:pdf",
            f"{domain} SaaS metrics {year} filetype:pdf",
            f"customer acquisition cost {domain} {year} filetype:pdf",
        ]
        
        # Add domain-specific queries
        domain_specific = {
            'edtech': [
                f"education technology market report {year} filetype:pdf",
                f"online learning benchmarks {year} filetype:pdf",
            ],
            'fintech': [
                f"financial technology trends {year} filetype:pdf",
                f"digital payments market {year} filetype:pdf",
            ],
            'healthtech': [
                f"healthcare technology market {year} filetype:pdf",
                f"digital health benchmarks {year} filetype:pdf",
            ],
            'saas': [
                f"SaaS capital survey {year} filetype:pdf",
                f"software industry benchmarks {year} filetype:pdf",
            ]
        }
        
        queries = base_queries + domain_specific.get(domain, [])
        return queries[:5]  # Limit to 5 queries
    
    def _search_pdfs(self, query: str) -> List[Dict]:
        """Search for PDFs using SerpAPI."""
        
        try:
            search = GoogleSearch({
                "q": query,
                "api_key": self.serpapi_key,
                "num": 10
            })
            
            results = search.get_dict()
            return results.get('organic_results', [])
        
        except Exception as e:
            logger.error(f"SerpAPI search failed: {e}")
            return []
    
    def _is_valid_pdf_url(self, url: str) -> bool:
        """Check if URL is likely a downloadable PDF."""
        
        if not url:
            return False
        
        # Direct PDF links
        if url.lower().endswith('.pdf'):
            return True
        
        # Known research/report platforms
        trusted_domains = [
            'researchgate.net',
            'arxiv.org',
            'ssrn.com',
            'papers.ssrn.com',
            'academia.edu',
            '.edu/',  # University sites
            'openviewpartners.com',
            'saas-capital.com',
            'mckinsey.com',
            'bcg.com',
            'deloitte.com',
            'gartner.com',
            'forrester.com',
        ]
        
        url_lower = url.lower()
        return any(domain in url_lower for domain in trusted_domains)
    
    def _download_pdf(
        self, 
        url: str, 
        title: str, 
        query: str
    ) -> Optional[Dict]:
        """Download PDF from URL."""
        
        # Check cache
        url_hash = hashlib.md5(url.encode()).hexdigest()
        if url_hash in self.download_cache:
            return self.download_cache[url_hash]
        
        try:
            # Download with timeout
            headers = {
                'User-Agent': 'Mozilla/5.0 (Academic Research Bot) AppleWebKit/537.36'
            }
            
            response = requests.get(
                url, 
                timeout=30, 
                headers=headers,
                allow_redirects=True
            )
            
            if response.status_code == 200:
                # Verify it's a PDF
                content_type = response.headers.get('Content-Type', '')
                if 'pdf' not in content_type.lower() and not url.endswith('.pdf'):
                    logger.debug(f"Not a PDF: {url}")
                    return None
                
                # Save file
                filename = f"{url_hash}.pdf"
                file_path = os.path.join(self.download_dir, filename)
                
                with open(file_path, 'wb') as f:
                    f.write(response.content)
                
                # File info
                file_info = {
                    'path': file_path,
                    'filename': filename,
                    'title': title,
                    'url': url,
                    'query': query,
                    'size': len(response.content),
                    'downloaded_at': datetime.now().isoformat()
                }
                
                # Cache it
                self.download_cache[url_hash] = file_info
                
                return file_info
            
            else:
                logger.debug(f"Failed to download (status {response.status_code}): {url}")
                return None
        
        except Exception as e:
            logger.debug(f"Download error for {url}: {e}")
            return None
    
    def _fetch_known_sources(self, domain: str, year: int) -> List[Dict]:
        """
        Attempt to download from known, reliable industry sources.
        These are pre-configured URLs known to have good reports.
        """
        
        known_sources = {
            'saas': [
                {
                    'url': 'https://www.saas-capital.com/wp-content/uploads/2024/01/SaaS-Survey-2024.pdf',
                    'title': 'SaaS Capital Survey 2024',
                },
                {
                    'url': 'https://openviewpartners.com/wp-content/uploads/2024/02/SaaS-Benchmarks-Report.pdf',
                    'title': 'OpenView SaaS Benchmarks 2024',
                }
            ],
            'edtech': [
                {
                    'url': 'https://www.holoniq.com/wp-content/uploads/2024/01/EdTech-Market-Report.pdf',
                    'title': 'HolonIQ EdTech Market Report 2024',
                }
            ],
            # Note: Many of these URLs are examples and may not exist
            # In production, maintain a curated list of working URLs
        }
        
        downloaded = []
        sources = known_sources.get(domain, [])
        
        for source in sources:
            try:
                file_info = self._download_pdf(
                    url=source['url'],
                    title=source['title'],
                    query=f"Known source: {domain}"
                )
                
                if file_info:
                    downloaded.append(file_info)
                    logger.info(f"      ✅ Known source: {source['title']}")
            except:
                continue
        
        return downloaded
    
    def clear_cache(self):
        """Clear download cache and temp files."""
        
        try:
            import shutil
            if os.path.exists(self.download_dir):
                shutil.rmtree(self.download_dir)
                os.makedirs(self.download_dir, exist_ok=True)
            
            self.download_cache = {}
            logger.info("🗑️ Download cache cleared")
        
        except Exception as e:
            logger.error(f"Failed to clear cache: {e}")