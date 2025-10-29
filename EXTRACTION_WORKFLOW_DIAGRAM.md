# Local RAG Extraction Workflow Diagrams

## KeyTermsExtractor Workflow (Hybrid Local + Cloud)

```
┌─────────────────────────────────────────────────────────────────────┐
│                      KEYTERMS EXTRACTOR WORKFLOW                    │
└─────────────────────────────────────────────────────────────────────┘

Input: lease.pdf
    │
    ▼
┌──────────────────────┐
│  1. DOCUMENT PARSING │
│                      │  Try LlamaParse (cloud) first
│  - LlamaParse ✓      │  Fallback to SimpleDirectoryReader (local)
│  - SimpleDirectoryRdr│
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  2. INDEX DOCUMENT   │
│                      │  Upload to LlamaCloud for:
│  LlamaCloud Index    │  - Vector storage
│  - HuggingFace embed │  - Caching
│  - Sentence splitter │  - Fast retrieval
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  3. RAG RETRIEVAL    │
│                      │  Query: "Provide comprehensive summary
│  Query Engine        │          of all key lease terms..."
│  - Streaming enabled │
│  - Context gathering │  Returns relevant chunks from document
└──────────┬───────────┘
           │
           ▼  (Streaming output to console)
     Full Context
           │
           ▼
┌──────────────────────┐
│  4. LOCAL EXTRACTION │
│                      │  Prompt: "Extract from context into JSON"
│  OpenAI GPT-4o-mini  │
│  - Format to JSON    │  Uses context to extract structured data
│  - Validate schema   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  5. PYDANTIC PARSE   │
│                      │  Validate and structure into:
│  LeaseSummary schema │  - property_info
│  - PropertyInfo      │  - tenant_info
│  - TenantInfo        │  - lease_dates
│  - LeaseDates        │  - financial_terms
│  - FinancialTerms    │
└──────────┬───────────┘
           │
           ▼
Output: JSON result with status, data, metadata
```

---

## LeaseSummaryExtractor Workflow (Cloud-Based)

```
┌─────────────────────────────────────────────────────────────────────┐
│                   LLAMA SUMMARY EXTRACTOR WORKFLOW                  │
└─────────────────────────────────────────────────────────────────────┘

Input: lease.pdf
    │
    ▼
┌──────────────────────────────────────────┐
│  LlamaExtract Cloud Agent                │
│  (Managed Extraction Service)            │
│                                          │
│  Agent: "atlas-summary-extractor"        │  Pre-configured with:
│  Schema: LeaseSummary                    │  - Multimodal extraction
│  Mode: MULTIMODAL                        │  - Source citations
│  Features:                               │  - Reasoning enabled
│    - use_reasoning: True                 │
│    - cite_sources: True                  │
│    - extraction_target: PER_DOC          │
└──────────────────┬───────────────────────┘
                   │
                   ▼
Output: LeaseSummary object with extracted data
```

---

## RiskFlagsExtractor Workflow (Cloud-Based)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RISK FLAGS EXTRACTOR WORKFLOW                    │
└─────────────────────────────────────────────────────────────────────┘

Input: lease.pdf
    │
    ▼
┌──────────────────────────────────────────┐
│  LlamaExtract Cloud Agent                │
│  (Managed Extraction Service)            │
│                                          │
│  Agent: "atlas-lease-flags"              │  Pre-configured with:
│  Schema: RiskFlagsSchema                 │  - Multimodal extraction
│  Mode: MULTIMODAL                        │  - Source citations
│  Features:                               │  - Reasoning enabled
│    - use_reasoning: True                 │
│    - cite_sources: True                  │
│    - extraction_target: PER_DOC          │
└──────────────────┬───────────────────────┘
                   │
                   ▼
Output: RiskFlagsSchema with list of risk_flags
        (15 possible risk types with confidence scores)
