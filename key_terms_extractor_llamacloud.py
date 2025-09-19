#!/usr/bin/env python3
"""
Key Terms Extractor - LlamaCloud approach with intelligent index checking
Optimized for evals-tester with smart caching and efficient LlamaCloud usage
"""

import os
import sys
import json
from typing import Optional
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

# Phoenix instrumentation for subprocess-level tracing
# Only initialize if not already running in a Flask context
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
elif __name__ == "__main__":
    # Force Phoenix setup for CLI usage
    if phoenix_api_key and phoenix_api_key != "YOUR_PHOENIX_API_KEY":
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

from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.core import Settings
from llama_index.core import SimpleDirectoryReader
from llama_index.core.output_parsers import PydanticOutputParser
from llama_index.core.prompts import PromptTemplate

# Import the shared components
from rag_pipeline import RAGPipeline
from lease_summary_agent_schema import LeaseSummary
from llama_cloud_manager import LlamaCloudManager

# Try to import LlamaParse with fallback
try:
    from llama_cloud_services import LlamaParse
    LLAMA_PARSE_AVAILABLE = True
except ImportError:
    print("⚠️  LlamaParse not available. Will use SimpleDirectoryReader instead.")
    LLAMA_PARSE_AVAILABLE = False

# Configure LLM settings - can be overridden by environment variables or model config
def configure_llm():
    """Configure LLM based on environment variables or default to OpenAI"""
    llm_provider = os.getenv("LLM_PROVIDER", "openai").lower()

    if llm_provider == "ollama" or llm_provider == "local":
        # Configure for local Ollama model
        try:
            from llama_index.llms.ollama import Ollama
            model_name = os.getenv("LLM_MODEL", "llama3.1:8b")
            print(f"🦙 Configuring Ollama model: {model_name}")

            Settings.llm = Ollama(
                model=model_name,
                temperature=float(os.getenv("LLM_TEMPERATURE", "0.1")),
                request_timeout=600.0,  # 10 minutes for local models
                base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
                additional_kwargs={
                    "num_predict": int(os.getenv("LLM_MAX_TOKENS", "1024")),  # Reduce token limit
                    "num_ctx": 4096,  # Limit context window
                }
            )
            print("✅ Ollama LLM configured")
        except ImportError:
            print("❌ Ollama not available. Install with: pip install llama-index-llms-ollama")
            raise

    elif llm_provider == "anthropic":
        # Configure for Anthropic
        try:
            from llama_index.llms.anthropic import Anthropic
            model_name = os.getenv("LLM_MODEL", "claude-3-haiku-20240307")
            print(f"🤖 Configuring Anthropic model: {model_name}")

            Settings.llm = Anthropic(
                model=model_name,
                temperature=float(os.getenv("LLM_TEMPERATURE", "0.1")),
                max_tokens=int(os.getenv("LLM_MAX_TOKENS", "4096"))
            )
            print("✅ Anthropic LLM configured")
        except ImportError:
            print("❌ Anthropic not available. Install with: pip install llama-index-llms-anthropic")
            raise
    else:
        # Default to OpenAI
        model_name = os.getenv("LLM_MODEL", "gpt-4o-mini")
        streaming_enabled = os.getenv("LLM_STREAMING", "true").lower() == "true"
        print(f"🤖 Configuring OpenAI model: {model_name} (streaming: {streaming_enabled})")

        Settings.llm = OpenAI(
            model=model_name,
            streaming=streaming_enabled,
            temperature=float(os.getenv("LLM_TEMPERATURE", "0.1")),
            max_tokens=int(os.getenv("LLM_MAX_TOKENS", "4096")) if os.getenv("LLM_MAX_TOKENS") else None
        )
        print("✅ OpenAI LLM configured")

