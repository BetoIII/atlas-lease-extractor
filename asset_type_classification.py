from enum import Enum
import os
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

from llama_cloud_services import LlamaParse
from llama_index.core.indices.vector_store.base import VectorStoreIndex
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.core import Settings
from pydantic import BaseModel, Field
from typing import List, Literal
from llama_index.core.program import LLMTextCompletionProgram
from config import get_llm_model

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
    
    # Initialize the LLM with configurable model
    try:
        llm = OpenAI(model=get_llm_model())
    except Exception:
        # Fallback to default model if configuration fails
        llm = OpenAI(model="gpt-4o-mini")
    
    # Create a text completion program instead of function calling to avoid Python 3.13 issues
    program = LLMTextCompletionProgram.from_defaults(
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
        
        Return your response in JSON format with the following structure:
        {{
            "asset_type": "one of the asset types above",
            "confidence": 0.95
        }}
        
        Context: {context_str}
        
        Question: What is the asset type of this property based on the lease document?
        """,
        llm=llm,
        verbose=True
    )
    
    # Use LlamaIndex to get context from the document
    query_engine = index.as_query_engine(streaming=False)  # Disable streaming for more reliable results
    context_response = query_engine.query("What type of property is described in this lease document? Include details about the use, location, and property characteristics.")
    
    # Execute the classification with the document context
    response = program(context_str=str(context_response))
    
    return response

