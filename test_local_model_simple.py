#!/usr/bin/env python3
"""
Simplified test for local model - tests direct Ollama integration without RAG
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_simple_ollama():
    """Test direct Ollama integration without RAG complexity"""
    
    # Set environment variables for local model
    os.environ["LLM_PROVIDER"] = "ollama"
    os.environ["LLM_MODEL"] = "llama3.1:8b"
    os.environ["LLM_TEMPERATURE"] = "0.1"
    os.environ["LLM_MAX_TOKENS"] = "512"  # Much smaller for testing
    os.environ["LLM_STREAMING"] = "false"
    os.environ["OLLAMA_BASE_URL"] = "http://localhost:11434"
    
    print("🧪 Testing simple Ollama integration...")
    print(f"LLM_PROVIDER: {os.getenv('LLM_PROVIDER')}")
    print(f"LLM_MODEL: {os.getenv('LLM_MODEL')}")
    print("-" * 50)
    
    try:
        # Test direct LLM connection
        from llama_index.llms.ollama import Ollama
        
        # Create simple LLM instance
        llm = Ollama(
            model="llama3.1:8b",
            temperature=0.1,
            request_timeout=60.0,  # 1 minute timeout
            base_url="http://localhost:11434",
            additional_kwargs={
                "num_predict": 512,
                "num_ctx": 2048,
            }
        )
        
        print("✅ Ollama LLM initialized")
        
        # Test simple completion
        print("🧪 Testing simple completion...")
        response = llm.complete("What is the capital of Texas?")
        print(f"✅ Response: {response.text[:100]}...")
        
        # Test with a slightly longer prompt
        print("🧪 Testing lease-related prompt...")
        lease_prompt = """
        Given the following text from a lease document:
        
        "The tenant, ABC Corp, agrees to lease Suite 100 at 123 Main St for $2000 per month."
        
        Extract the tenant name, address, and rent amount in JSON format.
        """
        
        response = llm.complete(lease_prompt)
        print(f"✅ Lease extraction response: {response.text[:200]}...")
        
        print("✅ Simple Ollama test successful!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing simple Ollama: {str(e)}")
        print("\nTroubleshooting:")
        print("1. Check if Ollama is running: curl http://localhost:11434/api/tags")
        print("2. Try restarting Ollama: pkill ollama && ollama serve")
        print("3. Check model availability: ollama list")
        return False

if __name__ == "__main__":
    test_simple_ollama()