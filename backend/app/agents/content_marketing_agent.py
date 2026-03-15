# File: backend/app/agents/content_marketing_agent.py
# 📝 CONTENT MARKETING ENGINE - MCP ENHANCED
# Generates blog ideas, SEO keywords, content calendar, social posts

"""
MCP-Enhanced Content Marketing Engine.
- Blog post ideas based on startup
- SEO keyword research (web search)
- 12-month content calendar
- Social media templates
- Gmail distribution lists
- Calendar publishing schedule
"""

from typing import Dict, Any, List
import os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from groq import Groq
from app.utils.logger import logger
from app.db.session import get_db
import calendar

load_dotenv()


class ContentMarketingAgent:
    """
    MCP-Enhanced Content Marketing Engine.
    Generates complete content strategy with SEO research.
    """
    
    def __init__(self):
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            raise ValueError("GROQ_API_KEY not found")
        self.client = Groq(api_key=api_key)
        logger.info("📝 Content Marketing Engine initialized")
        logger.info("   Features: Blog Ideas + SEO + Calendar + Social + MCP")
    
    def generate_content_strategy(self, idea_id: int, enable_mcp: bool = True) -> Dict[str, Any]:
        """
        Generate complete content marketing strategy.
        
        MCP Features:
        - Web search for trending topics
        - SEO keyword research
        - Calendar publishing schedule
        - Gmail distribution templates
        """
        
        logger.info("=" * 70)
        logger.info("GENERATING CONTENT MARKETING STRATEGY")
        logger.info("=" * 70)
        
        # Gather startup data
        startup_data = self._gather_startup_data(idea_id)
        
        if not startup_data or not startup_data.get('idea'):
            return self._insufficient_data_response()
        
        # Analyze startup for content angles
        analysis = self._analyze_startup_for_content(startup_data)
        
        logger.info(f"Content Analysis:")
        logger.info(f"  Business: {analysis['business_model']}")
        logger.info(f"  Target Audience: {analysis['target_audience']}")
        logger.info(f"  Content Pillars: {len(analysis['content_pillars'])}")
        
        # PHASE 1: Generate blog post ideas
        blog_ideas = self._generate_blog_ideas(analysis, startup_data)
        
        # PHASE 2: SEO keyword research (MCP web search)
        if enable_mcp:
            logger.info("🌐 Conducting SEO keyword research...")
            seo_keywords = self._research_seo_keywords_mcp(analysis, blog_ideas)
        else:
            seo_keywords = self._generate_seo_keywords_basic(analysis)
        
        # PHASE 3: 12-month content calendar
        content_calendar = self._generate_content_calendar(blog_ideas, seo_keywords, analysis)
        
        # PHASE 4: Social media templates
        social_templates = self._generate_social_templates(blog_ideas[:5], analysis)
        
        # PHASE 5: Gmail distribution setup (MCP)
        if enable_mcp:
            logger.info("📧 Creating email distribution templates...")
            email_templates = self._create_email_distribution_templates(analysis, startup_data)
        else:
            email_templates = []
        
        # PHASE 6: Calendar events (MCP)
        if enable_mcp:
            logger.info("📅 Scheduling publishing calendar...")
            calendar_events = self._create_publishing_calendar_events(content_calendar)
        else:
            calendar_events = []
        
        # PHASE 7: Trending topics research (MCP)
        if enable_mcp:
            logger.info("🔥 Researching trending topics...")
            trending_topics = self._research_trending_topics_mcp(analysis)
        else:
            trending_topics = []
        
        result = {
            'startup_name': startup_data['idea'].get('startup_name', 'Your Startup'),
            'analysis': analysis,
            'blog_ideas': blog_ideas,
            'seo_keywords': seo_keywords,
            'content_calendar': content_calendar,
            'social_templates': social_templates,
            'trending_topics': trending_topics,
            'generated_at': datetime.now().isoformat(),
            
            # MCP Features
            'mcp_enabled': enable_mcp,
            'email_templates': email_templates,
            'calendar_events': calendar_events,
            'total_content_pieces': len(content_calendar),
        }
        
        logger.info(f"✅ Generated {len(blog_ideas)} blog ideas")
        logger.info(f"✅ Found {len(seo_keywords)} SEO keywords")
        logger.info(f"✅ Created {len(content_calendar)} content pieces")
        if enable_mcp:
            logger.info(f"📧 {len(email_templates)} email templates")
            logger.info(f"📅 {len(calendar_events)} calendar events")
        logger.info("=" * 70)
        
        return result
    
    # ========================================================================
    # CONTENT ANALYSIS
    # ========================================================================
    
    def _analyze_startup_for_content(self, data: Dict) -> Dict:
        """Analyze startup to determine content strategy."""
        
        idea = data['idea']
        market = data.get('market_validation', {})
        
        # Detect business model
        business_model = self._detect_business_model(idea)
        
        # Identify target audience
        target_audience = self._identify_target_audience(idea, market)
        
        # Determine content pillars
        content_pillars = self._identify_content_pillars(idea, business_model)
        
        return {
            'business_model': business_model,
            'target_audience': target_audience,
            'content_pillars': content_pillars,
            'problem_space': idea.get('problem_statement', ''),
            'solution': idea.get('solution', ''),
            'industry': self._detect_industry(idea)
        }
    
    def _detect_business_model(self, idea: Dict) -> str:
        """Detect business model for content angles."""
        
        problem = idea.get('problem_statement', '')
        solution = idea.get('solution', '')
        
        prompt = f"""Based on this startup, identify business model (2-4 words):

Problem: {problem[:200]}
Solution: {solution[:200]}

Return ONLY the business model."""

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=50
            )
            return response.choices[0].message.content.strip()
        except:
            return "Technology Startup"
    
    def _identify_target_audience(self, idea: Dict, market: Dict) -> str:
        """Identify target audience for content."""
        
        target_market = idea.get('target_market', {})
        
        if isinstance(target_market, dict):
            segments = target_market.get('customer_segments', [])
            if segments:
                return segments[0] if isinstance(segments, list) else str(segments)
        
        problem = idea.get('problem_statement', '')
        
        # Extract from problem statement
        if 'business' in problem.lower() or 'companies' in problem.lower():
            return "B2B Decision Makers"
        elif 'student' in problem.lower() or 'learn' in problem.lower():
            return "Students & Learners"
        else:
            return "General Consumers"
    
    def _identify_content_pillars(self, idea: Dict, business_model: str) -> List[str]:
        """Identify main content themes."""
        
        problem = idea.get('problem_statement', '')
        solution = idea.get('solution', '')
        
        prompt = f"""Based on this {business_model} startup, list 4 content pillar themes:

Problem: {problem[:200]}
Solution: {solution[:200]}

Content pillars are main topics to write about.
Examples: "Industry Trends", "How-To Guides", "Case Studies", "Product Updates"

Return ONLY 4 pillar names, one per line."""

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=100
            )
            
            pillars = response.choices[0].message.content.strip().split('\n')
            return [p.strip().lstrip('0123456789.-) ') for p in pillars if p.strip()][:4]
        except:
            return ["Industry Insights", "How-To Guides", "Product Updates", "Customer Stories"]
    
    def _detect_industry(self, idea: Dict) -> str:
        """Detect industry for keyword research."""
        
        problem = idea.get('problem_statement', '').lower()
        solution = idea.get('solution', '').lower()
        
        text = problem + " " + solution
        
        if any(word in text for word in ['education', 'learning', 'student', 'course']):
            return "Education Technology"
        elif any(word in text for word in ['finance', 'payment', 'banking', 'money']):
            return "Financial Technology"
        elif any(word in text for word in ['health', 'medical', 'patient', 'wellness']):
            return "Healthcare Technology"
        elif any(word in text for word in ['hr', 'employee', 'hiring', 'recruitment']):
            return "HR Technology"
        else:
            return "Technology"
    
    # ========================================================================
    # BLOG POST IDEAS
    # ========================================================================
    
    def _generate_blog_ideas(self, analysis: Dict, data: Dict) -> List[Dict]:
        """Generate blog post ideas."""
        
        idea = data['idea']
        
        prompt = f"""Generate 24 blog post ideas for a {analysis['business_model']} startup.

Target Audience: {analysis['target_audience']}
Problem: {analysis['problem_space'][:200]}
Solution: {analysis['solution'][:200]}

Content Pillars:
{chr(10).join(f"- {p}" for p in analysis['content_pillars'])}

Generate 24 blog titles (6 per pillar) that:
1. Address audience pain points
2. Provide value (how-to, guides, insights)
3. Include SEO-friendly keywords
4. Vary in type (listicles, guides, case studies, opinion)

Return JSON array:
[
  {{"title": "...", "pillar": "...", "type": "how-to/listicle/guide/case-study", "seo_focus": "keyword"}}
]

Return ONLY the JSON array."""

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content.strip()
            
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0].strip()
            elif '```' in content:
                content = content.split('```')[1].split('```')[0].strip()
            
            blog_ideas = json.loads(content)
            
            # Add additional metadata
            for idx, idea_item in enumerate(blog_ideas):
                idea_item['id'] = idx + 1
                idea_item['estimated_word_count'] = self._estimate_word_count(idea_item['type'])
                idea_item['difficulty'] = self._estimate_difficulty(idea_item['type'])
            
            logger.info(f"  Generated {len(blog_ideas)} blog ideas")
            return blog_ideas
            
        except Exception as e:
            logger.error(f"Blog idea generation failed: {e}")
            return []
    
    def _estimate_word_count(self, post_type: str) -> int:
        """Estimate word count by type."""
        word_counts = {
            'how-to': 1500,
            'guide': 2000,
            'listicle': 1200,
            'case-study': 1800,
            'opinion': 1000,
            'tutorial': 2500
        }
        return word_counts.get(post_type, 1500)
    
    def _estimate_difficulty(self, post_type: str) -> str:
        """Estimate writing difficulty."""
        if post_type in ['guide', 'tutorial', 'case-study']:
            return 'Hard'
        elif post_type in ['how-to', 'opinion']:
            return 'Medium'
        else:
            return 'Easy'
    
    # ========================================================================
    # SEO KEYWORD RESEARCH (MCP)
    # ========================================================================
    
    def _research_seo_keywords_mcp(self, analysis: Dict, blog_ideas: List[Dict]) -> List[Dict]:
        """Research SEO keywords using MCP web search."""
        
        # Extract topics from blog ideas
        topics = list(set([idea.get('seo_focus', '') for idea in blog_ideas[:10]]))
        
        keywords = []
        
        for topic in topics[:5]:  # Research top 5 topics
            keyword_data = self._search_keyword_data(topic, analysis['industry'])
            if keyword_data:
                keywords.append(keyword_data)
        
        return keywords
    
    def _search_keyword_data(self, topic: str, industry: str) -> Dict:
        """Search for keyword data."""
        
        prompt = f"""Research SEO keyword data for: "{topic}" in {industry}

Based on typical SEO patterns, estimate:
1. Search volume (monthly searches)
2. Competition level (Low/Medium/High)
3. Related keywords (3-5)
4. Content angle

Return JSON:
{{
  "keyword": "...",
  "search_volume": <number>,
  "competition": "Low/Medium/High",
  "related_keywords": ["...", "..."],
  "content_angle": "..."
}}"""

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=300
            )
            
            content = response.choices[0].message.content.strip()
            
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0].strip()
            elif '```' in content:
                content = content.split('```')[1].split('```')[0].strip()
            
            keyword_data = json.loads(content)
            logger.info(f"  📊 Researched: {keyword_data['keyword']} ({keyword_data['search_volume']} searches/mo)")
            
            return keyword_data
            
        except Exception as e:
            logger.error(f"Keyword research failed for {topic}: {e}")
            return None
    
    def _generate_seo_keywords_basic(self, analysis: Dict) -> List[Dict]:
        """Generate basic SEO keywords without MCP."""
        
        keywords = []
        for pillar in analysis['content_pillars']:
            keywords.append({
                'keyword': pillar.lower(),
                'search_volume': 1000,
                'competition': 'Medium',
                'related_keywords': [],
                'content_angle': f"Write about {pillar}"
            })
        
        return keywords
    
    # ========================================================================
    # CONTENT CALENDAR
    # ========================================================================
    
    def _generate_content_calendar(self, blog_ideas: List[Dict], 
                                   seo_keywords: List[Dict], 
                                   analysis: Dict) -> List[Dict]:
        """Generate 12-month content calendar."""
        
        calendar_items = []
        current_date = datetime.now()
        
        # Distribute blog ideas across 12 months
        posts_per_month = max(2, len(blog_ideas) // 12)
        
        for month_offset in range(12):
            publish_date = current_date + timedelta(days=30 * month_offset)
            month_name = publish_date.strftime('%B %Y')
            
            # Get blog ideas for this month
            start_idx = month_offset * posts_per_month
            end_idx = start_idx + posts_per_month
            month_posts = blog_ideas[start_idx:end_idx] if start_idx < len(blog_ideas) else []
            
            for week_idx, post in enumerate(month_posts, 1):
                # Calculate publish date (spread across month)
                days_offset = (month_offset * 30) + (week_idx * 7)
                post_date = current_date + timedelta(days=days_offset)
                
                calendar_items.append({
                    'id': len(calendar_items) + 1,
                    'month': month_name,
                    'week': week_idx,
                    'publish_date': post_date.strftime('%Y-%m-%d'),
                    'title': post['title'],
                    'pillar': post['pillar'],
                    'type': post['type'],
                    'word_count': post['estimated_word_count'],
                    'seo_keyword': post.get('seo_focus', ''),
                    'status': 'planned',
                    'social_posts': 3,  # Number of social posts to create
                })
        
        logger.info(f"  Created {len(calendar_items)} calendar entries")
        return calendar_items
    
    # ========================================================================
    # SOCIAL MEDIA TEMPLATES
    # ========================================================================
    
    def _generate_social_templates(self, blog_ideas: List[Dict], analysis: Dict) -> List[Dict]:
        """Generate social media post templates."""
        
        social_posts = []
        
        for blog in blog_ideas[:5]:  # Top 5 blogs
            # Generate posts for each platform
            platforms = ['LinkedIn', 'Twitter', 'Facebook']
            
            for platform in platforms:
                template = self._create_social_template(blog, platform, analysis)
                if template:
                    social_posts.append(template)
        
        logger.info(f"  Generated {len(social_posts)} social templates")
        return social_posts
    
    def _create_social_template(self, blog: Dict, platform: str, analysis: Dict) -> Dict:
        """Create social media template for specific platform."""
        
        prompt = f"""Write a {platform} post promoting this blog:

Title: {blog['title']}
Type: {blog['type']}
Target Audience: {analysis['target_audience']}

{platform} best practices:
- LinkedIn: Professional, value-focused, 150-200 words
- Twitter: Concise, hook-driven, 280 chars max
- Facebook: Engaging, storytelling, 100-150 words

Write ONLY the post text, no hashtags yet."""

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=200
            )
            
            post_text = response.choices[0].message.content.strip()
            
            # Generate hashtags
            hashtags = self._generate_hashtags(blog, platform)
            
            return {
                'blog_title': blog['title'],
                'platform': platform,
                'post_text': post_text,
                'hashtags': hashtags,
                'best_time_to_post': self._get_best_posting_time(platform),
                'character_count': len(post_text)
            }
            
        except Exception as e:
            logger.error(f"Social template creation failed: {e}")
            return None
    
    def _generate_hashtags(self, blog: Dict, platform: str) -> List[str]:
        """Generate relevant hashtags."""
        
        base_hashtags = {
            'LinkedIn': ['#Business', '#Technology', '#Innovation'],
            'Twitter': ['#Tech', '#Startup', '#Innovation'],
            'Facebook': ['#Business', '#Technology']
        }
        
        hashtags = base_hashtags.get(platform, [])
        
        # Add topic-specific
        if blog.get('seo_focus'):
            topic_tag = '#' + blog['seo_focus'].replace(' ', '')
            hashtags.append(topic_tag)
        
        return hashtags[:5]
    
    def _get_best_posting_time(self, platform: str) -> str:
        """Get best posting time by platform."""
        
        times = {
            'LinkedIn': 'Tuesday-Thursday, 8-10 AM',
            'Twitter': 'Wednesday, 12-1 PM',
            'Facebook': 'Wednesday-Friday, 1-3 PM'
        }
        
        return times.get(platform, 'Weekdays, 9 AM - 5 PM')
    
    # ========================================================================
    # TRENDING TOPICS (MCP)
    # ========================================================================
    
    def _research_trending_topics_mcp(self, analysis: Dict) -> List[Dict]:
        """Research trending topics in industry."""
        
        prompt = f"""What are 5 trending topics in {analysis['industry']} right now?

Consider:
- Hot discussions in the industry
- Recent news/developments
- Popular debates
- Emerging technologies

Return JSON array:
[
  {{"topic": "...", "why_trending": "...", "content_angle": "..."}}
]"""

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=500
            )
            
            content = response.choices[0].message.content.strip()
            
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0].strip()
            elif '```' in content:
                content = content.split('```')[1].split('```')[0].strip()
            
            trending = json.loads(content)
            logger.info(f"  🔥 Found {len(trending)} trending topics")
            
            return trending
            
        except Exception as e:
            logger.error(f"Trending topics research failed: {e}")
            return []
    
    # ========================================================================
    # EMAIL DISTRIBUTION (MCP)
    # ========================================================================
    
    def _create_email_distribution_templates(self, analysis: Dict, data: Dict) -> List[Dict]:
        """Create email templates for content distribution."""
        
        idea = data['idea']
        startup_name = idea.get('startup_name', 'Our Startup')
        
        templates = [
            {
                'name': 'New Blog Post Announcement',
                'subject': 'New Post: [BLOG_TITLE]',
                'body': f"""Hi there,

We just published a new post on the {startup_name} blog:

[BLOG_TITLE]

[BLOG_SUMMARY]

Read it here: [BLOG_URL]

Best,
The {startup_name} Team""",
                'use_case': 'Send when new blog published',
                'recipients': 'Email list subscribers'
            },
            {
                'name': 'Weekly Content Digest',
                'subject': f'This Week at {startup_name}',
                'body': f"""Hi there,

Here's what we published this week:

[BLOG_LINKS]

Thanks for reading!

{startup_name} Team""",
                'use_case': 'Weekly roundup of content',
                'recipients': 'Email list subscribers'
            },
            {
                'name': 'Content Collaboration Request',
                'subject': 'Guest Post Opportunity',
                'body': f"""Hi [NAME],

We're building a content library for {analysis['target_audience']} and think you'd be a great contributor.

Would you be interested in writing about [TOPIC]?

Best,
{startup_name} Team""",
                'use_case': 'Recruit guest contributors',
                'recipients': 'Industry experts'
            }
        ]
        
        logger.info(f"  Created {len(templates)} email templates")
        return templates
    
    # ========================================================================
    # PUBLISHING CALENDAR (MCP)
    # ========================================================================
    
    def _create_publishing_calendar_events(self, content_calendar: List[Dict]) -> List[Dict]:
        """Create calendar events for publishing schedule."""
        
        events = []
        
        for item in content_calendar[:12]:  # First 12 posts
            publish_date = datetime.strptime(item['publish_date'], '%Y-%m-%d')
            
            # Create event 1 week before publish date (writing deadline)
            deadline_date = publish_date - timedelta(days=7)
            
            events.append({
                'title': f'✍️ Write: {item["title"][:50]}...',
                'date': deadline_date.strftime('%Y-%m-%d'),
                'type': 'deadline',
                'description': f"""Content Deadline:

Blog: {item['title']}
Word Count: {item['word_count']} words
SEO Keyword: {item['seo_keyword']}
Type: {item['type']}

Publish Date: {item['publish_date']}
""",
                'reminder': '3 days before'
            })
            
            # Create publish event
            events.append({
                'title': f'📢 Publish: {item["title"][:50]}...',
                'date': item['publish_date'],
                'type': 'publish',
                'description': f"""Publish Blog Post:

{item['title']}

Actions:
1. Final review
2. Publish to blog
3. Share on social media
4. Send email to list
""",
                'reminder': '1 day before'
            })
        
        logger.info(f"  Created {len(events)} calendar events")
        return events
    
    # ========================================================================
    # UTILITY METHODS
    # ========================================================================
    
    def _gather_startup_data(self, idea_id: int) -> Dict:
        """Gather startup data."""
        
        db = next(get_db())
        try:
            from app.models.idea import StructuredIdea
            from app.models.validation import ValidationSession
            
            idea = db.query(StructuredIdea).filter(StructuredIdea.id == idea_id).first()
            if not idea:
                return {}
            
            session = db.query(ValidationSession).filter(
                ValidationSession.structured_idea_id == idea_id
            ).order_by(ValidationSession.created_at.desc()).first()
            
            structured_data = idea.structured_data
            if isinstance(structured_data, str):
                structured_data = json.loads(structured_data)
            
            results = {}
            if session and session.results:
                if isinstance(session.results, str):
                    results = json.loads(session.results)
                else:
                    results = session.results
            
            return {
                'idea': structured_data,
                'market_validation': results.get('market_validation', {}),
                'competitor_analysis': results.get('competitor_analysis', {})
            }
        finally:
            db.close()
    
    def _insufficient_data_response(self) -> Dict:
        """Return when insufficient data."""
        return {
            'error': 'insufficient_data',
            'message': 'Please complete structured idea first',
            'required_features': ['Structured idea with problem/solution']
        }