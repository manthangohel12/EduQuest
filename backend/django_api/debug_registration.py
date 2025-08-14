#!/usr/bin/env python
import os
import sys
import django
import json

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eduquest.settings')
django.setup()

from users.serializers import UserRegistrationSerializer

# Test with the exact data the frontend might be sending
test_cases = [
    {
        'email': 'testuser6@example.com',
        'password': 'testpass123',
        'password_confirm': 'testpass123',
        'first_name': 'Test',
        'last_name': 'User'
    },
    {
        'email': 'testuser7@example.com',
        'password': 'testpass123',
        'password_confirm': 'testpass123',
        'first_name': 'Test',
        'last_name': 'User',
        'username': 'testuser7'  # In case frontend is still sending username
    }
]

for i, test_data in enumerate(test_cases):
    print(f"\n--- Test Case {i+1} ---")
    print(f"Input data: {json.dumps(test_data, indent=2)}")
    
    serializer = UserRegistrationSerializer(data=test_data)
    if serializer.is_valid():
        print("✅ Serializer is valid!")
        try:
            user = serializer.save()
            print(f"✅ User created: {user.email}")
        except Exception as e:
            print(f"❌ Error creating user: {e}")
    else:
        print("❌ Serializer validation failed:")
        print(json.dumps(serializer.errors, indent=2)) 