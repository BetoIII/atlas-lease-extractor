#!/usr/bin/env python3
"""
Test script to verify the risk flag extraction endpoints work correctly.
Tests both /extract-risk-flags and /stream-risk-flags endpoints.
"""

import requests
import json
import time
import os

# Flask server configuration
FLASK_URL = "http://localhost:5601"
TEST_FILE_PATH = "uploaded_documents/sample_lease.txt"

def test_extract_risk_flags_endpoint():
    """Test the /extract-risk-flags endpoint (for Try It Now page)."""
    print("Testing /extract-risk-flags endpoint...")
    print("-" * 50)
    
    if not os.path.exists(TEST_FILE_PATH):
        print(f"Error: Test file not found: {TEST_FILE_PATH}")
        return False
    
    url = f"{FLASK_URL}/extract-risk-flags"
    
    try:
        with open(TEST_FILE_PATH, 'rb') as f:
            files = {'file': (os.path.basename(TEST_FILE_PATH), f, 'text/plain')}
            response = requests.post(url, files=files, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}...")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                print("✅ /extract-risk-flags endpoint working correctly")
                return True
            else:
                print(f"❌ Endpoint returned error: {data.get('message', 'Unknown error')}")
                return False
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Flask server. Make sure it's running on port 5601.")
        return False
    except Exception as e:
        print(f"❌ Error testing endpoint: {str(e)}")
        return False

def test_stream_risk_flags_endpoint():
    """Test the /stream-risk-flags endpoint (for streaming demo)."""
    print("\nTesting /stream-risk-flags endpoint...")
    print("-" * 50)
    
    if not os.path.exists(TEST_FILE_PATH):
        print(f"Error: Test file not found: {TEST_FILE_PATH}")
        return False
    
    url = f"{FLASK_URL}/stream-risk-flags"
    
    try:
        with open(TEST_FILE_PATH, 'rb') as f:
            files = {'file': (os.path.basename(TEST_FILE_PATH), f, 'text/plain')}
            response = requests.post(url, files=files, stream=True, timeout=60)
        
        print(f"Status Code: {response.status_code}")
        print("Streaming response:")
        
        if response.status_code == 200:
            for i, line in enumerate(response.iter_lines(decode_unicode=True)):
                if line:
                    print(f"  Line {i+1}: {line[:100]}...")
                    if i >= 10:  # Limit output for testing
                        print("  ... (truncated)")
                        break
            
            print("✅ /stream-risk-flags endpoint responding correctly")
            return True
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Flask server. Make sure it's running on port 5601.")
        return False
    except Exception as e:
        print(f"❌ Error testing endpoint: {str(e)}")
        return False

def test_endpoints_with_existing_file():
    """Test endpoints using filename parameter instead of file upload."""
    print("\nTesting endpoints with existing file...")
    print("-" * 50)
    
    # Test /stream-risk-flags with filename parameter
    url = f"{FLASK_URL}/stream-risk-flags"
    data = {"filename": "sample_lease.txt"}
    
    try:
        response = requests.post(url, json=data, stream=True, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Filename-based streaming works")
            return True
        else:
            print(f"Response: {response.text[:200]}...")
            return False
            
    except Exception as e:
        print(f"❌ Error testing filename-based endpoint: {str(e)}")
        return False

def main():
    """Run all endpoint tests."""
    print("Risk Flag Extraction Endpoints Test")
    print("=" * 50)
    
    # Check if test file exists
    if not os.path.exists(TEST_FILE_PATH):
        print(f"❌ Test file not found: {TEST_FILE_PATH}")
        print("Please make sure the sample lease document exists.")
        return
    
    print(f"✅ Test file found: {TEST_FILE_PATH}")
    print(f"📄 File size: {os.path.getsize(TEST_FILE_PATH)} bytes")
    
    # Run tests
    results = []
    results.append(test_extract_risk_flags_endpoint())
    results.append(test_stream_risk_flags_endpoint())
    results.append(test_endpoints_with_existing_file())
    
    # Summary
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(results)
    total = len(results)
    
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! Both endpoints are working correctly.")
    else:
        print("⚠️  Some tests failed. Check the Flask server and API keys.")
        print("\nTroubleshooting:")
        print("1. Make sure Flask server is running: python3 flask_server.py")
        print("2. Check that OPENAI_API_KEY is set in environment")
        print("3. Verify uploaded_documents directory exists with sample_lease.txt")

if __name__ == "__main__":
    main()