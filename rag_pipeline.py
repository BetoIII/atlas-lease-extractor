import os
from multiprocessing import Lock
from llama_index.core import Document, SimpleDirectoryReader, VectorStoreIndex, load_index_from_storage
from llama_index.indices.managed.llama_cloud import LlamaCloudIndex
from llama_index.llms.openai import OpenAI
from dotenv import load_dotenv
import tempfile
import shutil
from typing import List
import threading
import chromadb
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core import StorageContext

# Load environment variables from .env file
load_dotenv()

class RAGPipeline:
    def __init__(self):
        self.index = None
        self.lock = Lock()
        self.upload_folder = "uploaded_documents"
        
        # LlamaCloud configuration
        self.llama_cloud_config = {
            "name": "agreed-urial-2025-04-15",
            "project_name": "Default",
            "organization_id": "226d42fe-57bd-4b61-a14e-0776cd6b5b8a",
            "api_key": os.environ.get("LLAMA_CLOUD_API_KEY")
        }
        
        # Initialize Chroma client and collection
        self.db = chromadb.PersistentClient(path="./chroma_db")
        self.chroma_collection = self.db.get_or_create_collection("quickstart")
        
        # Assign Chroma as the vector store
        self.vector_store = ChromaVectorStore(chroma_collection=self.chroma_collection)
        self.storage_context = StorageContext.from_defaults(
            persist_dir="./persist_dir",
            vector_store=self.vector_store
        )
    
    def ensure_upload_folder(self):
        if not os.path.exists(self.upload_folder):
            os.makedirs(self.upload_folder)
    
    def initialize_index(self):
        if not self.llama_cloud_config["api_key"]:
            raise ValueError("LLAMA_CLOUD_API_KEY environment variable is not set")
        
        if not os.environ.get("OPENAI_API_KEY"):
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        
        with self.lock:
            self.ensure_upload_folder()
            # Initialize LlamaCloud index with OpenAI as the query engine
            llm = OpenAI(model="gpt-4")
            self.index = LlamaCloudIndex(
                name=self.llama_cloud_config["name"],
                project_name=self.llama_cloud_config["project_name"],
                organization_id=self.llama_cloud_config["organization_id"],
                api_key=self.llama_cloud_config["api_key"],
                llm=llm
            )
    
    def background_index_existing_documents(self):
        print("[Background] Starting indexing of existing documents...")
        if os.path.exists(self.upload_folder) and os.listdir(self.upload_folder):
            documents = SimpleDirectoryReader(self.upload_folder).load_data()
            for doc in documents:
                try:
                    self.index.insert(doc)
                except Exception as e:
                    print(f"[Background] Error indexing existing document: {str(e)}")
                    continue  # Skip to the next document immediately
        print("[Background] Finished indexing existing documents.")
    
    def handle_file_upload(self, file_path: str) -> bool:
        """
        Handle a new file upload, add it to the upload folder, and update the index
        """
        try:
            with self.lock:
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
                    final_path = os.path.join(self.upload_folder, os.path.basename(file_path))
                    shutil.copy2(temp_file_path, final_path)
                    
                    # Update the index with new documents
                    if self.index is None:
                        self.initialize_index()
                    
                    # Insert each document into LlamaCloud index with metadata
                    for doc in documents:
                        # Add filename to document metadata
                        doc.metadata["filename"] = os.path.basename(file_path)
                        self.index.insert(doc)
                    
            return True
        except Exception as e:
            print(f"Error handling file upload: {str(e)}")
            return False
    
    def query_index(self, query_text: str) -> str:
        if self.index is None:
            return "Index not initialized"
        
        try:
            # Use LlamaCloud query engine
            response = self.index.as_query_engine().query(query_text)
            return str(response)
        except Exception as e:
            return f"Error querying index: {str(e)}"
    
    def load_index_from_storage(self):
        """Load the index from storage"""
        return load_index_from_storage(self.storage_context) 