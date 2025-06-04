#!/usr/bin/env python3
"""
Test script for the refactored lease flags extractor.
This demonstrates how to use the streaming lease flags extraction.
"""

import json
import time
from lease_flags.lease_flags_extractor import LeaseFlagsExtractor, stream_lease_flags_extraction, extract_lease_flags_from_document

def test_streaming_extraction():
    """Test the streaming lease flags extraction."""
    print("=== Testing Streaming Lease Flags Extraction ===")
    print("Starting extraction...")
    
    try:
        for response in stream_lease_flags_extraction():
            if response["status"] == "streaming":
                print("📡 Streaming response received:")
                print(json.dumps(response["data"], indent=2))
                print("-" * 50)
            elif response["status"] == "complete":
                print("✅ Final response received:")
                print(json.dumps(response["data"], indent=2))
                break
            elif response["status"] == "error":
                print(f"❌ Error: {response['error']}")
                break
            
            # Small delay to simulate real-time processing
            time.sleep(0.1)
            
    except Exception as e:
        print(f"❌ Exception during streaming: {str(e)}")

def test_non_streaming_extraction():
    """Test the non-streaming lease flags extraction."""
    print("\n=== Testing Non-Streaming Lease Flags Extraction ===")
    
    try:
        result = extract_lease_flags_from_document()
        print("✅ Extraction completed:")
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"❌ Exception during extraction: {str(e)}")

def test_specific_document_extraction():
    """Test extraction for a specific document."""
    print("\n=== Testing Specific Document Extraction ===")
    
    # Example filename - replace with actual filename from your indexed documents
    filename = "lease_agreement.pdf"
    
    try:
        print(f"Extracting flags from: {filename}")
        for response in stream_lease_flags_extraction(filename):
            if response["status"] == "complete":
                print("✅ Document-specific extraction completed:")
                print(json.dumps(response["data"], indent=2))
                break
            elif response["status"] == "error":
                print(f"❌ Error: {response['error']}")
                break
    except Exception as e:
        print(f"❌ Exception during document-specific extraction: {str(e)}")

def test_extractor_class_directly():
    """Test using the LeaseFlagsExtractor class directly."""
    print("\n=== Testing LeaseFlagsExtractor Class Directly ===")
    
    try:
        extractor = LeaseFlagsExtractor()
        print("✅ Extractor initialized successfully")
        
        # Test streaming
        print("Testing streaming method...")
        count = 0
        for response in extractor.extract_lease_flags_streaming():
            count += 1
            print(f"Response {count}: {response['status']}")
            if response["is_complete"]:
                print("Final response data:")
                print(json.dumps(response["data"], indent=2))
                break
            if count > 10:  # Prevent infinite loop
                print("Stopping after 10 responses...")
                break
                
    except Exception as e:
        print(f"❌ Exception with extractor class: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Lease Flags Extractor Tests")
    print("=" * 60)
    
    # Run all tests
    test_streaming_extraction()
    test_non_streaming_extraction()
    test_specific_document_extraction()
    test_extractor_class_directly()
    
    print("\n" + "=" * 60)
    print("�� Tests completed!") 