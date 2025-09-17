from enum import Enum
import os
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

from llama_cloud_services import LlamaParse
from llama_index.core import Settings
from llama_index.llms.openai import OpenAI
from llama_index.llms.ollama import Ollama
from pydantic import BaseModel, Field
from llama_index.core.program import LLMTextCompletionProgram

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

def _configure_llm_for_evals():
    """Configure LLM based on current Settings or use optimized local Ollama model"""
    # Check if Settings.llm is already configured (by eval_manager)
    if hasattr(Settings, 'llm') and Settings.llm is not None:
        print(f"📋 Using pre-configured LLM: {type(Settings.llm).__name__}")
        # For asset classification, optimize the configured LLM with shorter timeouts
        if hasattr(Settings.llm, 'request_timeout'):
            Settings.llm.request_timeout = 180.0  # 3 minutes for any model
        return Settings.llm
    
    # Fallback configuration for standalone usage - force 8b model for speed
    try:
        # Use smaller, faster model for asset classification
        llm = Ollama(
            model="llama3.1:8b",  # Force 8b model for speed
            temperature=0.0,      # Zero temperature for consistent classification
            request_timeout=180.0,  # 3 minutes timeout
            base_url="http://localhost:11434",
            additional_kwargs={
                "num_predict": 50,   # Very short output for classification
                "num_ctx": 1024,     # Small context window for speed
                "top_p": 0.1,        # More focused responses
                "repeat_penalty": 1.0
            }
        )
        print("🦙 Using local Ollama 8b model for fast asset classification")
        return llm
    except Exception as e:
        print(f"⚠️  Ollama not available ({e}), falling back to OpenAI")
        return OpenAI(model="gpt-4o-mini", temperature=0.0, max_tokens=50)

def classify_asset_type(file_path: str):
    """Classify the asset type of a lease document using simplified approach for local models."""
    print(f"📄 Loading document: {file_path}")
    
    # Parse document with LlamaParse (fast cloud parsing)
    parser = LlamaParse(api_key=os.getenv("LLAMA_CLOUD_API_KEY"))
    result = parser.parse(file_path)
    
    # Get raw text content (no vector indexing)
    documents = result.get_text_documents(split_by_page=False)
    print(f"✅ Loaded {len(documents)} document(s) via LlamaParse")
    
    # Extract raw text content and aggressively truncate for fast classification
    full_text = "\n".join([doc.text for doc in documents])
    # For asset classification, we only need key building/property type indicators
    # Use first 800 chars - enough to capture property type but fast to process
    truncated_text = full_text[:800] + "..." if len(full_text) > 800 else full_text
    print(f"📝 Using {len(truncated_text)} characters for fast classification")
    
    # Configure LLM
    llm = _configure_llm_for_evals()
    
    # Create optimized text completion program for fast classification
    program = LLMTextCompletionProgram.from_defaults(
        output_cls=AssetTypeClassification,
        prompt_template_str="""Classify this lease document as one asset type:

office, retail, industrial, multifamily, hospitality, healthcare, mixed_use

Document: {document_text}

Choose exactly one type. Return:
{{"asset_type": "type", "confidence": 0.9}}""",
        llm=llm,
        verbose=False  # Reduce output for faster processing
    )
    
    # Execute classification directly on text (no query engine)
    print("🔍 Running asset type classification...")
    response = program(document_text=truncated_text)
    print(f"✅ Classification complete: {response.asset_type} (confidence: {response.confidence})")
    
    # Ensure the result is JSON serializable
    try:
        import json
        result = response.model_dump()
        
        # Convert enum to string value for JSON serialization
        if "asset_type" in result and hasattr(result["asset_type"], "value"):
            result["asset_type"] = result["asset_type"].value
        
        json.dumps(result)  # Test serialization
        return result
    except (TypeError, ValueError) as e:
        print(f"⚠️  Result not JSON serializable: {e}")
        # Return a safe fallback
        return {
            "asset_type": str(response.asset_type.value) if hasattr(response, 'asset_type') and hasattr(response.asset_type, 'value') else "unknown",
            "confidence": float(response.confidence) if hasattr(response, 'confidence') else 0.0
        }

