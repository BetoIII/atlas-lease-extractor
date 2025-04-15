import os
from multiprocessing import Lock
from multiprocessing.managers import BaseManager
from llama_index.core import Document, SimpleDirectoryReader
from llama_index.indices.managed.llama_cloud import LlamaCloudIndex
from llama_index.llms.openai import OpenAI
from dotenv import load_dotenv
import tempfile
import shutil
from typing import List
import sys

# Load environment variables from .env file
load_dotenv()

index = None
lock = Lock()
UPLOAD_FOLDER = "uploaded_documents"

# Server configuration
SERVER_ADDRESS = ""  # Empty string means localhost
SERVER_PORT = 5602
SERVER_KEY = b"password"

# LlamaCloud configuration
LLAMA_CLOUD_CONFIG = {
    "name": "agreed-urial-2025-04-15",
    "project_name": "Default",
    "organization_id": "226d42fe-57bd-4b61-a14e-0776cd6b5b8a",
    "api_key": os.environ.get("LLAMA_CLOUD_API_KEY")
}

def ensure_upload_folder():
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)

def initialize_index():
    global index
    
    if not LLAMA_CLOUD_CONFIG["api_key"]:
        raise ValueError("LLAMA_CLOUD_API_KEY environment variable is not set")
    
    if not os.environ.get("OPENAI_API_KEY"):
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    
    with lock:
        ensure_upload_folder()
        # Initialize LlamaCloud index with OpenAI as the query engine
        llm = OpenAI(model="gpt-4")
        index = LlamaCloudIndex(
            name=LLAMA_CLOUD_CONFIG["name"],
            project_name=LLAMA_CLOUD_CONFIG["project_name"],
            organization_id=LLAMA_CLOUD_CONFIG["organization_id"],
            api_key=LLAMA_CLOUD_CONFIG["api_key"],
            llm=llm
        )
        
        # Load any existing documents
        if os.path.exists(UPLOAD_FOLDER) and os.listdir(UPLOAD_FOLDER):
            documents = SimpleDirectoryReader(UPLOAD_FOLDER).load_data()
            for doc in documents:
                try:
                    index.insert(doc)
                except Exception as e:
                    print(f"Error indexing existing document: {str(e)}")

def handle_file_upload(file_path: str) -> bool:
    """
    Handle a new file upload, add it to the upload folder, and update the index
    """
    global index
    
    try:
        with lock:
            # Create a temporary directory for processing
            with tempfile.TemporaryDirectory() as temp_dir:
                # Copy file to temporary directory
                temp_file_path = os.path.join(temp_dir, os.path.basename(file_path))
                shutil.copy2(file_path, temp_file_path)
                
                # Use SimpleDirectoryReader to parse the document
                documents = SimpleDirectoryReader(
                    input_files=[temp_file_path],
                    filename_as_id=True
                ).load_data()
                
                # Copy validated file to upload folder
                final_path = os.path.join(UPLOAD_FOLDER, os.path.basename(file_path))
                shutil.copy2(temp_file_path, final_path)
                
                # Update the index with new documents
                if index is None:
                    initialize_index()
                
                # Insert each document into LlamaCloud index with metadata
                for doc in documents:
                    # Add filename to document metadata
                    doc.metadata["filename"] = os.path.basename(file_path)
                    index.insert(doc)
                
        return True
    except Exception as e:
        print(f"Error handling file upload: {str(e)}")
        return False

def query_index(query_text: str) -> str:
    global index
    if index is None:
        return "Index not initialized"
    
    try:
        # Use LlamaCloud query engine
        response = index.as_query_engine().query(query_text)
        return str(response)
    except Exception as e:
        return f"Error querying index: {str(e)}"

if __name__ == "__main__":
    try:
        # init the global index
        print("Initializing index...")
        initialize_index()
        print("Index initialized successfully")

        # setup server
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