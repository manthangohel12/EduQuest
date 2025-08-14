#!/usr/bin/env python3
"""
Test script for improved summarization functionality
"""
import asyncio
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.text_simplifier import TextSimplifier

async def test_summarization():
    """Test the improved summarization functionality"""
    
    # Initialize the text simplifier with local API
    simplifier = TextSimplifier(use_local_api=True)
    
    # Test text
    test_text = """
    Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines capable of performing tasks that typically require human intelligence. These tasks include learning, reasoning, problem-solving, perception, and language understanding. AI systems can be classified into two main categories: narrow AI, which is designed to perform specific tasks, and general AI, which possesses the ability to perform any intellectual task that a human can do.
    
    Machine learning is a subset of AI that focuses on the development of algorithms and statistical models that enable computers to improve their performance on a specific task through experience. Deep learning, a subset of machine learning, uses artificial neural networks with multiple layers to model and understand complex patterns in data. These technologies have revolutionized various industries, including healthcare, finance, transportation, and entertainment.
    
    The applications of AI are vast and continue to expand. In healthcare, AI is used for disease diagnosis, drug discovery, and personalized treatment plans. In finance, AI algorithms are employed for fraud detection, risk assessment, and automated trading. In transportation, AI powers self-driving cars and optimizes traffic flow. The entertainment industry uses AI for content recommendation, game development, and creative content generation.
    """
    
    print("Testing improved summarization with local API...")
    print("=" * 50)
    print("Original text length:", len(test_text.split()))
    print("\nOriginal text:")
    print(test_text[:200] + "...")
    
    try:
        # Test bullet points summarization
        print("\n" + "=" * 50)
        print("Testing bullet points summarization:")
        
        summary = simplifier._summarize_with_local_api(test_text, max_length=300, style="bullet_points")
        print("\nBullet points summary:")
        print(summary)
        
        # Test concise summarization
        print("\n" + "=" * 50)
        print("Testing concise summarization:")
        
        concise_summary = simplifier._summarize_with_local_api(test_text, max_length=150, style="concise")
        print("\nConcise summary:")
        print(concise_summary)
        
        # Test full simplification process
        print("\n" + "=" * 50)
        print("Testing full simplification process:")
        
        result = await simplifier.simplify(test_text)
        print("\nFull result summary:")
        print(result['summary'])
        
        print("\n" + "=" * 50)
        print("Test completed successfully!")
        
    except Exception as e:
        print(f"Error during testing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_summarization()) 