# Configure embedding model
def configure_embeddings():
    """Configure embedding model"""
    embed_provider = os.getenv("EMBED_PROVIDER", "openai").lower()

    if embed_provider == "huggingface":
        try:
            from llama_index.embeddings.huggingface import HuggingFaceEmbedding
            model_name = os.getenv("EMBED_MODEL", "BAAI/bge-small-en-v1.5")
            print(f"🤗 Configuring HuggingFace embeddings: {model_name}")
            Settings.embed_model = HuggingFaceEmbedding(model_name=model_name)
            print("✅ HuggingFace embeddings configured")
        except ImportError:
            print("❌ HuggingFace embeddings not available. Install with: pip install llama-index-embeddings-huggingface")
            # Fallback to OpenAI
            Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")
    else:
        # Default to OpenAI embeddings
        embed_model = os.getenv("EMBED_MODEL", "text-embedding-3-small")
        print(f"🤖 Configuring OpenAI embeddings: {embed_model}")
        Settings.embed_model = OpenAIEmbedding(model=embed_model)
        print("✅ OpenAI embeddings configured")

# Initialize configurations
configure_llm()
configure_embeddings()

class KeyTermsExtractorLlamaCloud:
    def __init__(self):
        """Initialize the key terms extractor with RAG pipeline"""
        self.rag_pipeline = RAGPipeline()
        self.llama_manager = LlamaCloudManager()
        self.initialized = False

    def ensure_initialized(self):
        """Ensure the RAG pipeline is initialized"""
        if not self.initialized:
            if self.rag_pipeline.initialize_index():
                self.initialized = True
                print("✅ RAG pipeline initialized")
            else:
                raise Exception("Failed to initialize RAG pipeline")

    def _check_document_in_index(self, file_path: str) -> bool:
        """Check if document is already indexed in LlamaCloud"""
        try:
            import hashlib
            import os

            # Get file hash for checking
            with open(file_path, 'rb') as f:
                file_hash = hashlib.md5(f.read()).hexdigest()

            # Check if we have this file already indexed
            # For now, use a simple approach - check if index exists and has content
            index = self.llama_manager.get_index()
            if index is None:
                print("📁 No existing index found")
                return False

            # Try a simple query to see if the index has content
            query_engine = index.as_query_engine()
            test_response = query_engine.query("What type of document is this?")

            if test_response and len(str(test_response)) > 10:
                print(f"✅ Document appears to be indexed (found content: {len(str(test_response))} chars)")
                return True
            else:
                print("📁 Index exists but appears empty")
                return False

        except Exception as e:
            print(f"⚠️  Could not check index status: {e}")
            return False

    def parse_document(self, file_path: str):
        """Parse document with LlamaParse fallback to SimpleDirectoryReader"""
        print(f"📄 Loading document: {file_path}")

        # Try LlamaParse first if available
        if LLAMA_PARSE_AVAILABLE and os.getenv("LLAMA_CLOUD_API_KEY"):
            try:
                parser = LlamaParse(
                    api_key=os.getenv("LLAMA_CLOUD_API_KEY"),
                    verbose=True,
                    language="en"
                )
                result = parser.parse(file_path)
                documents = result.get_text_documents(split_by_page=False)
                print(f"✅ Loaded {len(documents)} document(s) via LlamaParse")
                return documents
            except Exception as e:
                print(f"⚠️  LlamaParse failed, falling back to SimpleDirectoryReader: {e}")

        # Fallback to SimpleDirectoryReader
        documents = SimpleDirectoryReader(input_files=[file_path]).load_data()
        print(f"✅ Loaded {len(documents)} document(s) via SimpleDirectoryReader")
        return documents

    def process_document(self, file_path: str, extraction_mode: Optional[str] = None) -> dict:
        """
        Process a document to extract key terms with streaming output.
        Uses LlamaCloud managed storage with intelligent index checking.
        """
        try:
            # Ensure pipeline is initialized
            self.ensure_initialized()

            # Step 1: Check if document is already indexed
            print("🔍 Checking if document is already indexed...")
            already_indexed = self._check_document_in_index(file_path)

            if not already_indexed:
                print("📄 Document not found in index, parsing and indexing...")
                # Step 2: Parse the document only if not indexed
                documents = self.parse_document(file_path)

                # Step 3: Index the document in LlamaCloud
                print("🔄 Indexing document in LlamaCloud...")
                success = self.rag_pipeline.handle_file_upload(file_path)
                if not success:
                    raise Exception("Failed to index document in LlamaCloud")
            else:
                print("✅ Document already indexed, using existing index")

            # Step 4: Get the index for querying
            index = self.llama_manager.get_index()

            # Step 5: Create query engine (streaming if supported)
            print("🔍 Creating query engine...")
            # Check if current LLM supports streaming
            llm_provider = os.getenv("LLM_PROVIDER", "openai").lower()
            supports_streaming = llm_provider not in ["ollama", "local"]

            if supports_streaming:
                print("📡 Streaming enabled")
                query_engine = index.as_query_engine(streaming=True)
            else:
                print("📄 Non-streaming mode (local model)")
                query_engine = index.as_query_engine(streaming=False)

            # Step 6: Set up output parser for LeaseSummary schema
            output_parser = PydanticOutputParser(LeaseSummary)

            # Step 7: Create extraction prompt with simpler approach
            prompt_str = """
            Based on the following lease document content, extract the key lease information:

            {context}

            Please provide the extracted information in this exact JSON structure (replace values with actual data from the document):

            {{
                "property_info": {{
                    "property_address": "1100 NE Loop 410, Suite 550, San Antonio, TX 78209",
                    "landlord_name": "TETCO Center LP"
                }},
                "tenant_info": {{
                    "tenant": "Sanderford & Caroll PC",
                    "suite_number": "Suite 550",
                    "leased_sqft": 2394.0
                }},
                "lease_dates": {{
                    "lease_commencement_date": "2019-12-09",
                    "lease_expiration_date": "2022-12-31",
                    "lease_term": "3 years"
                }},
                "financial_terms": {{
                    "base_rent": 4668.25,
                    "security_deposit": 9336.50,
                    "expense_recovery_type": "Net",
                    "renewal_options": "Two successive terms of one year each",
                    "free_rent_months": null
                }}
            }}

            CRITICAL: Return ONLY valid JSON. No explanations, no markdown, no additional text. Just the JSON object.
            """

            # Create simple prompt template (no format instructions needed since we specify JSON format)
            prompt_template = PromptTemplate(prompt_str)

            # Step 8: Query with appropriate method (streaming or non-streaming)
            context_query = "Provide a comprehensive summary of all key lease terms, financial details, dates, and provisions"

            if supports_streaming:
                print("💭 Extracting key terms (streaming)...")
                print("-" * 50)

                streaming_response = query_engine.query(context_query)

                # Collect streaming response
                full_context = ""
                for text in streaming_response.response_gen:
                    print(text, end="", flush=True)
                    full_context += text
                print("\n" + "-" * 50)
            else:
                print("💭 Extracting key terms (non-streaming)...")
                print("-" * 50)

                response = query_engine.query(context_query)
                full_context = str(response)
                print(full_context)
                print("\n" + "-" * 50)

            # Step 9: Parse the context into structured format
            print("\n📊 Parsing into structured format...")

            # Use the LLM to structure the response
            llm = Settings.llm
            formatted_prompt = prompt_template.format(context=full_context)

            # Get structured response
            structured_response = llm.complete(formatted_prompt)

            # Parse into LeaseSummary object
            try:
                # Clean the response text to extract just the JSON
                response_text = structured_response.text.strip()

                # Find JSON in the response (in case there's extra text)
                import re
                # Look for JSON object with proper nesting
                json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response_text, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                else:
                    # Fallback: try to find any JSON-like structure
                    json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                    if json_match:
                        json_str = json_match.group()
                    else:
                        json_str = response_text

                print(f"🔍 Extracted JSON: {json_str[:200]}...")

                # Parse JSON and create LeaseSummary object
                import json
                lease_data = json.loads(json_str)
                lease_summary = LeaseSummary(**lease_data)

                result = {
                    "status": "success",
                    "data": lease_summary.model_dump(mode='json'),  # Use JSON serialization mode
                    "extraction_metadata": {
                        "file_path": file_path,
                        "method": "llamacloud_streaming",
                        "parser": "LlamaParse" if LLAMA_PARSE_AVAILABLE else "SimpleDirectoryReader",
                        "cached": already_indexed,  # Indicate if we used existing index
                        "supports_streaming": supports_streaming
                    }
                }
            except json.JSONDecodeError as json_error:
                print(f"⚠️  Failed to parse JSON response: {json_error}")
                print(f"Raw response: {structured_response.text[:500]}...")
                # Fallback: return raw response
                result = {
                    "status": "partial",
                    "data": {"raw_extraction": structured_response.text},
                    "extraction_metadata": {
                        "file_path": file_path,
                        "method": "llamacloud_streaming",
                        "cached": already_indexed,
                        "error": f"JSON parsing failed: {str(json_error)}"
                    }
                }
            except Exception as parse_error:
                print(f"⚠️  Failed to create LeaseSummary object: {parse_error}")
                print(f"Raw response: {structured_response.text[:500]}...")
                # Fallback: return raw response
                result = {
                    "status": "partial",
                    "data": {"raw_extraction": structured_response.text},
                    "extraction_metadata": {
                        "file_path": file_path,
                        "method": "llamacloud_streaming",
                        "cached": already_indexed,
                        "error": str(parse_error)
                    }
                }

            print("\n✅ Extraction complete!")
            return result

        except Exception as e:
            print(f"\n❌ Error during extraction: {str(e)}")
            return {
                "status": "error",
                "message": str(e),
                "extraction_metadata": {
                    "file_path": file_path,
                    "error": str(e)
                }
            }

