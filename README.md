# Atlas Lease Extractor

A comprehensive AI-powered platform for commercial real estate lease document analysis, designed specifically for appraisers, brokers, and CRE professionals who need accurate, structured lease data extraction.

## Overview

Atlas transforms complex lease documents into clean, audit-ready data through advanced AI extraction pipelines. The platform combines multiple specialized AI agents with a modern web interface to deliver structured lease summaries, risk flag analysis, asset type classification, and source-verified extractions.

## Architecture

### Backend Services

#### Core API Server (`flask_server.py`)
- **Flask-based REST API** with comprehensive endpoint coverage
- **File upload and processing** with secure file handling
- **Multiple extraction pipelines** running in parallel
- **Streaming extraction endpoints** for real-time progress
- **Vector search integration** for document querying
- **CORS-enabled** for React frontend integration

#### LlamaCloud Integration (`llama_cloud_manager.py`)
- **Dual extraction agents**:
  - `atlas-summary-extractor` - Structured lease term extraction
  - `atlas-lease-flags` - Risk flag and compliance analysis
- **Dynamic schema management** with Pydantic models
- **Configurable extraction modes** (balanced, multimodal)
- **Source citation and reasoning** capabilities

#### Index Server (`index_server.py`)
- **Dedicated RAG pipeline server** with lazy initialization
- **Background document indexing** for existing files
- **Thread-safe operations** with connection pooling
- **Status monitoring** and health checks

#### Specialized Extractors
- **Lease Summary Extractor** (`lease_summary_extractor.py`)
  - Tenant and property information
  - Lease dates and terms
  - Financial terms and rent schedules
  - Renewal options and escalations

- **Risk Flags Extractor** (`risk_flags/risk_flags_extractor.py`)
  - Financial exposure and cost uncertainty flags
  - Operational constraints and legal risks
  - Insurance and liability requirements
  - Lease term and renewal issues

- **Asset Type Classification** (`asset_type_classification.py`)
  - Automated property type detection
  - Confidence scoring for classifications
  - Support for office, retail, industrial, multifamily, hospitality, healthcare, and mixed-use properties

### Frontend Application

#### Next.js React Interface (`flask_react/`)
- **Modern TypeScript/React application** with Tailwind CSS
- **Component-based architecture** using Radix UI primitives
- **Responsive design** optimized for professional workflows

#### Key Pages and Components
- **Landing Page** (`app/page.tsx`) - Marketing and feature overview
- **Try It Now Interface** (`app/try-it-now/page.tsx`) - Main application workflow
- **File Uploader** - Secure document upload with validation
- **Results Viewer** - Comprehensive extraction results display
- **Source Verification Panel** - PDF highlighting with source traceability
- **Risk Flags Display** - Categorized risk analysis
- **Asset Type Classification** - Property type detection with reclassification
- **Privacy Settings** - Data handling and compliance controls

#### Advanced Features
- **Streaming extraction progress** with real-time updates
- **PDF viewer integration** with highlighted source regions
- **Export capabilities** to Excel and CoStar formats
- **Context-aware data management** with React Context API
- **Mobile-responsive design** for field use

### Vector Database & RAG Pipeline

#### ChromaDB Integration
- **Document vectorization** using OpenAI embeddings
- **Efficient similarity search** for large document collections
- **Persistent storage** with unique collection management
- **Query engine integration** for natural language searches

#### RAG Pipeline (`rag_pipeline.py`)
- **LlamaIndex-based document processing** with LlamaParse
- **Multi-document indexing** with batch processing
- **Query optimization** for lease-specific searches
- **Background processing** for improved performance

## Key Features

### 1. **Multi-Modal Document Processing**
- **PDF parsing** with advanced OCR capabilities
- **Structured data extraction** using Pydantic schemas
- **Source citation** with page-level references
- **Confidence scoring** for extraction quality

### 2. **Comprehensive Risk Analysis**
- **Financial Exposure Flags**: Early termination clauses, uncapped expenses, hidden fees
- **Operational Risks**: Restrictive use clauses, non-compete agreements, vague language
- **Legal Compliance**: Insurance requirements, indemnification clauses
- **Lease Terms**: Unfavorable renewals, holdover penalties, sublease restrictions

