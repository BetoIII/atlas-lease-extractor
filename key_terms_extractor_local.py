#!/usr/bin/env python3
"""
Local Vector-Enhanced Key Terms Extractor
Uses ChromaDB for local vector indexing and retrieval to improve extraction accuracy.
Primarily uses local processing but falls back to LlamaParse OCR for scanned documents.
"""

import os
import json
import hashlib
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
import chromadb
from chromadb.config import Settings
import pypdf

# Try to import LlamaParse for OCR fallback
try:
    from llama_cloud_services import LlamaParse
    LLAMA_PARSE_AVAILABLE = True
except ImportError:
    LLAMA_PARSE_AVAILABLE = False
    print("⚠️  LlamaParse not available. OCR capabilities limited.")

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
        print("✅ Phoenix tracing initialized for local extractor")
    except Exception as e:
        print(f"⚠️  Phoenix setup failed: {e}")

from llama_index.core import Settings as LlamaSettings, Document
from llama_index.llms.openai import OpenAI
from llama_index.core.program import LLMTextCompletionProgram
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core import VectorStoreIndex, StorageContext
from pydantic import BaseModel, Field

# Try to import Ollama LLM with fallback
try:
    from llama_index.llms.ollama import Ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False
    print("⚠️  Ollama not available. Will use OpenAI only.")

class KeyTermsResponse(BaseModel):
    """Schema for key terms extraction with confidence scores"""
    lease_summary: str = Field(description="Brief summary of the lease agreement")
    property_address: str = Field(description="Property address")
    landlord: str = Field(description="Landlord name")
    tenant: str = Field(description="Tenant name") 
    lease_term: str = Field(description="Lease term dates")
    rent_amount: str = Field(description="Rent amount and schedule")
    security_deposit: str = Field(description="Security deposit amount")
    renewal_options: str = Field(description="Renewal options if any")

class DocumentChunk(BaseModel):
    """Represents a document chunk with metadata"""
    text: str
    chunk_id: str
    page_number: int
    section_type: str
    confidence: float = 0.0

def _configure_llm_for_local():
    """Configure LLM for local processing, respecting eval manager configuration"""
    # Check if Settings.llm is already configured (by eval_manager)
    if hasattr(LlamaSettings, 'llm') and LlamaSettings.llm is not None:
        print(f"📋 Using pre-configured LLM: {type(LlamaSettings.llm).__name__}")
        return LlamaSettings.llm
    
    # Fallback configuration for standalone usage
    if OLLAMA_AVAILABLE:
        try:
            # Try to use local Ollama model first
            llm = Ollama(
                model="llama3.1:8b",
                temperature=0.1,
                request_timeout=180.0,
                base_url="http://localhost:11434",
                additional_kwargs={
                    "num_predict": 2048,
                    "num_ctx": 4096,
                }
            )
            print("🦙 Using local Ollama model for extraction")
            return llm
        except Exception as e:
            print(f"⚠️  Ollama not available ({e}), falling back to OpenAI")
    else:
        print("⚠️  Ollama not installed, using OpenAI")
    
    return OpenAI(model="gpt-4o-mini", temperature=0.1, max_tokens=2048)

