import sys
import threading
import os
from multiprocessing.managers import BaseManager
from rag_pipeline import RAGPipeline

# Server configuration
INDEX_SERVER_HOST = os.getenv("INDEX_SERVER_HOST", "127.0.0.1")
INDEX_SERVER_PORT = int(os.getenv("INDEX_SERVER_PORT", "5602"))

def _runtime_env() -> str:
    return (os.getenv("FLASK_ENV") or os.getenv("ENV") or os.getenv("NODE_ENV") or "development").lower()

def validate_index_server_key(key_value: str | None, env_override: str | None = None) -> bytes:
    """Validate and return an index server key.
    - If a non-default key (not 'change-me') of sufficient length (>=16) is provided, use it.
    - In development, generate an ephemeral key if missing.
    - In production, missing/weak keys raise RuntimeError.
    """
    env = (env_override or _runtime_env()).lower()
    if key_value and key_value != "change-me" and len(key_value) >= 16:
        return key_value.encode()
    if env in ("development", "dev", "local"):
        # Ephemeral key for development convenience
        return os.urandom(32)
    raise RuntimeError("INDEX_SERVER_KEY is required in production and must be >=16 bytes and not 'change-me'.")

def _load_dev_key_from_file() -> bytes:
    path = os.getenv("INDEX_SERVER_KEY_FILE", ".dev_index_server.key")
    try:
        if os.path.exists(path):
            with open(path, "rb") as f:
                data = f.read()
            if isinstance(data, (bytes, bytearray)) and len(data) >= 16:
                return data
        key = os.urandom(32)
        with open(path, "wb") as f:
            f.write(key)
        try:
            os.chmod(path, 0o600)
        except Exception:
            pass
        return key
    except OSError:
        return os.urandom(32)

def _load_index_server_key() -> bytes:
    env = _runtime_env()
    env_val = os.getenv("INDEX_SERVER_KEY")
    if env_val:
        return validate_index_server_key(env_val, env_override=env)
    if env in ("development", "dev", "local"):
        return _load_dev_key_from_file()
    return validate_index_server_key(None, env_override=env)

INDEX_SERVER_KEY = _load_index_server_key()

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