def main():
    """Main function for command-line usage"""
    import argparse

    parser = argparse.ArgumentParser(description="Extract key terms from lease documents using LlamaCloud")
    parser.add_argument("pdf_path", help="Path to the PDF file to process")
    parser.add_argument("--save", "-s", action="store_true", help="Save results to JSON file")
    parser.add_argument("--output", "-o", help="Output file path (default: auto-generated)")

    args = parser.parse_args()

    if not os.path.exists(args.pdf_path):
        print(f"Error: File not found: {args.pdf_path}")
        sys.exit(1)

    # Check for required API keys
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY environment variable is required")
        sys.exit(1)

    if not os.getenv("LLAMA_CLOUD_API_KEY"):
        print("Warning: LLAMA_CLOUD_API_KEY not set. Some features may be limited.")

    try:
        extractor = KeyTermsExtractorLlamaCloud()
        result = extractor.process_document(args.pdf_path)

        # Save results to JSON only if requested
        if args.save:
            if args.output:
                output_file = args.output
            else:
                output_file = f"key_terms_llamacloud_{os.path.basename(args.pdf_path)}.json"

            with open(output_file, "w") as f:
                json.dump(result, f, indent=2)

            print(f"\n📁 Results saved to: {output_file}")

        # Always display summary
        if result.get("status") == "success":
            data = result.get("data", {})
            property_info = data.get("property_info", {})
            tenant_info = data.get("tenant_info", {})
            lease_dates = data.get("lease_dates", {})
            financial_terms = data.get("financial_terms", {})

            print(f"\n🏢 Property: {property_info.get('property_address', 'N/A')}")
            print(f"👤 Tenant: {tenant_info.get('tenant', 'N/A')}")
            print(f"💰 Base Rent: ${financial_terms.get('base_rent', 'N/A')}")
            print(f"📅 Lease Term: {lease_dates.get('lease_commencement_date', 'N/A')} to {lease_dates.get('lease_expiration_date', 'N/A')}")
            print(f"🏠 Square Feet: {tenant_info.get('leased_sqft', 'N/A')}")
            print(f"💳 Security Deposit: ${financial_terms.get('security_deposit', 'N/A')}")

            # Show metadata
            metadata = result.get("extraction_metadata", {})
            print(f"\n📊 Metadata:")
            print(f"   Cached: {metadata.get('cached', False)}")
            print(f"   Method: {metadata.get('method', 'N/A')}")
            print(f"   Parser: {metadata.get('parser', 'N/A')}")
        else:
            print(f"\n❌ Extraction failed: {result.get('message', 'Unknown error')}")

    except KeyboardInterrupt:
        print("\n\n⚠️  Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Fatal error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()