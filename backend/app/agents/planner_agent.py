# File: backend/app/agents/planner_agent.py
# Feature 6: Planner Agent (Workflow Orchestration)

from typing import Dict, Any, List
import json
import os
from dotenv import load_dotenv
from groq import Groq
from app.utils.logger import logger

load_dotenv()


class PlannerAgent:
    """
    Feature 6: Planner Agent
    Decides which validation agents to execute and in what order.
    Does NOT generate analytical content - only plans workflow.
    """
    
    AVAILABLE_AGENTS = {
        'market_validator': 'Validate market demand and size',
        'competitor_analyzer': 'Analyze existing competitors',
        'financial_viability': 'Assess revenue potential',
        'risk_assessment': 'Identify key risks'
    }
    
    def __init__(self):
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            raise ValueError("GROQ_API_KEY not found")
        self.client = Groq(api_key=api_key)
    
    def create_execution_plan(self, structured_idea: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze idea and create execution plan.
        
        Returns:
            {
                "execution_plan": ["agent1", "agent2", ...],
                "priority": "high|medium|low",
                "reasoning": "Why these agents",
                "estimated_time": "X minutes"
            }
        """
        logger.info("Creating execution plan...")
        
        idea_summary = self._summarize_idea(structured_idea)
        
        prompt = f"""You are a startup validation strategist. Analyze this idea and decide which validation steps are most important.

STARTUP IDEA:
{idea_summary}

AVAILABLE AGENTS:
{json.dumps(self.AVAILABLE_AGENTS, indent=2)}

Select 3-4 most relevant agents. Order by priority (most critical first).

Respond with ONLY valid JSON:
{{
  "execution_plan": ["agent1", "agent2", "agent3"],
  "priority": "high|medium|low",
  "reasoning": "Brief explanation",
  "estimated_time": "X minutes"
}}

JSON:"""

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=600
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Clean markdown
            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            plan = json.loads(response_text)
            
            # Validate agents
            valid_agents = [
                agent for agent in plan.get('execution_plan', [])
                if agent in self.AVAILABLE_AGENTS
            ]
            
            if not valid_agents:
                return self._get_default_plan()
            
            plan['execution_plan'] = valid_agents
            logger.info(f"Plan created: {valid_agents}")
            
            return plan
            
        except Exception as e:
            logger.error(f"Error creating plan: {e}")
            return self._get_default_plan()
    
    def _summarize_idea(self, structured_idea: Dict[str, Any]) -> str:
        """Create summary for prompt."""
        fields = []
        for key, value in structured_idea.items():
            if key != '_asked_fields' and value and value != []:
                if isinstance(value, list):
                    fields.append(f"{key}: {', '.join(value)}")
                else:
                    fields.append(f"{key}: {value}")
        return "\n".join(fields)
    
    def _get_default_plan(self) -> Dict[str, Any]:
        """Fallback plan."""
        return {
            "execution_plan": [
                "market_validator",
                "competitor_analyzer",
                "financial_viability"
            ],
            "priority": "medium",
            "reasoning": "Standard validation workflow",
            "estimated_time": "3-4 minutes"
        }