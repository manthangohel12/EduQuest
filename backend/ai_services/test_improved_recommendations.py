#!/usr/bin/env python3
"""
Test script for improved YouTube fallback and web resource recommendations
"""

import asyncio
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.recommendation_service import RecommendationService

async def test_improved_recommendations():
    """Test the improved recommendation methods"""
    
    print("🚀 Testing Improved Recommendation Service")
    print("=" * 50)
    
    # Initialize service
    service = RecommendationService()
    
    # Test content
    test_content = """
    Machine learning is a subset of artificial intelligence that enables computers to learn 
    and make decisions without being explicitly programmed. It involves algorithms that can 
    identify patterns in data and make predictions or decisions based on that data.
    
    Key concepts include supervised learning, unsupervised learning, neural networks, 
    deep learning, and reinforcement learning. These techniques are used in various 
    applications such as image recognition, natural language processing, and autonomous vehicles.
    """
    
    print(f"📝 Test Content: {test_content[:100]}...")
    print()
    
    # Test 1: Content Analysis
    print("🔍 Testing Content Analysis...")
    try:
        analysis = await service.analyze_content_with_gemini(test_content)
        print(f"✅ Analysis successful:")
        print(f"   Topics: {analysis.get('topics', [])}")
        print(f"   Subject: {analysis.get('subject', 'Unknown')}")
        print(f"   Complexity: {analysis.get('complexity', 'Unknown')}")
        print()
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        print()
    
    # Test 2: YouTube Fallback (without API key)
    print("📺 Testing YouTube Fallback (no API key)...")
    try:
        concepts = ["machine learning", "neural networks", "deep learning"]
        youtube_results = await service._get_youtube_fallback(concepts, 3)
        print(f"✅ YouTube fallback successful: {len(youtube_results)} videos found")
        for i, video in enumerate(youtube_results[:2]):
            print(f"   {i+1}. {video.get('title', 'No title')}")
            print(f"      Channel: {video.get('channel', 'Unknown')}")
            print(f"      URL: {video.get('url', 'No URL')}")
        print()
    except Exception as e:
        print(f"❌ YouTube fallback failed: {e}")
        print()
    
    # Test 3: Web Resources
    print("🌐 Testing Web Resources...")
    try:
        concepts = ["machine learning", "artificial intelligence"]
        web_results = await service._get_web_resource_recommendations(concepts, 4)
        print(f"✅ Web resources successful: {len(web_results)} resources found")
        for i, resource in enumerate(web_results[:2]):
            print(f"   {i+1}. {resource.get('title', 'No title')}")
            print(f"      Domain: {resource.get('domain', 'Unknown')}")
            print(f"      Score: {resource.get('relevance_score', 'Unknown')}")
            print(f"      URL: {resource.get('url', 'No URL')}")
        print()
    except Exception as e:
        print(f"❌ Web resources failed: {e}")
        print()
    
    # Test 4: Full Intelligent Recommendations
    print("🧠 Testing Full Intelligent Recommendations...")
    try:
        full_results = await service.get_intelligent_recommendations(
            content=test_content,
            topics=["machine learning", "AI", "neural networks"],
            subject="computer science",
            max_recommendations=8
        )
        
        print(f"✅ Full recommendations successful:")
        print(f"   Total: {full_results.get('total_recommendations', 0)}")
        print(f"   Wikipedia: {len(full_results.get('wikipedia', []))}")
        print(f"   YouTube: {len(full_results.get('youtube', []))}")
        print(f"   Web Resources: {len(full_results.get('web_resources', []))}")
        print(f"   Courses: {len(full_results.get('courses', []))}")
        print()
        
        # Show summary
        summary = service.get_recommendation_summary(full_results)
        print("📊 Recommendation Summary:")
        print(summary)
        
    except Exception as e:
        print(f"❌ Full recommendations failed: {e}")
        print()
    
    print("🎯 Testing Complete!")

if __name__ == "__main__":
    # Run the test
    asyncio.run(test_improved_recommendations())

