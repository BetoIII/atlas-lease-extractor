from enum import Enum
import os
from llama_cloud_services import LlamaParse
from llama_index.core.indices.vector_store.base import VectorStoreIndex
from openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.core import Settings
from pydantic import BaseModel

Settings.llm = OpenAI(model="gpt-3.5-turbo", streaming=True)
Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")

#define asset type schema
class AssetTypeClassification(BaseModel):
    asset_type: str
    description: str
    confidence: float

#define asset types
class AssetType(str, Enum):
    office = "office"
    retail = "retail"
    industrial = "industrial"
    multifamily = "multifamily"
    hospitality = "hospitality"
    healthcare = "healthcare"
    mixed_use = "mixed_use"
    other = "other"

def classify_asset_type(file_path: str) -> AssetTypeClassification:
    """Classify the asset type of a lease document and return a structured response."""
    print(f"Loading document: {file_path}")
    
    # Use LlamaParse to parse the document
    parser = LlamaParse(api_key=os.getenv("LLAMA_CLOUD_API_KEY"))
    result = parser.parse(file_path)
    
    # Get the parsed text documents
    documents = result.get_text_documents(split_by_page=False)
    print(f"Loaded {len(documents)} document(s) via LlamaParse")
    
    # Use LlamaIndex to embed the document
    index = VectorStoreIndex.from_documents(documents)
    
    # Define the prompt for classifying the asset type
    prompt_str = """
    You are a senior real estate analyst that is helpful to commercial real estate operators and investors. Analyze this lease document and identify the asset type of the property.

    Available asset types:
    - office: Commercial office buildings
    - retail: Shopping centers, stores, and retail spaces
    - industrial: Warehouses, manufacturing facilities, and industrial parks
    - multifamily: Apartment buildings and residential complexes
    - hospitality: Hotels, motels, and lodging facilities
    - healthcare: Medical offices, hospitals, and healthcare facilities
    - mixed_use: Properties with multiple uses
    - other: Any other property type

    Return a JSON object with the following structure:
    {
        "asset_type": "one of the above types",
        "description": "brief description of why this type was chosen",
        "confidence": "confidence score between 0 and 1"
    }

    Only include asset types that you can actually identify in the document with specific evidence.
    If you cannot identify any asset types, return "other" as the asset_type with a low confidence score.
    """
    
    # Use LlamaIndex to embed the prompt
    query_engine = index.as_query_engine(streaming=True)
    
    # Execute the query and collect the streaming response
    response = query_engine.query(prompt_str)
    full_response = ""
    for text_chunk in response.response_gen:
        full_response += text_chunk
    
    try:
        # Parse the response as JSON and create AssetTypeClassification object
        import json
        result_dict = json.loads(full_response)
        return AssetTypeClassification(**result_dict)
    except json.JSONDecodeError:
        # If JSON parsing fails, return a default response
        return AssetTypeClassification(
            asset_type="other",
            description="Could not parse the response as valid JSON",
            confidence=0.0
        )

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Classify the asset type of a lease document.")
    parser.add_argument("file_path", type=str, help="The path to the lease document")
    args = parser.parse_args()
    
    # Determine file path
    file_path = args.file_path
    
    # Expand user path (handles ~ for home directory)
    file_path = os.path.expanduser(file_path)
    
    # Classify the asset type
    result = classify_asset_type(file_path)
    
    print("ASSET TYPE CLASSIFIED:")
    print("="*60)
    
    # Print the result as JSON
    print(result.model_dump_json(indent=2))