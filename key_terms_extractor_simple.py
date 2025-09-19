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
from key_terms_extractor import KeyTermsResponse

# Try to import Ollama with fallback
try:
    from llama_index.llms.ollama import Ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False
    print("⚠️  Ollama not available. Will use OpenAI only.")


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

            # Create prompt for manual JSON extraction (compatible with local models)
            prompt = f"""
Extract lease information from this document and return ONLY a JSON object:

Document content:
{document_text}

Return ONLY this JSON structure with actual values from the document:
{{
    "lease_summary": "brief summary of the lease",
    "property_address": "property address from document",
    "landlord": "landlord name from document",
    "tenant": "tenant name from document",
    "lease_term": "lease term dates from document",
    "rent_amount": "rent amount and schedule from document",
    "security_deposit": "security deposit amount from document",
    "renewal_options": "renewal options from document or N/A"
}}

IMPORTANT: Start your response with {{ and end with }}. No other text.
"""

            # Use direct LLM completion instead of structured program
            print("🔍 Extracting key terms using direct LLM completion...")
            response = self.llm.complete(prompt)

            print("✅ Key terms extraction complete")

            # Manual JSON extraction (robust for local models)
            try:
                response_text = response.text.strip()

                # Remove common prefixes that local models add
                prefixes_to_remove = [
                    "Here is the extracted information in JSON format:",
                    "Here is the JSON:",
                    "The extracted information:",
                    "JSON:",
                    "```json",
                    "```"
                ]

                for prefix in prefixes_to_remove:
                    if response_text.startswith(prefix):
                        response_text = response_text[len(prefix):].strip()

                # Remove trailing markdown
                if response_text.endswith("```"):
                    response_text = response_text[:-3].strip()

                # Find JSON in the response
                import re
                json_patterns = [
                    r'\{(?:[^{}]|(?:\{[^{}]*\}))*\}',  # Nested JSON objects
                    r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}',  # Original pattern
                    r'\{.*?\}(?=\s*$)',  # JSON at end of string
                    r'\{.*\}'  # Fallback: any JSON-like structure
                ]

                json_str = None
                for pattern in json_patterns:
                    json_match = re.search(pattern, response_text, re.DOTALL)
                    if json_match:
                        json_str = json_match.group()
                        break

                if not json_str:
                    json_str = response_text

                print(f"🔍 Extracted JSON: {json_str[:200]}...")

                # Parse JSON and validate
                result = json.loads(json_str)

                # Ensure all required fields exist
                required_fields = ["lease_summary", "property_address", "landlord", "tenant",
                                 "lease_term", "rent_amount", "security_deposit", "renewal_options"]
                for field in required_fields:
                    if field not in result:
                        result[field] = "N/A"

            except json.JSONDecodeError as e:
                print(f"⚠️  Failed to parse JSON: {e}")
                print(f"Raw response: {response.text[:500]}...")
                # Fallback structure
                result = {
                    "lease_summary": f"Extraction failed: {str(e)}",
                    "property_address": "N/A",
                    "landlord": "N/A",
                    "tenant": "N/A",
                    "lease_term": "N/A",
                    "rent_amount": "N/A",
                    "security_deposit": "N/A",
                    "renewal_options": "N/A"
                }
            except Exception as e:
                print(f"⚠️  Error processing response: {e}")
                result = {
                    "lease_summary": f"Processing failed: {str(e)}",
                    "property_address": "N/A",
                    "landlord": "N/A",
                    "tenant": "N/A",
                    "lease_term": "N/A",
                    "rent_amount": "N/A",
                    "security_deposit": "N/A",
                    "renewal_options": "N/A"
                }

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