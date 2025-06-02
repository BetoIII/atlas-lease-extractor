import os
from dotenv import load_dotenv
from llama_cloud.client import LlamaCloud
from llama_index.indices.managed.llama_cloud import LlamaCloudIndex
from llama_index.core import Document
from llama_index.core.ingestion import IngestionPipeline
from llama_index.core.storage.docstore import SimpleDocumentStore
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core import SimpleDirectoryReader

pipeline = IngestionPipeline(
    transformations=[
        SentenceSplitter(),
        HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5"),
    ],
    docstore=SimpleDocumentStore(),
)

# Load environment variables from .env file
load_dotenv()

pipeline_id = "975599b4-c782-4a6e-a691-a729ea4eb450"
pipeline_name = "agreed-urial-2025-04-15"
project_id = "226d42fe-57bd-4b61-a14e-0776cd6b5b8a"
project_name = "Default"

index = LlamaCloudIndex(
    name=pipeline_name,
    project_name=project_name,
    organization_id=project_id,
    api_key=os.environ.get("LLAMA_CLOUD_API_KEY")
)

documents = SimpleDirectoryReader("/Users/betojuareziii/Applications/atlas-lease-extractor/uploaded_documents", filename_as_id=True).load_data()

client = LlamaCloud(
    token=os.environ.get("LLAMA_CLOUD_API_KEY"),
    base_url=os.environ.get("LLAMA_CLOUD_BASE_URL")
   )

all_documents = [
    *documents, #LlamaParsed document
    Document(text="This is a test document", metadata={"source": "test"})
]

llama_cloud_documents = [d.to_cloud_document() for d in all_documents]

upserted_doc = client.pipelines.upsert_batch_pipeline_documents(
    pipeline_id, request=llama_cloud_documents
)

print(upserted_doc)
nodes = pipeline.run(documents=documents)
print(f"Ingested {len(nodes)} Nodes")
for node in nodes:
    print(f"Node: {node.text}")