#!/usr/bin/env python3
"""
Test script for the LlamaParse-enabled RAG Pipeline
This script demonstrates how to:
1. Initialize the RAG pipeline with LlamaParse
2. Upload and parse documents
3. Query the index
4. View parsing results
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag_pipeline import RAGPipeline

def check_environment():
    """Check if required environment variables are set"""
    load_dotenv()
    
    required_vars = ["LLAMA_CLOUD_API_KEY", "OPENAI_API_KEY"]
    missing_vars = []
    
    for var in required_vars:
        if not os.environ.get(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease set these variables in your .env file or environment.")
        return False
    
    print("✅ All required environment variables are set")
    return True

def test_file_upload(rag_pipeline, file_path):
    """Test uploading and parsing a single file"""
    print(f"\n{'='*60}")
    print(f"🔍 Testing file upload: {os.path.basename(file_path)}")
    print(f"{'='*60}")
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return False
    
    print(f"📁 File size: {os.path.getsize(file_path):,} bytes")
    print(f"📄 Starting LlamaParse processing...")
    
    try:
        success = rag_pipeline.handle_file_upload(file_path)
        if success:
            print("✅ File upload and parsing completed successfully!")
            return True
        else:
            print("❌ File upload failed")
            return False
    except Exception as e:
        print(f"❌ Error during file upload: {str(e)}")
        return False

def test_queries(rag_pipeline):
    """Test various queries against the indexed documents"""
    print(f"\n{'='*60}")
    print("🤖 Testing Query Functionality")
    print(f"{'='*60}")
    
    test_queries = [
        "What is the lease term?",
        "What are the key dates mentioned in this lease?",
        "What is the rental amount?",
        "Who are the parties involved in this lease agreement?",
        "What are the main terms and conditions?",
        "Are there any escalation clauses?"
    ]
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n📝 Query {i}: {query}")
        print("-" * 50)
        
        try:
            response = rag_pipeline.query_index(query)
            print(f"🔍 Response: {response[:300]}...")
            if len(response) > 300:
                print(f"   (Response truncated - full length: {len(response)} characters)")
        except Exception as e:
            print(f"❌ Query failed: {str(e)}")

def test_background_indexing(rag_pipeline):
    """Test background indexing of existing documents"""
    print(f"\n{'='*60}")
    print("📚 Testing Background Indexing")
    print(f"{'='*60}")
    
    try:
        rag_pipeline.background_index_existing_documents()
        print("✅ Background indexing completed!")
    except Exception as e:
        print(f"❌ Background indexing failed: {str(e)}")

def main():
    """Main test function"""
    print("🚀 Starting LlamaParse RAG Pipeline Tests")
    print("=" * 60)
    
    # Check environment variables
    if not check_environment():
        return
    
    # Initialize the RAG pipeline
    print("\n🔧 Initializing RAG Pipeline...")
    try:
        rag_pipeline = RAGPipeline()
        print("✅ RAG Pipeline initialized successfully!")
        print(f"📁 Upload folder: {rag_pipeline.upload_folder}")
        print(f"🔧 LlamaParse configured with API key: {'***' + rag_pipeline.parser.api_key[-4:] if rag_pipeline.parser.api_key else 'Not set'}")
    except Exception as e:
        print(f"❌ Failed to initialize RAG Pipeline: {str(e)}")
        return
    
    # Initialize the index
    print("\n🔍 Initializing LlamaCloud Index...")
    try:
        rag_pipeline.initialize_index()
        print("✅ LlamaCloud Index initialized successfully!")
    except Exception as e:
        print(f"❌ Failed to initialize index: {str(e)}")
        return
    
    # Test with existing documents in uploaded_documents folder
    uploaded_docs_dir = "uploaded_documents"
    if os.path.exists(uploaded_docs_dir):
        existing_files = [f for f in os.listdir(uploaded_docs_dir) 
                         if os.path.isfile(os.path.join(uploaded_docs_dir, f))]
        
        if existing_files:
            print(f"\n📂 Found {len(existing_files)} existing documents:")
            for file in existing_files:
                print(f"   - {file}")
            
            # Test background indexing
            test_background_indexing(rag_pipeline)
        else:
            print(f"\n📂 No existing documents found in {uploaded_docs_dir}")
    
    # Test file upload with a specific file (if it exists)
    test_file_path = "uploaded_documents/2019-2022-Lease-Agreement-TETCO-Signed-tiny.pdf"
    if os.path.exists(test_file_path):
        test_file_upload(rag_pipeline, test_file_path)
    else:
        print(f"\n⚠️  Test file not found: {test_file_path}")
        print("You can add a PDF file to test with by placing it in the uploaded_documents folder")
    
    # Test queries
    test_queries(rag_pipeline)
    
    print(f"\n{'='*60}")
    print("🎉 Test completed!")
    print("=" * 60)

if __name__ == "__main__":
    main() 