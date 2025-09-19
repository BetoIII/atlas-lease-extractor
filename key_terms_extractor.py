#!/usr/bin/env python3
"""
Simplified Key Terms Extractor for Local Llama Models
Removes heavy RAG pipeline and vector indexing for faster local model performance
"""

import os
import json
from typing import Optional
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

# Phoenix instrumentation - simplified for local usage
phoenix_api_key = os.getenv("PHOENIX_API_KEY")
if phoenix_api_key and phoenix_api_key != "YOUR_PHOENIX_API_KEY" and not os.getenv("FLASK_ENV"):
    try:
        import llama_index.core
        os.environ["OTEL_EXPORTER_OTLP_HEADERS"] = f"api_key={phoenix_api_key}"
        llama_index.core.set_global_handler(
            "arize_phoenix", 
            endpoint="https://llamatrace.com/v1/traces"
        )
        print("✅ Phoenix tracing initialized for subprocess")
    except Exception as e:
        print(f"⚠️  Phoenix setup failed: {e}")

from llama_index.core import Settings
from llama_index.llms.openai import OpenAI
from llama_index.core.program import LLMTextCompletionProgram
from pydantic import BaseModel, Field

# Try to import Ollama LLM with fallback
try:
    from llama_index.llms.ollama import Ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False
    print("⚠️  Ollama not available. Will use OpenAI only.")
from typing import List, Dict, Any

# Try to import LlamaParse with fallback
try:
    from llama_cloud_services import LlamaParse
    LLAMA_PARSE_AVAILABLE = True
except ImportError:
    print("⚠️  LlamaParse not available. Will use simple text extraction.")
    LLAMA_PARSE_AVAILABLE = False

class KeyTermsResponse(BaseModel):
    """Unified schema for key terms extraction across all extractors"""
    lease_summary: str = Field(description="Brief summary of the lease agreement")
    property_address: str = Field(description="Property address")
    landlord: str = Field(description="Landlord name")
    tenant: str = Field(description="Tenant name")
    lease_term: str = Field(description="Lease term dates")
    rent_amount: str = Field(description="Rent amount and schedule")
    security_deposit: str = Field(description="Security deposit amount")
    renewal_options: str = Field(description="Renewal options if any")

    class Config:
        from_attributes = True
        populate_by_name = True

def _configure_llm_for_evals():
    """Configure LLM based on current Settings or use local Ollama model"""
    # Check if Settings.llm is already configured (by eval_manager)
    if hasattr(Settings, 'llm') and Settings.llm is not None:
        print(f"📋 Using pre-configured LLM: {type(Settings.llm).__name__}")
        return Settings.llm
    
    # Fallback configuration for standalone usage
    if OLLAMA_AVAILABLE:
        try:
            # Try to use local Ollama model first
            llm = Ollama(
                model="llama3.1:8b",
                temperature=0.1,
                request_timeout=180.0,  # 3 minutes timeout
                base_url="http://localhost:11434",
                additional_kwargs={
                    "num_predict": 1024,  # Limit output tokens
                    "num_ctx": 3072,     # Smaller context window
                }
            )
            print("🦙 Using local Ollama model for key terms extraction")
            return llm
        except Exception as e:
            print(f"⚠️  Ollama not available ({e}), falling back to OpenAI")
    else:
        print("⚠️  Ollama not installed, using OpenAI")
        
    return OpenAI(model="gpt-4o-mini", temperature=0.1, max_tokens=1024)

