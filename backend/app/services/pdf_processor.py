# File: backend/app/services/pdf_processor.py
# Intelligent PDF Processor for Financial Documents
# Extracts text, tables, and financial metrics

import os
import re
import json
from typing import Dict, List, Optional, Any
from groq import Groq
from app.utils.logger import logger

# PDF parsing libraries
try:
    import PyPDF2
    import pdfplumber
except ImportError:
    logger.warning("PDF libraries not installed. Install: pip install PyPDF2 pdfplumber")


class FinancialDocumentProcessor:
    """
    Processes financial PDFs and extracts metrics automatically.
    
    Features:
    - Text extraction from PDFs
    - Table detection and parsing
    - LLM-powered metric extraction
    - Smart chunking for financial documents
    """
    
    def __init__(self, groq_api_key: str):
        self.client = Groq(api_key=groq_api_key)
        logger.info("📄 Financial Document Processor initialized")
    
    def process_document(
        self, 
        pdf_path: str, 
        domain: str
    ) -> Dict[str, Any]:
        """
        Process a PDF and extract financial metrics.
        
        Args:
            pdf_path: Path to PDF file
            domain: Industry domain (for context)
        
        Returns:
            Dict with extracted metrics and metadata
        """
        
        logger.info(f"   📄 Processing: {os.path.basename(pdf_path)}")
        
        try:
            # Extract text
            text = self._extract_text(pdf_path)
            
            if not text or len(text) < 100:
                logger.warning(f"      ⚠️ Minimal text extracted ({len(text)} chars)")
                return {}
            
            # Extract tables
            tables = self._extract_tables(pdf_path)
            
            logger.info(f"      ✓ Extracted {len(text)} chars, {len(tables)} tables")
            
            # Use LLM to extract metrics
            metrics = self._extract_metrics_with_llm(
                text=text,
                tables=tables,
                domain=domain
            )
            
            if metrics:
                logger.info(f"      ✅ Extracted metrics: {list(metrics.keys())}")
            
            return {
                'metrics': metrics,
                'text': text[:5000],  # First 5K chars for context
                'tables': tables[:3],  # First 3 tables
                'char_count': len(text),
                'table_count': len(tables)
            }
        
        except Exception as e:
            logger.error(f"      ❌ Processing failed: {e}")
            return {}
    
    def _extract_text(self, pdf_path: str) -> str:
        """Extract all text from PDF."""
        
        text = ""
        
        try:
            # Try pdfplumber first (better for tables)
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n\n"
        
        except Exception as e:
            logger.debug(f"pdfplumber failed, trying PyPDF2: {e}")
            
            # Fallback to PyPDF2
            try:
                with open(pdf_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    for page in pdf_reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n\n"
            except Exception as e2:
                logger.error(f"Both PDF extractors failed: {e2}")
        
        return text.strip()
    
    def _extract_tables(self, pdf_path: str) -> List[Dict]:
        """Extract tables from PDF."""
        
        tables = []
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    page_tables = page.extract_tables()
                    
                    for table_data in page_tables:
                        if table_data and len(table_data) > 1:
                            # Convert to dict format
                            headers = table_data[0] if table_data[0] else []
                            rows = table_data[1:]
                            
                            table_dict = {
                                'page': page_num,
                                'headers': headers,
                                'rows': rows,
                                'row_count': len(rows)
                            }
                            
                            tables.append(table_dict)
        
        except Exception as e:
            logger.debug(f"Table extraction failed: {e}")
        
        return tables
    
    def _extract_metrics_with_llm(
        self, 
        text: str, 
        tables: List[Dict], 
        domain: str
    ) -> Dict[str, Any]:
        """
        Use LLM to extract financial metrics from text and tables.
        """
        
        # Prepare text sample (first ~4000 chars to fit in context)
        text_sample = text[:4000]
        
        # Prepare table summary
        table_summary = []
        for i, table in enumerate(tables[:3]):  # Max 3 tables
            table_summary.append({
                'table_num': i + 1,
                'page': table['page'],
                'headers': table['headers'],
                'row_count': table['row_count'],
                'sample_rows': table['rows'][:3]  # First 3 rows
            })
        
        # Create extraction prompt
        prompt = self._build_extraction_prompt(
            domain=domain,
            text=text_sample,
            tables=table_summary
        )
        
        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=1000
            )
            
            content = response.choices[0].message.content.strip()
            
            # Parse JSON from response
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0]
            elif '```' in content:
                content = content.split('```')[1].split('```')[0]
            
            metrics = json.loads(content.strip())
            
            return metrics
        
        except Exception as e:
            logger.warning(f"LLM extraction failed: {e}")
            return {}
    
    def _build_extraction_prompt(
        self, 
        domain: str, 
        text: str, 
        tables: List[Dict]
    ) -> str:
        """Build prompt for metric extraction."""
        
        return f"""Extract financial benchmarks for {domain} industry from this document.

DOCUMENT TEXT (first 4000 characters):
{text}

TABLES FOUND:
{json.dumps(tables, indent=2)}

Extract these metrics if present:
- Customer Acquisition Cost (CAC) - in dollars
- Lifetime Value (LTV) - in dollars
- Monthly Churn Rate - as percentage
- Average Subscription Price - monthly, in dollars
- Market Size (TAM) - in dollars
- Growth Rate (CAGR) - as percentage
- Any pricing tiers

For each metric found, include:
- value (numeric)
- source (e.g., "Page 12, Table 3", "Section 2.1", "Figure 5")
- confidence (0.0 to 1.0)

Return ONLY valid JSON (no markdown, no explanation):
{{
  "cac": {{
    "value": 194.50,
    "source": "Page 12, Table 3",
    "confidence": 0.9
  }},
  "ltv": {{
    "value": 756.00,
    "source": "Page 15, paragraph 2",
    "confidence": 0.85
  }},
  "churn_monthly": {{
    "value": 4.2,
    "source": "Figure 8, page 18",
    "confidence": 0.9
  }},
  "avg_price_monthly": {{
    "value": 79.00,
    "source": "Table 5, page 22",
    "confidence": 0.8
  }},
  "market_size_tam": {{
    "value": 163490000000,
    "source": "Page 5, executive summary",
    "confidence": 0.95
  }},
  "growth_rate_cagr": {{
    "value": 13.3,
    "source": "Page 7, forecast section",
    "confidence": 0.9
  }},
  "pricing_tiers": [
    {{"name": "Basic", "price": 29, "source": "Table 6"}},
    {{"name": "Pro", "price": 79, "source": "Table 6"}},
    {{"name": "Enterprise", "price": 199, "source": "Table 6"}}
  ]
}}

If a metric is not found, omit it from the JSON (do not use null).
Return ONLY the JSON object.

JSON:"""
    
    def chunk_for_faiss(
        self, 
        text: str, 
        tables: List[Dict],
        chunk_size: int = 500
    ) -> List[Dict]:
        """
        Create intelligent chunks for FAISS storage.
        Keeps tables and related context together.
        """
        
        chunks = []
        
        # Add tables as special chunks
        for table in tables:
            table_text = f"TABLE (Page {table['page']}):\n"
            table_text += f"Headers: {', '.join(table['headers'])}\n"
            
            for row in table['rows'][:10]:  # Max 10 rows
                table_text += " | ".join(str(cell) for cell in row) + "\n"
            
            chunks.append({
                'text': table_text,
                'type': 'table',
                'page': table['page'],
                'metadata': {'table_headers': table['headers']}
            })
        
        # Chunk remaining text
        # Split by paragraphs first
        paragraphs = text.split('\n\n')
        
        current_chunk = ""
        for para in paragraphs:
            if len(current_chunk) + len(para) < chunk_size:
                current_chunk += para + "\n\n"
            else:
                if current_chunk:
                    chunks.append({
                        'text': current_chunk.strip(),
                        'type': 'text',
                        'metadata': {}
                    })
                current_chunk = para + "\n\n"
        
        # Add final chunk
        if current_chunk:
            chunks.append({
                'text': current_chunk.strip(),
                'type': 'text',
                'metadata': {}
            })
        
        return chunks