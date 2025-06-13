import { useState, useCallback, useRef } from 'react';

export interface RiskFlag {
  category: string;
  title: string;
  description: string;
}

export interface RiskFlagsData {
  risk_flags: RiskFlag[];
}

export interface StreamingResponse {
  status: 'streaming' | 'complete' | 'error' | 'connected';
  data?: RiskFlagsData;
  error?: string;
  is_complete?: boolean;
  message?: string;
  note?: string;
  stage?: string;
  text?: string;
}

export interface UseStreamingExtractionOptions {
  onProgress?: (response: StreamingResponse) => void;
  onComplete?: (response: StreamingResponse) => void;
  onError?: (response: StreamingResponse) => void;
  onConnected?: (response: StreamingResponse) => void;
}

export interface UseStreamingExtractionReturn {
  isStreaming: boolean;
  isConnected: boolean;
  currentResponse: StreamingResponse | null;
  allResponses: StreamingResponse[];
  error: string | null;
  startStreaming: (file?: File, filename?: string) => Promise<void>;
  stopStreaming: () => void;
  clearResponses: () => void;
}

export const useStreamingExtraction = (
  options: UseStreamingExtractionOptions = {}
): UseStreamingExtractionReturn => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<StreamingResponse | null>(null);
  const [allResponses, setAllResponses] = useState<StreamingResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { onProgress, onComplete, onError, onConnected } = options;

  const stopStreaming = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsConnected(false);
  }, []);

  const clearResponses = useCallback(() => {
    setAllResponses([]);
    setCurrentResponse(null);
    setError(null);
  }, []);

  const startStreaming = useCallback(async (file?: File, filename?: string) => {
    // Clean up any existing connections
    stopStreaming();
    clearResponses();
    
    setIsStreaming(true);
    setError(null);

    try {
      let finalFilename = filename;
      
      // If we have a file, upload it first
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadResponse = await fetch('http://localhost:5601/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Upload failed! status: ${uploadResponse.status}`);
        }
        
        const uploadResult = await uploadResponse.json();
        finalFilename = uploadResult.filename;
        
        // Index the uploaded file
        const indexResponse = await fetch('http://localhost:5601/index', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ file_path: uploadResult.filepath }),
          credentials: 'include',
        });
        
        if (!indexResponse.ok) {
          throw new Error(`Indexing failed! status: ${indexResponse.status}`);
        }
      }

      // Create EventSource URL for the new streaming pipeline endpoint
      let eventSourceUrl = 'http://localhost:5601/stream-lease-flags-pipeline';
      if (finalFilename) {
        eventSourceUrl += `?filename=${encodeURIComponent(finalFilename)}`;
      }

      // Create EventSource for SSE (this will be a GET request)
      const eventSource = new EventSource(eventSourceUrl, {
        withCredentials: true,
      });
      
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        console.log('SSE connection opened');
      };

      eventSource.addEventListener('connected', (event: MessageEvent) => {
        const response: StreamingResponse = JSON.parse(event.data);
        setIsConnected(true);
        setCurrentResponse(response);
        setAllResponses(prev => [...prev, response]);
        onConnected?.(response);
      });

      eventSource.addEventListener('progress', (event: MessageEvent) => {
        const response: StreamingResponse = JSON.parse(event.data);
        setCurrentResponse(response);
        setAllResponses(prev => [...prev, response]);
        
        // Handle different stages of the streaming process
        if (response.stage === 'llm_response' && response.text) {
          // This is streaming text from the LLM - we can parse it for lease flags
          const parsedFlags = parseStreamingText(response.text);
          if (parsedFlags.length > 0) {
            // Create a response with partial lease flags data
            const flagsResponse = {
              ...response,
              data: { risk_flags: parsedFlags }
            };
            onProgress?.(flagsResponse);
          } else {
            onProgress?.(response);
          }
        } else {
          onProgress?.(response);
        }
      });

      eventSource.addEventListener('complete', (event: MessageEvent) => {
        const response: StreamingResponse = JSON.parse(event.data);
        setCurrentResponse(response);
        setAllResponses(prev => [...prev, response]);
        setIsStreaming(false);
        setIsConnected(false);
        onComplete?.(response);
        stopStreaming();
      });

      eventSource.addEventListener('error', (event: MessageEvent) => {
        const response: StreamingResponse = JSON.parse(event.data);
        setCurrentResponse(response);
        setAllResponses(prev => [...prev, response]);
        setError(response.error || 'Unknown streaming error');
        setIsStreaming(false);
        setIsConnected(false);
        onError?.(response);
        stopStreaming();
      });

      eventSource.onerror = (event) => {
        console.error('SSE error:', event);
        setError('Connection error occurred');
        setIsStreaming(false);
        setIsConnected(false);
        stopStreaming();
      };

    } catch (err) {
      console.error('Streaming error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsStreaming(false);
      setIsConnected(false);
      stopStreaming();
    }
  }, [onProgress, onComplete, onError, onConnected, stopStreaming, clearResponses]);

  return {
    isStreaming,
    isConnected,
    currentResponse,
    allResponses,
    error,
    startStreaming,
    stopStreaming,
    clearResponses,
  };
};

