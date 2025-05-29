import os
from multiprocessing import Lock
from llama_index.core import Document, SimpleDirectoryReader, VectorStoreIndex, load_index_from_storage
from llama_index.indices.managed.llama_cloud import LlamaCloudIndex
from llama_index.llms.openai import OpenAI
from dotenv import load_dotenv
from typing import List
from llama_parse import LlamaParse
from llama_cloud.client import LlamaCloud
from llama_index.indices.managed.llama_cloud import LlamaCloudIndex
from llama_index.core import Document

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

documents = LlamaParse(result_type="markdown").load_data(
    file_path="/Users/betojuareziii/Applications/atlas-lease-extractor/uploaded_documents/2019-2022-Lease-Agreement-TETCO-Signed-tiny.pdf"
)    

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