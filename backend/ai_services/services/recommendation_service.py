import asyncio
import aiohttp
import requests
import json
import re
from typing import List, Dict, Any, Optional
from urllib.parse import quote, urlencode
import logging
from bs4 import BeautifulSoup
import time
import random

logger = logging.getLogger(__name__)

class RecommendationService:
    def __init__(self):
        self.wikipedia_api_url = "https://en.wikipedia.org/api/rest_v1"
        self.youtube_api_key = None  # Will be loaded from environment
        self.search_engines = {
            "google": "https://www.google.com/search",
            "bing": "https://www.bing.com/search",
            "duckduckgo": "https://duckduckgo.com/"
        }
        
        # Load API keys from environment
        self._load_api_keys()
        
        # Rate limiting
        self.request_delays = {
            "wikipedia": 0.1,
            "youtube": 0.2,
            "web_search": 0.5  # Reduced from 1.0 to 0.5
        }
        self.last_request_time = {}
        
    def _load_api_keys(self):
        """Load API keys from environment variables"""
        import os
        self.youtube_api_key = os.getenv("YOUTUBE_API_KEY")
        if not self.youtube_api_key:
            logger.warning("YouTube API key not found. YouTube recommendations will be limited.")
    
    async def _rate_limit(self, service: str):
        """Implement rate limiting for different services"""
        if service in self.last_request_time:
            elapsed = time.time() - self.last_request_time[service]
            delay = self.request_delays.get(service, 1.0)
            if elapsed < delay:
                await asyncio.sleep(delay - elapsed)
        self.last_request_time[service] = time.time()
    
    async def get_recommendations(self, content: str, content_type: str = "text", 
                                max_recommendations: int = 10) -> Dict[str, Any]:
        """
        Get comprehensive recommendations based on content analysis
        
        Args:
            content: The content to analyze (text, quiz content, etc.)
            content_type: Type of content ("text", "quiz", "summary")
            max_recommendations: Maximum number of recommendations per category
            
        Returns:
            Dictionary containing recommendations for different resource types
        """
        try:
            # Extract key concepts and topics from content
            key_concepts = await self._extract_key_concepts(content)
            
            # Get recommendations in parallel
            tasks = [
                self._get_wikipedia_recommendations(key_concepts, max_recommendations),
                self._get_youtube_recommendations(key_concepts, max_recommendations),
                self._get_web_resource_recommendations(key_concepts, max_recommendations),
                self._get_educational_resource_recommendations(key_concepts, max_recommendations)
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results and handle exceptions
            wikipedia_results = results[0] if not isinstance(results[0], Exception) else []
            youtube_results = results[1] if not isinstance(results[1], Exception) else []
            web_results = results[2] if not isinstance(results[2], Exception) else []
            educational_results = results[3] if not isinstance(results[3], Exception) else []
            
            return {
                "wikipedia": wikipedia_results,
                "youtube": youtube_results,
                "web_resources": web_results,
                "educational_resources": educational_results,
                "key_concepts": key_concepts,
                "content_type": content_type,
                "total_recommendations": len(wikipedia_results) + len(youtube_results) + 
                                       len(web_results) + len(educational_results)
            }
            
        except Exception as e:
            logger.error(f"Error getting recommendations: {e}")
            return {
                "error": str(e),
                "wikipedia": [],
                "youtube": [],
                "web_resources": [],
                "educational_resources": [],
                "key_concepts": [],
                "content_type": content_type,
                "total_recommendations": 0
            }
    
    async def _extract_key_concepts(self, content: str) -> List[str]:
        """Extract key concepts and topics from content"""
        try:
            # Simple keyword extraction (can be enhanced with NLP)
            words = re.findall(r'\b[a-zA-Z]{3,}\b', content.lower())
            
            # Filter out common words and get frequency
            common_words = {'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'}
            
            word_freq = {}
            for word in words:
                if word not in common_words and len(word) > 3:
                    word_freq[word] = word_freq.get(word, 0) + 1
            
            # Get top concepts
            sorted_concepts = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
            key_concepts = [concept for concept, freq in sorted_concepts[:10]]
            
            # Add some multi-word phrases
            phrases = re.findall(r'\b[a-zA-Z]+(?:\s+[a-zA-Z]+){1,3}\b', content)
            for phrase in phrases[:5]:
                if len(phrase.split()) >= 2:
                    key_concepts.append(phrase.lower())
            
            return list(set(key_concepts))[:15]  # Limit to 15 unique concepts
            
        except Exception as e:
            logger.error(f"Error extracting key concepts: {e}")
            return []
    
    async def _get_wikipedia_recommendations(self, concepts: List[str], max_results: int) -> List[Dict[str, Any]]:
        """Get Wikipedia page recommendations based on key concepts"""
        try:
            await self._rate_limit("wikipedia")
            
            recommendations = []
            
            async with aiohttp.ClientSession() as session:
                for concept in concepts[:max_results]:
                    try:
                        # Search Wikipedia for the concept
                        search_url = f"{self.wikipedia_api_url}/page/summary/{quote(concept)}"
                        
                        async with session.get(search_url) as response:
                            if response.status == 200:
                                data = await response.json()
                                
                                if 'title' in data and 'extract' in data:
                                    recommendation = {
                                        "title": data['title'],
                                        "summary": data['extract'][:200] + "..." if len(data['extract']) > 200 else data['extract'],
                                        "url": f"https://en.wikipedia.org/wiki/{quote(data['title'])}",
                                        "concept": concept,
                                        "type": "wikipedia",
                                        "thumbnail": data.get('thumbnail', {}).get('source', ''),
                                        "page_id": data.get('pageid', '')
                                    }
                                    recommendations.append(recommendation)
                                    
                                    if len(recommendations) >= max_results:
                                        break
                        
                        # Small delay between requests
                        await asyncio.sleep(0.1)
                        
                    except Exception as e:
                        logger.warning(f"Error getting Wikipedia recommendation for '{concept}': {e}")
                        continue
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting Wikipedia recommendations: {e}")
            return []
    
    async def _get_youtube_recommendations(self, concepts: List[str], max_results: int) -> List[Dict[str, Any]]:
        """Get YouTube video recommendations based on key concepts"""
        try:
            await self._rate_limit("youtube")
            
            if not self.youtube_api_key:
                # Fallback to web scraping (limited)
                return await self._get_youtube_fallback(concepts, max_results)
            
            recommendations = []
            
            async with aiohttp.ClientSession() as session:
                for concept in concepts[:max_results]:
                    try:
                        # Use YouTube Data API v3
                        search_url = "https://www.googleapis.com/youtube/v3/search"
                        params = {
                            'part': 'snippet',
                            'q': concept,
                            'type': 'video',
                            'maxResults': 1,
                            'order': 'relevance',
                            'videoDuration': 'medium',  # 4-20 minutes
                            'videoDefinition': 'high',
                            'relevanceLanguage': 'en',
                            'key': self.youtube_api_key
                        }
                        
                        async with session.get(search_url, params=params) as response:
                            if response.status == 200:
                                data = await response.json()
                                
                                if 'items' in data and data['items']:
                                    item = data['items'][0]['snippet']
                                    video_id = data['items'][0]['id']['videoId']
                                    
                                    recommendation = {
                                        "title": item['title'],
                                        "description": item['description'][:150] + "..." if len(item['description']) > 150 else item['description'],
                                        "url": f"https://www.youtube.com/watch?v={video_id}",
                                        "concept": concept,
                                        "type": "youtube",
                                        "thumbnail": item['thumbnails']['high']['url'],
                                        "channel": item['channelTitle'],
                                        "published_at": item['publishedAt'],
                                        "duration": "N/A",  # Would need additional API call
                                        "view_count": "N/A"  # Would need additional API call
                                    }
                                    recommendations.append(recommendation)
                                    
                                    if len(recommendations) >= max_results:
                                        break
                        
                        # Small delay between requests
                        await asyncio.sleep(0.2)
                        
                    except Exception as e:
                        logger.warning(f"Error getting YouTube recommendation for '{concept}': {e}")
                        continue
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting YouTube recommendations: {e}")
            return []
    
    async def _get_youtube_fallback(self, concepts: List[str], max_results: int) -> List[Dict[str, Any]]:
        """Improved fallback method for YouTube recommendations without API key"""
        try:
            recommendations = []
            
            async with aiohttp.ClientSession() as session:
                for concept in concepts[:max_results]:
                    try:
                        # Enhanced search query with educational keywords
                        search_terms = [
                            f"{concept} tutorial",
                            f"{concept} lecture",
                            f"{concept} explanation",
                            f"{concept} introduction",
                            f"{concept} overview"
                        ]
                        
                        for search_term in search_terms:
                            if len(recommendations) >= max_results:
                                break
                                
                            search_url = f"https://www.youtube.com/results?search_query={quote(search_term)}&sp=CAI%253D"  # Sort by relevance
                            
                            headers = {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                                'Accept-Language': 'en-US,en;q=0.5',
                                'Accept-Encoding': 'gzip, deflate',
                                'DNT': '1',
                                'Connection': 'keep-alive',
                                'Upgrade-Insecure-Requests': '1',
                            }
                            
                            async with session.get(search_url, headers=headers, timeout=30) as response:
                                if response.status == 200:
                                    html = await response.text()
                                    
                                    # Multiple extraction methods for better reliability
                                    video_data = self._extract_youtube_video_data(html, concept)
                                    
                                    if video_data:
                                        recommendation = {
                                            "title": video_data['title'],
                                            "description": video_data['description'],
                                            "url": video_data['url'],
                                            "concept": concept,
                                            "type": "youtube",
                                            "thumbnail": video_data['thumbnail'],
                                            "channel": video_data['channel'],
                                            "published_at": "N/A",
                                            "duration": "N/A",
                                            "view_count": "N/A"
                                        }
                                        recommendations.append(recommendation)
                                        break  # Found a video for this concept
                            
                            # Shorter delay between searches
                            await asyncio.sleep(0.5)
                        
                        # Small delay between concepts
                        await asyncio.sleep(0.3)
                        
                    except Exception as e:
                        logger.warning(f"Error getting YouTube fallback for '{concept}': {e}")
                        continue
            
            # If we didn't get enough results, add fallback YouTube resources
            if len(recommendations) < max_results // 2:
                fallback_youtube = self._get_fallback_youtube_resources(concepts, max_results - len(recommendations))
                recommendations.extend(fallback_youtube)
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in YouTube fallback: {e}")
            # Return fallback YouTube resources if main method fails
            return self._get_fallback_youtube_resources(concepts, max_results)
    
    def _extract_youtube_video_data(self, html: str, concept: str) -> Optional[Dict[str, str]]:
        """Extract YouTube video data using multiple parsing strategies"""
        try:
            # Method 1: Extract from ytInitialData (most reliable)
            yt_data_match = re.search(r'var ytInitialData = ({.*?});', html)
            if yt_data_match:
                try:
                    import json
                    yt_data = json.loads(yt_data_match.group(1))
                    videos = self._parse_yt_initial_data(yt_data)
                    if videos:
                        return videos[0]  # Return first video
                except:
                    pass
            
            # Method 2: Extract from embedded data
            embedded_data_match = re.search(r'"videoId":"([^"]+)"', html)
            if embedded_data_match:
                video_id = embedded_data_match.group(1)
                title_match = re.search(r'"title":"([^"]+)"', html)
                channel_match = re.search(r'"channelName":"([^"]+)"', html)
                
                if video_id and title_match:
                    title = title_match.group(1).replace('\\u0026', '&').replace('\\"', '"')
                    channel = channel_match.group(1) if channel_match else "YouTube"
                    
                    return {
                        "title": title,
                        "description": f"Educational video about {concept}",
                        "url": f"https://www.youtube.com/watch?v={video_id}",
                        "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                        "channel": channel
                    }
            
            # Method 3: Basic regex fallback (improved)
            video_patterns = [
                r'"videoId":"([^"]+)"',
                r'watch\?v=([a-zA-Z0-9_-]+)',
                r'/embed/([a-zA-Z0-9_-]+)'
            ]
            
            for pattern in video_patterns:
                video_matches = re.findall(pattern, html)
                if video_matches:
                    video_id = video_matches[0]
                    
                    # Try to find title
                    title_patterns = [
                        r'"title":"([^"]+)"',
                        r'<title>([^<]+)</title>',
                        r'<meta property="og:title" content="([^"]+)"'
                    ]
                    
                    title = f"Video about {concept}"
                    for title_pattern in title_patterns:
                        title_match = re.search(title_pattern, html)
                        if title_match:
                            title = title_match.group(1).replace('\\u0026', '&').replace('\\"', '"')
                            break
                    
                    return {
                        "title": title,
                        "description": f"Educational video about {concept}",
                        "url": f"https://www.youtube.com/watch?v={video_id}",
                        "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                        "channel": "YouTube"
                    }
            
            return None
            
        except Exception as e:
            logger.warning(f"Error extracting YouTube video data: {e}")
            return None
    
    def _parse_yt_initial_data(self, yt_data: Dict) -> List[Dict[str, str]]:
        """Parse YouTube initial data for video information"""
        try:
            videos = []
            
            # Navigate through the complex structure
            if 'contents' in yt_data:
                contents = yt_data['contents']
                if 'twoColumnSearchResultsRenderer' in contents:
                    search_results = contents['twoColumnSearchResultsRenderer']
                    if 'primaryContents' in search_results:
                        primary = search_results['primaryContents']
                        if 'sectionListRenderer' in primary:
                            sections = primary['sectionListRenderer']['contents']
                            for section in sections:
                                if 'itemSectionRenderer' in section:
                                    items = section['itemSectionRenderer']['contents']
                                    for item in items:
                                        if 'videoRenderer' in item:
                                            video = item['videoRenderer']
                                            video_id = video.get('videoId', '')
                                            title = video.get('title', {}).get('runs', [{}])[0].get('text', '')
                                            channel = video.get('ownerText', {}).get('runs', [{}])[0].get('text', '')
                                            
                                            if video_id and title:
                                                videos.append({
                                                    "title": title,
                                                    "description": f"Educational video about {concept}",
                                                    "url": f"https://www.youtube.com/watch?v={video_id}",
                                                    "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                                                    "channel": channel or "YouTube"
                                                })
                                                
                                                if len(videos) >= 3:  # Limit to 3 videos
                                                    break
                                        if len(videos) >= 3:
                                            break
                                    if len(videos) >= 3:
                                        break
                                if len(videos) >= 3:
                                    break
            
            return videos
            
        except Exception as e:
            logger.warning(f"Error parsing YouTube initial data: {e}")
            return []
    
    async def _get_web_resource_recommendations(self, concepts: List[str], max_results: int) -> List[Dict[str, Any]]:
        """Get general web resource recommendations using multiple search strategies"""
        try:
            await self._rate_limit("web_search")
            
            recommendations = []
            
            async with aiohttp.ClientSession() as session:
                for concept in concepts[:max_results]:
                    try:
                        # Multiple search strategies for better coverage
                        search_strategies = [
                            f"{concept} tutorial guide",
                            f"{concept} learning resources",
                            f"{concept} study materials",
                            f"{concept} educational content",
                            f"learn {concept} online"
                        ]
                        
                        for search_query in search_strategies:
                            if len(recommendations) >= max_results:
                                break
                                
                            # Try multiple search engines for better results
                            search_engines = [
                                ("DuckDuckGo", f"https://duckduckgo.com/html/?q={quote(search_query)}"),
                                ("Bing", f"https://www.bing.com/search?q={quote(search_query)}"),
                                ("Google", f"https://www.google.com/search?q={quote(search_query)}")
                            ]
                            
                            for engine_name, search_url in search_engines:
                                if len(recommendations) >= max_results:
                                    break
                                    
                                try:
                                    headers = {
                                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                                        'Accept-Language': 'en-US,en;q=0.5',
                                        'Accept-Encoding': 'gzip, deflate',
                                        'DNT': '1',
                                        'Connection': 'keep-alive',
                                        'Upgrade-Insecure-Requests': '1',
                                    }
                                    
                                    async with session.get(search_url, headers=headers, timeout=30) as response:
                                        if response.status == 200:
                                            html = await response.text()
                                            
                                            # Parse search results based on engine
                                            if engine_name == "DuckDuckGo":
                                                results = self._parse_duckduckgo_results(html, concept)
                                            elif engine_name == "Bing":
                                                results = self._parse_bing_results(html, concept)
                                            else:  # Google
                                                results = self._parse_google_results(html, concept)
                                            
                                            # Add results to recommendations
                                            for result in results:
                                                if len(recommendations) >= max_results:
                                                    break
                                                recommendations.append(result)
                                            
                                            # If we found good results, move to next concept
                                            if results:
                                                break
                                                
                                except Exception as e:
                                    logger.warning(f"Error with {engine_name} search for '{concept}': {e}")
                                    continue
                            
                            # Small delay between search strategies
                            await asyncio.sleep(0.5)
                        
                        # Small delay between concepts
                        await asyncio.sleep(0.3)
                        
                    except Exception as e:
                        logger.warning(f"Error getting web resource for '{concept}': {e}")
                        continue
            
            # If we didn't get enough results from web scraping, add fallback resources
            if len(recommendations) < max_results // 2:
                fallback_resources = self._get_fallback_web_resources(concepts, max_results - len(recommendations))
                recommendations.extend(fallback_resources)
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting web resource recommendations: {e}")
            # Return fallback resources if main method fails
            return self._get_fallback_web_resources(concepts, max_results)
    
    def _get_fallback_web_resources(self, concepts: List[str], max_results: int) -> List[Dict[str, Any]]:
        """Generate fallback web resources when web scraping fails"""
        try:
            fallback_resources = []
            
            # Curated educational resource domains
            educational_domains = [
                {"name": "Khan Academy", "url": "https://www.khanacademy.org", "search_url": "https://www.khanacademy.org/search?page_search_query="},
                {"name": "Coursera", "url": "https://www.coursera.org", "search_url": "https://www.coursera.org/search?query="},
                {"name": "edX", "url": "https://www.edx.org", "search_url": "https://www.edx.org/search?q="},
                {"name": "MIT OpenCourseWare", "url": "https://ocw.mit.edu", "search_url": "https://ocw.mit.edu/search/?q="},
                {"name": "OpenStax", "url": "https://openstax.org", "search_url": "https://openstax.org/search?q="},
                {"name": "W3Schools", "url": "https://www.w3schools.com", "search_url": "https://www.w3schools.com/search/search.php?q="},
                {"name": "MDN Web Docs", "url": "https://developer.mozilla.org", "search_url": "https://developer.mozilla.org/en-US/search?q="},
                {"name": "Stack Overflow", "url": "https://stackoverflow.com", "search_url": "https://stackoverflow.com/search?q="},
                {"name": "GitHub", "url": "https://github.com", "search_url": "https://github.com/search?q="},
                {"name": "YouTube Learning", "url": "https://www.youtube.com", "search_url": "https://www.youtube.com/results?search_query="}
            ]
            
            for concept in concepts[:max_results]:
                for domain in educational_domains:
                    if len(fallback_resources) >= max_results:
                        break
                        
                    try:
                        # Create search URL
                        search_url = f"{domain['search_url']}{quote(concept)}"
                        
                        fallback_resources.append({
                            "title": f"{concept.title()} - {domain['name']}",
                            "description": f"Find educational content about {concept} on {domain['name']}",
                            "url": search_url,
                            "concept": concept,
                            "type": "fallback_resource",
                            "domain": domain['name'],
                            "relevance_score": 0.7,
                            "is_fallback": True
                        })
                        
                    except Exception as e:
                        logger.warning(f"Error creating fallback resource: {e}")
                        continue
                
                if len(fallback_resources) >= max_results:
                    break
            
            return fallback_resources
            
        except Exception as e:
            logger.error(f"Error getting fallback web resources: {e}")
            return []
    
    def _parse_duckduckgo_results(self, html: str, concept: str) -> List[Dict[str, Any]]:
        """Parse DuckDuckGo search results"""
        try:
            results = []
            soup = BeautifulSoup(html, 'html.parser')
            
            # Look for result links
            result_links = soup.find_all('a', class_='result__a')
            
            for link in result_links[:5]:  # Get top 5 results
                try:
                    title = link.get_text().strip()
                    url = link.get('href', '')
                    
                    if title and url and not url.startswith('#'):
                        # Get snippet from nearby elements
                        snippet_elem = link.find_next('a', class_='result__snippet')
                        snippet = snippet_elem.get_text().strip() if snippet_elem else f"Resource about {concept}"
                        
                        # Filter and score the result
                        score = self._score_web_resource(url, title, snippet, concept)
                        
                        if score > 0.3:  # Lower threshold for more results
                            results.append({
                                "title": title,
                                "description": snippet[:150] + "..." if len(snippet) > 150 else snippet,
                                "url": url,
                                "concept": concept,
                                "type": "web_resource",
                                "domain": self._extract_domain(url),
                                "relevance_score": score
                            })
                
                except Exception as e:
                    continue
            
            return results
            
        except Exception as e:
            logger.warning(f"Error parsing DuckDuckGo results: {e}")
            return []
    
    def _parse_bing_results(self, html: str, concept: str) -> List[Dict[str, Any]]:
        """Parse Bing search results"""
        try:
            results = []
            soup = BeautifulSoup(html, 'html.parser')
            
            # Look for result containers
            result_containers = soup.find_all('li', class_='b_algo')
            
            for container in result_containers[:5]:
                try:
                    title_elem = container.find('h2')
                    link_elem = container.find('a')
                    snippet_elem = container.find('p')
                    
                    if title_elem and link_elem:
                        title = title_elem.get_text().strip()
                        url = link_elem.get('href', '')
                        snippet = snippet_elem.get_text().strip() if snippet_elem else f"Resource about {concept}"
                        
                        if title and url:
                            score = self._score_web_resource(url, title, snippet, concept)
                            
                            if score > 0.3:
                                results.append({
                                    "title": title,
                                    "description": snippet[:150] + "..." if len(snippet) > 150 else snippet,
                                    "url": url,
                                    "concept": concept,
                                    "type": "web_resource",
                                    "domain": self._extract_domain(url),
                                    "relevance_score": score
                                })
                
                except Exception as e:
                    continue
            
            return results
            
        except Exception as e:
            logger.warning(f"Error parsing Bing results: {e}")
            return []
    
    def _parse_google_results(self, html: str, concept: str) -> List[Dict[str, Any]]:
        """Parse Google search results"""
        try:
            results = []
            soup = BeautifulSoup(html, 'html.parser')
            
            # Look for search result containers
            search_results = soup.find_all('div', class_='g')
            
            for result in search_results[:5]:
                try:
                    title_elem = result.find('h3')
                    link_elem = result.find('a')
                    snippet_elem = result.find('span', class_='aCOpRe') or result.find('div', class_='VwiC3b')
                    
                    if title_elem and link_elem:
                        title = title_elem.get_text().strip()
                        url = link_elem.get('href', '')
                        snippet = snippet_elem.get_text().strip() if snippet_elem else f"Resource about {concept}"
                        
                        if title and url and not url.startswith('/url?'):
                            score = self._score_web_resource(url, title, snippet, concept)
                            
                            if score > 0.3:
                                results.append({
                                    "title": title,
                                    "description": snippet[:150] + "..." if len(snippet) > 150 else snippet,
                                    "url": url,
                                    "concept": concept,
                                    "type": "web_resource",
                                    "domain": self._extract_domain(url),
                                    "relevance_score": score
                                })
                
                except Exception as e:
                    continue
            
            return results
            
        except Exception as e:
            logger.warning(f"Error parsing Google results: {e}")
            return []
    
    def _score_web_resource(self, url: str, title: str, snippet: str, concept: str) -> float:
        """Score web resources based on relevance and quality"""
        try:
            score = 0.0
            
            # Domain quality scoring
            domain = self._extract_domain(url).lower()
            
            # High-quality domains
            if any(quality_domain in domain for quality_domain in ['edu', 'org', 'gov', 'ac.uk', 'ac.za']):
                score += 0.4
            elif any(platform in domain for platform in ['khanacademy', 'coursera', 'edx', 'mit', 'stanford', 'harvard']):
                score += 0.5
            elif any(tech_domain in domain for tech_domain in ['github', 'stackoverflow', 'w3schools', 'mdn', 'tutorialspoint']):
                score += 0.3
            elif any(blog_domain in domain for blog_domain in ['medium', 'dev.to', 'hashnode']):
                score += 0.2
            
            # Content relevance scoring
            concept_lower = concept.lower()
            title_lower = title.lower()
            snippet_lower = snippet.lower()
            
            # Title relevance
            if concept_lower in title_lower:
                score += 0.3
            elif any(word in title_lower for word in concept_lower.split()):
                score += 0.2
            
            # Snippet relevance
            if concept_lower in snippet_lower:
                score += 0.2
            elif any(word in snippet_lower for word in concept_lower.split()):
                score += 0.1
            
            # Educational keywords bonus
            educational_keywords = ['tutorial', 'guide', 'learn', 'lesson', 'course', 'explanation', 'how to', 'introduction']
            for keyword in educational_keywords:
                if keyword in title_lower or keyword in snippet_lower:
                    score += 0.1
                    break
            
            # Penalize low-quality domains
            if any(spam_domain in domain for spam_domain in ['clickbait', 'spam', 'fake']):
                score -= 0.5
            
            return max(0.0, min(1.0, score))  # Clamp between 0 and 1
            
        except Exception as e:
            logger.warning(f"Error scoring web resource: {e}")
            return 0.5  # Default neutral score
    
    def _extract_domain(self, url: str) -> str:
        """Extract domain from URL"""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            return parsed.netloc or "unknown"
        except:
            return "unknown"
    
    async def _get_educational_resource_recommendations(self, concepts: List[str], max_results: int) -> List[Dict[str, Any]]:
        """Get specific educational platform recommendations"""
        try:
            recommendations = []
            
            # Educational platforms to search
            platforms = [
                {"name": "Khan Academy", "url": "https://www.khanacademy.org", "search_url": "https://www.khanacademy.org/search?page_search_query="},
                {"name": "Coursera", "url": "https://www.coursera.org", "search_url": "https://www.coursera.org/search?query="},
                {"name": "edX", "url": "https://www.edx.org", "search_url": "https://www.edx.org/search?q="},
                {"name": "MIT OpenCourseWare", "url": "https://ocw.mit.edu", "search_url": "https://ocw.mit.edu/search/?q="},
                {"name": "OpenStax", "url": "https://openstax.org", "search_url": "https://openstax.org/search?q="}
            ]
            
            for concept in concepts[:max_results]:
                for platform in platforms:
                    try:
                        recommendation = {
                            "title": f"{concept.title()} on {platform['name']}",
                            "description": f"Find educational content about {concept} on {platform['name']}",
                            "url": f"{platform['search_url']}{quote(concept)}",
                            "concept": concept,
                            "type": "educational_platform",
                            "platform": platform['name'],
                            "platform_url": platform['url'],
                            "relevance_score": 0.9
                        }
                        recommendations.append(recommendation)
                        
                        if len(recommendations) >= max_results:
                            break
                    
                    except Exception as e:
                        logger.warning(f"Error creating educational platform recommendation: {e}")
                        continue
                
                if len(recommendations) >= max_results:
                    break
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting educational resource recommendations: {e}")
            return []
    
    async def analyze_content_with_gemini(self, content: str) -> Dict[str, Any]:
        """Analyze content using Gemini to identify topics and subject"""
        try:
            import os
            import google.generativeai as genai
            
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                # Fallback to basic analysis
                return self._fallback_content_analysis(content)
            
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            prompt = f"""
            Analyze the following content and provide a structured analysis:
            
            Content: {content[:2000]}
            
            Please return a JSON response with the following structure:
            {{
                "topics": ["topic1", "topic2", "topic3"],
                "subject": "main subject area",
                "complexity": "beginner/intermediate/advanced",
                "summary": "brief summary of the content",
                "key_concepts": ["concept1", "concept2", "concept3"]
            }}
            
            Focus on identifying the main subject area and key topics that would be useful for finding learning resources.
            """
            
            response = model.generate_content(prompt)
            text = getattr(response, "text", None) or ""
            
            # Extract JSON from response
            import json
            import re
            
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                return result
            else:
                return self._fallback_content_analysis(content)
                
        except Exception as e:
            logger.error(f"Error analyzing content with Gemini: {e}")
            return self._fallback_content_analysis(content)
    
    def _fallback_content_analysis(self, content: str) -> Dict[str, Any]:
        """Fallback content analysis when Gemini is not available"""
        try:
            # Extract key concepts
            concepts = self._extract_key_concepts_sync(content)
            
            # Simple subject detection
            subjects = {
                'science': ['physics', 'chemistry', 'biology', 'mathematics', 'engineering'],
                'history': ['history', 'ancient', 'medieval', 'war', 'civilization'],
                'literature': ['poetry', 'novel', 'drama', 'fiction', 'author'],
                'technology': ['computer', 'software', 'programming', 'ai', 'machine learning'],
                'business': ['economics', 'finance', 'marketing', 'management', 'strategy']
            }
            
            detected_subject = 'general'
            for subject, keywords in subjects.items():
                if any(keyword in content.lower() for keyword in keywords):
                    detected_subject = subject
                    break
            
            return {
                "topics": concepts[:5],
                "subject": detected_subject,
                "complexity": "intermediate",
                "summary": f"Content related to {detected_subject} with key topics: {', '.join(concepts[:3])}",
                "key_concepts": concepts[:5]
            }
            
        except Exception as e:
            logger.error(f"Error in fallback content analysis: {e}")
            return {
                "topics": ["general"],
                "subject": "general",
                "complexity": "intermediate",
                "summary": "Content analysis completed",
                "key_concepts": ["general"]
            }
    
    def _extract_key_concepts_sync(self, content: str) -> List[str]:
        """Synchronous version of key concept extraction"""
        try:
            # Simple keyword extraction (can be enhanced with NLP)
            words = re.findall(r'\b[a-zA-Z]{3,}\b', content.lower())
            
            # Filter out common words and get frequency
            common_words = {'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'}
            
            word_freq = {}
            for word in words:
                if word not in common_words and len(word) > 3:
                    word_freq[word] = word_freq.get(word, 0) + 1
            
            # Get top concepts
            sorted_concepts = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
            key_concepts = [concept for concept, freq in sorted_concepts[:10]]
            
            # Add some multi-word phrases
            phrases = re.findall(r'\b[a-zA-Z]+(?:\s+[a-zA-Z]+){1,3}\b', content)
            for phrase in phrases[:5]:
                if len(phrase.split()) >= 2:
                    key_concepts.append(phrase.lower())
            
            return list(set(key_concepts))[:15]  # Limit to 15 unique concepts
            
        except Exception as e:
            logger.error(f"Error extracting key concepts: {e}")
            return []
    
    async def get_intelligent_recommendations(self, content: str, topics: List[str], subject: str, max_recommendations: int = 12) -> Dict[str, Any]:
        """Get intelligent recommendations based on content analysis"""
        try:
            # Get recommendations in parallel
            tasks = [
                self._get_wikipedia_recommendations(topics, max_recommendations // 3),
                self._get_youtube_recommendations(topics, max_recommendations // 3),
                self._get_web_resource_recommendations(topics, max_recommendations // 3),
                self._get_course_recommendations(topics, subject, max_recommendations // 3)
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results and handle exceptions
            wikipedia_results = results[0] if not isinstance(results[0], Exception) else []
            youtube_results = results[1] if not isinstance(results[1], Exception) else []
            web_results = results[2] if not isinstance(results[2], Exception) else []
            course_results = results[3] if not isinstance(results[3], Exception) else []
            
            return {
                "wikipedia": wikipedia_results,
                "youtube": youtube_results,
                "web_resources": web_results,
                "courses": course_results,
                "topics": topics,
                "subject": subject,
                "total_recommendations": len(wikipedia_results) + len(youtube_results) + 
                                       len(web_results) + len(course_results)
            }
            
        except Exception as e:
            logger.error(f"Error getting intelligent recommendations: {e}")
            return {
                "error": str(e),
                "wikipedia": [],
                "youtube": [],
                "web_resources": [],
                "courses": [],
                "topics": topics,
                "subject": subject,
                "total_recommendations": 0
            }
    
    async def _get_course_recommendations(self, topics: List[str], subject: str, max_results: int) -> List[Dict[str, Any]]:
        """Get course recommendations based on topics and subject"""
        try:
            recommendations = []
            
            # Educational platforms to search
            platforms = [
                {"name": "Khan Academy", "url": "https://www.khanacademy.org", "search_url": "https://www.khanacademy.org/search?page_search_query="},
                {"name": "Coursera", "url": "https://www.coursera.org", "search_url": "https://www.coursera.org/search?query="},
                {"name": "edX", "url": "https://www.edx.org", "search_url": "https://www.edx.org/search?q="},
                {"name": "MIT OpenCourseWare", "url": "https://ocw.mit.edu", "search_url": "https://ocw.mit.edu/search/?q="},
                {"name": "OpenStax", "url": "https://openstax.org", "search_url": "https://openstax.org/search?q="}
            ]
            
            for topic in topics[:max_results // len(platforms)]:
                for platform in platforms:
                    try:
                        recommendation = {
                            "title": f"{topic.title()} Course on {platform['name']}",
                            "description": f"Find courses about {topic} on {platform['name']}",
                            "url": f"{platform['search_url']}{quote(topic)}",
                            "topic": topic,
                            "type": "course",
                            "platform": platform['name'],
                            "platform_url": platform['url'],
                            "relevance_score": 0.9
                        }
                        recommendations.append(recommendation)
                        
                        if len(recommendations) >= max_results:
                            break
                    
                    except Exception as e:
                        logger.warning(f"Error creating course recommendation: {e}")
                        continue
                
                if len(recommendations) >= max_results:
                    break
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting course recommendations: {e}")
            return []
    
    def get_recommendation_summary(self, recommendations: Dict[str, Any]) -> str:
        """Generate a summary of recommendations for display"""
        try:
            total = recommendations.get('total_recommendations', 0)
            topics = recommendations.get('topics', [])
            subject = recommendations.get('subject', 'general')
            
            if total == 0:
                return "No recommendations found for the given content."
            
            summary = f"Found {total} relevant resources for {subject} based on {len(topics)} key topics:\n\n"
            
            # Add topic list
            if topics:
                summary += f"Key topics: {', '.join(topics[:5])}\n\n"
            
            # Add resource counts
            wikipedia_count = len(recommendations.get('wikipedia', []))
            youtube_count = len(recommendations.get('youtube', []))
            web_count = len(recommendations.get('web_resources', []))
            course_count = len(recommendations.get('courses', []))
            
            summary += f"• {wikipedia_count} Wikipedia articles\n"
            summary += f"• {youtube_count} YouTube videos\n"
            summary += f"• {web_count} web resources\n"
            summary += f"• {course_count} course resources"
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating recommendation summary: {e}")
            return "Error generating recommendation summary."
