# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (Python)
- **Start the index server**: `python index_server.py` (runs on port 5602)
- **Start the main Flask API server**: `python flask_server.py` (runs on port 5601)
- **Install Python dependencies**: `pip install -r requirements.txt`
- **Environment setup**: Copy `.env.example` to `.env` and configure API keys:
  - `OPENAI_API_KEY`
  - `LLAMA_CLOUD_API_KEY`
  - `LLAMA_CLOUD_ORG_ID`
  - **LlamaTrace Phoenix Observability** (optional): Configure Phoenix observability for LLM tracing:
    - `PHOENIX_API_KEY=YOUR_LLAMATRACE_API_KEY` (get from https://llamatrace.com)

### Frontend (Next.js)
- **Start development server**: `cd flask_react && npm run dev` (runs on port 3000)
- **Build for production**: `cd flask_react && npm run build`
- **Lint code**: `cd flask_react && npm run lint`
- **Install dependencies**: `cd flask_react && npm install`

### Testing
- **Test risk flag extraction**: `python test_risk_flag_endpoints.py`
- **Test streaming endpoints**: `python test_streaming_endpoints.py`
- **Test pipeline**: `python test_pipeline.py`

## Architecture Overview

### Dual Server Architecture
The application runs on two separate Python servers:
1. **Flask API Server** (`flask_server.py`) - Main application endpoints on port 5601
2. **Index Server** (`index_server.py`) - RAG pipeline and document indexing on port 5602

The servers communicate via BaseManager for thread-safe operations.

### Key Components

#### Backend Services
- **LlamaCloud Manager** (`llama_cloud_manager.py`) - Manages two specialized extraction agents:
  - `atlas-summary-extractor` - Structured lease data extraction
  - `atlas-lease-flags` - Risk flag analysis and compliance checking
- **RAG Pipeline** (`rag_pipeline.py`) - LlamaIndex-based document processing with ChromaDB
- **Risk Flags Module** (`risk_flags/`) - Specialized risk analysis with its own schema and extractor
- **Asset Type Classification** (`asset_type_classification.py`) - Property type detection

#### Frontend Application
- **Next.js App Router** (`flask_react/app/`) with TypeScript and Tailwind CSS
- **Component Library** based on Radix UI primitives (`flask_react/components/ui/`)
- **Main Workflow** at `/try-it-now` page with multi-step document processing
- **Custom Hooks** (`flask_react/hooks/`) for state management and API integration

### Data Flow
1. Documents uploaded via React frontend
2. Flask API processes files through multiple extraction pipelines
3. LlamaCloud agents extract structured data and risk flags
4. ChromaDB stores document vectors for RAG queries
5. Results displayed with source verification and PDF highlighting

## Key API Endpoints
- `POST /upload` - Document upload and initial processing
- `POST /extract-summary` - Structured lease data extraction
- `POST /extract-risk-flags` - Risk flag analysis
- `POST /stream-risk-flags` - Streaming risk flag extraction
- `POST /classify-asset-type` - Property type classification
- `POST /index` - Document indexing for RAG
- `GET /query` - RAG-based document queries

## Configuration
- **Environment variables** managed in `config.py`
- **Frontend configuration** in `flask_react/next.config.mjs`
- **Database**: ChromaDB for vector storage (local `chroma_db/` directory)
- **File storage**: Local directories `uploaded_documents/` and `extraction_results/`

## Development Notes
- The application uses **streaming extraction** for real-time progress updates
- **Source verification** links extracted data back to specific PDF pages
- **Privacy controls** allow users to configure data sharing preferences
- **Export functionality** supports Excel and CoStar formats
- The codebase includes comprehensive **sample data** for development and testing

## Authentication
- Uses **better-auth** library for authentication
- Database configuration in `flask_react/lib/auth.ts`
- Sign-in/sign-up pages at `/auth/signin` and `/auth/signup`

## Deployment Considerations
- Requires both Python and Node.js servers running simultaneously
- ChromaDB data persists in local directories
- Supports **LlamaTrace Phoenix** observability integration
- **CORS enabled** for React frontend integration