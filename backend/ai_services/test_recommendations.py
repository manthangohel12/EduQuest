#!/usr/bin/env python3
"""
Test script for recommendation service functionality
"""
import asyncio
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.recommendation_service import RecommendationService

async def test_recommendations():
    """Test the recommendation service"""
    
    print("Testing Recommendation Service")
    print("=" * 50)
    
    # Initialize the service
    service = RecommendationService()
    
    # Test content
    test_content = """
    Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines capable of performing tasks that typically require human intelligence. These tasks include learning, reasoning, problem-solving, perception, and language understanding. AI systems can be classified into two main categories: narrow AI, which is designed to perform specific tasks, and general AI, which possesses the ability to perform any intellectual task that a human can do.
    
    Machine learning is a subset of AI that focuses on the development of algorithms and statistical models that enable computers to improve their performance on a specific task through experience. Deep learning, a subset of machine learning, uses artificial neural networks with multiple layers to model and understand complex patterns in data. These technologies have revolutionized various industries, including healthcare, finance, transportation, and entertainment.
    
    The applications of AI are vast and continue to expand. In healthcare, AI is used for disease diagnosis, drug discovery, and personalized treatment plans. In finance, AI algorithms are employed for fraud detection, risk assessment, and automated trading. In transportation, AI powers self-driving cars and optimizes traffic flow. The entertainment industry uses AI for content recommendation, game development, and creative content generation.
    """
    
    print(f"Test content length: {len(test_content)} characters")
    print(f"Test content preview: {test_content[:100]}...")
    
    print("\n" + "=" * 50)
    print("Testing Key Concept Extraction")
    print("=" * 50)
    
    try:
        key_concepts = await service._extract_key_concepts(test_content)
        print(f"Extracted {len(key_concepts)} key concepts:")
        for i, concept in enumerate(key_concepts, 1):
            print(f"  {i}. {concept}")
    except Exception as e:
        print(f"Error extracting key concepts: {e}")
    
    print("\n" + "=" * 50)
    print("Testing Full Recommendations")
    print("=" * 50)
    
    try:
        recommendations = await service.get_recommendations(
            content=test_content,
            content_type="text",
            max_recommendations=5
        )
        
        print(f"Total recommendations: {recommendations.get('total_recommendations', 0)}")
        
        # Display Wikipedia recommendations
        wikipedia_recs = recommendations.get('wikipedia', [])
        print(f"\nWikipedia articles: {len(wikipedia_recs)}")
        for i, rec in enumerate(wikipedia_recs[:3], 1):
            print(f"  {i}. {rec.get('title', 'N/A')}")
            print(f"     URL: {rec.get('url', 'N/A')}")
        
        # Display YouTube recommendations
        youtube_recs = recommendations.get('youtube', [])
        print(f"\nYouTube videos: {len(youtube_recs)}")
        for i, rec in enumerate(youtube_recs[:3], 1):
            print(f"  {i}. {rec.get('title', 'N/A')}")
            print(f"     Channel: {rec.get('channel', 'N/A')}")
            print(f"     URL: {rec.get('url', 'N/A')}")
        
        # Display web resources
        web_recs = recommendations.get('web_resources', [])
        print(f"\nWeb resources: {len(web_recs)}")
        for i, rec in enumerate(web_recs[:3], 1):
            print(f"  {i}. {rec.get('title', 'N/A')}")
            print(f"     Domain: {rec.get('domain', 'N/A')}")
            print(f"     URL: {rec.get('url', 'N/A')}")
        
        # Display educational resources
        edu_recs = recommendations.get('educational_resources', [])
        print(f"\nEducational platforms: {len(edu_recs)}")
        for i, rec in enumerate(edu_recs[:3], 1):
            print(f"  {i}. {rec.get('title', 'N/A')}")
            print(f"     Platform: {rec.get('platform', 'N/A')}")
            print(f"     URL: {rec.get('url', 'N/A')}")
        
        # Generate summary
        summary = service.get_recommendation_summary(recommendations)
        print(f"\nSummary:\n{summary}")
        
    except Exception as e:
        print(f"Error getting recommendations: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_recommendations())

