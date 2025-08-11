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
    
    # Check server configuration
    print("\n🖧 Index Server Config:")
    host = os.getenv("INDEX_SERVER_HOST") or "(default 127.0.0.1)"
    port = os.getenv("INDEX_SERVER_PORT") or "(default 5602)"
    key = os.getenv("INDEX_SERVER_KEY")
    print(f"HOST: {host}")
    print(f"PORT: {port}")
    print(f"KEY: {'set' if key else 'not set (will use weak default)'}")

    # Check database URL
    print("\n🗄️  Database:")
    db_url = os.getenv('DATABASE_URL')
    if db_url:
        masked = db_url.split('@')
        print(f"✅ DATABASE_URL: set ({'@'.join(['****'] + masked[1:]) if len(masked) > 1 else 'masked'})")
    else:
        print("❌ DATABASE_URL: Not set")
    
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