def _parse_document_simple(file_path: str) -> str:
    """Parse document using LlamaParse or simple file reading"""
    print(f"📄 Loading document: {file_path}")
    
    if LLAMA_PARSE_AVAILABLE and os.getenv("LLAMA_CLOUD_API_KEY"):
        try:
            # Use LlamaParse for better text extraction
            parser = LlamaParse(
                api_key=os.getenv("LLAMA_CLOUD_API_KEY"),
                verbose=False,
                language="en"
            )
            result = parser.parse(file_path)
            documents = result.get_text_documents(split_by_page=False)
            full_text = "\n".join([doc.text for doc in documents])
            print(f"✅ Loaded document via LlamaParse ({len(full_text)} chars)")
        except Exception as e:
            print(f"⚠️  LlamaParse failed ({e}), using simple file read")
            # Fallback to simple text extraction
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                full_text = f.read()
    else:
        # Simple text extraction for non-PDF files
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                full_text = f.read()
            print(f"✅ Loaded document via file read ({len(full_text)} chars)")
        except Exception as e:
            print(f"❌ Could not read file: {e}")
            return ""
    
    # Truncate text for local models (keep first 4000 chars)
    truncated_text = full_text[:4000] + "..." if len(full_text) > 4000 else full_text
    print(f"📝 Using {len(truncated_text)} characters for extraction")
    
    return truncated_text

class KeyTermsExtractor:
    """Simplified Key Terms Extractor for local models"""
    
    def __init__(self):
        """Initialize simplified extractor"""
        print("🔧 Initializing simplified key terms extractor")
        
    def process_document(self, file_path: str) -> Dict[str, Any]:
        """Extract key terms using simplified approach for local models"""
        try:
            # Parse document to text (no vector indexing)
            document_text = _parse_document_simple(file_path)
            
            if not document_text.strip():
                raise ValueError("Could not extract text from document")
            
            # Configure LLM
            llm = _configure_llm_for_evals()
            
            # Create simplified extraction program
            program = LLMTextCompletionProgram.from_defaults(
                output_cls=KeyTermsResponse,
                prompt_template_str="""
You are a lease analyst. Extract key terms from this lease document excerpt.

Document excerpt:
{document_text}

Extract the following information and return in JSON format:
- lease_summary: Brief summary of the lease
- property_address: Full property address
- landlord: Landlord name/entity
- tenant: Tenant name/entity  
- lease_term: Start and end dates
- rent_amount: Rent amount and payment schedule
- security_deposit: Security deposit amount
- renewal_options: Any renewal options or extensions

If information is not found, use "Not specified" or "N/A".

Return JSON format:
{{
    "lease_summary": "Brief lease summary",
    "property_address": "Property address",
    "landlord": "Landlord name",
    "tenant": "Tenant name",
    "lease_term": "Lease dates",
    "rent_amount": "Rent details",
    "security_deposit": "Security deposit",
    "renewal_options": "Renewal options"
}}
""",
                llm=llm,
                verbose=False
            )
            
            # Execute extraction
            print("🔍 Extracting key terms...")
            response = program(document_text=document_text)
            print("✅ Key terms extraction complete")
            
            # Convert to dict for consistency with other extractors
            result = response.model_dump()
            
            # Ensure the result is JSON serializable
            try:
                import json
                json.dumps(result)  # Test serialization
                return result
            except (TypeError, ValueError) as e:
                print(f"⚠️  Result not JSON serializable: {e}")
                # Return a safe fallback
                return {
                    "lease_summary": str(result.get("lease_summary", "N/A")),
                    "property_address": str(result.get("property_address", "N/A")),
                    "landlord": str(result.get("landlord", "N/A")),
                    "tenant": str(result.get("tenant", "N/A")),
                    "lease_term": str(result.get("lease_term", "N/A")),
                    "rent_amount": str(result.get("rent_amount", "N/A")),
                    "security_deposit": str(result.get("security_deposit", "N/A")),
                    "renewal_options": str(result.get("renewal_options", "N/A"))
                }
            
        except Exception as e:
            print(f"❌ Error in key terms extraction: {e}")
            # Return minimal structure on error
            return {
                "lease_summary": f"Error during extraction: {str(e)}",
                "property_address": "N/A",
                "landlord": "N/A", 
                "tenant": "N/A",
                "lease_term": "N/A",
                "rent_amount": "N/A",
                "security_deposit": "N/A",
                "renewal_options": "N/A"
            }

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python key_terms_extractor_simplified.py <path_to_document>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    extractor = KeyTermsExtractor()
    try:
        result = extractor.process_document(file_path)
        print("\nExtraction Result:")
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)