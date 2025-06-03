#!/usr/bin/env python3
"""
Quick test script for LlamaParse RAG Pipeline
Simple script to quickly test document parsing and querying
"""

import os
from rag_pipeline import RAGPipeline

def quick_test():
    print("🔍 Quick LlamaParse RAG Test")
    print("=" * 40)
    
    # Initialize pipeline
    rag = RAGPipeline()
    rag.initialize_index()
    
    # Test with existing document
    test_file = "uploaded_documents/2019-2022-Lease-Agreement-TETCO-Signed-tiny.pdf"
    
    if os.path.exists(test_file):
        print(f"📄 Testing with: {os.path.basename(test_file)}")
        success = rag.handle_file_upload(test_file)
        
        if success:
            print("\n✅ Document processed successfully!")
            print("\n🔍 Testing query...")
            response = rag.query_index("What is the lease term and rental amount?")
            print(f"Response: {response}")
        else:
            print("❌ Document processing failed")
    else:
        print(f"❌ Test file not found: {test_file}")

if __name__ == "__main__":
    quick_test() 