import os
from dotenv import load_dotenv
from llama_cloud.client import LlamaCloud
from llama_index.indices.managed.llama_cloud import LlamaCloudIndex
from llama_index.core import Document
from llama_index.core.ingestion import IngestionPipeline
from llama_index.core.storage.docstore import SimpleDocumentStore
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core import SimpleDirectoryReader
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

class RAGPipeline:
    def __init__(self):
        # Load environment variables from .env file
        load_dotenv()
        
        self.pipeline_id = "975599b4-c782-4a6e-a691-a729ea4eb450"
        self.pipeline_name = "agreed-urial-2025-04-15"
        self.project_id = "226d42fe-57bd-4b61-a14e-0776cd6b5b8a"
        self.project_name = "Default"
        
        self.pipeline = IngestionPipeline(
            transformations=[
                SentenceSplitter(),
                HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5"),
            ],
            docstore=SimpleDocumentStore(),
        )
        
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

    def handle_file_upload(self, file_path: str) -> bool:
        """Process and upload a file to the index"""
        try:
            if not self.initialized:
                if not self.initialize_index():
                    return False

            # Load the document
            documents = SimpleDirectoryReader(
                os.path.dirname(file_path),
                filename_as_id=True
            ).load_data()

            # Convert to cloud documents
            llama_cloud_documents = [d.to_cloud_document() for d in documents]

            # Upload to pipeline
            self.client.pipelines.upsert_batch_pipeline_documents(
                self.pipeline_id, request=llama_cloud_documents
            )

            # Process through local pipeline
            nodes = self.pipeline.run(documents=documents)
            print(f"Ingested {len(nodes)} Nodes")
            
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
                    self.handle_file_upload(file_path)
        except Exception as e:
            print(f"Error in background indexing: {str(e)}")

    def get_status(self) -> dict:
        """Get the current status of the pipeline"""
        return {
            "initialized": self.initialized,
            "connected": self.index is not None,
            "message": "Pipeline ready" if self.initialized else "Pipeline not initialized"
        }