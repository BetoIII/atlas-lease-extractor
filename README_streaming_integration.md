# Streaming Lease Flags Extraction - Flask + React Integration

This document describes the complete streaming integration for lease flags extraction between the Flask backend and React frontend.

## Overview

The streaming integration provides real-time lease flags extraction with live updates to the user interface. It combines:

- **Backend**: Flask server with streaming endpoints using Server-Sent Events (SSE)
- **Frontend**: React components with custom hooks for handling streaming data
- **AI Pipeline**: LlamaIndex RAG pipeline with structured data extraction

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Flask Server   │    │  RAG Pipeline   │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Streaming   │ │    │ │ SSE         │ │    │ │ LlamaIndex  │ │
│ │ Hook        │◄├────┤ │ Endpoints   │◄├────┤ │ Extractor   │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ UI          │ │    │ │ CORS        │ │    │ │ Structured  │ │
│ │ Components  │ │    │ │ Headers     │ │    │ │ Output      │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Backend Implementation

### Flask Streaming Endpoints

#### 1. `/stream-lease-flags-pipeline` (Recommended)
- Method: GET (EventSource) or POST (file upload)
- Content-Type: `text/event-stream`
- Description: SSE with named events (`connected`, `progress`, `complete`, `error`)
- Usage: Primary endpoint for the React streaming UI

Example (EventSource):
```bash
curl -N "http://localhost:5601/stream-lease-flags-pipeline?filename=lease_document.txt"
```

#### 2. `/stream-risk-flags`
- Method: POST/GET
- Content-Type: `text/event-stream`
- Description: SSE that emits plain `data:` lines (no named events)
- Usage: Alternate/simple client and testing

### Request Formats

**File Upload (pipeline):**
```bash
curl -X POST http://localhost:5601/stream-lease-flags-pipeline \
  -F "file=@lease_document.pdf"
```

**Filename-based (pipeline via GET):**
```bash
curl -N "http://localhost:5601/stream-lease-flags-pipeline?filename=lease_document.txt"
```

**Alternate simple SSE (stream-risk-flags):**
```bash
curl -X POST http://localhost:5601/stream-risk-flags \
  -H "Content-Type: application/json" \
  -d '{"filename": "lease_document.txt"}'
```

### Response Format

**SSE Events (pipeline):**
```
event: connected
data: {"status": "connected", "message": "Starting extraction..."}

event: progress
data: {"status": "streaming", "stage": "indexing", "message": "Processing with LlamaIndex pipeline..."}

event: complete
data: {"status": "complete", "data": { /* risk_flags or processed result */ }, "is_complete": true}

event: error
data: {"status": "error", "error": "Error message", "is_complete": true}
```

## Frontend Implementation

### Custom React Hook

The `useStreamingExtraction` hook handles all streaming logic:

```typescript
import { useStreamingExtraction } from '@/hooks/useStreamingExtraction';

const {
  isStreaming,
  isConnected,
  currentResponse,
  allResponses,
  error,
  startStreaming,
  stopStreaming,
  clearResponses
} = useStreamingExtraction({
  onProgress: (response) => console.log('Progress:', response),
  onComplete: (response) => console.log('Complete:', response),
  onError: (response) => console.error('Error:', response),
  onConnected: (response) => console.log('Connected:', response)
});
```

### React Component

The `StreamingRiskFlagsExtractor` component provides a complete UI:

```tsx
import { StreamingRiskFlagsExtractor } from '@/components/StreamingRiskFlagsExtractor';

<StreamingRiskFlagsExtractor
  file={selectedFile}
  onComplete={(data) => setExtractedData(data)}
  onError={(error) => setError(error)}
/>
```

### Features

- **Real-time Progress**: Live updates as flags are discovered
- **Visual Indicators**: Loading states, progress bars, status badges
- **Error Handling**: Graceful error display and recovery
- **Debug Mode**: Development-only debug information
- **Responsive Design**: Works on desktop and mobile

## Usage Examples

### 1. Basic Streaming

