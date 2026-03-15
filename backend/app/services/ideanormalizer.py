# File: backend/app/services/ideanormalizer.py
# Feature 5: Improved Structured Idea Normalization
# Better extraction to reduce questions needed

from typing import Dict, Any
import json
import os
from dotenv import load_dotenv
from groq import Groq
from app.schemas.ideaschema import MandatoryIdeaSchema
from app.utils.logger import logger

# Load environment variables
load_dotenv()


class IdeaNormalizerService:
    """
    Normalizes raw text input into structured idea format.
    IMPROVED: Better extraction, fewer questions needed
    """
    
    def __init__(self):
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables.")
        self.client = Groq(api_key=api_key)
    
    def normalize_idea(self, raw_text: str) -> Dict[str, Any]:
        """
        Extract structured information with better inference.
        
        IMPROVED:
        - Makes reasonable inferences from context
        - Extracts implicit information
        - Reduces need for follow-up questions
        """
        logger.info("Normalizing idea from raw text (improved extraction)...")
        
        all_fields = MandatoryIdeaSchema.get_all_fields()
        
        prompt = f"""You are an expert business analyst extracting structured information from startup ideas.

Startup Idea:
{raw_text}

Extract information for these fields:
{json.dumps(all_fields, indent=2)}

EXTRACTION RULES:
1. **Extract explicitly stated information** - highest priority
2. **Make reasonable business inferences** - if context strongly suggests something
3. **Use industry knowledge** - fill in obvious patterns (e.g., if they mention "SaaS", business_model is likely "subscription")
4. **For stage**: Infer from language:
   - "I want to build" = "idea"
   - "I'm building" = "prototype" or "mvp"
   - "We launched" = "launched"
5. **For competitors**: If they mention similar products/companies, list them
6. **For key_features**: Extract from their solution description
7. **Only use null** when you truly have NO information or reasonable inference

Examples of good inference:
- "A SaaS platform for restaurants" → business_model: "Monthly/annual subscription (SaaS)"
- "Help remote teams collaborate" → target_audience: "Remote teams, distributed companies"
- "Using AI to analyze spending" → key_features: ["AI-powered analysis", "Spending insights"]

Respond with ONLY valid JSON:
{{
  "problem_statement": "string or null",
  "target_audience": "string or null",
  "solution_description": "string or null",
  "market_size_estimate": "string or null",
  "competitors": ["list or []"],
  "unique_value_proposition": "string or null",
  "business_model": "string or null",
  "key_features": ["list or []"],
  "stage": "string or null"
}}

JSON:"""

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,  # Slightly higher for better inference
                max_tokens=2500
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Clean markdown
            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            structured_data = json.loads(response_text)
            
            filled_count = len([v for v in structured_data.values() if v and v != []])
            logger.info(f"Extracted {filled_count}/9 fields successfully")
            
            return structured_data
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            logger.error(f"Response: {response_text if 'response_text' in locals() else 'N/A'}")
            return {field: None for field in all_fields.keys()}
            
        except Exception as e:
            logger.error(f"Error normalizing: {e}")
            raise