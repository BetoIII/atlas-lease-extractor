#!/usr/bin/env python3
"""
Test script for the Flask streaming endpoints.
This script tests the streaming lease flags extraction endpoints.
"""

import requests
import json
import time
import sys

# Configuration
FLASK_BASE_URL = "http://localhost:5601"
TEST_ENDPOINTS = [
    "/stream-lease-flags",
    "/stream-lease-flags-sse", 
    "/extract-lease-flags-streaming"
]

def test_streaming_endpoint(endpoint_url, test_name):
    """Test a streaming endpoint."""
    print(f"\n{'='*60}")
    print(f"Testing: {test_name}")
    print(f"URL: {endpoint_url}")
    print(f"{'='*60}")
    
    try:
        # Test with no file (analyze all indexed documents)
        response = requests.post(
            endpoint_url,
            json={},
            headers={'Content-Type': 'application/json'},
            stream=True,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("\n📡 Streaming Response:")
            print("-" * 40)
            
            if 'text/event-stream' in response.headers.get('content-type', ''):
                # Handle SSE format
                for line in response.iter_lines(decode_unicode=True):
                    if line:
                        print(f"Raw line: {line}")
                        if line.startswith('data: '):
                            try:
                                data = json.loads(line[6:])  # Remove 'data: ' prefix
                                print(f"Parsed data: {json.dumps(data, indent=2)}")
                                if data.get('is_complete'):
                                    print("✅ Stream completed!")
                                    break
                            except json.JSONDecodeError as e:
                                print(f"❌ JSON decode error: {e}")
                        elif line.startswith('event: '):
                            print(f"Event type: {line[7:]}")
            else:
                # Handle plain text streaming
                for line in response.iter_lines(decode_unicode=True):
                    if line:
                        print(f"Raw line: {line}")
                        if line.startswith('data: '):
                            try:
                                data = json.loads(line[6:])  # Remove 'data: ' prefix
                                print(f"Parsed data: {json.dumps(data, indent=2)}")
                                if data.get('is_complete'):
                                    print("✅ Stream completed!")
                                    break
                            except json.JSONDecodeError as e:
                                print(f"❌ JSON decode error: {e}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def test_non_streaming_endpoint():
    """Test the non-streaming endpoint for comparison."""
    endpoint_url = f"{FLASK_BASE_URL}/extract-lease-flags-streaming"
    print(f"\n{'='*60}")
    print(f"Testing: Non-streaming endpoint (for comparison)")
    print(f"URL: {endpoint_url}")
    print(f"{'='*60}")
    
    try:
        response = requests.post(
            endpoint_url,
            json={},
            headers={'Content-Type': 'application/json'},
            timeout=60
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Non-streaming response received:")
            print(json.dumps(data, indent=2))
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def test_flask_server_health():
    """Test if Flask server is running."""
    try:
        response = requests.get(f"{FLASK_BASE_URL}/", timeout=5)
        if response.status_code == 200:
            print("✅ Flask server is running")
            return True
        else:
            print(f"❌ Flask server returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to Flask server: {e}")
        return False

def main():
    print("🚀 Testing Flask Streaming Endpoints")
    print(f"Base URL: {FLASK_BASE_URL}")
    
    # Check if Flask server is running
    if not test_flask_server_health():
        print("\n❌ Flask server is not accessible. Please ensure:")
        print("1. Flask server is running on localhost:5601")
        print("2. CORS is properly configured")
        print("3. No firewall blocking the connection")
        sys.exit(1)
    
    # Test each streaming endpoint
    for endpoint in TEST_ENDPOINTS:
        endpoint_url = f"{FLASK_BASE_URL}{endpoint}"
        test_name = endpoint.replace("/", "").replace("-", " ").title()
        test_streaming_endpoint(endpoint_url, test_name)
        time.sleep(2)  # Brief pause between tests
    
    # Test non-streaming endpoint
    test_non_streaming_endpoint()
    
    print(f"\n{'='*60}")
    print("🏁 Testing completed!")
    print(f"{'='*60}")

if __name__ == "__main__":
    main() 