def _get_document_hash(file_path: str) -> str:
    """Generate SHA-256 hash of document content"""
    with open(file_path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()[:16]

def _parse_pdf_with_llm(file_path: str, llm) -> List[DocumentChunk]:
    """Parse PDF using pypdf + LLM enhancement, with OCR fallback for scanned documents"""
    chunks = []
    
    try:
        # First attempt: pypdf for text-based PDFs
        with open(file_path, 'rb') as file:
            pdf_reader = pypdf.PdfReader(file)
            
            for page_num, page in enumerate(pdf_reader.pages, 1):
                raw_text = page.extract_text()
                
                if raw_text.strip():
                    # Use LLM to clean and structure the text
                    clean_prompt = f"""
Clean and structure this PDF text extract. Remove formatting artifacts, 
fix broken words, and organize into coherent paragraphs. Preserve all 
important information but make it readable:

Raw text:
{raw_text[:2000]}

Return only the cleaned text without any additional commentary.
"""
                    
                    try:
                        cleaned_text = str(llm.complete(clean_prompt))
                        
                        # Create chunks from cleaned text (500-1000 chars with overlap)
                        text_parts = [cleaned_text[i:i+800] for i in range(0, len(cleaned_text), 700)]
                        
                        for idx, part in enumerate(text_parts):
                            if part.strip():
                                chunk = DocumentChunk(
                                    text=part.strip(),
                                    chunk_id=f"page_{page_num}_chunk_{idx}",
                                    page_number=page_num,
                                    section_type="content"
                                )
                                chunks.append(chunk)
                                
                    except Exception as e:
                        print(f"⚠️  LLM cleaning failed for page {page_num}: {e}")
                        # Fallback to raw text
                        chunk = DocumentChunk(
                            text=raw_text[:800],
                            chunk_id=f"page_{page_num}_raw",
                            page_number=page_num,
                            section_type="raw"
                        )
                        chunks.append(chunk)
        
        # If no text extracted and LlamaParse is available, try OCR
        if not chunks and LLAMA_PARSE_AVAILABLE and os.getenv("LLAMA_CLOUD_API_KEY"):
            print("📸 No text found with pypdf - trying OCR with LlamaParse...")
            try:
                parser = LlamaParse(
                    api_key=os.getenv("LLAMA_CLOUD_API_KEY"),
                    verbose=False,
                    language="en"
                )
                result = parser.parse(file_path)
                documents = result.get_text_documents(split_by_page=True)
                
                for page_num, doc in enumerate(documents, 1):
                    if doc.text.strip():
                        # Create chunks from OCR text
                        text_parts = [doc.text[i:i+800] for i in range(0, len(doc.text), 700)]
                        
                        for idx, part in enumerate(text_parts):
                            if part.strip():
                                chunk = DocumentChunk(
                                    text=part.strip(),
                                    chunk_id=f"ocr_page_{page_num}_chunk_{idx}",
                                    page_number=page_num,
                                    section_type="ocr_content"
                                )
                                chunks.append(chunk)
                
                if chunks:
                    print(f"✅ OCR extracted {len(chunks)} chunks from scanned PDF")
                else:
                    print("❌ OCR extraction also failed - document may be corrupted")
                    
            except Exception as e:
                print(f"❌ OCR extraction failed: {e}")
        
        elif not chunks:
            print("❌ Document appears to be scanned/image-based but OCR not available")
            if not LLAMA_PARSE_AVAILABLE:
                print("💡 Install llama-cloud-services for OCR support")
            elif not os.getenv("LLAMA_CLOUD_API_KEY"):
                print("💡 Set LLAMA_CLOUD_API_KEY for OCR support")
                        
    except Exception as e:
        print(f"❌ PDF parsing failed: {e}")
        return []
    
    print(f"📄 Extracted {len(chunks)} chunks from PDF")
    return chunks

def _parse_text_file(file_path: str) -> List[DocumentChunk]:
    """Parse text file into chunks"""
    chunks = []
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
        # Create chunks from text content
        text_parts = [content[i:i+800] for i in range(0, len(content), 700)]
        
        for idx, part in enumerate(text_parts):
            if part.strip():
                chunk = DocumentChunk(
                    text=part.strip(),
                    chunk_id=f"text_chunk_{idx}",
                    page_number=1,
                    section_type="content"
                )
                chunks.append(chunk)
                
    except Exception as e:
        print(f"❌ Text file parsing failed: {e}")
        return []
    
    print(f"📄 Extracted {len(chunks)} chunks from text file")
    return chunks

class LocalKeyTermsExtractor:
    """Local vector-enhanced key terms extractor"""
    
    def __init__(self):
        """Initialize the extractor with local components"""
        print("🔧 Initializing local vector-enhanced key terms extractor")
        
        # Initialize ChromaDB client
        self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        
        # Initialize embedding model
        try:
            self.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
            print("🤗 Using HuggingFace embeddings")
        except Exception as e:
            print(f"⚠️  HuggingFace embeddings failed: {e}")
            self.embed_model = None
        
        # Configure LLM
        self.llm = _configure_llm_for_local()
        
        # Index registry
        self.registry_path = "local_indexes"
        self.registry_file = os.path.join(self.registry_path, "index_registry.json")
        os.makedirs(self.registry_path, exist_ok=True)
        self.index_registry = self._load_index_registry()
        
        # Key terms search queries
        self.search_queries = [
            "property address location premises",
            "landlord lessor owner name entity",
            "tenant lessee renter name entity",
            "lease term duration start end dates",
            "rent payment amount monthly schedule",
            "security deposit amount",
            "renewal options extensions lease term"
        ]
    
    def _load_index_registry(self) -> Dict[str, Any]:
        """Load the index registry from disk"""
        if os.path.exists(self.registry_file):
            try:
                with open(self.registry_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠️  Could not load index registry: {e}")
        return {}
    
    def _save_index_registry(self):
        """Save the index registry to disk"""
        try:
            with open(self.registry_file, 'w') as f:
                json.dump(self.index_registry, f, indent=2)
        except Exception as e:
            print(f"⚠️  Could not save index registry: {e}")
    
    def _get_collection_name(self, doc_hash: str) -> str:
        """Generate ChromaDB collection name"""
        return f"kt_doc_{doc_hash}"
    
    def _index_document(self, file_path: str, doc_hash: str) -> bool:
        """Index document chunks in ChromaDB"""
        try:
            print(f"📚 Indexing document: {os.path.basename(file_path)}")
            
            # Parse document into chunks
            if file_path.lower().endswith('.pdf'):
                chunks = _parse_pdf_with_llm(file_path, self.llm)
            else:
                chunks = _parse_text_file(file_path)
            
            if not chunks:
                print("❌ No chunks extracted from document")
                return False
            
            if not self.embed_model:
                print("❌ No embedding model available")
                return False
            
            # Create ChromaDB collection
            collection_name = self._get_collection_name(doc_hash)
            
            try:
                # Delete existing collection if it exists
                self.chroma_client.delete_collection(collection_name)
            except:
                pass
            
            collection = self.chroma_client.create_collection(
                name=collection_name,
                metadata={"hnsw:space": "cosine"}
            )
            
            # Prepare documents for indexing
            documents = []
            metadatas = []
            ids = []
            
            for chunk in chunks:
                documents.append(chunk.text)
                metadatas.append({
                    "chunk_id": chunk.chunk_id,
                    "page_number": chunk.page_number,
                    "section_type": chunk.section_type,
                    "file_path": file_path
                })
                ids.append(chunk.chunk_id)
            
            # Add to collection
            collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            
            # Update registry
            from datetime import datetime
            self.index_registry[doc_hash] = {
                "file_path": file_path,
                "collection_name": collection_name,
                "total_chunks": len(chunks),
                "indexed_at": datetime.now().isoformat()
            }
            self._save_index_registry()
            
            print(f"✅ Indexed {len(chunks)} chunks in collection {collection_name}")
            return True
            
        except Exception as e:
            print(f"❌ Document indexing failed: {e}")
            return False
    
    def _retrieve_relevant_chunks(self, doc_hash: str, queries: List[str], n_results: int = 3) -> List[Dict[str, Any]]:
        """Retrieve relevant chunks using vector search"""
        try:
            collection_name = self._get_collection_name(doc_hash)
            collection = self.chroma_client.get_collection(collection_name)
            
            all_results = []
            
            for query in queries:
                try:
                    results = collection.query(
                        query_texts=[query],
                        n_results=n_results
                    )
                    
                    if results and results['documents']:
                        for i, doc in enumerate(results['documents'][0]):
                            result = {
                                'text': doc,
                                'metadata': results['metadatas'][0][i] if results['metadatas'] else {},
                                'distance': results['distances'][0][i] if results['distances'] else 1.0,
                                'query': query
                            }
                            all_results.append(result)
                            
                except Exception as e:
                    print(f"⚠️  Query failed for '{query}': {e}")
                    continue
            
            # Remove duplicates and sort by relevance
            seen_ids = set()
            unique_results = []
            for result in all_results:
                chunk_id = result['metadata'].get('chunk_id', '')
                if chunk_id not in seen_ids:
                    seen_ids.add(chunk_id)
                    unique_results.append(result)
            
            # Sort by distance (lower is better)
            unique_results.sort(key=lambda x: x['distance'])
            
            print(f"🔍 Retrieved {len(unique_results)} relevant chunks")
            return unique_results[:15]  # Top 15 most relevant
            
        except Exception as e:
            print(f"❌ Chunk retrieval failed: {e}")
            return []
    
    def process_document(self, file_path: str) -> Dict[str, Any]:
        """Process document with local vector enhancement"""
        try:
            print(f"🔍 Processing document: {os.path.basename(file_path)}")
            
            # Generate document hash
            doc_hash = _get_document_hash(file_path)
            
            # Check if already indexed
            was_cached = doc_hash in self.index_registry
            if not was_cached:
                print("📚 Document not in cache, indexing...")
                if not self._index_document(file_path, doc_hash):
                    print("⚠️  Indexing failed, falling back to simple extraction")
                    return self._fallback_extraction(file_path)
            else:
                print("📋 Using cached index")
            
            # Retrieve relevant chunks
            relevant_chunks = self._retrieve_relevant_chunks(doc_hash, self.search_queries)
            
            if not relevant_chunks:
                print("⚠️  No relevant chunks found, falling back to simple extraction")
                return self._fallback_extraction(file_path)
            
            # Assemble context from retrieved chunks
            context_text = "\n\n".join([
                f"[Chunk from page {chunk['metadata'].get('page_number', '?')}]: {chunk['text']}"
                for chunk in relevant_chunks
            ])
            
            # Create enhanced extraction program
            program = LLMTextCompletionProgram.from_defaults(
                output_cls=KeyTermsResponse,
                prompt_template_str="""
You are a lease analyst. Extract key terms from this lease document using the provided context.

CONTEXT FROM DOCUMENT:
{context_text}

Based on the context above, extract the following information:
- lease_summary: Brief summary of the lease agreement
- property_address: Full property address
- landlord: Landlord name/entity
- tenant: Tenant name/entity  
- lease_term: Start and end dates
- rent_amount: Rent amount and payment schedule
- security_deposit: Security deposit amount
- renewal_options: Any renewal options or extensions

If information is not found in the context, use "Not specified" or "N/A".
Be specific and include details when available.

Return JSON format only.
""",
                llm=self.llm,
                verbose=False
            )
            
            # Execute extraction
            print("🔍 Extracting key terms with vector context...")
            response = program(context_text=context_text[:6000])  # Limit context size
            
            # Convert to dict and add source attribution
            result = response.model_dump()
            
            # Add metadata
            source_attribution = {}
            for field in result.keys():
                # Find chunks that likely contributed to this field
                field_chunks = [c for c in relevant_chunks[:5] if any(
                    keyword in c['text'].lower() for keyword in [
                        field.replace('_', ' '), 
                        'address' if 'address' in field else '',
                        'landlord' if 'landlord' in field else '',
                        'tenant' if 'tenant' in field else '',
                        'rent' if 'rent' in field else '',
                        'deposit' if 'deposit' in field else ''
                    ]
                )]
                
                if field_chunks:
                    source_attribution[field] = {
                        "chunks": [c['metadata'].get('chunk_id', '') for c in field_chunks[:2]],
                        "confidence": round(1.0 - min(c['distance'] for c in field_chunks), 2),
                        "page_numbers": list(set(c['metadata'].get('page_number', 0) for c in field_chunks))
                    }
            
            print("✅ Local vector-enhanced extraction complete")
            
            return {
                "status": "success",
                "data": result,
                "source_attribution": source_attribution,
                "extraction_metadata": {
                    "extractor_type": "local_vector_enhanced",
                    "document_hash": doc_hash,
                    "was_cached": was_cached,
                    "total_chunks_retrieved": len(relevant_chunks),
                    "index_info": self.index_registry.get(doc_hash, {})
                }
            }
            
        except Exception as e:
            print(f"❌ Error in local vector extraction: {e}")
            return self._fallback_extraction(file_path)
    
    def _fallback_extraction(self, file_path: str) -> Dict[str, Any]:
        """Fallback to simple extraction if vector indexing fails"""
        try:
            print("🔄 Using fallback extraction method")
            
            # Simple text extraction
            if file_path.lower().endswith('.pdf'):
                chunks = _parse_pdf_with_llm(file_path, self.llm)
                document_text = " ".join([chunk.text for chunk in chunks[:3]])  # First 3 chunks
            else:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    document_text = f.read()[:4000]
            
            # Simple extraction program
            program = LLMTextCompletionProgram.from_defaults(
                output_cls=KeyTermsResponse,
                prompt_template_str="""
You are a lease analyst. Extract key terms from this lease document excerpt.

Document excerpt:
{document_text}

Extract the following information:
- lease_summary: Brief summary of the lease
- property_address: Full property address
- landlord: Landlord name/entity
- tenant: Tenant name/entity  
- lease_term: Start and end dates
- rent_amount: Rent amount and payment schedule
- security_deposit: Security deposit amount
- renewal_options: Any renewal options or extensions

If information is not found, use "Not specified" or "N/A".
""",
                llm=self.llm,
                verbose=False
            )
            
            response = program(document_text=document_text)
            result = response.model_dump()
            
            return {
                "status": "success",
                "data": result,
                "extraction_metadata": {
                    "extractor_type": "fallback_simple",
                    "fallback_reason": "Vector indexing unavailable"
                }
            }
            
        except Exception as e:
            print(f"❌ Fallback extraction failed: {e}")
            return {
                "status": "error",
                "message": f"All extraction methods failed: {str(e)}",
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

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python key_terms_extractor_local.py <path_to_document>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    extractor = LocalKeyTermsExtractor()
    try:
        result = extractor.process_document(file_path)
        print("\nExtraction Result:")
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)