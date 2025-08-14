#!/usr/bin/env python3
"""
Test script for AI services file upload functionality
"""

import requests
import os
import tempfile

def test_file_upload():
    """Test the file upload endpoint"""
    
    # AI services URL
    base_url = "http://localhost:8001"
    
    # Create a simple test file
    test_content = "This is a test document with some content to process."
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write(test_content)
        temp_file_path = f.name
    
    try:
        # Test file upload
        with open(temp_file_path, 'rb') as f:
            files = {'file': ('test.txt', f, 'text/plain')}
            data = {
                'difficulty_level': 'intermediate',
                'target_audience': 'student'
            }
            
            print("Testing file upload...")
            response = requests.post(f"{base_url}/process-file", files=files, data=data)
            
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ File upload test passed!")
                print(f"Original text: {result.get('original_text', 'N/A')[:100]}...")
                print(f"Simplified text: {result.get('simplified_text', 'N/A')[:100]}...")
            else:
                print("❌ File upload test failed!")
                
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
    
    finally:
        # Clean up
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

def test_text_simplification():
    """Test the text simplification endpoint"""
    
    base_url = "http://localhost:8001"
    
    test_text = "The quantum mechanical properties of subatomic particles exhibit wave-particle duality, which is a fundamental concept in modern physics."
    
    data = {
        'text': test_text,
        'difficulty_level': 'beginner',
        'target_audience': 'student'
    }
    
    try:
        print("Testing text simplification...")
        response = requests.post(f"{base_url}/simplify", json=data)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Text simplification test passed!")
            print(f"Original: {result.get('original_text', 'N/A')}")
            print(f"Simplified: {result.get('simplified_text', 'N/A')}")
        else:
            print(f"❌ Text simplification test failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")

def test_health_check():
    """Test the health check endpoint"""
    
    base_url = "http://localhost:8001"
    
    try:
        print("Testing health check...")
        response = requests.get(f"{base_url}/health")
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Health check test passed!")
            print(f"Status: {result.get('status', 'N/A')}")
            print(f"Services: {result.get('services', {})}")
        else:
            print(f"❌ Health check test failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")

if __name__ == "__main__":
    print("🧪 Testing AI Services...")
    print("=" * 50)
    
    test_health_check()
    print()
    
    test_text_simplification()
    print()
    
    test_file_upload()
    print()
    
    print("🏁 Testing completed!") 