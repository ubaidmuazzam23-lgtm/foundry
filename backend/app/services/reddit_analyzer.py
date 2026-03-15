# File: backend/app/services/reddit_analyzer.py
# Analyzes Reddit discussions to find real customer pain points

import requests
from typing import List, Dict, Any
from collections import Counter
import re
from app.utils.logger import logger


class RedditPainPointAnalyzer:
    """
    Analyzes Reddit to find REAL customer pain points.
    
    Uses Reddit's JSON API (no authentication needed for public posts).
    Extracts common themes, complaints, and feature requests.
    """
    
    def __init__(self):
        self.base_url = "https://www.reddit.com"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; MarketResearch/1.0)'
        }
    
    def analyze_pain_points(
        self, 
        target_audience: str, 
        problem_area: str,
        max_posts: int = 50
    ) -> Dict[str, Any]:
        """
        Analyze pain points from Reddit discussions.
        
        Args:
            target_audience: Who the target customers are
            problem_area: What problem space to research
            max_posts: Maximum posts to analyze
            
        Returns:
            {
                'pain_points': [...],
                'feature_requests': [...],
                'common_complaints': [...],
                'sentiment_score': 0.0-1.0
            }
        """
        logger.info(f"🔍 Analyzing Reddit for: {target_audience} + {problem_area}")
        
        # Find relevant subreddits
        subreddits = self._find_relevant_subreddits(target_audience)
        
        # Search posts
        all_posts = []
        for subreddit in subreddits[:3]:  # Top 3 subreddits
            posts = self._search_subreddit(subreddit, problem_area, limit=max_posts // 3)
            all_posts.extend(posts)
        
        if not all_posts:
            logger.warning("No Reddit posts found")
            return self._empty_result()
        
        # Analyze content
        pain_points = self._extract_pain_points(all_posts)
        feature_requests = self._extract_feature_requests(all_posts)
        complaints = self._extract_complaints(all_posts)
        sentiment = self._calculate_sentiment(all_posts)
        
        result = {
            'pain_points': pain_points,
            'feature_requests': feature_requests,
            'common_complaints': complaints,
            'sentiment_score': sentiment,
            'posts_analyzed': len(all_posts),
            'subreddits': subreddits[:3]
        }
        
        logger.info(f"✅ Analyzed {len(all_posts)} Reddit posts")
        logger.info(f"   Found {len(pain_points)} pain points, {len(feature_requests)} feature requests")
        
        return result
    
    def _find_relevant_subreddits(self, target_audience: str) -> List[str]:
        """Find relevant subreddits based on target audience."""
        
        target_lower = target_audience.lower()
        
        # Mapping of audiences to subreddits
        subreddit_map = {
            'teacher': ['Teachers', 'education', 'teaching', 'Professors'],
            'school': ['Teachers', 'education', 'Principals', 'highschool'],
            'parent': ['Parenting', 'Mommit', 'daddit', 'raisingkids'],
            'student': ['college', 'students', 'highschool', 'GradSchool'],
            'restaurant': ['restaurateur', 'KitchenConfidential', 'restaurant', 'Chefit'],
            'developer': ['programming', 'webdev', 'cscareerquestions', 'learnprogramming'],
            'business': ['smallbusiness', 'Entrepreneur', 'startups', 'business'],
            'healthcare': ['medicine', 'nursing', 'healthcare', 'medical'],
            'finance': ['personalfinance', 'investing', 'FinancialPlanning', 'finance'],
            'marketer': ['marketing', 'SEO', 'socialmedia', 'PPC'],
            'sales': ['sales', 'salestechniques', 'SaaS'],
            'hr': ['humanresources', 'recruiting', 'AskHR'],
        }
        
        # Find matching subreddits
        for keyword, subs in subreddit_map.items():
            if keyword in target_lower:
                return subs
        
        # Default
        return ['AskReddit', 'business', 'smallbusiness']
    
    def _search_subreddit(self, subreddit: str, query: str, limit: int = 20) -> List[Dict]:
        """Search a subreddit for posts matching query."""
        
        try:
            # Use Reddit's JSON API
            url = f"{self.base_url}/r/{subreddit}/search.json"
            
            params = {
                'q': query,
                'restrict_sr': 'on',  # Search only this subreddit
                'sort': 'relevance',
                'limit': limit,
                't': 'year'  # Past year
            }
            
            response = requests.get(url, headers=self.headers, params=params, timeout=10)
            
            if response.status_code != 200:
                logger.warning(f"Reddit API error {response.status_code} for r/{subreddit}")
                return []
            
            data = response.json()
            posts = []
            
            for child in data.get('data', {}).get('children', []):
                post_data = child.get('data', {})
                
                posts.append({
                    'title': post_data.get('title', ''),
                    'selftext': post_data.get('selftext', ''),
                    'score': post_data.get('score', 0),
                    'num_comments': post_data.get('num_comments', 0),
                    'subreddit': subreddit,
                    'url': f"https://reddit.com{post_data.get('permalink', '')}"
                })
            
            logger.info(f"Found {len(posts)} posts in r/{subreddit}")
            return posts
            
        except Exception as e:
            logger.error(f"Error searching r/{subreddit}: {e}")
            return []
    
    def _extract_pain_points(self, posts: List[Dict]) -> List[Dict[str, Any]]:
        """Extract pain points from posts."""
        
        pain_indicators = [
            'frustrated', 'annoying', 'hate', 'difficult', 'hard to',
            'wish', 'problem', 'issue', 'struggle', 'challenge',
            'painful', 'time-consuming', 'complicated', 'confusing'
        ]
        
        pain_points = []
        
        for post in posts:
            text = f"{post['title']} {post['selftext']}".lower()
            
            # Check if post mentions pain points
            pain_score = sum(1 for indicator in pain_indicators if indicator in text)
            
            if pain_score >= 2:  # At least 2 pain indicators
                # Extract key sentences
                sentences = re.split(r'[.!?]', text)
                
                for sentence in sentences:
                    if any(indicator in sentence for indicator in pain_indicators):
                        if len(sentence) > 20 and len(sentence) < 300:
                            pain_points.append({
                                'text': sentence.strip(),
                                'score': post['score'],
                                'source': post['subreddit'],
                                'url': post['url']
                            })
        
        # Sort by Reddit score (upvotes)
        pain_points.sort(key=lambda x: x['score'], reverse=True)
        
        # Group similar pain points
        grouped = self._group_similar_texts([p['text'] for p in pain_points[:20]])
        
        # Format
        formatted_pain_points = []
        for pain, count in grouped.most_common(10):
            formatted_pain_points.append({
                'pain_point': pain,
                'mentions': count,
                'validation': 'High' if count >= 3 else 'Medium'
            })
        
        return formatted_pain_points
    
    def _extract_feature_requests(self, posts: List[Dict]) -> List[str]:
        """Extract feature requests."""
        
        request_indicators = [
            'need', 'want', 'wish', 'would love', 'looking for',
            'feature request', 'would be great if', 'hope they add',
            'missing feature', 'should have'
        ]
        
        features = []
        
        for post in posts:
            text = f"{post['title']} {post['selftext']}".lower()
            
            for indicator in request_indicators:
                if indicator in text:
                    # Extract sentence
                    sentences = re.split(r'[.!?]', text)
                    for sentence in sentences:
                        if indicator in sentence and len(sentence) > 15:
                            features.append(sentence.strip())
        
        # Get most common
        grouped = self._group_similar_texts(features)
        
        return [feature for feature, count in grouped.most_common(10)]
    
    def _extract_complaints(self, posts: List[Dict]) -> List[Dict[str, Any]]:
        """Extract common complaints."""
        
        complaint_words = []
        
        for post in posts:
            text = f"{post['title']} {post['selftext']}".lower()
            
            # Extract negative phrases
            if any(word in text for word in ['worst', 'terrible', 'awful', 'useless']):
                words = text.split()
                complaint_words.extend(words)
        
        # Find most common words
        word_freq = Counter(complaint_words)
        
        # Remove common stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'it'}
        
        complaints = []
        for word, count in word_freq.most_common(20):
            if word not in stop_words and len(word) > 3:
                complaints.append({
                    'complaint': word,
                    'frequency': count
                })
        
        return complaints[:10]
    
    def _calculate_sentiment(self, posts: List[Dict]) -> float:
        """Calculate overall sentiment (0.0 = negative, 1.0 = positive)."""
        
        positive_words = ['love', 'great', 'awesome', 'helpful', 'excellent', 'fantastic']
        negative_words = ['hate', 'terrible', 'awful', 'useless', 'frustrated', 'annoying']
        
        positive_count = 0
        negative_count = 0
        
        for post in posts:
            text = f"{post['title']} {post['selftext']}".lower()
            
            positive_count += sum(1 for word in positive_words if word in text)
            negative_count += sum(1 for word in negative_words if word in text)
        
        total = positive_count + negative_count
        if total == 0:
            return 0.5
        
        return positive_count / total
    
    def _group_similar_texts(self, texts: List[str]) -> Counter:
        """Group similar text snippets."""
        
        # Simple grouping by first 50 chars
        grouped = Counter()
        
        for text in texts:
            # Normalize
            normalized = re.sub(r'[^\w\s]', '', text.lower())
            
            # Take first few words as key
            words = normalized.split()[:8]
            key = ' '.join(words)
            
            if key:
                grouped[key] += 1
        
        return grouped
    
    def _empty_result(self) -> Dict[str, Any]:
        """Return empty result."""
        return {
            'pain_points': [],
            'feature_requests': [],
            'common_complaints': [],
            'sentiment_score': 0.5,
            'posts_analyzed': 0,
            'subreddits': []
        }
    
    def format_reddit_data(self, analysis: Dict[str, Any]) -> str:
        """Format Reddit analysis for AI consumption."""
        
        if analysis['posts_analyzed'] == 0:
            return "No Reddit data available"
        
        formatted = ["=== REDDIT CUSTOMER INSIGHTS ===\n"]
        
        formatted.append(f"Analysis based on {analysis['posts_analyzed']} Reddit posts")
        formatted.append(f"Subreddits analyzed: {', '.join(analysis['subreddits'])}")
        formatted.append(f"Overall sentiment: {analysis['sentiment_score']:.2f} (0=negative, 1=positive)\n")
        
        if analysis['pain_points']:
            formatted.append("TOP PAIN POINTS (from real users):")
            for i, pain in enumerate(analysis['pain_points'], 1):
                formatted.append(f"{i}. {pain['pain_point']} (mentioned {pain['mentions']}x, validation: {pain['validation']})")
            formatted.append("")
        
        if analysis['feature_requests']:
            formatted.append("FEATURE REQUESTS (what users want):")
            for i, feature in enumerate(analysis['feature_requests'][:5], 1):
                formatted.append(f"{i}. {feature}")
            formatted.append("")
        
        if analysis['common_complaints']:
            formatted.append("COMMON COMPLAINTS:")
            for complaint in analysis['common_complaints'][:5]:
                formatted.append(f"- {complaint['complaint']} (mentioned {complaint['frequency']}x)")
        
        return "\n".join(formatted)