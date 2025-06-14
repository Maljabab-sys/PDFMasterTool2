#!/usr/bin/env python3
"""
Test script to test profile update functionality
"""

import requests
import json

BASE_URL = "http://localhost:5001"

def test_profile_update():
    # Test user credentials
    email = "test@example.com"
    password = "password123"
    
    print("Testing profile update functionality...")
    
    # 1. Login to get token
    print("1. Logging in...")
    login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": email,
        "password": password
    })
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.status_code} - {login_response.text}")
        return
    
    login_data = login_response.json()
    token = login_data["token"]
    print(f"Login successful! Token: {token[:50]}...")
    
    # 2. Test profile update
    print("2. Testing profile update...")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    profile_data = {
        "fullName": "Test User Updated",
        "email": "test@example.com",
        "profileImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "clinics": ["Test Clinic 1", "Test Clinic 2"],
        "notifications": True
    }
    
    update_response = requests.put(f"{BASE_URL}/api/auth/profile", 
                                 json=profile_data, 
                                 headers=headers)
    
    print(f"Profile update response: {update_response.status_code}")
    print(f"Response body: {update_response.text}")
    
    if update_response.status_code == 200:
        print("✅ Profile update successful!")
        updated_user = update_response.json()
        print(f"Updated user data: {json.dumps(updated_user, indent=2)}")
    else:
        print(f"❌ Profile update failed: {update_response.status_code}")

if __name__ == "__main__":
    test_profile_update() 