```

---

## Complete Extraction Workflow (extract_lease_workflow.py)

```
┌─────────────────────────────────────────────────────────────────────┐
│                  LLAMAINDEX WORKFLOW ORCHESTRATOR                   │
└─────────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │ StartEvent   │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Initialize  │
                    │  Extractors  │
                    └──────┬───────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
    ┌────────────────────┐  ┌────────────────────┐
    │ LeaseSummary       │  │ RiskFlags          │
    │ Extractor          │  │ Extractor          │
    └────────┬───────────┘  └────────┬───────────┘
             │                       │
             └───────────┬───────────┘
                         │
                         ▼
                 ┌──────────────┐
                 │ Scan data/   │
                 │ directory    │
                 │ for PDFs     │
                 └──────┬───────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼
    lease1.pdf     lease2.pdf     lease3.pdf
         │              │              │
         └──────────────┼──────────────┘
                        │
            For each PDF, extract:
            - Summary data
            - Risk flags
                        │
                        ▼
                ┌──────────────┐
                │ Aggregate    │
                │ Results      │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │ Save to JSON │
                │              │
                │ extraction_  │
                │ results/     │
                └──────┬───────┘
                       │
                       ▼
                  StopEvent
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SYSTEM ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────────┘

┌────────────────┐
│   Frontend     │  Next.js App (port 3000)
│   React UI     │  /try-it-now page
└────────┬───────┘
         │ HTTP POST
         ▼
┌────────────────┐
│ Flask API      │  Flask Server (port 5601)
│ flask_server.py│  - /extract-key-terms
└────────┬───────┘  - /stream-key-terms
         │          - /extract-summary
         │          - /extract-risk-flags
         │
    ┌────┴────┬─────────────┬──────────────┐
    │         │             │              │
    ▼         ▼             ▼              ▼
┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
│KeyTerms│ │Lease   │ │RiskFlags │ │RAG       │
│Extract │ │Summary │ │Extractor │ │Pipeline  │
└────┬───┘ └───┬────┘ └────┬─────┘ └────┬─────┘
     │         │            │            │
     │         │            │            │
     ▼         ▼            ▼            ▼
┌─────────────────────────────────────────────┐
│          EXTERNAL SERVICES                  │
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │ OpenAI API   │      │  LlamaCloud     │ │
│  │              │      │                 │ │
│  │ - GPT-4o-mini│      │ - LlamaParse    │ │
│  │ - Embeddings │      │ - LlamaExtract  │ │
│  │              │      │ - Vector Index  │ │
│  └──────────────┘      └─────────────────┘ │
└─────────────────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │  Local Storage  │
         │                 │
         │ - uploaded_docs/│
         │ - chroma_db/    │
         │ - extraction_   │
         │   results/      │
         └─────────────────┘
```

---

## Comparison Matrix

| Feature | KeyTermsExtractor | LeaseSummaryExtractor | RiskFlagsExtractor |
|---------|-------------------|----------------------|--------------------|
| **Extraction Method** | Hybrid (Local + Cloud) | Cloud Agent | Cloud Agent |
| **Streaming Support** | ✅ Yes | ❌ No | ✅ Yes (via Flask) |
| **Real-time Feedback** | ✅ Yes | ❌ No | ✅ Yes |
| **Local Control** | ✅ High | ❌ Low | ❌ Low |
| **API Dependencies** | OpenAI + LlamaCloud | LlamaCloud | LlamaCloud |
| **Avg Extraction Time** | 35-105s | 30-90s | 40-120s |
| **Caching** | ✅ LlamaCloud | ✅ LlamaCloud | ✅ LlamaCloud |
| **Customization** | ✅ High | ❌ Limited | ❌ Limited |
| **Best Use Case** | Development/Testing | Production | Risk Analysis |
| **Output Format** | Pydantic + JSON | Pydantic | Pydantic |
| **Schema** | LeaseSummary | LeaseSummary | RiskFlagsSchema |

---

## API Keys Required

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ENVIRONMENT VARIABLES                          │
└─────────────────────────────────────────────────────────────────────┘

Required for KeyTermsExtractor:
┌────────────────────────────────────┐
│ OPENAI_API_KEY=sk-...             │  For GPT-4o-mini extraction
│ LLAMA_CLOUD_API_KEY=llx-...       │  For document indexing
│ LLAMA_CLOUD_ORG_ID=...            │  Your org ID
└────────────────────────────────────┘

Required for LeaseSummaryExtractor:
┌────────────────────────────────────┐
│ LLAMA_CLOUD_API_KEY=llx-...       │  For extraction agent
└────────────────────────────────────┘

Required for RiskFlagsExtractor:
┌────────────────────────────────────┐
│ LLAMA_CLOUD_API_KEY=llx-...       │  For extraction agent
└────────────────────────────────────┘

Optional (Observability):
┌────────────────────────────────────┐
│ PHOENIX_API_KEY=...               │  For LlamaTrace tracing
└────────────────────────────────────┘
```