// Helper function to parse streaming text for risk flags
const parseStreamingText = (text: string): Array<{category: string, title: string, description: string}> => {
  const flags: Array<{category: string, title: string, description: string}> = [];
  
  // Simple parsing logic - look for patterns that indicate risk flags
  const lines = text.split('\n');
  let currentFlag: Partial<{category: string, title: string, description: string}> = {};
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Look for category indicators
    if (trimmedLine.includes('Financial Exposure') || trimmedLine.includes('Cost Uncertainty')) {
      currentFlag.category = 'Financial Exposure & Cost Uncertainty';
    } else if (trimmedLine.includes('Operational Constraints') || trimmedLine.includes('Legal Risks')) {
      currentFlag.category = 'Operational Constraints & Legal Risks';
    } else if (trimmedLine.includes('Insurance') || trimmedLine.includes('Liability')) {
      currentFlag.category = 'Insurance & Liability';
    } else if (trimmedLine.includes('Lease Term') || trimmedLine.includes('Renewal')) {
      currentFlag.category = 'Lease Term & Renewal';
    } else if (trimmedLine.includes('Miscellaneous')) {
      currentFlag.category = 'Miscellaneous';
    }
    
    // Look for title patterns (often start with capital letters or numbers)
    if (/^[A-Z][a-z].*[Cc]lause|^[A-Z][a-z].*[Tt]erm|^[A-Z][a-z].*[Rr]equirement/.test(trimmedLine)) {
      if (currentFlag.category && currentFlag.title && currentFlag.description) {
        flags.push(currentFlag as {category: string, title: string, description: string});
      }
      currentFlag = {
        category: currentFlag.category,
        title: trimmedLine,
        description: ''
      };
    }
    
    // Accumulate description
    if (currentFlag.title && trimmedLine && !trimmedLine.includes('Category:') && trimmedLine !== currentFlag.title) {
      currentFlag.description = currentFlag.description ? 
        `${currentFlag.description} ${trimmedLine}` : trimmedLine;
    }
  }
  
  // Add the last flag if complete
  if (currentFlag.category && currentFlag.title && currentFlag.description) {
    flags.push(currentFlag as {category: string, title: string, description: string});
  }
  
  return flags;
};

// Alternative hook for simple fetch-based streaming (fallback)
export const useSimpleStreamingExtraction = (
  options: UseStreamingExtractionOptions = {}
): UseStreamingExtractionReturn => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<StreamingResponse | null>(null);
  const [allResponses, setAllResponses] = useState<StreamingResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const { onProgress, onComplete, onError } = options;

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsConnected(false);
  }, []);

  const clearResponses = useCallback(() => {
    setAllResponses([]);
    setCurrentResponse(null);
    setError(null);
  }, []);

  const startStreaming = useCallback(async (file?: File, filename?: string) => {
    stopStreaming();
    clearResponses();
    
    setIsStreaming(true);
    setIsConnected(true);
    setError(null);

    try {
      // Prepare the request
      let url = 'http://localhost:5601/stream-lease-flags';
      let requestOptions: RequestInit = {
        method: 'POST',
        credentials: 'include',
      };

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        requestOptions.body = formData;
      } else if (filename) {
        requestOptions.headers = {
          'Content-Type': 'application/json',
        };
        requestOptions.body = JSON.stringify({ filename });
      } else {
        requestOptions.headers = {
          'Content-Type': 'application/json',
        };
        requestOptions.body = JSON.stringify({});
      }

      abortControllerRef.current = new AbortController();
      requestOptions.signal = abortControllerRef.current.signal;

      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = line.slice(6); // Remove 'data: ' prefix
              const response: StreamingResponse = JSON.parse(jsonData);
              
              setCurrentResponse(response);
              setAllResponses(prev => [...prev, response]);
              
              if (response.status === 'streaming') {
                onProgress?.(response);
              } else if (response.status === 'complete') {
                setIsStreaming(false);
                setIsConnected(false);
                onComplete?.(response);
                return;
              } else if (response.status === 'error') {
                setError(response.error || 'Unknown error');
                setIsStreaming(false);
                setIsConnected(false);
                onError?.(response);
                return;
              }
            } catch (parseError) {
              console.error('Error parsing streaming response:', parseError);
            }
          }
        }
      }
      
    } catch (err) {
      console.error('Streaming error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsStreaming(false);
      setIsConnected(false);
    }
  }, [onProgress, onComplete, onError, stopStreaming, clearResponses]);

  return {
    isStreaming,
    isConnected,
    currentResponse,
    allResponses,
    error,
    startStreaming,
    stopStreaming,
    clearResponses,
  };
};

// Update the data handling to use risk_flags instead of lease_flags
const handleStreamingResponse = (response: StreamingResponse) => {
  if (response.status === 'streaming' && response.data) {
    const parsedFlags = parseStreamingText(response.text || '');
    return {
      status: 'streaming',
      data: { risk_flags: parsedFlags }
    };
  }
  return response;
}; 