```typescript
// Start streaming extraction
await startStreaming(file);

// Handle responses
const handleProgress = (response) => {
  if (response.data?.risk_flags) {
    setStreamingFlags(response.data.risk_flags);
  }
};

const handleComplete = (response) => {
  setFinalFlags(response.data.risk_flags);
  setProgress(100);
};
```

### 2. File Upload with Streaming

```typescript
const handleFileUpload = async (file: File) => {
  setSelectedFile(file);
  await startStreaming(file);
};
```

### 3. Indexed Document Analysis

```typescript
// Analyze all indexed documents
await startStreaming();

// Analyze specific document
await startStreaming(undefined, 'specific_lease.pdf');
```

## Testing

### Backend Testing

Run the test script to verify Flask endpoints:

```bash
python test_streaming_endpoints.py
```

This tests:
- Server connectivity
- All streaming endpoints
- Response formats
- Error handling

### Frontend Testing

1. **Start the Flask server:**
   ```bash
   python flask_server.py
   ```

2. **Start the React development server:**
   ```bash
   cd flask_react
   npm run dev
   ```

3. **Navigate to the streaming demo:**
   ```
   http://localhost:3000/streaming-demo
   ```

## Configuration

### Environment Variables

```bash
# Required for backend
LLAMA_CLOUD_API_KEY=your_llama_cloud_api_key
OPENAI_API_KEY=your_openai_api_key

# Optional for development
NODE_ENV=development  # Enables debug mode in React
```

### CORS Configuration

The Flask server is configured for React development:

```python
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)
```

For production, update the origins list accordingly.

## Deployment Considerations

### Production Setup

1. **Backend:**
   - Use a production WSGI server (Gunicorn, uWSGI)
   - Configure proper CORS origins
   - Set up SSL/TLS for secure connections
   - Implement rate limiting

2. **Frontend:**
   - Build the React app for production
   - Configure proper API endpoints
   - Set up CDN for static assets
   - Implement error boundaries

### Performance Optimization

1. **Streaming:**
   - Implement connection pooling
   - Add request timeouts
   - Use compression for large responses
   - Monitor memory usage

2. **UI:**
   - Implement virtual scrolling for large result sets
   - Add pagination for historical results
   - Use React.memo for expensive components
   - Implement proper cleanup on unmount

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Verify Flask CORS configuration
   - Check browser developer tools
   - Ensure credentials are included

2. **Connection Timeouts:**
   - Increase timeout values
   - Check network connectivity
   - Verify server is running

3. **Streaming Interruptions:**
   - Implement reconnection logic
   - Add error recovery mechanisms
   - Check server logs for errors

### Debug Mode

Enable debug mode in development:

```typescript
// Shows debug information in UI
process.env.NODE_ENV === 'development'
```

### Logging

Backend logging is configured with rotating file handlers:

```python
# Check app.log for server-side issues
tail -f app.log
```

## API Reference

### Streaming Response Schema

```typescript
interface StreamingResponse {
  status: 'streaming' | 'complete' | 'error' | 'connected';
  data?: {
    risk_flags: Array<{
      category: string;
      title: string;
      description: string;
    }>;
  };
  error?: string;
  is_complete?: boolean;
  message?: string;
  note?: string;
}
```

### Hook Options

```typescript
interface UseStreamingExtractionOptions {
  onProgress?: (response: StreamingResponse) => void;
  onComplete?: (response: StreamingResponse) => void;
  onError?: (response: StreamingResponse) => void;
  onConnected?: (response: StreamingResponse) => void;
}
```

## Future Enhancements

1. **WebSocket Support**: For bidirectional communication
2. **Batch Processing**: Handle multiple documents simultaneously
3. **Progress Estimation**: More accurate progress indicators
4. **Caching**: Cache results for faster subsequent requests
5. **Real-time Collaboration**: Multiple users viewing same extraction

## Contributing

When contributing to the streaming functionality:

1. Test both backend and frontend changes
2. Update documentation for API changes
3. Add appropriate error handling
4. Consider performance implications
5. Test with various document types and sizes 