# Risk Flag Extraction Endpoints - Canonical and Deprecated

## Overview
We maintain a minimal, consistent set of endpoints for risk flag extraction. These are the canonical ones used by the UI and docs:

1. `/extract-risk-flags` — Synchronous extraction (Try It Now)
2. `/stream-lease-flags-pipeline` — SSE streaming used by the React UI
3. `/stream-risk-flags` — Alternate SSE streaming (plain data events), used by tests and tooling

## Deprecated/Removed Endpoints
- ❌ `/stream-lease-flags` — Deprecated, returns 410
- ❌ `/stream-lease-flags-sse` — Deprecated, returns 410
- ❌ `/extract-lease-flags-streaming` — Removed

## Canonical Endpoints

### 1) `/extract-risk-flags` (POST)
Purpose: Synchronous extraction for the Try It Now page using `RiskFlagsExtractor`.

Features:
- Accepts file uploads via multipart/form-data
- Returns complete results immediately
- Saves uploaded files to `uploaded_documents/`

Request Example:
```bash
curl -X POST http://localhost:5601/extract-risk-flags \
  -F "file=@sample_lease.pdf"
```

Response Format:
```json
{
  "status": "success",
  "data": { /* extracted risk flags */ },
  "sourceData": { /* extraction metadata */ },
  "message": "Risk flags extraction completed successfully"
}
```

### 2) `/stream-lease-flags-pipeline` (GET for EventSource, POST for upload)
Purpose: Preferred SSE endpoint for the React streaming UI. Emits named SSE events: `connected`, `progress`, `complete`, `error`.

Examples:
```bash
# EventSource (GET)
curl -N "http://localhost:5601/stream-lease-flags-pipeline?filename=sample_lease.txt"

# Upload then stream (POST with file)
curl -X POST http://localhost:5601/stream-lease-flags-pipeline \
  -F "file=@sample_lease.pdf"
```

SSE Events:
```
event: connected
data: {"status":"connected","message":"Starting streaming extraction..."}

event: progress
data: {"status":"streaming","message":"Processing...","stage":"indexing"}

event: complete
data: {"status":"complete","data":{...},"is_complete":true}
```

### 3) `/stream-risk-flags` (POST/GET)
Purpose: Alternate SSE endpoint that emits plain `data:` lines (without named events). Helpful for simple clients and tests.

Examples:
```bash
# File upload
curl -X POST http://localhost:5601/stream-risk-flags \
  -F "file=@sample_lease.pdf"

# Filename (POST JSON)
curl -X POST http://localhost:5601/stream-risk-flags \
  -H "Content-Type: application/json" \
  -d '{"filename":"sample_lease.txt"}'

# GET with filename
curl -N "http://localhost:5601/stream-risk-flags?filename=sample_lease.txt"
```

## Notes
- The UI uses `/stream-lease-flags-pipeline` for structured SSE events; tests also cover `/stream-risk-flags`.
- Deprecated endpoints return 410 to guide clients to the canonical routes.