from enum import Enum
import os
from llama_cloud_services import LlamaParse
from llama_index.core.indices.vector_store.base import VectorStoreIndex
from openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.core import Settings
from pydantic import BaseModel, Field
from typing import List, Literal
from llama_index.core.program import FunctionCallingProgram

class AssetType(str, Enum):
    OFFICE = "office"
    RETAIL = "retail"
    INDUSTRIAL = "industrial"
    MULTIFAMILY = "multifamily"
    HOSPITALITY = "hospitality"
    HEALTHCARE = "healthcare"
    MIXED_USE = "mixed_use"

class AssetTypeClassification(BaseModel):
    """Schema for asset type classification output."""
    asset_type: AssetType = Field(..., description="The classified asset type")
    confidence: float = Field(
        ...,
        description="Confidence score between 0 and 1",
        ge=0.0,
        le=1.0
    )

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
    
    # Initialize the LLM
    llm = OpenAI(model="o3-mini")
    
    # Create the function calling program
    program = FunctionCallingProgram.from_defaults(
        output_cls=AssetTypeClassification,
        prompt_template_str="""
        You are a senior real estate analyst that is helpful to commercial real estate operators and investors. 
        Analyze this lease document and identify the asset type of the property.
        
        Available asset types:
        - office: Commercial office buildings
        - retail: Shopping centers, stores, and retail spaces
        - industrial: Warehouses, manufacturing facilities, and industrial parks
        - multifamily: Apartment buildings and residential complexes
        - hospitality: Hotels, motels, and lodging facilities
        - healthcare: Medical offices, hospitals, and healthcare facilities
        - mixed_use: Properties with multiple uses
        
        You MUST choose one of the exact asset types listed above. Do not make up new asset types.
        """,
        llm=llm,
        verbose=True
    )
    
    # Use LlamaIndex to embed the prompt
    query_engine = index.as_query_engine(streaming=True)
    
    # Execute the query and get structured output
    response = program(query_engine)
    
    return response

