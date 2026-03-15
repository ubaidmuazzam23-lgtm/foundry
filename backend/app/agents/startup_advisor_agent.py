# File: backend/app/agents/startup_advisor_agent.py
# Intelligent chatbot that knows everything about the user's startup

from typing import Dict, Any, List, Optional
import json
from datetime import datetime
from groq import Groq
from app.utils.logger import logger
from app.db.session import get_db
import os
from dotenv import load_dotenv

load_dotenv()


class StartupAdvisorAgent:
    """
    AI advisor that knows everything about the user's startup.
    Uses all validated data to provide contextual, intelligent answers.
    """
    
    def __init__(self):
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            raise ValueError("GROQ_API_KEY not found")
        self.client = Groq(api_key=api_key)
        logger.info("🤖 Startup Advisor Agent initialized")
    
    def chat(
        self,
        idea_id: int,
        user_message: str,
        conversation_history: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Chat with the AI advisor about the startup.
        
        Args:
            idea_id: The startup idea to discuss
            user_message: User's question/message
            conversation_history: Previous messages in conversation
            
        Returns:
            {
                'response': 'AI response text',
                'sources': ['data sources used'],
                'suggestions': ['follow-up actions']
            }
        """
        
        logger.info(f"💬 Advisor chat for idea #{idea_id}")
        logger.info(f"   Question: {user_message[:100]}")
        
        # Gather startup context
        context = self._gather_startup_context(idea_id)
        
        # Build system prompt with context
        system_prompt = self._build_system_prompt(context)
        
        # Build conversation messages
        messages = self._build_messages(
            system_prompt,
            user_message,
            conversation_history or []
        )
        
        # Get AI response
        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
            
            ai_response = response.choices[0].message.content
            
            # Extract sources and suggestions
            sources = self._extract_sources(context, ai_response)
            suggestions = self._extract_suggestions(ai_response)
            
            logger.info(f"   ✅ Response generated ({len(ai_response)} chars)")
            
            return {
                'response': ai_response,
                'sources': sources,
                'suggestions': suggestions,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Chat failed: {e}")
            raise
    
    def _gather_startup_context(self, idea_id: int) -> Dict[str, Any]:
        """Gather all available data about the startup."""
        
        db = next(get_db())
        try:
            from app.models.idea import StructuredIdea
            from app.models.validation import ValidationSession
            
            # Get idea
            idea = db.query(StructuredIdea).filter(
                StructuredIdea.id == idea_id
            ).first()
            
            if not idea:
                return {}
            
            # Get latest validation session
            session = db.query(ValidationSession).filter(
                ValidationSession.structured_idea_id == idea_id
            ).order_by(ValidationSession.created_at.desc()).first()
            
            # Parse structured data
            structured_data = idea.structured_data
            if isinstance(structured_data, str):
                structured_data = json.loads(structured_data)
            
            # Get validation results
            results = session.results if session else {}
            if isinstance(results, str):
                results = json.loads(results)
            
            context = {
                'idea': structured_data,
                'market_validation': results.get('market_validation', {}),
                'competitor_analysis': results.get('competitor_analysis', {}),
                'financial_projections': results.get('financial_projections', {}),
                'quality_evaluation': results.get('quality_evaluation', {})
            }
            
            logger.info(f"   📊 Context gathered: {len(str(context))} chars")
            
            return context
            
        finally:
            db.close()
    
    def _build_system_prompt(self, context: Dict) -> str:
        """Build comprehensive system prompt with startup data."""
        
        idea = context.get('idea', {})
        market = context.get('market_validation', {})
        competitors = context.get('competitor_analysis', {})
        financials = context.get('financial_projections', {})
        quality = context.get('quality_evaluation', {})
        
        # Extract key information
        startup_name = idea.get('startup_name', 'the startup')
        problem = idea.get('problem_statement', 'N/A')
        solution = idea.get('solution_description', 'N/A')
        target_audience = idea.get('target_audience', 'N/A')
        
        # Market info
        tam = market.get('tam', 'N/A')
        sam = market.get('sam', 'N/A')
        som = market.get('som', 'N/A')
        market_demand = market.get('market_demand', 'N/A')
        
        # Competitor info
        competitor_count = len(competitors.get('competitors', []))
        
        # Financial info
        has_financials = bool(financials and len(str(financials)) > 10)
        
        prompt = f"""You are an expert startup advisor for {startup_name}.

**STARTUP OVERVIEW:**
- Problem: {problem}
- Solution: {solution}
- Target Audience: {target_audience}

**MARKET INTELLIGENCE:**
- TAM (Total Addressable Market): {tam}
- SAM (Serviceable Addressable Market): {sam}
- SOM (Serviceable Obtainable Market): {som}
- Market Demand: {market_demand}

**COMPETITIVE LANDSCAPE:**
- Competitors Identified: {competitor_count}
{self._format_competitors(competitors)}

**FINANCIAL DATA:**
{self._format_financials(financials) if has_financials else "Financial projections not yet generated."}

**YOUR ROLE:**
- Provide specific, actionable advice based on the startup's validated data
- Reference actual numbers and insights from the validation results
- Be honest about gaps in data (suggest running missing analyses)
- Think like a seasoned founder/advisor
- Keep responses concise but insightful (2-4 paragraphs)
- Suggest concrete next steps when relevant

**GUIDELINES:**
- Use data from validation results to support your advice
- Don't make up information - only use what's provided
- If data is missing, suggest which feature to run (Market Validation, Competitor Analysis, Financial Projections)
- Be encouraging but realistic
- Think strategically about growth, product, market fit

Answer the founder's questions with this context in mind."""

        return prompt
    
    def _format_competitors(self, competitors: Dict) -> str:
        """Format competitor information."""
        comp_list = competitors.get('competitors', [])
        if not comp_list:
            return "- No competitors analyzed yet"
        
        formatted = []
        for i, comp in enumerate(comp_list[:5], 1):
            name = comp.get('name', f'Competitor {i}')
            formatted.append(f"  {i}. {name}")
        
        return "\n".join(formatted)
    
    def _format_financials(self, financials: Dict) -> str:
        """Format financial information."""
        
        if not financials or not isinstance(financials, dict):
            return "Financial projections not available."
        
        parts = []
        
        # Unit economics
        unit_econ = financials.get('unit_economics', {})
        if unit_econ:
            cac = unit_econ.get('cac', 'N/A')
            ltv = unit_econ.get('ltv', 'N/A')
            ratio = unit_econ.get('ltv_cac_ratio', 'N/A')
            parts.append(f"- CAC: ${cac}, LTV: ${ltv}, LTV:CAC: {ratio}")
        
        # Revenue
        exec_summary = financials.get('executive_summary', {})
        headline = exec_summary.get('headline_metrics', {})
        if headline:
            y1_arr = headline.get('year_1_arr', 'N/A')
            y3_arr = headline.get('year_3_arr', 'N/A')
            parts.append(f"- Year 1 ARR: ${y1_arr}, Year 3 ARR: ${y3_arr}")
        
        # Customer segments
        segments = financials.get('customer_segments', {})
        if segments:
            parts.append(f"- Customer Segments: {len(segments)}")
        
        return "\n".join(parts) if parts else "Limited financial data available."
    
    def _build_messages(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: List[Dict]
    ) -> List[Dict]:
        """Build message array for API call."""
        
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add conversation history (last 5 exchanges)
        for msg in conversation_history[-10:]:
            messages.append({
                "role": msg.get('role', 'user'),
                "content": msg.get('content', '')
            })
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        return messages
    
    def _extract_sources(self, context: Dict, response: str) -> List[str]:
        """Extract which data sources were referenced."""
        
        sources = []
        
        if 'market' in response.lower() or 'tam' in response.lower():
            if context.get('market_validation'):
                sources.append('Market Validation')
        
        if 'competitor' in response.lower():
            if context.get('competitor_analysis'):
                sources.append('Competitor Analysis')
        
        if 'financial' in response.lower() or 'revenue' in response.lower() or 'arr' in response.lower():
            if context.get('financial_projections'):
                sources.append('Financial Projections')
        
        if 'quality' in response.lower():
            if context.get('quality_evaluation'):
                sources.append('Quality Evaluation')
        
        return sources or ['General Knowledge']
    
    def _extract_suggestions(self, response: str) -> List[str]:
        """Extract actionable suggestions from response."""
        
        suggestions = []
        
        # Look for common suggestion patterns
        if 'run market validation' in response.lower():
            suggestions.append('Run Market Validation')
        
        if 'analyze competitor' in response.lower():
            suggestions.append('Run Competitor Analysis')
        
        if 'financial projection' in response.lower():
            suggestions.append('Generate Financial Projections')
        
        if 'quality evaluation' in response.lower():
            suggestions.append('Run Quality Evaluation')
        
        # Generic suggestions
        lower_response = response.lower()
        if 'talk to customer' in lower_response or 'customer interview' in lower_response:
            suggestions.append('Conduct Customer Interviews')
        
        if 'build mvp' in lower_response or 'prototype' in lower_response:
            suggestions.append('Build MVP/Prototype')
        
        if 'pricing' in lower_response and 'test' in lower_response:
            suggestions.append('Test Pricing Strategy')
        
        return suggestions[:3]  # Max 3 suggestions
    
    def get_suggested_questions(self, idea_id: int) -> List[str]:
        """Get suggested questions based on available data."""
        
        context = self._gather_startup_context(idea_id)
        
        questions = [
            "What should I focus on this week?",
            "How does my idea compare to competitors?",
        ]
        
        # Add context-specific questions
        if context.get('market_validation'):
            questions.append("What does my market analysis tell me?")
        
        if context.get('financial_projections'):
            questions.append("Are my financial projections realistic?")
        
        if not context.get('competitor_analysis'):
            questions.append("What should I know about my competitors?")
        
        if not context.get('financial_projections'):
            questions.append("How should I think about pricing?")
        
        return questions[:5]