#!/usr/bin/env python3
"""
Test script for improved summarization logic
"""
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.text_simplifier import TextSimplifier

def test_improved_summarization():
    """Test the improved summarization logic"""
    
    print("Testing Improved Summarization Logic")
    print("=" * 50)
    
    # Test text
    test_text = """
    Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines capable of performing tasks that typically require human intelligence. These tasks include learning, reasoning, problem-solving, perception, and language understanding. AI systems can be classified into two main categories: narrow AI, which is designed to perform specific tasks, and general AI, which possesses the ability to perform any intellectual task that a human can do.
    
    Machine learning is a subset of AI that focuses on the development of algorithms and statistical models that enable computers to improve their performance on a specific task through experience. Deep learning, a subset of machine learning, uses artificial neural networks with multiple layers to model and understand complex patterns in data. These technologies have revolutionized various industries, including healthcare, finance, transportation, and entertainment.
    
    The applications of AI are vast and continue to expand. In healthcare, AI is used for disease diagnosis, drug discovery, and personalized treatment plans. In finance, AI algorithms are employed for fraud detection, risk assessment, and automated trading. In transportation, AI powers self-driving cars and optimizes traffic flow. The entertainment industry uses AI for content recommendation, game development, and creative content generation.
    """
    
    print(f"Original text length: {len(test_text.split())} words")
    print(f"Original text preview: {test_text[:100]}...")
    
    # Test the improved rule-based summarization
    print("\n" + "=" * 50)
    print("Testing Improved Rule-Based Summarization:")
    
    simplifier = TextSimplifier(use_local_api=True)
    
    try:
        # Test the improved rule-based summarization
        summary = simplifier._improved_rule_based_summarization(test_text)
        print(f"\nImproved summary:")
        print(summary)
        print(f"\nSummary length: {len(summary.split())} words")
        
        # Test bullet point conversion
        print("\n" + "=" * 50)
        print("Testing Bullet Point Conversion:")
        
        bullet_summary = simplifier._convert_to_bullet_points(summary)
        print(f"\nBullet point summary:")
        print(bullet_summary)
        
        print("\n" + "=" * 50)
        print("✅ Test completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_improved_summarization() 