# Lease Flags Query Pipeline

A Python application that extracts lease flags (potential risks and important clauses) from lease documents using AI/LLM technology.

## Features

- **Document Processing**: Loads and processes PDF lease documents
- **AI-Powered Analysis**: Uses OpenAI's GPT-3.5-turbo to analyze lease content
- **Structured Output**: Extracts lease flags according to predefined categories
- **Vector Search**: Creates searchable vector indexes for efficient document querying
- **JSON Export**: Saves results in structured JSON format

## Lease Flag Categories

The pipeline identifies lease flags in the following categories:

### Financial Exposure & Cost Uncertainty
- Early Termination Clauses
- Uncapped or Vague Operating Expenses
- Ambiguous Maintenance and Upgrade Obligations
- Excessive Service Charges Without Transparency or Caps
- Hidden Fees

### Operational Constraints & Legal Risks
- Restrictive Use Clauses
- Do Not Compete Clauses
- Ambiguous or Vague Language
- Landlord's Right to Terminate

### Insurance & Liability
- Tenant Insurance Requirements
- Indemnification Clauses

### Lease Term & Renewal
- Unfavorable Renewal Terms
- Holdover Penalties

### Miscellaneous
- Sublease Restrictions
- Assignment Clauses

## Installation

1. Install required dependencies:
```bash
pip install -r requirements.txt
```

2. Set your OpenAI API key:
```bash
export OPENAI_API_KEY="your_api_key_here"
```

## Usage

### Basic Usage
Run the pipeline with the default TETCO lease document:
```bash
python lease_flags_query_pipeline.py
```

### Custom File Path
To analyze a different lease document, you can either:

1. **Interactive mode**: Run the test script and enter a file path when prompted:
```bash
python test_different_file.py
```

2. **Programmatic usage**: Import and use the main function:
```python
from lease_flags_query_pipeline import main
main("/path/to/your/lease/document.pdf")
```

### Example Output

The pipeline will:
1. Load and process the document
2. Create a vector index for efficient searching
3. Query the document for lease flags
4. Display results in the terminal
5. Save structured results to a JSON file

```
============================================================
LEASE FLAGS EXTRACTED:
============================================================

1. Early Termination Clauses
   Category: Financial Exposure & Cost Uncertainty
   Description: The lease document includes a clause that allows the tenant to terminate the lease early under specific conditions...

2. Tenant Insurance Requirements
   Category: Insurance & Liability
   Description: The document outlines clauses requiring the tenant to indemnify and hold harmless the landlord...
============================================================

Results saved to: lease_flags_[filename].json
```

## Files

- `lease_flags_query_pipeline.py` - Main pipeline script
- `lease_flags_schema.py` - Pydantic schemas for structured lease flags
- `simple_lease_extractor.py` - Simplified version for basic extraction
- `test_pipeline.py` - Basic file loading test
- `test_different_file.py` - Interactive test for custom file paths
- `requirements.txt` - Python dependencies

## Technical Details

- **LLM**: OpenAI GPT-3.5-turbo for document analysis
- **Embeddings**: OpenAI text-embedding-3-small for vector search
- **Framework**: LlamaIndex for document processing and querying
- **Storage**: Local vector index storage with unique directories per file
- **Output**: Structured JSON with categorized lease flags

## Requirements

- Python 3.8+
- OpenAI API key
- PDF documents in accessible file paths 