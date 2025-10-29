# Local RAG Lease Extraction Guide

This guide explains the local RAG-based lease data extraction capabilities in this repository.

## Architecture Overview

The system supports **three extraction methods** with different trade-offs:

### 1. KeyTermsExtractor (Hybrid Local + Cloud)
**File**: `key_terms_extractor.py`

**How it works**:
- Uses **LlamaCloud** for document indexing and vector storage (with caching)
- Performs **local RAG retrieval** to get relevant context from documents
- Uses **OpenAI GPT-4o-mini** locally for structured extraction
- Supports **streaming output** for real-time progress
- Parses documents with **LlamaParse** (cloud) or **SimpleDirectoryReader** (local fallback)

**Pros**:
- Streaming output provides real-time feedback
- Leverages LlamaCloud's caching for faster repeated queries
- More control over the extraction prompt and process
- Can be customized locally

**Cons**:
- Requires both OpenAI and LlamaCloud API keys
- Still depends on cloud services for indexing

**Best for**: Development, testing, and scenarios where you need streaming feedback

---

### 2. LeaseSummaryExtractor (Cloud-Based)
**File**: `lease_summary_extractor.py`

**How it works**:
- Uses **LlamaExtract cloud agents** (managed extraction service)
- Pre-configured agent with `LeaseSummary` schema
- Multimodal extraction mode with reasoning and source citations
- No local processing required

**Pros**:
- Simple API - just call `process_document()`
- Managed service handles optimization
- Consistent results across runs

**Cons**:
- Less control over extraction process
- No streaming support
- Dependent on cloud service availability

**Best for**: Production deployments with high volume

---

### 3. RiskFlagsExtractor (Cloud-Based)
**File**: `risk_flags/risk_flags_extractor.py`

**How it works**:
- Uses **LlamaExtract cloud agents** for risk analysis
- Pre-configured agent with `RiskFlagsSchema`
- Identifies 15+ types of lease risk flags
- Multimodal extraction with reasoning

**Pros**:
- Specialized for risk/compliance analysis
- Structured categorization of risks
- Confidence scores for each flag

**Cons**:
- Cloud-dependent
- No streaming support

**Best for**: Compliance and risk assessment workflows

---

## Data Schema

### LeaseSummary Schema
Defined in `lease_summary_agent_schema.py`:

```python
{
  "property_info": {
    "property_address": "string",
    "landlord_name": "string"
  },
  "tenant_info": {
    "tenant": "string",
    "suite_number": "string",
    "leased_sqft": float
  },
  "lease_dates": {
    "lease_commencement_date": "YYYY-MM-DD",
    "lease_expiration_date": "YYYY-MM-DD",
    "lease_term": "string"
  },
  "financial_terms": {
    "base_rent": float,
    "security_deposit": float,
    "rent_escalations": RentEscalationSchema,
    "expense_recovery_type": "Net" | "Stop Amount" | "Gross",
    "renewal_options": "string",
    "free_rent_months": int
  }
}
```

### RiskFlagsSchema
Defined in `risk_flags/risk_flags_schema.py`:

```python
{
  "risk_flags": [
    {
      "category": "string",
      "title": "string",
      "description": "string"
    }
  ]
}
```

**15 Risk Flag Types**:
1. Early Termination Clauses
2. Uncapped or Vague Operating Expenses
3. Ambiguous Maintenance and Upgrade Obligations
4. Excessive Service Charges Without Transparency or Caps
5. Hidden Fees
6. Restrictive Use Clauses
7. Do Not Compete Clauses
8. Ambiguous or Vague Language
9. Landlord's Right to Terminate
10. Tenant Insurance Requirements
11. Indemnification Clauses
12. Unfavorable Renewal Terms
13. Holdover Penalties
14. Sublease Restrictions
15. Assignment Clauses

---

## RAG Pipeline Details

### RAGPipeline Class
**File**: `rag_pipeline.py`

