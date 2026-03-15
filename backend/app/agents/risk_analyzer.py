# File: backend/app/agents/risk_analyzer.py
# Feature F: Risk Analysis & Mitigation
# Identifies risks and provides mitigation strategies

from typing import Dict, Any, List
import os
from dotenv import load_dotenv
from groq import Groq
from app.utils.logger import logger
import json

load_dotenv()


class RiskAnalyzer:
    """
    Risk Analysis Agent
    
    Identifies and analyzes:
    - Technical risks
    - Market risks
    - Competitive risks
    - Financial risks
    - Regulatory/Legal risks
    - Team/Execution risks
    
    Provides mitigation strategies for each
    """
    
    def __init__(self):
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            raise ValueError("GROQ_API_KEY not found")
        
        self.client = Groq(api_key=api_key)
        logger.info("⚠️ Risk Analyzer initialized")
    
    def analyze_risks(
        self,
        idea: Any,
        market_validation: Dict[str, Any],
        competitor_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Comprehensive risk analysis."""
        
        logger.info("=" * 70)
        logger.info("⚠️ ANALYZING STARTUP RISKS")
        logger.info("=" * 70)
        
        context = self._build_risk_context(idea, market_validation, competitor_analysis)
        
        analysis = {
            'technical_risks': self._analyze_technical_risks(context),
            'market_risks': self._analyze_market_risks(context, market_validation),
            'competitive_risks': self._analyze_competitive_risks(context, competitor_analysis),
            'financial_risks': self._analyze_financial_risks(context),
            'regulatory_risks': self._analyze_regulatory_risks(context),
            'execution_risks': self._analyze_execution_risks(context),
            'overall_risk_score': None,  # Will be calculated
            'top_3_critical_risks': [],  # Will be populated
            'risk_mitigation_timeline': self._create_mitigation_timeline()
        }
        
        # Calculate overall risk score
        analysis['overall_risk_score'] = self._calculate_overall_risk(analysis)
        analysis['top_3_critical_risks'] = self._identify_top_risks(analysis)
        
        logger.info(f"✅ Risk analysis complete - Overall risk: {analysis['overall_risk_score']}")
        
        return analysis
    
    def _build_risk_context(self, idea, market_validation, competitor_analysis) -> str:
        """Build context for risk analysis."""
        
        problem = getattr(idea, 'problem_statement', 'Not specified')
        solution = getattr(idea, 'solution_description', 'Not specified')
        
        competitors = len(competitor_analysis.get('competitor_comparison', []))
        
        return f"""
STARTUP:
Problem: {problem}
Solution: {solution}

MARKET:
Competitors: {competitors}
Validation: {market_validation.get('market_validation_status', 'Unknown')}
"""
    
    def _analyze_technical_risks(self, context: str) -> List[Dict]:
        """Analyze technical and product risks."""
        
        logger.info("🔧 Analyzing technical risks...")
        
        prompt = f"""Identify technical/product risks for this startup:

{context}

List 3-5 SPECIFIC technical risks with mitigation strategies.

Respond with JSON:
{{
  "risks": [
    {{
      "risk": "Specific technical risk",
      "probability": "high|medium|low",
      "impact": "critical|high|medium|low",
      "mitigation_strategy": "Concrete mitigation steps",
      "early_warning_signals": ["Signal 1", "Signal 2"]
    }}
  ]
}}

JSON:"""
        
        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1500
            )
            
            response_text = response.choices[0].message.content.strip()
            
            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]
            
            return json.loads(response_text.strip()).get('risks', [])
            
        except Exception as e:
            logger.error(f"Technical risk analysis error: {e}")
            return [{
                "risk": "Technical complexity underestimated",
                "probability": "medium",
                "impact": "high",
                "mitigation_strategy": "Prototype key features early, hire experienced engineers",
                "early_warning_signals": ["Development timelines slipping", "Increased bug count"]
            }]
    
    def _analyze_market_risks(self, context: str, market_validation: Dict) -> List[Dict]:
        """Analyze market and demand risks."""
        
        logger.info("📊 Analyzing market risks...")
        
        return [
            {
                "risk": "Market timing - Too early/late to market",
                "probability": "medium",
                "impact": "critical",
                "mitigation_strategy": "Run pilot programs, validate demand with MVPs before full launch",
                "early_warning_signals": [
                    "Low engagement with marketing content",
                    "High bounce rate on landing page",
                    "Feedback indicating 'nice to have' not 'must have'"
                ]
            },
            {
                "risk": "TAM smaller than estimated",
                "probability": "medium",
                "impact": "high",
                "mitigation_strategy": "Conservative growth projections, have pivot options ready",
                "early_warning_signals": [
                    "Lower than expected conversion rates",
                    "Difficulty finding qualified leads",
                    "Market research contradicts assumptions"
                ]
            },
            {
                "risk": "Customer acquisition cost higher than sustainable",
                "probability": "high",
                "impact": "critical",
                "mitigation_strategy": "Test multiple channels early, focus on organic growth tactics",
                "early_warning_signals": [
                    "CAC > LTV",
                    "Paid channels not profitable",
                    "Longer sales cycles than expected"
                ]
            },
            {
                "risk": "Customer problem not painful enough",
                "probability": "medium",
                "impact": "critical",
                "mitigation_strategy": "Deep customer discovery, willingness-to-pay tests",
                "early_warning_signals": [
                    "Free users don't convert to paid",
                    "High churn in first 30 days",
                    "Low engagement metrics"
                ]
            }
        ]
    
    def _analyze_competitive_risks(self, context: str, competitor_analysis: Dict) -> List[Dict]:
        """Analyze competitive and differentiation risks."""
        
        logger.info("⚔️ Analyzing competitive risks...")
        
        competitors = competitor_analysis.get('competitor_comparison', [])
        num_competitors = len(competitors)
        
        risks = [
            {
                "risk": "Incumbent launches similar feature",
                "probability": "high" if num_competitors > 5 else "medium",
                "impact": "high",
                "mitigation_strategy": "Build moat through network effects, integrations, or proprietary data",
                "early_warning_signals": [
                    "Competitor job postings for similar roles",
                    "Industry news about competitor product updates",
                    "Customer questions about competitor features"
                ]
            },
            {
                "risk": "Price war with established players",
                "probability": "medium",
                "impact": "high",
                "mitigation_strategy": "Compete on value/experience not price, target underserved niches",
                "early_warning_signals": [
                    "Competitor pricing changes",
                    "Promotional emails from competitors",
                    "Customer pricing objections increase"
                ]
            }
        ]
        
        if num_competitors > 0:
            top_competitor = competitors[0].get('name', 'Market leader')
            risks.append({
                "risk": f"{top_competitor} could acquire smaller players to consolidate market",
                "probability": "low",
                "impact": "medium",
                "mitigation_strategy": "Build unique value proposition, establish strong customer relationships",
                "early_warning_signals": [
                    "M&A activity in the space",
                    "Competitor funding announcements",
                    "Market consolidation trends"
                ]
            })
        
        return risks
    
    def _analyze_financial_risks(self, context: str) -> List[Dict]:
        """Analyze financial and funding risks."""
        
        logger.info("💰 Analyzing financial risks...")
        
        return [
            {
                "risk": "Runway runs out before achieving product-market fit",
                "probability": "high",
                "impact": "critical",
                "mitigation_strategy": "Conservative burn rate, milestone-based spending, have fundraising plan B",
                "early_warning_signals": [
                    "Burn rate exceeding plan",
                    "Milestones slipping",
                    "Less than 6 months runway remaining"
                ]
            },
            {
                "risk": "Unable to raise next funding round",
                "probability": "medium",
                "impact": "critical",
                "mitigation_strategy": "Hit key milestones early, build investor relationships proactively",
                "early_warning_signals": [
                    "Investor interest cooling",
                    "Market conditions deteriorating",
                    "Competitors raising large rounds"
                ]
            },
            {
                "risk": "Unit economics don't work at scale",
                "probability": "medium",
                "impact": "high",
                "mitigation_strategy": "Test assumptions early, model scenarios, have fallback monetization",
                "early_warning_signals": [
                    "CAC not decreasing with scale",
                    "Retention rates worse than modeled",
                    "Server costs scaling faster than revenue"
                ]
            },
            {
                "risk": "Revenue concentration (few customers = most revenue)",
                "probability": "medium",
                "impact": "high",
                "mitigation_strategy": "Diversify customer base, avoid over-reliance on any single customer",
                "early_warning_signals": [
                    "Top 3 customers > 50% of revenue",
                    "Large customer at risk of churning",
                    "Sales pipeline skewed to large deals"
                ]
            }
        ]
    
    def _analyze_regulatory_risks(self, context: str) -> List[Dict]:
        """Analyze regulatory and legal risks."""
        
        logger.info("⚖️ Analyzing regulatory risks...")
        
        return [
            {
                "risk": "Data privacy regulations (GDPR, CCPA, etc.)",
                "probability": "medium",
                "impact": "medium",
                "mitigation_strategy": "Privacy-by-design, legal review, compliance from day 1",
                "early_warning_signals": [
                    "New regulations announced",
                    "Customer data privacy concerns",
                    "Competitor compliance issues"
                ]
            },
            {
                "risk": "Industry-specific regulations",
                "probability": "low",
                "impact": "high",
                "mitigation_strategy": "Early consultation with industry lawyers, compliance roadmap",
                "early_warning_signals": [
                    "Regulatory body announcements",
                    "Industry association guidance",
                    "Competitor regulatory challenges"
                ]
            },
            {
                "risk": "IP infringement claims",
                "probability": "low",
                "impact": "high",
                "mitigation_strategy": "Conduct IP search, file provisional patents, legal review",
                "early_warning_signals": [
                    "Cease and desist letters",
                    "Competitor patent filings",
                    "Similar products with IP protection"
                ]
            }
        ]
    
    def _analyze_execution_risks(self, context: str) -> List[Dict]:
        """Analyze team and execution risks."""
        
        logger.info("👥 Analyzing execution risks...")
        
        return [
            {
                "risk": "Key founder/team member leaves",
                "probability": "medium",
                "impact": "high",
                "mitigation_strategy": "Vesting schedules, document processes, cross-train team",
                "early_warning_signals": [
                    "Team member disengagement",
                    "Disagreements on vision/strategy",
                    "Headhunter activity targeting team"
                ]
            },
            {
                "risk": "Cannot hire fast enough to scale",
                "probability": "high",
                "impact": "medium",
                "mitigation_strategy": "Build employer brand early, use contractors initially, plan hiring 6mo ahead",
                "early_warning_signals": [
                    "Extended time-to-hire",
                    "Offer rejection rate increasing",
                    "Key positions unfilled > 90 days"
                ]
            },
            {
                "risk": "Skill gaps in founding team",
                "probability": "high",
                "impact": "medium",
                "mitigation_strategy": "Hire advisors, bring in experienced operators, acknowledge gaps",
                "early_warning_signals": [
                    "Repeated mistakes in same area",
                    "Stalled decision-making",
                    "Failure to execute on key initiatives"
                ]
            },
            {
                "risk": "Poor product development execution",
                "probability": "medium",
                "impact": "high",
                "mitigation_strategy": "Agile methodology, user testing, MVP approach",
                "early_warning_signals": [
                    "Feature creep",
                    "Missed release dates",
                    "Quality issues increasing"
                ]
            }
        ]
    
    def _calculate_overall_risk(self, analysis: Dict) -> str:
        """Calculate overall risk level."""
        
        # Count critical/high impact risks
        all_risks = []
        for category in ['technical_risks', 'market_risks', 'competitive_risks', 
                        'financial_risks', 'regulatory_risks', 'execution_risks']:
            all_risks.extend(analysis.get(category, []))
        
        critical_count = sum(1 for r in all_risks if r.get('impact') == 'critical')
        high_count = sum(1 for r in all_risks if r.get('impact') == 'high')
        
        if critical_count >= 3:
            return "High Risk"
        elif critical_count >= 1 or high_count >= 5:
            return "Medium-High Risk"
        elif high_count >= 2:
            return "Medium Risk"
        else:
            return "Low-Medium Risk"
    
    def _identify_top_risks(self, analysis: Dict) -> List[Dict]:
        """Identify top 3 critical risks."""
        
        all_risks = []
        for category in ['technical_risks', 'market_risks', 'competitive_risks',
                        'financial_risks', 'regulatory_risks', 'execution_risks']:
            for risk in analysis.get(category, []):
                risk['category'] = category.replace('_risks', '')
                all_risks.append(risk)
        
        # Score and sort
        def risk_score(r):
            impact_scores = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
            prob_scores = {'high': 3, 'medium': 2, 'low': 1}
            return impact_scores.get(r.get('impact', 'low'), 1) * prob_scores.get(r.get('probability', 'low'), 1)
        
        sorted_risks = sorted(all_risks, key=risk_score, reverse=True)
        
        return sorted_risks[:3]
    
    def _create_mitigation_timeline(self) -> Dict:
        """Create risk mitigation timeline."""
        
        return {
            'immediate_actions': {
                'timeframe': 'Week 1-4',
                'actions': [
                    'Conduct IP search and file provisional patents',
                    'Set up legal entity and compliance framework',
                    'Implement data privacy measures (GDPR, CCPA)',
                    'Create founder vesting agreements',
                    'Validate key technical assumptions with prototype'
                ]
            },
            'short_term_actions': {
                'timeframe': 'Month 2-3',
                'actions': [
                    'Test unit economics with pilot customers',
                    'Validate market demand with beta users',
                    'Build competitive moat (network effects, integrations)',
                    'Establish investor relationships',
                    'Hire for critical skill gaps'
                ]
            },
            'ongoing_monitoring': {
                'timeframe': 'Continuous',
                'actions': [
                    'Track early warning signals dashboard',
                    'Monthly burn rate vs runway review',
                    'Quarterly competitive intelligence scan',
                    'Regular customer feedback sessions',
                    'Monitor key metrics vs assumptions'
                ]
            }
        }