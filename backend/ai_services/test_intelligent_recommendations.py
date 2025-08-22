#!/usr/bin/env python3
"""
Test script for intelligent recommendation service functionality
"""
import asyncio
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.recommendation_service import RecommendationService

async def test_intelligent_recommendations():
    """Test the intelligent recommendation service"""
    
    print("Testing Intelligent Recommendation Service")
    print("=" * 60)
    
    # Initialize the service
    service = RecommendationService()
    
    # Test content
    test_content = """
    Machine learning is a subset of artificial intelligence that focuses on the development of algorithms and statistical models that enable computers to improve their performance on a specific task through experience. Deep learning, a subset of machine learning, uses artificial neural networks with multiple layers to model and understand complex patterns in data.
    
    These technologies have revolutionized various industries, including healthcare, finance, transportation, and entertainment. In healthcare, AI is used for disease diagnosis, drug discovery, and personalized treatment plans. In finance, AI algorithms are employed for fraud detection, risk assessment, and automated trading.
    """
    
    print(f"Test content length: {len(test_content)} characters")
    print(f"Test content preview: {test_content[:100]}...")
    
    print("\n" + "=" * 60)
    print("Testing Content Analysis with Gemini")
    print("=" * 60)
    
    try:
        analysis = await service.analyze_content_with_gemini(test_content)
        print(f"Content Analysis Results:")
        print(f"  Topics: {analysis.get('topics', [])}")
        print(f"  Subject: {analysis.get('subject', 'N/A')}")
        print(f"  Complexity: {analysis.get('complexity', 'N/A')}")
        print(f"  Summary: {analysis.get('summary', 'N/A')}")
        print(f"  Key Concepts: {analysis.get('key_concepts', [])}")
        
        topics = analysis.get('topics', [])
        subject = analysis.get('subject', 'general')
        
    except Exception as e:
        print(f"Error in content analysis: {e}")
        # Use fallback values
        topics = ['machine learning', 'artificial intelligence', 'deep learning']
        subject = 'technology'
    
    print("\n" + "=" * 60)
    print("Testing Intelligent Recommendations")
    print("=" * 60)
    
    try:
        recommendations = await service.get_intelligent_recommendations(
            content=test_content,
            topics=topics,
            subject=subject,
            max_recommendations=8
        )
        
        print(f"Total recommendations: {recommendations.get('total_recommendations', 0)}")
        
        # Display Wikipedia recommendations
        wikipedia_recs = recommendations.get('wikipedia', [])
        print(f"\nWikipedia articles: {len(wikipedia_recs)}")
        for i, rec in enumerate(wikipedia_recs[:2], 1):
            print(f"  {i}. {rec.get('title', 'N/A')}")
            print(f"     URL: {rec.get('url', 'N/A')}")
        
        # Display YouTube recommendations
        youtube_recs = recommendations.get('youtube', [])
        print(f"\nYouTube videos: {len(youtube_recs)}")
        for i, rec in enumerate(youtube_recs[:2], 1):
            print(f"  {i}. {rec.get('title', 'N/A')}")
            print(f"     Channel: {rec.get('channel', 'N/A')}")
            print(f"     URL: {rec.get('url', 'N/A')}")
        
        # Display web resources
        web_recs = recommendations.get('web_resources', [])
        print(f"\nWeb resources: {len(web_recs)}")
        for i, rec in enumerate(web_recs[:2], 1):
            print(f"  {i}. {rec.get('title', 'N/A')}")
            print(f"     Domain: {rec.get('domain', 'N/A')}")
            print(f"     URL: {rec.get('url', 'N/A')}")
        
        # Display course resources
        course_recs = recommendations.get('courses', [])
        print(f"\nCourse resources: {len(course_recs)}")
        for i, rec in enumerate(course_recs[:2], 1):
            print(f"  {i}. {rec.get('title', 'N/A')}")
            print(f"     Platform: {rec.get('platform', 'N/A')}")
            print(f"     URL: {rec.get('url', 'N/A')}")
        
        # Generate summary
        summary = service.get_recommendation_summary(recommendations)
        print(f"\nSummary:\n{summary}")
        
    except Exception as e:
        print(f"Error getting intelligent recommendations: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_intelligent_recommendations())