### 3. **Professional-Grade Output**
- **Audit-ready extractions** with source traceability
- **98%+ first-pass accuracy** on commercial lease documents
- **Field-level verification** with PDF highlighting
- **Export formats** compatible with industry tools

### 4. **Privacy and Security**
- **Private by default** - no data sharing without permission
- **Secure file handling** with temporary storage
- **GDPR-compliant** data processing options
- **On-premises deployment** capabilities

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 18+
- OpenAI API key
- LlamaCloud API key

### Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys:
# OPENAI_API_KEY=your_openai_key
# LLAMA_CLOUD_API_KEY=your_llamacloud_key
# LLAMA_CLOUD_ORG_ID=your_org_id

# Start the index server (terminal 1)
python index_server.py

# Start the main Flask server (terminal 2)
python flask_server.py
```

### Frontend Setup
```bash
cd flask_react

# Install dependencies
npm install

# Start development server
npm run dev
```

## API Endpoints

### Document Processing
- `POST /upload` - Upload lease documents
- `POST /index` - Index documents for search
- `POST /extract-summary` - Extract structured lease summary
- `POST /extract-risk-flags` - Extract risk flags
- `POST /classify-asset-type` - Classify property type

### Streaming Extraction
- `POST /stream-risk-flags` - Stream risk flag extraction (plain SSE)
- `GET|POST /stream-lease-flags-pipeline` - Stream risk flags with named SSE events (UI)

### Querying & Search
- `GET /query` - Query indexed documents
- `POST /rag-query` - RAG-based document search
- `GET /list-indexed-documents` - List processed documents

## Usage

### Web Interface
1. Navigate to `http://localhost:3000/try-it-now`
2. Upload a lease document (PDF format)
3. View real-time extraction progress
4. Review structured results with source verification
5. Export data to Excel or CoStar formats

### API Integration
```python
# Example: Extract lease summary
import requests

# Upload document
files = {'file': open('lease.pdf', 'rb')}
upload_response = requests.post('http://localhost:5601/upload', files=files)
file_path = upload_response.json()['filepath']

# Extract summary
summary_response = requests.post('http://localhost:5601/extract-summary', 
                                json={'file_path': file_path})
lease_data = summary_response.json()
```

## Data Schemas

### Lease Summary
- **Tenant Information**: Name, suite number, leased square footage
- **Property Details**: Address, landlord, unit specifications
- **Lease Dates**: Commencement, expiration, term length
- **Financial Terms**: Base rent, escalations, expense recovery, security deposits

### Risk Flags
- **Category Classification**: Financial, operational, legal, insurance risks
- **Severity Assessment**: Impact level and priority scoring
- **Source References**: Page numbers and text citations
- **Compliance Notes**: Regulatory and standard practice deviations

### Asset Types
- Office, Retail, Industrial, Multifamily, Hospitality, Healthcare, Mixed-Use
- Confidence scoring and reclassification capabilities

## Development

### Project Structure
```
atlas-lease-extractor/
├── flask_server.py              # Main API server
├── index_server.py              # RAG pipeline server
├── llama_cloud_manager.py       # LlamaCloud integration
├── risk_flags/                  # Risk extraction module
├── flask_react/                 # Next.js frontend
│   ├── app/                     # App router pages
│   ├── components/              # Reusable components
│   └── hooks/                   # Custom React hooks
├── config.py                    # Configuration management
└── requirements.txt             # Python dependencies
```

### Key Technologies
- **Backend**: Flask, LlamaIndex, ChromaDB, OpenAI, LlamaCloud
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Radix UI
- **AI/ML**: GPT-4, OpenAI Embeddings, LlamaParse
- **Database**: ChromaDB (vector), Local file storage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with appropriate tests
4. Submit a pull request with detailed description

## License

[Add your license here]

## Support

For technical support or feature requests, please open an issue in the repository. 