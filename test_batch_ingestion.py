#!/usr/bin/env python3
"""
Test script for improved LlamaCloud batch ingestion
Tests the new batch ingestion methods that should avoid timeouts
"""

import os
from rag_pipeline import RAGPipeline

def test_batch_ingestion():
    """Test the improved batch ingestion methods"""
    print("🔬 Testing Improved Batch Ingestion...")
    print("=" * 60)
    
    # Check environment variables
    if not os.environ.get('LLAMA_CLOUD_API_KEY'):
        print('❌ LLAMA_CLOUD_API_KEY not set')
        return False
    
    if not os.environ.get('OPENAI_API_KEY'):
        print('❌ OPENAI_API_KEY not set')
        return False
    
    print('✅ Environment variables are set')
    
    # Initialize pipeline
    try:
        rag = RAGPipeline()
        rag.initialize_index()
        print('✅ Pipeline initialized and connected to LlamaCloud')
    except Exception as e:
        print(f'❌ Pipeline initialization failed: {e}')
        return False
    
    # Test with existing documents
    upload_folder = "uploaded_documents"
    if os.path.exists(upload_folder):
        file_paths = []
        for filename in os.listdir(upload_folder):
            file_path = os.path.join(upload_folder, filename)
            if os.path.isfile(file_path):
                file_paths.append(file_path)
        
        if file_paths:
            print(f"\n📂 Found {len(file_paths)} files to test:")
            for file_path in file_paths:
                print(f"   - {os.path.basename(file_path)}")
            
            try:
                print(f"\n🔄 Testing batch ingestion with improved methods...")
                
                # Parse documents
                documents = rag.parse_documents(file_paths)
                
                if documents:
                    # Test batch ingestion
                    result = rag.ingest_documents(documents, "batch_test")
                    
                    if result["successful"] > 0:
                        print("✅ Batch ingestion test passed!")
                        print(f"   📊 Results: {result['successful']} successful, {result['failed']} failed")
                        return True
                    else:
                        print("❌ Batch ingestion test failed - no documents processed")
                        return False
                else:
                    print("❌ No documents were parsed")
                    return False
                    
            except Exception as e:
                print(f"❌ Batch ingestion test failed: {e}")
                return False
        else:
            print(f"📂 No files found in {upload_folder} for testing")
            print("💡 Add some test files to the uploaded_documents folder")
            return False
    else:
        print(f"📂 Upload folder {upload_folder} doesn't exist")
        return False

if __name__ == "__main__":
    success = test_batch_ingestion()
    if success:
        print("\n🎉 All tests passed! The improved ingestion methods should resolve timeout issues.")
    else:
        print("\n❌ Tests failed. Please check the configuration.")
    exit(0 if success else 1) 