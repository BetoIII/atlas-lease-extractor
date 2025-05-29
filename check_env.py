#!/usr/bin/env python3
"""
Environment checker for LlamaParse RAG Pipeline
Verifies all required dependencies and API keys are available
"""

import os
from dotenv import load_dotenv

def check_environment():
    print("🔧 Environment Check for LlamaParse RAG Pipeline")
    print("=" * 50)
    
    # Load environment variables
    load_dotenv()
    
    # Check API keys
    print("\n🔑 API Keys:")
    api_keys = ["LLAMA_CLOUD_API_KEY", "OPENAI_API_KEY"]
    
    for key in api_keys:
        value = os.environ.get(key)
        if value:
            print(f"✅ {key}: {'*' * (len(value) - 4) + value[-4:]}")
        else:
            print(f"❌ {key}: Not set")
    
    # Check Python packages
    print("\n📦 Package Dependencies:")
    packages = [
        "llama_parse",
        "llama_index",
        "llama_cloud_services", 
        "openai",
        "chromadb",
        "python-dotenv"
    ]
    
    for package in packages:
        try:
            __import__(package.replace("-", "_"))
            print(f"✅ {package}: Installed")
        except ImportError:
            print(f"❌ {package}: Not installed")
    
    # Check directories
    print("\n📁 Directories:")
    dirs = ["uploaded_documents", "chroma_db", "persist_dir"]
    
    for dir_name in dirs:
        if os.path.exists(dir_name):
            print(f"✅ {dir_name}: Exists")
        else:
            print(f"⚠️  {dir_name}: Will be created when needed")
    
    # Check test files
    print("\n📄 Test Files:")
    test_files = [
        "uploaded_documents/2019-2022-Lease-Agreement-TETCO-Signed-tiny.pdf",
        "uploaded_documents/2019-2022-Lease-Agreement-TETCO-Signed-condensed.pdf"
    ]
    
    for file_path in test_files:
        if os.path.exists(file_path):
            size = os.path.getsize(file_path)
            print(f"✅ {os.path.basename(file_path)}: {size:,} bytes")
        else:
            print(f"❌ {os.path.basename(file_path)}: Not found")

if __name__ == "__main__":
    check_environment() 