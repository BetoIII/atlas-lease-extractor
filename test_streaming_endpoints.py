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
    "/stream-risk-flags",
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

def test_pipeline_sse_get(filename: str = ""):
    """Optional: test the pipeline SSE endpoint via GET (EventSource-style)."""
    base = f"{FLASK_BASE_URL}/stream-lease-flags-pipeline"
    url = f"{base}?filename={filename}" if filename else base
    print(f"\n{'='*60}")
    print(f"Testing: Pipeline SSE (GET)")
    print(f"URL: {url}")
    print(f"{'='*60}")
    try:
        response = requests.get(url, stream=True, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        if response.status_code == 200:
            for i, line in enumerate(response.iter_lines(decode_unicode=True)):
                if line:
                    print(f"  Line {i+1}: {line[:200]}...")
                if i >= 10:
                    print("  ... (truncated)")
                    break
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")

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
    
    # Optional: test pipeline SSE (GET)
    test_pipeline_sse_get()
    
    print(f"\n{'='*60}")
    print("🏁 Testing completed!")
    print(f"{'='*60}")

if __name__ == "__main__":
    main() 