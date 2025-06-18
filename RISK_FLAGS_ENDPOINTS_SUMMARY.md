# Risk Flag Extraction Endpoints - Refactoring Summary

## Overview
The Flask server has been refactored to maintain only **two risk flag extraction endpoints** as requested:

1. **`/extract-risk-flags`** - For the Try It Now page (synchronous)
2. **`/stream-risk-flags`** - For the streaming demo (asynchronous with SSE)

## Removed Endpoints
The following endpoints have been **removed** as they were either broken or redundant:

- ❌ `/stream-lease-flags` - Broken (referenced non-existent function)
- ❌ `/stream-lease-flags-sse` - Redundant
- ❌ `/extract-lease-flags-streaming` - Broken (referenced non-existent function)

## Maintained Endpoints

### 1. `/extract-risk-flags` (POST)
**Purpose**: Used by the Try It Now page for synchronous risk flag extraction using Llama Parse.

**Features**:
- Accepts file uploads via multipart/form-data
- Uses `RiskFlagsExtractor` class
- Returns complete results immediately
- Saves uploaded files to `uploaded_documents/` directory

**Request Example**:
```bash
curl -X POST http://localhost:5601/extract-risk-flags \
  -F "file=@sample_lease.pdf"
```

**Response Format**:
```json
{
  "status": "success",
  "data": { /* extracted risk flags */ },
  "sourceData": { /* extraction metadata */ },
  "message": "Risk flags extraction completed successfully"
}
```

### 2. `/stream-risk-flags` (POST/GET)
**Purpose**: Used by the streaming demo for real-time risk flag extraction with Server-Sent Events.

**Features**:
- Supports both file upload (POST) and filename-based requests (POST/GET)
- Uses the `risk_flags/risk_flags_query_pipeline.py` script via subprocess
- Returns streaming responses with real-time progress updates
- Server-Sent Events (SSE) format for better frontend integration

**Request Examples**:
```bash
# File upload
curl -X POST http://localhost:5601/stream-risk-flags \
  -F "file=@sample_lease.pdf"

# Existing file
curl -X POST http://localhost:5601/stream-risk-flags \
  -H "Content-Type: application/json" \
  -d '{"filename": "sample_lease.txt"}'

# EventSource (GET)
curl -X GET "http://localhost:5601/stream-risk-flags?filename=sample_lease.txt"
```

**Response Format** (SSE):
```
event: connected
data: {"status": "connected", "message": "Starting streaming extraction..."}

event: progress
data: {"status": "streaming", "message": "Loading document...", "stage": "loading"}

event: complete
data: {"status": "complete", "data": {...}, "is_complete": true}
```

## Fixes Applied

### 1. Pipeline Script Improvements (`risk_flags/risk_flags_query_pipeline.py`)
- ✅ Fixed import issues (absolute vs relative imports)
- ✅ Added graceful error handling for missing API keys
- ✅ Added fallback to SimpleDirectoryReader when LlamaParse is unavailable
- ✅ Improved streaming output with real-time progress display
- ✅ Better error messages and recovery mechanisms

### 2. Flask Server Improvements
- ✅ Fixed file path reference in streaming endpoint
- ✅ Removed broken endpoints that referenced non-existent functions
- ✅ Improved error handling and logging
- ✅ Standardized response formats

### 3. Testing Infrastructure
- ✅ Created `uploaded_documents/` directory
- ✅ Added sample lease document for testing
- ✅ Created comprehensive test script (`test_risk_flag_endpoints.py`)

## Files Created/Modified

### New Files:
- `uploaded_documents/sample_lease.txt` - Sample lease document for testing
- `test_risk_flag_endpoints.py` - Comprehensive endpoint testing script
- `RISK_FLAGS_ENDPOINTS_SUMMARY.md` - This documentation

### Modified Files:
- `flask_server.py` - Refactored to keep only 2 risk flag endpoints
- `risk_flags/risk_flags_query_pipeline.py` - Fixed imports and error handling

## Testing the Endpoints

### Prerequisites:
1. Set required environment variables:
   ```bash
   export OPENAI_API_KEY="your-openai-api-key"
   export LLAMA_CLOUD_API_KEY="your-llama-cloud-api-key"  # Optional
   ```

2. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running Tests:
1. Start the Flask server:
   ```bash
   python3 flask_server.py
   ```

2. In another terminal, run the test script:
   ```bash
   python3 test_risk_flag_endpoints.py
   ```

### Expected Behavior:
- Both endpoints should accept the sample lease document
- `/extract-risk-flags` should return structured JSON with risk flags
- `/stream-risk-flags` should stream progress updates via SSE
- Error handling should work gracefully when API keys are missing

## Integration Notes

### Try It Now Page:
- Should continue using `/extract-risk-flags` endpoint
- File upload via form-data remains unchanged
- Response format is backward compatible

### Streaming Demo:
- Should use `/stream-risk-flags` endpoint  
- Can use EventSource API for real-time updates
- Supports both file upload and filename-based requests

## Troubleshooting

### Common Issues:
1. **Missing API Keys**: Endpoints will return errors if OPENAI_API_KEY is not set
2. **Import Errors**: Make sure to run scripts from the correct directory
3. **File Not Found**: Ensure uploaded_documents directory exists with test files
4. **Connection Errors**: Verify Flask server is running on port 5601

### Testing Without API Keys:
The test script will show the endpoint structure and error handling even without valid API keys, which helps verify the basic functionality.