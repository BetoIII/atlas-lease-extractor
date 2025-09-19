import os
from dotenv import load_dotenv
from llama_cloud.client import LlamaCloud
from llama_index.indices.managed.llama_cloud import LlamaCloudIndex
from llama_index.core import Document
from llama_index.core import SimpleDirectoryReader

class RAGPipeline:
    """
    RAG Pipeline that uses LlamaCloud's managed vector storage.
    
    This class handles document indexing and querying using LlamaCloud's infrastructure,
    eliminating the need for local vector stores and avoiding docstore strategy warnings.
    LlamaCloud automatically handles embeddings, vector storage, and document management.
    """
    def __init__(self):
        # Load environment variables from .env file
        load_dotenv()

        self.pipeline_id = "975599b4-c782-4a6e-a691-a729ea4eb450"
        self.pipeline_name = "agreed-urial-2025-04-15"
        self.project_id = "226d42fe-57bd-4b61-a14e-0776cd6b5b8a"
        self.project_name = "Default"
        
        # Use LlamaCloud client for document operations
        # LlamaCloud manages vector storage internally - no local vector store needed
        self.client = LlamaCloud(
            token=os.environ.get("LLAMA_CLOUD_API_KEY"),
            base_url=os.environ.get("LLAMA_CLOUD_BASE_URL")
        )
        
        self.index = None
        self.initialized = False

    def initialize_index(self):
        """Initialize the LlamaCloud index"""
        try:
            self.index = LlamaCloudIndex(
                name=self.pipeline_name,
                project_name=self.project_name,
                organization_id=self.project_id,
                api_key=os.environ.get("LLAMA_CLOUD_API_KEY")
            )
            self.initialized = True
            return True
        except Exception as e:
            print(f"Error initializing index: {str(e)}")
            return False

    def clear_pipeline_documents(self) -> bool:
        """Clear all documents from the LlamaCloud pipeline"""
        try:
            if not self.initialized:
                if not self.initialize_index():
                    return False

            print(f"🔍 Checking pipeline {self.pipeline_name} (ID: {self.pipeline_id}) for existing documents...")
            # Get all document IDs in the pipeline
            documents_response = self.client.pipelines.list_pipeline_documents(self.pipeline_id)

            if hasattr(documents_response, 'documents') and documents_response.documents:
                # Delete all documents
                document_ids = [doc.id for doc in documents_response.documents]
                print(f"🗑️  Found {len(document_ids)} documents in pipeline:")
                for doc in documents_response.documents[:3]:  # Show first 3 for debugging
                    print(f"   📄 Document: {getattr(doc, 'name', 'unnamed')} (ID: {doc.id})")
                if len(document_ids) > 3:
                    print(f"   ... and {len(document_ids) - 3} more documents")
                print(f"🗑️  Clearing all {len(document_ids)} documents from pipeline...")

                for doc_id in document_ids:
                    self.client.pipelines.delete_pipeline_document(
                        self.pipeline_id,
                        document_id=doc_id
                    )

                print("✅ Pipeline cleared successfully")
            else:
                print("📝 Pipeline already empty")

            return True
        except Exception as e:
            print(f"⚠️  Error clearing pipeline: {str(e)}")
            return False

    def handle_file_upload(self, file_path: str, clear_existing: bool = True) -> bool:
        """Process and upload a file to the LlamaCloud index"""
        try:
            if not self.initialized:
                if not self.initialize_index():
                    return False

            # Clear existing documents if requested (for clean evaluation testing)
            if clear_existing:
                if not self.clear_pipeline_documents():
                    print("⚠️  Warning: Could not clear existing documents")

            # Load the specific document file
            documents = SimpleDirectoryReader(
                input_files=[file_path],
                filename_as_id=True
            ).load_data()

            # Convert to cloud documents and upload to LlamaCloud pipeline
            # LlamaCloud handles all vector storage and indexing automatically
            llama_cloud_documents = [d.to_cloud_document() for d in documents]

            # Upload to LlamaCloud pipeline - this handles vector storage internally
            self.client.pipelines.upsert_batch_pipeline_documents(
                self.pipeline_id, request=llama_cloud_documents
            )

            print(f"Successfully uploaded {len(documents)} document(s) to LlamaCloud")
            print("✅ LlamaCloud is handling vector storage and indexing automatically")

            return True
        except Exception as e:
            print(f"Error handling file upload: {str(e)}")
            return False

    def query_index(self, query_text: str) -> str:
        """Query the index"""
        try:
            if not self.initialized:
                if not self.initialize_index():
                    return "Failed to initialize index"

            # Get both retrieval results and query response
            nodes = self.index.as_retriever().retrieve(query_text)
            response = self.index.as_query_engine().query(query_text)
            
            return str(response)
        except Exception as e:
            return f"Error querying index: {str(e)}"

    def background_index_existing_documents(self):
        """Index all existing documents in the uploaded_documents directory"""
        try:
            upload_dir = "uploaded_documents"
            if not os.path.exists(upload_dir):
                print(f"Upload directory {upload_dir} does not exist")
                return

            for filename in os.listdir(upload_dir):
                if filename.endswith(('.pdf', '.txt', '.doc', '.docx')):
                    file_path = os.path.join(upload_dir, filename)
                    print(f"Indexing {filename}...")
                    # Don't clear existing documents during background indexing
                    self.handle_file_upload(file_path, clear_existing=False)
        except Exception as e:
            print(f"Error in background indexing: {str(e)}")

    def get_status(self) -> dict:
        """Get the current status of the pipeline"""
        return {
            "initialized": self.initialized,
            "connected": self.index is not None,
            "storage_type": "llamacloud_managed",
            "vector_store": "managed_by_llamacloud",
            "message": "LlamaCloud pipeline ready" if self.initialized else "Pipeline not initialized"
        }