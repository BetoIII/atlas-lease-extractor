#!/usr/bin/env python3
"""
Test script for the Key Terms Extractor
Demonstrates both command-line and API usage
"""

import os
import sys
import requests
import json
from pathlib import Path

# Configuration
FLASK_URL = "http://localhost:5601"
TEST_FILE_PATH = "data/2019-2022-Lease-Agreement-TETCO-Signed-tiny.pdf"

def test_cli_extraction():
    """Test the command-line interface"""
    print("=== Testing CLI Extraction ===")
    print(f"File: {TEST_FILE_PATH}\n")
    
    if not os.path.exists(TEST_FILE_PATH):
        print(f"❌ Test file not found: {TEST_FILE_PATH}")
        return False
    
    # Run the extractor directly with --save flag to create output file for testing
    exit_code = os.system(f"python key_terms_extractor.py {TEST_FILE_PATH} --save")
    
    if exit_code != 0:
        print("❌ CLI command failed")
        return False
    
    # Check if output file was created
    output_file = f"key_terms_{os.path.basename(TEST_FILE_PATH)}.json"
    if os.path.exists(output_file):
        print(f"\n✅ Output file created: {output_file}")
        with open(output_file, 'r') as f:
            result = json.load(f)
            if result.get("status") == "success":
                print("✅ Extraction successful")
                # Clean up the test file
                os.remove(output_file)
                return True
            else:
                print(f"❌ Extraction failed: {result.get('message', 'Unknown error')}")
                return False
    else:
        print("❌ No output file created")
        return False

def test_api_extraction():
    """Test the non-streaming API endpoint"""
    print("\n=== Testing API Extraction ===")
    print(f"Endpoint: POST {FLASK_URL}/extract-key-terms\n")
    
    if not os.path.exists(TEST_FILE_PATH):
        print(f"❌ Test file not found: {TEST_FILE_PATH}")
        return False
    
    try:
        with open(TEST_FILE_PATH, 'rb') as f:
            files = {'file': (os.path.basename(TEST_FILE_PATH), f, 'application/pdf')}
            response = requests.post(f"{FLASK_URL}/extract-key-terms", files=files, timeout=120)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API extraction successful")
            
            # Display some extracted data
            data = result.get("data", {})
            print(f"\nExtracted Key Terms:")
            print(f"- Property: {data.get('property_address', 'N/A')}")
            print(f"- Tenant: {data.get('tenant_name', 'N/A')}")
            print(f"- Landlord: {data.get('landlord_name', 'N/A')}")
            print(f"- Monthly Rent: {data.get('monthly_rent', 'N/A')}")
            print(f"- Lease Start: {data.get('lease_start_date', 'N/A')}")
            print(f"- Lease End: {data.get('lease_end_date', 'N/A')}")
            
            return True
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Flask server. Make sure it's running on port 5601.")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_streaming_extraction():
    """Test the streaming API endpoint"""
    print("\n=== Testing Streaming Extraction ===")
    print(f"Endpoint: POST {FLASK_URL}/stream-key-terms\n")
    
    if not os.path.exists(TEST_FILE_PATH):
        print(f"❌ Test file not found: {TEST_FILE_PATH}")
        return False
    
    try:
        with open(TEST_FILE_PATH, 'rb') as f:
            files = {'file': (os.path.basename(TEST_FILE_PATH), f, 'application/pdf')}
            response = requests.post(f"{FLASK_URL}/stream-key-terms", files=files, stream=True, timeout=120)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("\nStreaming Events:")
            print("-" * 50)
            
            event_count = 0
            for line in response.iter_lines(decode_unicode=True):
                if line:
                    if line.startswith("event:"):
                        event_type = line.split(":", 1)[1].strip()
                        print(f"\n📡 Event: {event_type}")
                    elif line.startswith("data:"):
                        data = json.loads(line.split(":", 1)[1].strip())
                        status = data.get("status", "unknown")
                        message = data.get("message", "")
                        
                        if status == "connected":
                            print(f"   ✅ {message}")
                        elif status == "streaming":
                            stage = data.get("stage", "")
                            print(f"   🔄 [{stage}] {message}")
                        elif status == "complete":
                            print(f"   ✅ Extraction complete!")
                            # Show some results
                            result_data = data.get("data", {})
                            if result_data:
                                print(f"   - Property: {result_data.get('property_address', 'N/A')}")
                                print(f"   - Tenant: {result_data.get('tenant_name', 'N/A')}")
                        elif status == "error":
                            print(f"   ❌ Error: {data.get('error', 'Unknown error')}")
                        
                        event_count += 1
            
            print("-" * 50)
            print(f"\n✅ Received {event_count} events")
            return True
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Flask server. Make sure it's running on port 5601.")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🧪 Key Terms Extractor Test Suite")
    print("=" * 50)
    
    # Check if test file exists
    if not os.path.exists(TEST_FILE_PATH):
        print(f"❌ Test file not found: {TEST_FILE_PATH}")
        print("Please ensure the test file exists or update TEST_FILE_PATH")
        sys.exit(1)
    
    # Run tests based on command-line arguments
    if len(sys.argv) > 1:
        test_type = sys.argv[1].lower()
        if test_type == "cli":
            success = test_cli_extraction()
        elif test_type == "api":
            success = test_api_extraction()
        elif test_type == "stream":
            success = test_streaming_extraction()
        else:
            print(f"Unknown test type: {test_type}")
            print("Usage: python test_key_terms_extractor.py [cli|api|stream]")
            sys.exit(1)
    else:
        # Run all tests
        cli_success = test_cli_extraction()
        api_success = test_api_extraction()
        stream_success = test_streaming_extraction()
        
        print("\n" + "=" * 50)
        print("📊 Test Summary:")
        print(f"   CLI Extraction: {'✅ PASS' if cli_success else '❌ FAIL'}")
        print(f"   API Extraction: {'✅ PASS' if api_success else '❌ FAIL'}")
        print(f"   Streaming API: {'✅ PASS' if stream_success else '❌ FAIL'}")
        
        success = cli_success and api_success and stream_success
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
