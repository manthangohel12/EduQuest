#!/usr/bin/env python3
"""
Comparison script to show the difference between old and new summarization approaches
"""
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def old_rule_based_summarization(text: str) -> str:
    """Old rule-based summarization approach"""
    import re
    # Simple extractive summarization
    sentences = re.split(r'[.!?]+', text)
    # Take first few sentences as summary
    summary_sentences = sentences[:3]
    return '. '.join(summary_sentences) + '.'

def improved_rule_based_summarization(text: str) -> str:
    """Improved rule-based summarization approach"""
    import re
    try:
        # Split into sentences
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if len(sentences) <= 3:
            return text
        
        # Score sentences based on importance (simple heuristics)
        sentence_scores = []
        for sentence in sentences:
            score = 0
            words = sentence.lower().split()
            
            # Score based on length (medium length sentences are often more important)
            if 10 <= len(words) <= 25:
                score += 2
            elif 5 <= len(words) <= 35:
                score += 1
            
            # Score based on keyword presence
            important_words = ['important', 'key', 'main', 'primary', 'essential', 'critical', 'significant', 'major']
            for word in important_words:
                if word in sentence.lower():
                    score += 3
            
            # Score based on position (first and last sentences are often important)
            if sentences.index(sentence) < 2 or sentences.index(sentence) > len(sentences) - 3:
                score += 1
            
            sentence_scores.append((sentence, score))
        
        # Sort by score and take top sentences
        sentence_scores.sort(key=lambda x: x[1], reverse=True)
        top_sentences = sentence_scores[:min(5, len(sentence_scores))]
        
        # Sort back to original order
        top_sentences.sort(key=lambda x: sentences.index(x[0]))
        
        summary = '. '.join([s[0] for s in top_sentences]) + '.'
        return summary
        
    except Exception as e:
        print(f"Improved rule-based summarization failed: {e}")
        return old_rule_based_summarization(text)

def compare_summarization():
    """Compare old vs new summarization approaches"""
    
    test_text = """
    Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines capable of performing tasks that typically require human intelligence. These tasks include learning, reasoning, problem-solving, perception, and language understanding. AI systems can be classified into two main categories: narrow AI, which is designed to perform specific tasks, and general AI, which possesses the ability to perform any intellectual task that a human can do.
    
    Machine learning is a subset of AI that focuses on the development of algorithms and statistical models that enable computers to improve their performance on a specific task through experience. Deep learning, a subset of machine learning, uses artificial neural networks with multiple layers to model and understand complex patterns in data. These technologies have revolutionized various industries, including healthcare, finance, transportation, and entertainment.
    
    The applications of AI are vast and continue to expand. In healthcare, AI is used for disease diagnosis, drug discovery, and personalized treatment plans. In finance, AI algorithms are employed for fraud detection, risk assessment, and automated trading. In transportation, AI powers self-driving cars and optimizes traffic flow. The entertainment industry uses AI for content recommendation, game development, and creative content generation.
    """
    
    print("Comparing Old vs New Summarization Approaches")
    print("=" * 60)
    print(f"Original text length: {len(test_text.split())} words")
    print(f"Original text preview: {test_text[:100]}...")
    
    print("\n" + "=" * 60)
    print("OLD APPROACH (Simple extractive):")
    print("=" * 60)
    old_summary = old_rule_based_summarization(test_text)
    print(old_summary)
    print(f"\nLength: {len(old_summary.split())} words")
    
    print("\n" + "=" * 60)
    print("NEW APPROACH (Intelligent scoring):")
    print("=" * 60)
    new_summary = improved_rule_based_summarization(test_text)
    print(new_summary)
    print(f"\nLength: {len(new_summary.split())} words")
    
    print("\n" + "=" * 60)
    print("BULLET POINT VERSION:")
    print("=" * 60)
    
    # Convert to bullet points
    sentences = new_summary.split('. ')
    bullet_points = []
    for sentence in sentences:
        if sentence.strip():
            bullet_points.append(f"• {sentence.strip()}")
    
    bullet_summary = '\n'.join(bullet_points)
    print(bullet_summary)
    
    print("\n" + "=" * 60)
    print("✅ Comparison completed!")

if __name__ == "__main__":
    compare_summarization() 