**Components**:
1. **Sentence Splitter**: Chunks documents into sentences
2. **HuggingFace Embeddings**: Uses `BAAI/bge-small-en-v1.5` model
3. **SimpleDocumentStore**: In-memory document storage
4. **LlamaCloudIndex**: Managed vector index in cloud

**Methods**:
- `initialize_index()`: Initializes the LlamaCloud index
- `handle_file_upload(file_path)`: Indexes a document
- `query_index(query_text)`: Queries the RAG index
- `background_index_existing_documents()`: Batch indexes all documents in `uploaded_documents/`

**Storage**:
- Vector embeddings stored in **LlamaCloud** (managed)
- Local document cache in **ChromaDB** (`chroma_db/` directory)

---

## Step-by-Step Extraction Workflow

### Using KeyTermsExtractor (Recommended for Local Control)

```python
from key_terms_extractor import KeyTermsExtractor

# 1. Initialize extractor
extractor = KeyTermsExtractor()

# 2. Process document (with streaming)
result = extractor.process_document("path/to/lease.pdf")

# 3. Check results
if result["status"] == "success":
    data = result["data"]
    # Access structured fields
    property_address = data["property_info"]["property_address"]
    base_rent = data["financial_terms"]["base_rent"]
    # ... etc
```

**What happens internally**:
1. **Parse**: Document is parsed with LlamaParse or SimpleDirectoryReader
2. **Index**: Document is indexed in LlamaCloud for vector storage
3. **Query**: RAG retrieval finds relevant context (streaming)
4. **Extract**: OpenAI GPT-4o-mini structures the context into JSON
5. **Validate**: Pydantic validates and parses into `LeaseSummary` object

---

## Environment Variables Required

```bash
# Required for KeyTermsExtractor
OPENAI_API_KEY=your_openai_api_key
LLAMA_CLOUD_API_KEY=your_llama_cloud_api_key
LLAMA_CLOUD_ORG_ID=your_org_id

# Optional for observability
PHOENIX_API_KEY=your_llamatrace_api_key  # For LlamaTrace Phoenix tracing
```

---

## Command-Line Usage

### Extract with KeyTermsExtractor
```bash
# Basic extraction (prints to console)
python key_terms_extractor.py path/to/lease.pdf

# Save results to JSON file
python key_terms_extractor.py path/to/lease.pdf --save

# Custom output file
python key_terms_extractor.py path/to/lease.pdf --save -o output.json
```

### Extract with LeaseSummaryExtractor
```bash
python lease_summary_extractor.py path/to/lease.pdf
```

### Extract Risk Flags
```bash
python risk_flags/risk_flags_extractor.py path/to/lease.pdf
```

### Run Complete Workflow
```bash
# Processes all PDFs in data/ directory
python extract_lease_workflow.py
```

This uses LlamaIndex Workflow to orchestrate both summary and risk flag extraction:
- Reads all PDFs from `data/` directory
- Extracts both lease summaries and risk flags
- Saves combined results to `extraction_results/extraction_results.json`

---

## Testing

### Test KeyTermsExtractor
```bash
python test_key_terms_extractor.py        # Run all tests
python test_key_terms_extractor.py cli    # Test CLI only
python test_key_terms_extractor.py api    # Test API only
python test_key_terms_extractor.py stream # Test streaming only
```

### Test RAG Pipeline
```bash
pytest tests/test_rag_pipeline.py
```

---

## API Endpoints (Flask Server)

When running `flask_server.py`, these endpoints are available:

```
POST /extract-key-terms       # Non-streaming KeyTerms extraction
POST /stream-key-terms        # Streaming KeyTerms extraction (SSE)
POST /extract-summary         # LlamaSummary extraction
POST /extract-risk-flags      # Risk flags extraction
POST /stream-risk-flags       # Streaming risk flags (SSE)
POST /index                   # Index document in RAG
GET  /query                   # Query RAG index
```

---

## Workflow Orchestration

### ExtractLeaseWorkflow
**File**: `extract_lease_workflow.py`

A **LlamaIndex Workflow** that orchestrates complete lease extraction:

```python
from extract_lease_workflow import ExtractLease
import asyncio

async def main():
    workflow = ExtractLease(timeout=300, verbose=True)
    result = await workflow.run()
    print(f"Processed {len(result['extractions'])} documents")

asyncio.run(main())
```

**Steps**:
1. **Start**: Initializes extractors (summary + risk flags)
2. **Extract**: Processes all PDFs in `data/` directory
3. **Save**: Writes results to `extraction_results/extraction_results.json`
4. **End**: Returns aggregated results

---

## File Organization

```
atlas-lease-extractor/
├── rag_pipeline.py                    # RAG pipeline with LlamaCloud
├── key_terms_extractor.py             # Hybrid local/cloud extractor
├── lease_summary_extractor.py         # Cloud-based summary extractor
├── extract_lease_workflow.py          # Workflow orchestrator
├── llama_cloud_manager.py             # LlamaCloud service manager
│
├── lease_summary_agent_schema.py      # Pydantic schema for lease data
├── rent_escalation_schema.py          # Rent escalation sub-schema
│
├── risk_flags/
│   ├── risk_flags_extractor.py        # Risk flags extractor
│   └── risk_flags_schema.py           # Risk flags Pydantic schema
│
├── data/                              # Input PDFs
├── extraction_results/                # Output JSON files
├── uploaded_documents/                # Uploaded files
└── chroma_db/                         # ChromaDB vector storage
```

---

## Observability with Phoenix

The extractors support **LlamaTrace Phoenix** for tracing:

1. Sign up at https://llamatrace.com
2. Set `PHOENIX_API_KEY` in `.env`
3. All LlamaIndex operations are automatically traced

This provides:
- Request/response logging
- Token usage tracking
- Latency monitoring
- Error tracking

---

## Performance Characteristics

### KeyTermsExtractor
- **Parsing**: 5-15 seconds (LlamaParse) or 1-3 seconds (SimpleDirectoryReader)
- **Indexing**: 10-30 seconds (first time), cached thereafter
- **Extraction**: 20-60 seconds (streaming)
- **Total**: ~35-105 seconds per document

### LeaseSummaryExtractor
- **Extraction**: 30-90 seconds per document
- **Total**: ~30-90 seconds (managed service)

### RiskFlagsExtractor
- **Extraction**: 40-120 seconds per document (more complex analysis)
- **Total**: ~40-120 seconds

---

## Best Practices

1. **Use KeyTermsExtractor for development**: Provides streaming feedback and more control
2. **Use LeaseSummaryExtractor for production**: More reliable and consistent
3. **Cache aggressively**: LlamaCloud handles caching automatically
4. **Monitor with Phoenix**: Track performance and errors
5. **Validate results**: Always validate Pydantic schemas
6. **Handle errors gracefully**: Network issues can occur with cloud services

---

## Troubleshooting

### "Failed to initialize RAG pipeline"
- Check `LLAMA_CLOUD_API_KEY` and `LLAMA_CLOUD_ORG_ID` are set
- Verify API key has access to the project

### "OpenAI API error"
- Check `OPENAI_API_KEY` is valid and has credits
- Verify network connectivity

### "LlamaParse not available"
- Falls back to SimpleDirectoryReader automatically
- SimpleDirectoryReader has lower quality parsing

### Slow extraction
- First run is slower due to indexing
- Subsequent runs use cached embeddings
- Consider using LeaseSummaryExtractor for production

---

## Future Enhancements

Potential improvements for truly local extraction:

1. **Local embeddings**: Replace LlamaCloud with local Chroma/Qdrant
2. **Local LLM**: Use Ollama/vLLM instead of OpenAI
3. **Local parsing**: Use PyPDF2/pdfplumber instead of LlamaParse
4. **Offline mode**: Complete air-gapped operation

This would require modifying:
- `rag_pipeline.py`: Use local vector DB
- `key_terms_extractor.py`: Use local LLM
- Remove LlamaCloud dependencies
