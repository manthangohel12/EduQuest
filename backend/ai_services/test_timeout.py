#!/usr/bin/env python3
"""
Test script to check timeout issues with AI services
"""
import requests
import time
import json

def test_summarization_timeout():
    """Test the summarization endpoint for timeout issues"""
    
    base_url = "http://localhost:8001"
    
    print("Testing Summarization Timeout")
    print("=" * 50)
    
    # Test data - a longer text to see if it causes timeout
    test_text = """
    Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines that work and react like humans. 
    Some of the activities computers with artificial intelligence are designed for include speech recognition, learning, planning, and problem solving.
    
    Machine Learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed. 
    It focuses on the development of computer programs that can access data and use it to learn for themselves.
    
    Deep Learning is a subset of machine learning that uses neural networks with multiple layers to model and understand complex patterns. 
    It has been particularly successful in areas like image recognition, natural language processing, and speech recognition.
    
    Natural Language Processing (NLP) is a field of AI that focuses on the interaction between computers and human language. 
    It involves the development of algorithms and models that can understand, interpret, and generate human language.
    
    Computer Vision is another important field of AI that enables computers to interpret and understand visual information from the world. 
    It involves techniques for acquiring, processing, analyzing, and understanding digital images.
    
    Robotics combines AI with mechanical engineering to create robots that can perform tasks autonomously or semi-autonomously. 
    These robots can be used in manufacturing, healthcare, exploration, and many other fields.
    
    Expert Systems are AI programs that emulate the decision-making ability of a human expert in a specific domain. 
    They use knowledge bases and inference engines to solve complex problems in fields like medicine, engineering, and finance.
    
    Neural Networks are computing systems inspired by biological neural networks. 
    They consist of interconnected nodes (neurons) that process information and can learn to recognize patterns.
    
    Reinforcement Learning is a type of machine learning where an agent learns to make decisions by taking actions in an environment. 
    The agent receives rewards or penalties based on its actions and learns to maximize rewards over time.
    
    Supervised Learning is a type of machine learning where the algorithm learns from labeled training data. 
    The goal is to learn a mapping from inputs to outputs based on example input-output pairs.
    
    Unsupervised Learning is a type of machine learning where the algorithm learns patterns from unlabeled data. 
    The goal is to discover hidden structures or patterns in the data without any predefined labels.
    
    Semi-supervised Learning combines supervised and unsupervised learning approaches. 
    It uses both labeled and unlabeled data to improve learning performance.
    
    Transfer Learning is a technique where a model trained on one task is adapted for a related task. 
    This can significantly reduce the amount of training data and time required for the new task.
    
    Computer Vision is a field of AI that focuses on enabling computers to interpret and understand visual information. 
    It involves techniques for image processing, object recognition, and scene understanding.
    
    Natural Language Generation (NLG) is a subfield of NLP that focuses on generating human-like text from structured data. 
    It's used in applications like automated report generation, chatbots, and content creation.
    
    Speech Recognition is the technology that enables computers to understand and interpret human speech. 
    It's used in applications like voice assistants, transcription services, and hands-free computing.
    
    Computer Vision is a field of AI that focuses on enabling computers to interpret and understand visual information. 
    It involves techniques for image processing, object recognition, and scene understanding.
    
    Natural Language Generation (NLG) is a subfield of NLP that focuses on generating human-like text from structured data. 
    It's used in applications like automated report generation, chatbots, and content creation.
    
    Speech Recognition is the technology that enables computers to understand and interpret human speech. 
    It's used in applications like voice assistants, transcription services, and hands-free computing.
    """
    
    test_data = {
        "text": test_text,
        "max_length": 300,
        "style": "bullet_points",
        "temperature": 0.3
    }
    
    try:
        print("1. Testing health endpoint...")
        health_response = requests.get(f"{base_url}/health", timeout=10)
        print(f"Health status: {health_response.status_code}")
        
        if health_response.status_code == 200:
            print("✅ AI services are running")
            
            print("\n2. Testing summarization endpoint...")
            print(f"Text length: {len(test_text)} characters")
            print("Starting summarization request...")
            
            start_time = time.time()
            
            # Test with different timeouts
            for timeout in [30, 45, 60]:
                print(f"\nTrying with {timeout} second timeout...")
                try:
                    response = requests.post(
                        f"{base_url}/summarize",
                        json=test_data,
                        headers={'Content-Type': 'application/json'},
                        timeout=timeout
                    )
                    
                    end_time = time.time()
                    duration = end_time - start_time
                    
                    print(f"Response status: {response.status_code}")
                    print(f"Request duration: {duration:.2f} seconds")
                    
                    if response.status_code == 200:
                        result = response.json()
                        print("✅ Summarization successful!")
                        print(f"Summary length: {len(result.get('summary', ''))} characters")
                        print(f"Processing time: {result.get('processing_time', 'N/A')} seconds")
                        print(f"Success: {result.get('success', 'N/A')}")
                        
                        # Show first 200 characters of summary
                        summary = result.get('summary', '')
                        if summary:
                            print(f"Summary preview: {summary[:200]}...")
                        
                        break
                    else:
                        print(f"❌ Request failed with status {response.status_code}")
                        print(f"Response: {response.text}")
                        
                except requests.exceptions.Timeout:
                    print(f"❌ Request timed out after {timeout} seconds")
                    if timeout == 60:
                        print("⚠️ Even 60 seconds wasn't enough. The AI service might be overloaded.")
                except Exception as e:
                    print(f"❌ Error: {e}")
                    
        else:
            print("❌ AI services are not responding properly")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to AI services. Make sure they're running on port 8001.")
    except Exception as e:
        print(f"❌ Error during testing: {e}")

if __name__ == "__main__":
    test_summarization_timeout() 