import sys
import threading
from multiprocessing.managers import BaseManager
from rag_pipeline import RAGPipeline

# Server configuration
SERVER_ADDRESS = ""  # Empty string means localhost
SERVER_PORT = 5602
SERVER_KEY = b"password"

# Global RAG pipeline instance
rag_pipeline = None

def initialize_rag_pipeline():
    """Initialize the RAG pipeline"""
    global rag_pipeline
    rag_pipeline = RAGPipeline()
    rag_pipeline.initialize_index()

def handle_file_upload(file_path: str) -> bool:
    """Wrapper function for file upload handling"""
    global rag_pipeline
    if rag_pipeline is None:
        return False
    return rag_pipeline.handle_file_upload(file_path)

def query_index(query_text: str) -> str:
    """Wrapper function for index querying"""
    global rag_pipeline
    if rag_pipeline is None:
        return "RAG pipeline not initialized"
    return rag_pipeline.query_index(query_text)

def start_background_indexing():
    """Start background thread for existing document ingestion"""
    global rag_pipeline
    if rag_pipeline is not None:
        threading.Thread(target=rag_pipeline.background_index_existing_documents, daemon=True).start()

if __name__ == "__main__":
    try:
        # Initialize the RAG pipeline
        print("Initializing RAG pipeline...")
        initialize_rag_pipeline()
        print("RAG pipeline initialized successfully")

        # Start background thread for existing document ingestion
        start_background_indexing()

        # Setup server
        print(f"Starting server on port {SERVER_PORT}...")
        manager = BaseManager((SERVER_ADDRESS, SERVER_PORT), SERVER_KEY)
        manager.register("query_index", query_index)
        manager.register("handle_file_upload", handle_file_upload)
        
        # Get the server instance
        server = manager.get_server()
        print(f"Server ready! Listening on port {SERVER_PORT}")
        
        # Start serving
        server.serve_forever()
    except Exception as e:
        print(f"Error starting server: {str(e)}", file=sys.stderr)
        sys.exit(1) 