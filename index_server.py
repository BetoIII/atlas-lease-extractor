import sys
import threading
import os
from multiprocessing.managers import BaseManager
from rag_pipeline import RAGPipeline

# Server configuration
INDEX_SERVER_HOST = os.getenv("INDEX_SERVER_HOST", "127.0.0.1")
INDEX_SERVER_PORT = int(os.getenv("INDEX_SERVER_PORT", "5602"))
INDEX_SERVER_KEY = os.getenv("INDEX_SERVER_KEY", "change-me").encode()

# Global RAG pipeline instance - initialized on first use
rag_pipeline = None
pipeline_lock = threading.Lock()

def ensure_pipeline():
    """Lazy initialization of RAG pipeline on first use"""
    global rag_pipeline
    
    if rag_pipeline is None:
        with pipeline_lock:
            # Double-check locking pattern
            if rag_pipeline is None:
                print("🚀 Initializing RAG Pipeline on first use...")
                try:
                    rag_pipeline = RAGPipeline()
                    rag_pipeline.initialize_index()
                    print("✅ RAG Pipeline ready")
                    return True
                except Exception as e:
                    print(f"❌ Failed to initialize RAG pipeline: {str(e)}")
                    return False
    return True

def upload_file(file_path: str) -> bool:
    """Upload and process a file through the RAG pipeline"""
    if not ensure_pipeline():
        return False
    return rag_pipeline.handle_file_upload(file_path)

def query(query_text: str) -> str:
    """Query the index through the RAG pipeline"""
    if not ensure_pipeline():
        return "Failed to initialize pipeline"
    return rag_pipeline.query_index(query_text)

def start_background_indexing() -> bool:
    """Start background indexing of existing documents"""
    if not ensure_pipeline():
        return False
    
    print("🔄 Starting background indexing...")
    threading.Thread(
        target=rag_pipeline.background_index_existing_documents, 
        daemon=True
    ).start()
    return True

def get_status() -> dict:
    """Get pipeline status"""
    if rag_pipeline is None:
        return {
            "initialized": False, 
            "connected": False,
            "message": "Pipeline not yet initialized - will initialize on first use"
        }
    return rag_pipeline.get_status()

if __name__ == "__main__":
    try:
        print("🌟 LlamaCloud Index Server")
        print("=" * 50)
        print("📋 Server starting in lazy-load mode")
        print("💡 Pipeline will initialize on first request")
        
        # Setup and start server immediately - no initialization
        print(f"🚀 Starting server on {INDEX_SERVER_HOST}:{INDEX_SERVER_PORT}")
        manager = BaseManager((INDEX_SERVER_HOST, INDEX_SERVER_PORT), INDEX_SERVER_KEY)
        manager.register("upload_file", upload_file)
        manager.register("query", query)
        manager.register("start_background_indexing", start_background_indexing)
        manager.register("get_status", get_status)
        
        server = manager.get_server()
        print("✅ Server ready!")
        print("📋 Available methods:")
        print("   - upload_file(file_path)")
        print("   - query(query_text)")
        print("   - start_background_indexing()")
        print("   - get_status()")
        print("🔧 Pipeline will initialize automatically on first use")
        
        server.serve_forever()
        
    except KeyboardInterrupt:
        print("\n🛑 Server shutdown")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Server error: {str(e)}")
        sys.exit(1) 