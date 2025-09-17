#!/usr/bin/env python3
"""
Test script for local model configuration with key terms extractor
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_local_model():
    """Test the local model configuration"""
    
    # Set environment variables for local model
    os.environ["LLM_PROVIDER"] = "ollama"
    os.environ["LLM_MODEL"] = "llama3.1:8b"
    os.environ["LLM_TEMPERATURE"] = "0.1"
    os.environ["LLM_MAX_TOKENS"] = "2048"
    os.environ["LLM_STREAMING"] = "false"  # Disable streaming for local models
    os.environ["OLLAMA_BASE_URL"] = "http://localhost:11434"
    
    # Optional: Use local embeddings too
    os.environ["EMBED_PROVIDER"] = "huggingface"
    os.environ["EMBED_MODEL"] = "BAAI/bge-small-en-v1.5"
    
    print("🧪 Testing local model configuration...")
    print(f"LLM_PROVIDER: {os.getenv('LLM_PROVIDER')}")
    print(f"LLM_MODEL: {os.getenv('LLM_MODEL')}")
    print(f"LLM_STREAMING: {os.getenv('LLM_STREAMING')}")
    print(f"OLLAMA_BASE_URL: {os.getenv('OLLAMA_BASE_URL')}")
    print(f"EMBED_PROVIDER: {os.getenv('EMBED_PROVIDER')}")
    print("-" * 50)
    
    try:
        # Import and test the key terms extractor
        from key_terms_extractor import KeyTermsExtractor
        
        # Test with a document
        test_file = "data/2019-2022-Lease-Agreement-TETCO-Signed-tiny.pdf"
        if os.path.exists(test_file):
            extractor = KeyTermsExtractor()
            print(f"✅ Extractor initialized successfully")
            print(f"🧪 Testing extraction with: {test_file}")
            
            result = extractor.process_document(test_file)
            
            if result.get("status") == "success":
                print("✅ Local model extraction successful!")
                data = result.get("data", {})
                property_info = data.get("property_info", {})
                print(f"🏢 Property: {property_info.get('property_address', 'N/A')}")
            else:
                print(f"❌ Extraction failed: {result.get('message', 'Unknown error')}")
        else:
            print(f"⚠️  Test file not found: {test_file}")
            print("Please ensure you have a test PDF in the data/ directory")
            
    except Exception as e:
        print(f"❌ Error testing local model: {str(e)}")
        print("\nTroubleshooting:")
        print("1. Make sure Ollama is running: ollama serve")
        print("2. Make sure the model is installed: ollama pull llama3.1:8b")
        print("3. Check if Ollama is accessible: curl http://localhost:11434/api/tags")
        return False
    
    return True

if __name__ == "__main__":
    test_local_model()
