# Lease Extractor

A Python application that uses LlamaCloud's extraction capabilities to extract structured data from lease documents.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file with your LlamaCloud credentials:
```bash
LLAMA_CLOUD_API_KEY=your_api_key_here
```

3. Place your lease documents in the `data/` directory.

## Usage

Run the extraction script:
```bash
python lease_extractor.py
```

## Project Structure

- `lease_extractor.py`: Main extraction script
- `data/`: Directory containing lease documents to process
- `requirements.txt`: Python dependencies
- `.env`: Environment variables (not tracked in git)

## Schema

The lease extraction schema will be defined based on the specific fields needed from the lease documents. This will be configured in the `lease_extractor.py` file. 