#!/usr/bin/env python3
"""
Key Terms Extractor (Simple)
Uses LlamaIndex structured_predict with SimpleDirectoryReader.
No indexing, embedding, or caching - just raw text processing.
"""

import os
import json
from typing import Dict, Any
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

# Phoenix instrumentation (optional)
phoenix_api_key = os.getenv("PHOENIX_API_KEY")
if phoenix_api_key and phoenix_api_key != "YOUR_PHOENIX_API_KEY" and not os.getenv("FLASK_ENV"):
    try:
        import llama_index.core
        os.environ["OTEL_EXPORTER_OTLP_HEADERS"] = f"api_key={phoenix_api_key}"
        llama_index.core.set_global_handler(
            "arize_phoenix",
            endpoint="https://llamatrace.com/v1/traces"
        )
        print("✅ Phoenix tracing initialized")
    except Exception as e:
        print(f"⚠️  Phoenix setup failed: {e}")

from llama_index.core import SimpleDirectoryReader, Settings
from llama_index.llms.openai import OpenAI
from llama_index.core.program import LLMTextCompletionProgram
from pydantic import BaseModel, Field

# Try to import Ollama with fallback
try:
    from llama_index.llms.ollama import Ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False
    print("⚠️  Ollama not available. Will use OpenAI only.")

class KeyTermsResponse(BaseModel):
    """Schema for key terms extraction matching existing extractors"""
    lease_summary: str = Field(description="Brief summary of the lease agreement")
    property_address: str = Field(description="Property address")
    landlord: str = Field(description="Landlord name")
    tenant: str = Field(description="Tenant name")
    lease_term: str = Field(description="Lease term dates")
    rent_amount: str = Field(description="Rent amount and schedule")
    security_deposit: str = Field(description="Security deposit amount")
    renewal_options: str = Field(description="Renewal options if any")

def _configure_llm():
    """Configure LLM based on current Settings or use fallback"""
    # Check if Settings.llm is already configured
    if hasattr(Settings, 'llm') and Settings.llm is not None:
        print(f"📋 Using pre-configured LLM: {type(Settings.llm).__name__}")
        return Settings.llm

    # Fallback configuration
    if OLLAMA_AVAILABLE:
        try:
            llm = Ollama(
                model="llama3.1:8b",
                temperature=0.1,
                request_timeout=180.0,
                base_url="http://localhost:11434",
                additional_kwargs={
                    "num_predict": 1024,
                    "num_ctx": 4096,
                }
            )
            print("🦙 Using local Ollama model")
            return llm
        except Exception as e:
            print(f"⚠️  Ollama not available ({e}), falling back to OpenAI")

    return OpenAI(model="gpt-4o-mini", temperature=0.1, max_tokens=1024)

class SimpleKeyTermsExtractor:
    """Simple Key Terms Extractor using structured_predict"""

    def __init__(self):
        """Initialize the simple extractor"""
        print("🔧 Initializing simple key terms extractor")
        self.llm = _configure_llm()

    def process_document(self, file_path: str) -> Dict[str, Any]:
        """Extract key terms using structured_predict with SimpleDirectoryReader"""
        try:
            print(f"📄 Processing document: {os.path.basename(file_path)}")

            # Use SimpleDirectoryReader to load the document
            file_dir = os.path.dirname(file_path)
            file_name = os.path.basename(file_path)

            # Load documents using SimpleDirectoryReader
            documents = SimpleDirectoryReader(
                input_dir=file_dir,
                input_files=[file_path] if os.path.isfile(file_path) else None,
                recursive=False
            ).load_data()

            if not documents:
                raise ValueError("No documents could be loaded")

            # Combine all document text
            document_text = "\n\n".join([doc.text for doc in documents])

            # Truncate text if too long (keep first 4000 chars for performance)
            if len(document_text) > 4000:
                document_text = document_text[:4000] + "..."
                print(f"📝 Truncated document to 4000 characters")

            print(f"📝 Using {len(document_text)} characters for extraction")

            # Create extraction program using LLMTextCompletionProgram
            program = LLMTextCompletionProgram.from_defaults(
                output_cls=KeyTermsResponse,
                prompt_template_str="""
You are a lease analyst. Extract key terms from this lease document.

Document content:
{document_text}

Extract the following information:
- lease_summary: Brief summary of the lease agreement
- property_address: Full property address
- landlord: Landlord name/entity
- tenant: Tenant name/entity
- lease_term: Start and end dates
- rent_amount: Rent amount and payment schedule
- security_deposit: Security deposit amount
- renewal_options: Any renewal options or extensions

If information is not found, use "Not specified" or "N/A".
Be specific and include details when available.
""",
                llm=self.llm,
                verbose=False
            )

            # Use the program to extract key terms
            print("🔍 Extracting key terms using LLMTextCompletionProgram...")
            response = program(document_text=document_text)

            print("✅ Key terms extraction complete")

            # Convert to dict
            result = response.model_dump()

            return {
                "status": "success",
                "data": result,
                "extraction_metadata": {
                    "extractor_type": "simple_structured_predict",
                    "document_chars": len(document_text),
                    "llm_type": type(self.llm).__name__
                }
            }

        except Exception as e:
            print(f"❌ Error in simple extraction: {e}")
            return {
                "status": "error",
                "message": f"Extraction failed: {str(e)}",
                "data": {
                    "lease_summary": "Extraction failed",
                    "property_address": "N/A",
                    "landlord": "N/A",
                    "tenant": "N/A",
                    "lease_term": "N/A",
                    "rent_amount": "N/A",
                    "security_deposit": "N/A",
                    "renewal_options": "N/A"
                }
            }

def extract_key_terms_simple(file_path: str) -> Dict[str, Any]:
    """Standalone function for simple key terms extraction"""
    extractor = SimpleKeyTermsExtractor()
    return extractor.process_document(file_path)

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python key_terms_extractor_simple.py <path_to_document>")
        sys.exit(1)

    file_path = sys.argv[1]

    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        sys.exit(1)

    try:
        result = extract_key_terms_simple(file_path)
        print("\nExtraction Result:")
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)