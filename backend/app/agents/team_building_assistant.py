# File: backend/app/agents/team_building_assistant.py
# Feature C: Team Building Assistant
# Recommends team composition and generates job descriptions

from typing import Dict, Any, List
import os
from dotenv import load_dotenv
from groq import Groq
from app.utils.logger import logger
import json

load_dotenv()


class TeamBuildingAssistant:
    """
    Team Building Assistant
    
    Analyzes startup needs and recommends:
    - Key roles to hire
    - Skills required for each role
    - Hiring timeline and priority
    - Job descriptions
    - Advisor recommendations
    - LinkedIn search queries
    """
    
    def __init__(self):
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            raise ValueError("GROQ_API_KEY not found")
        
        self.client = Groq(api_key=api_key)
        logger.info("👥 Team Building Assistant initialized")
    
    def analyze_team_needs(
        self,
        idea: Any,
        market_validation: Dict[str, Any],
        risk_analysis: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Comprehensive team building analysis."""
        
        logger.info("=" * 70)
        logger.info("👥 ANALYZING TEAM BUILDING NEEDS")
        logger.info("=" * 70)
        
        context = self._build_team_context(idea, market_validation, risk_analysis)
        
        analysis = {
            'founding_team_assessment': self._assess_current_team(context, idea),
            'critical_hires': self._identify_critical_hires(context),
            'hiring_timeline': self._create_hiring_timeline(context),
            'job_descriptions': self._generate_job_descriptions(context),
            'advisor_needs': self._identify_advisor_needs(context),
            'recruiting_strategy': self._create_recruiting_strategy(),
            'team_culture_recommendations': self._recommend_culture_values()
        }
        
        logger.info("✅ Team building analysis complete")
        
        return analysis
    
    def _build_team_context(self, idea, market_validation, risk_analysis) -> str:
        """Build context for team analysis."""
        
        problem = getattr(idea, 'problem_statement', 'Not specified')
        solution = getattr(idea, 'solution_description', 'Not specified')
        
        # Extract skill gaps from risk analysis
        skill_gaps = []
        if risk_analysis:
            execution_risks = risk_analysis.get('execution_risks', [])
            for risk in execution_risks:
                if 'skill' in risk.get('risk', '').lower():
                    skill_gaps.append(risk.get('risk', ''))
        
        return f"""
STARTUP:
Problem: {problem}
Solution: {solution}

IDENTIFIED GAPS:
{', '.join(skill_gaps) if skill_gaps else 'None identified'}
"""
    
    def _assess_current_team(self, context: str, idea: Any) -> Dict:
        """Assess current founding team composition."""
        
        logger.info("🔍 Assessing current team...")
        
        return {
            'current_team_size': 'Founder(s)',
            'strengths': [
                'Product vision and domain expertise',
                'Passion and commitment'
            ],
            'gaps': [
                'Technical execution (if non-technical founder)',
                'Go-to-market expertise',
                'Operations and scaling experience',
                'Industry connections'
            ],
            'recommended_cofounder_profile': {
                'skills': [
                    'Complementary to founder (tech if founder is business, vice versa)',
                    'Startup experience',
                    'Network in target industry',
                    'Execution-focused mindset'
                ],
                'equity_range': '20-40% (vesting over 4 years)',
                'search_channels': [
                    'YC Co-Founder Matching',
                    'LinkedIn (2nd degree connections)',
                    'Startup events and hackathons',
                    'Industry conferences',
                    'Referrals from trusted advisors'
                ]
            }
        }
    
    def _identify_critical_hires(self, context: str) -> List[Dict]:
        """Identify critical roles to hire."""
        
        logger.info("🎯 Identifying critical hires...")
        
        prompt = f"""Identify the 5 most critical roles to hire for this startup:

{context}

Consider: technical needs, go-to-market, operations, product

Respond with JSON:
{{
  "critical_hires": [
    {{
      "role": "Senior Full-Stack Engineer",
      "priority": "Critical",
      "why_needed": "Build MVP and scale product",
      "skills_required": ["React", "Node.js", "AWS"],
      "ideal_background": "3-5 years at high-growth startup",
      "hire_timeframe": "Month 1-2"
    }}
  ]
}}

JSON:"""
        
        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=1500
            )
            
            response_text = response.choices[0].message.content.strip()
            
            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]
            
            return json.loads(response_text.strip()).get('critical_hires', [])
            
        except Exception as e:
            logger.error(f"Critical hires identification error: {e}")
            return self._get_default_critical_hires()
    
    def _create_hiring_timeline(self, context: str) -> Dict:
        """Create hiring timeline."""
        
        logger.info("📅 Creating hiring timeline...")
        
        return {
            'phase_1_foundation': {
                'months': '0-3',
                'hires': [
                    'Co-founder (if not already found)',
                    'Senior Engineer #1 (technical co-founder or early hire)',
                    'Part-time Designer/UX (contractor okay)'
                ],
                'total_team_size': '2-3 full-time'
            },
            'phase_2_mvp': {
                'months': '3-6',
                'hires': [
                    'Senior Engineer #2',
                    'Product Manager (if founder not filling role)',
                    'Marketing/Growth Lead (contractor initially)'
                ],
                'total_team_size': '4-5 full-time'
            },
            'phase_3_launch': {
                'months': '6-12',
                'hires': [
                    'Customer Success Manager',
                    'Sales Lead (if B2B)',
                    'Engineer #3-4',
                    'Designer (full-time)',
                    'Operations/Finance (part-time initially)'
                ],
                'total_team_size': '8-10 full-time'
            },
            'phase_4_scale': {
                'months': '12-24',
                'hires': [
                    'VP Engineering',
                    'VP Sales (if B2B)',
                    'Head of Marketing',
                    'Engineers #5-10',
                    'Support team (2-3)',
                    'CFO/Finance team'
                ],
                'total_team_size': '20-25 full-time'
            }
        }
    
    def _generate_job_descriptions(self, context: str) -> List[Dict]:
        """Generate job descriptions for key roles."""
        
        logger.info("📝 Generating job descriptions...")
        
        return [
            {
                'role': 'Senior Full-Stack Engineer',
                'job_description': """
We're looking for a Senior Full-Stack Engineer to join our founding team and build our MVP from the ground up.

WHAT YOU'LL DO:
• Architect and build our core product (React + Node.js + AWS)
• Make key technical decisions that will shape our platform
• Work directly with founders to translate vision into code
• Set engineering standards and best practices
• Mentor junior engineers as we scale

REQUIREMENTS:
• 5+ years full-stack development experience
• Expert in React, Node.js, and cloud infrastructure (AWS/GCP)
• Experience scaling products from 0 to 1
• Startup experience strongly preferred
• Strong product sense and user empathy

NICE TO HAVE:
• Experience with [relevant domain, e.g., fintech, healthcare]
• Previous founding team experience
• Open source contributions

WHY JOIN US:
• Ground floor opportunity (employee #1-5)
• Significant equity (0.5-2%)
• Work directly with founders
• Shape product and culture
• Solve meaningful problems

COMPENSATION:
• $120-180K base (depending on experience)
• Equity: 0.5-2%
• Full benefits
• Flexible work arrangements
""",
                'linkedin_search_query': '"Senior Full-Stack Engineer" (React OR Node.js) startup (San Francisco OR remote)',
                'screening_questions': [
                    'Tell me about a time you built a product from scratch',
                    'What\'s your approach to making technical tradeoffs?',
                    'Why are you interested in joining an early-stage startup?'
                ]
            },
            {
                'role': 'Product Marketing Manager',
                'job_description': """
We're seeking a Product Marketing Manager to own our go-to-market strategy and drive customer acquisition.

WHAT YOU'LL DO:
• Develop and execute GTM strategy for product launches
• Create compelling positioning and messaging
• Build content marketing engine (blog, SEO, social)
• Run growth experiments and optimize funnels
• Analyze market trends and competitive landscape

REQUIREMENTS:
• 3-5 years product marketing experience (B2B SaaS preferred)
• Proven track record of driving user acquisition
• Strong analytical skills and data-driven approach
• Excellent writing and communication skills
• Comfortable with ambiguity and fast-paced environment

NICE TO HAVE:
• Growth hacking experience
• Technical background or ability to learn quickly
• Experience with [relevant tools, e.g., HubSpot, Segment]

WHY JOIN US:
• Own marketing from day 1
• Direct impact on company success
• Equity: 0.25-1%
• Work with exceptional team
• Build your personal brand

COMPENSATION:
• $90-140K base
• Equity: 0.25-1%
• Full benefits
• Professional development budget
""",
                'linkedin_search_query': '"Product Marketing Manager" "B2B SaaS" startup (growth OR acquisition)',
                'screening_questions': [
                    'Walk me through a successful product launch you led',
                    'How do you approach positioning against larger competitors?',
                    'What metrics do you track to measure marketing success?'
                ]
            }
        ]
    
    def _identify_advisor_needs(self, context: str) -> List[Dict]:
        """Identify advisor needs and profiles."""
        
        logger.info("🎓 Identifying advisor needs...")
        
        return [
            {
                'advisor_type': 'Technical Advisor',
                'why_needed': 'Validate technical architecture and scalability decisions',
                'ideal_profile': [
                    'CTO/VP Eng at successful startup (Series B+)',
                    'Built similar products at scale',
                    'Willing to commit 2-4 hours/month'
                ],
                'equity': '0.1-0.5% (4-year vesting)',
                'how_to_find': [
                    'YC advisor network',
                    'LinkedIn outreach to admired CTOs',
                    'Tech conference speakers',
                    'Introductions from investors'
                ]
            },
            {
                'advisor_type': 'Industry Expert',
                'why_needed': 'Navigate industry nuances and build credibility',
                'ideal_profile': [
                    '15+ years in target industry',
                    'C-level experience',
                    'Strong network of potential customers',
                    'Excited about your mission'
                ],
                'equity': '0.25-0.75%',
                'how_to_find': [
                    'Industry conferences',
                    'LinkedIn searches',
                    'Customer interviews (convert to advisors)',
                    'Warm introductions from early customers'
                ]
            },
            {
                'advisor_type': 'Go-to-Market Advisor',
                'why_needed': 'Accelerate customer acquisition and avoid GTM mistakes',
                'ideal_profile': [
                    'VP Sales/Marketing at B2B SaaS company',
                    'Experience with similar customer segment',
                    'Hands-on, willing to roll up sleeves',
                    'Network of potential customers/partners'
                ],
                'equity': '0.25-0.5%',
                'how_to_find': [
                    'Advisor matching platforms',
                    'Referrals from other founders',
                    'GTM-focused angels',
                    'Previous employers/colleagues'
                ]
            },
            {
                'advisor_type': 'Fundraising Advisor',
                'why_needed': 'Navigate fundraising process and investor introductions',
                'ideal_profile': [
                    'Successful founder (raised Series A+)',
                    'Or experienced angel investor',
                    'Strong VC network',
                    'Available during fundraise'
                ],
                'equity': 'Performance-based or 0.1-0.25%',
                'how_to_find': [
                    'Founder networks (YC, OnDeck)',
                    'Angel List',
                    'Intro from existing investors',
                    'Pitch deck reviews'
                ]
            }
        ]
    
    def _create_recruiting_strategy(self) -> Dict:
        """Create recruiting strategy and best practices."""
        
        return {
            'sourcing_channels': [
                {
                    'channel': 'LinkedIn',
                    'tactics': [
                        'Boolean searches for exact skill matches',
                        'Engage with target candidates\' content',
                        'InMail templates that highlight opportunity',
                        'Recruiter Lite for advanced search'
                    ],
                    'cost': '$100-200/month'
                },
                {
                    'channel': 'YC Jobs / AngelList',
                    'tactics': [
                        'Post compelling job descriptions',
                        'Highlight equity and impact',
                        'Respond quickly to applications',
                        'Showcase founder credibility'
                    ],
                    'cost': 'Free'
                },
                {
                    'channel': 'Referrals',
                    'tactics': [
                        'Referral bonuses ($2-5K)',
                        'Ask every interview candidate for referrals',
                        'Leverage advisors and investors',
                        'Alumni networks'
                    ],
                    'cost': '$2-5K per hire'
                },
                {
                    'channel': 'Content/Employer Brand',
                    'tactics': [
                        'Blog about technical challenges',
                        'Share company updates on social',
                        'Speak at conferences',
                        'Open source contributions'
                    ],
                    'cost': 'Time investment'
                }
            ],
            'interview_process': {
                'stage_1': 'Initial screening call (30 min) - Culture fit, motivation',
                'stage_2': 'Technical/functional assessment (60-90 min)',
                'stage_3': 'Team fit interview with founders (60 min)',
                'stage_4': 'Reference checks (2-3 references)',
                'stage_5': 'Offer and negotiation',
                'timeline': '7-14 days total (move fast!)'
            },
            'closing_tactics': [
                'Move quickly - best candidates have multiple offers',
                'Sell vision and impact, not just compensation',
                'Be transparent about risks and rewards',
                'Involve candidate in product discussions',
                'Show genuine excitement about working together',
                'Competitive equity and clear career growth path'
            ]
        }
    
    def _recommend_culture_values(self) -> Dict:
        """Recommend team culture and values."""
        
        return {
            'core_values': [
                {
                    'value': 'Customer Obsession',
                    'description': 'Every decision starts with the customer impact',
                    'example_behavior': 'Regularly talk to customers, prioritize their feedback'
                },
                {
                    'value': 'Bias for Action',
                    'description': 'Speed matters. Move fast and iterate.',
                    'example_behavior': 'Ship MVPs quickly, learn from real users'
                },
                {
                    'value': 'Radical Transparency',
                    'description': 'Default to open communication',
                    'example_behavior': 'Share metrics, challenges, and wins with entire team'
                },
                {
                    'value': 'Own Your Outcomes',
                    'description': 'Take ownership, don\'t make excuses',
                    'example_behavior': 'Proactively solve problems, don\'t wait to be told'
                },
                {
                    'value': 'Continuous Learning',
                    'description': 'Always be improving and teaching others',
                    'example_behavior': 'Share learnings, attend conferences, read widely'
                }
            ],
            'culture_building_practices': [
                'Weekly all-hands with transparent metrics',
                'Monthly team offsites for bonding',
                'Peer recognition program',
                'Learning stipend ($500-1000/year)',
                'Open vacation policy',
                'Flexible work arrangements',
                'Regular 1-on-1s with manager',
                'Demo days to showcase work'
            ]
        }
    
    def _get_default_critical_hires(self) -> List[Dict]:
        """Default critical hires if AI generation fails."""
        
        return [
            {
                'role': 'Senior Full-Stack Engineer',
                'priority': 'Critical',
                'why_needed': 'Build and scale product',
                'skills_required': ['React', 'Node.js', 'AWS', 'Database design'],
                'ideal_background': 'Startup experience, 5+ years',
                'hire_timeframe': 'Month 1-2'
            },
            {
                'role': 'Product Manager',
                'priority': 'High',
                'why_needed': 'Own product roadmap and execution',
                'skills_required': ['Product strategy', 'User research', 'Roadmap planning'],
                'ideal_background': 'PM at growth-stage startup',
                'hire_timeframe': 'Month 3-4'
            },
            {
                'role': 'Growth/Marketing Lead',
                'priority': 'High',
                'why_needed': 'Drive customer acquisition',
                'skills_required': ['Growth hacking', 'Content marketing', 'Analytics'],
                'ideal_background': 'B2B SaaS marketing experience',
                'hire_timeframe': 'Month 4-6'
            }
        ]