# File: backend/app/services/crossquestioning.py
# Feature 4: Cross-Questioning Engine - FINAL VERSION
# Asks exactly 5 different questions, no repeats

from typing import List, Dict, Optional
import json
import os
from dotenv import load_dotenv
from groq import Groq
from app.schemas.ideaschema import MandatoryIdeaSchema
from app.utils.logger import logger

load_dotenv()


class CrossQuestioningService:
    """
    Asks exactly 5 different questions.
    Each question targets a different field.
    Automatically marks complete after 5 questions.
    """
    
    MAX_QUESTIONS = 5
    
    # Pre-defined short questions for each field
    FIELD_QUESTIONS = {
        'problem_statement': "What specific problem does your startup solve?",
        'target_audience': "Who are your target customers?",
        'solution_description': "How does your solution work?",
        'unique_value_proposition': "What makes your solution unique?",
        'business_model': "How will you make money?",
        'competitors': "Who are your main competitors?",
        'market_size_estimate': "What's your estimated market size?",
        'key_features': "What are the key features of your product?",
        'stage': "What stage is your startup at? (idea/prototype/launched)"
    }
    
    def __init__(self):
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            raise ValueError("GROQ_API_KEY not found")
        self.client = Groq(api_key=api_key)
    
    def get_next_question(
        self, 
        structured_idea: Dict[str, any],
        questions_asked: int = 0,
        asked_fields: List[str] = []
    ) -> Optional[Dict[str, str]]:
        """
        Get the next question.
        Returns None if 5 questions asked OR no more fields to ask.
        """
        
        # HARD STOP: Already asked 5 questions
        if questions_asked >= self.MAX_QUESTIONS:
            logger.info(f"STOP: Already asked {self.MAX_QUESTIONS} questions")
            return None
        
        # Get missing fields
        idea_schema = MandatoryIdeaSchema(**structured_idea)
        missing_fields = idea_schema.get_missing_fields()
        
        if not missing_fields:
            logger.info("All fields complete")
            return None
        
        # Filter out already asked fields
        available_fields = [f for f in missing_fields if f not in asked_fields]
        
        if not available_fields:
            logger.info("No more new fields to ask about")
            return None
        
        # Get the next field to ask about
        next_field = available_fields[0]
        
        # Use pre-defined question
        question_text = self.FIELD_QUESTIONS.get(
            next_field, 
            f"Tell me about {next_field.replace('_', ' ')}?"
        )
        
        remaining = min(
            len(available_fields) - 1,
            self.MAX_QUESTIONS - questions_asked - 1
        )
        
        logger.info(f"Question {questions_asked + 1}/{self.MAX_QUESTIONS}: {next_field}")
        
        return {
            "field": next_field,
            "question": question_text,
            "remaining_questions": remaining
        }
    
    def update_structured_idea(
        self,
        structured_idea: Dict[str, any],
        field_name: str,
        answer: str
    ) -> Dict[str, any]:
        """Update field with user's answer."""
        logger.info(f"Updating field: {field_name}")
        
        # Handle list fields (competitors, key_features)
        if field_name in ['competitors', 'key_features']:
            parsed_value = self._parse_list_answer(answer)
        else:
            parsed_value = answer.strip()
        
        structured_idea[field_name] = parsed_value
        return structured_idea
    
    def _parse_list_answer(self, answer: str) -> List[str]:
        """Parse answer into list."""
        try:
            # Try AI parsing first
            prompt = f"""Convert this to a JSON array of strings:

{answer}

Return ONLY: ["item1", "item2", ...]
If "none": []

Array:"""

            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=200
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Clean markdown
            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            parsed = json.loads(response_text)
            return parsed if isinstance(parsed, list) else [response_text]
            
        except Exception as e:
            logger.error(f"List parse error: {e}")
            # Fallback: simple split
            if answer.lower() in ['none', 'no', 'not sure', 'n/a']:
                return []
            items = answer.replace(',', '\n').replace(';', '\n').split('\n')
            return [item.strip() for item in items if item.strip()]