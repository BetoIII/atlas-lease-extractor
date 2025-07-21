# Atlas Lease Extractor Development Guide

## Project Overview

Atlas Lease Extractor is a full stack application for extracting structured data from commercial real estate lease documents. The backend is a Flask API that orchestrates several LlamaIndex based pipelines for summarization, risk flag detection and asset type classification. A separate index server manages a RAG pipeline. The frontend is a Next.js (React + TypeScript) application in `flask_react/`.

## Repository Structure

```
.
├── flask_server.py          # Main Flask API server
├── index_server.py          # Manager for the RAG pipeline
├── llama_cloud_manager.py   # Helper for LlamaCloud agents
├── asset_type_classification.py
├── lease_summary_extractor.py
├── risk_flags/              # Risk flag extraction utilities
│   ├── risk_flags_extractor.py
│   ├── risk_flags_schema.py
│   └── risk_flags_query_pipeline.py
├── flask_react/             # Next.js frontend
│   ├── app/                 # App router pages and screens
│   ├── components/          # Shared UI components
│   └── hooks/               # React hooks
├── uploaded_documents/      # Created at runtime for file uploads (ignored)
├── persist_dir/             # Vector index persistence (ignored)
├── chroma_db/               # ChromaDB persistence (ignored)
├── requirements.txt         # Python dependencies
├── package.json             # Node helper (xlsx conversion)
└── README.md                # Project documentation
```

## Environment Setup

1. **Python**
   - Python >=3.8
   - Install dependencies: `pip install -r requirements.txt`
   - Copy `.env.example` to `.env` and set `LLAMA_CLOUD_API_KEY` and optional OpenAI keys.
   - Start services in separate terminals:
     ```bash
     # RAG index server
     python index_server.py

     # Flask API server
     python flask_server.py
     ```

2. **Frontend**
   - Node.js >=18
   - Navigate to `flask_react` and run:
     ```bash
     npm install
     npm run dev
     ```
   - The React app expects the Flask server on `http://localhost:5601`.

## Development Guidelines

### Python
- Keep endpoints in `flask_server.py` concise and return JSON with `status` and `message` fields.
- `LlamaCloudManager` centralises access to extraction agents. Update it when modifying agent IDs or configuration.
- Use Pydantic models for all structured outputs (e.g. `LeaseSummary`, `RiskFlagsSchema`).
- Background indexing logic lives in `index_server.py` and `rag_pipeline.py`.
- Uploaded files are stored under `uploaded_documents/` which is excluded from git.

### React/TypeScript
- Uses Next.js 14 with the App Router. Pages are under `flask_react/app/`.
- Common UI components reside in `flask_react/components/ui`.
- State for the Try‑It‑Now workflow is managed via context in `lease-context.tsx`.
- Streaming interactions are handled by the `useStreamingExtraction` hook.
- Tailwind CSS is configured via `tailwind.config.ts`.

## Key Endpoints

- `POST /upload` – save an uploaded document to `uploaded_documents/`.
- `POST /index` – index a document using the RAG pipeline server.
- `POST /extract-summary` – synchronous lease summary extraction.
- `POST /extract-risk-flags` – synchronous risk flag extraction.
- `POST|GET /stream-risk-flags` – SSE streaming of risk flag results.
- `POST|GET /stream-lease-flags-pipeline` – streaming using the internal pipeline.
- `POST /classify-asset-type` – classify asset type of a document.

## Testing

Several utility scripts are provided for quick manual tests:
- `test_risk_flag_endpoints.py` – verifies the `/extract-risk-flags` and `/stream-risk-flags` endpoints.
- `quick_test.py` and `test_batch_ingestion.py` – basic RAG pipeline checks.

Run them directly with Python after starting the Flask server. Example:
```bash
python test_risk_flag_endpoints.py
```

## Adding New Features

1. Update or create Pydantic schemas when introducing new structured outputs.
2. Add new extraction logic under a dedicated module. Keep Flask routes thin and delegate heavy work to helper classes.
3. For React features, colocate page‑level logic in `flask_react/app/...` and reusable components in `flask_react/components`.
4. When extending the streaming system, reuse the patterns in `useStreamingExtraction.ts` and the existing SSE endpoints.

## Reference
- See `README.md` and `README_streaming_integration.md` for detailed explanation of the architecture and streaming flow.
- `RISK_FLAGS_ENDPOINTS_SUMMARY.md` documents the history of the risk flag endpoints.

