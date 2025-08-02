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
        
        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5601'}/upload`, {
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
        const indexResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5601'}/index`, {
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
      let eventSourceUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5601'}/stream-lease-flags-pipeline`;
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
          // Get accumulated text from all LLM responses so far
          const accumulatedText = allResponses
            .filter(r => r.stage === 'llm_response' && r.text)
            .map(r => r.text)
            .join('') + (response.text || '');
          
          // Parse flags from accumulated text
          const parsedFlags = parseStreamingText(accumulatedText);
          
          // Create a response with current flags data
          const flagsResponse = {
            ...response,
            data: { risk_flags: parsedFlags }
          };
          onProgress?.(flagsResponse);
        } else {
          onProgress?.(response);
        }
      });

      eventSource.addEventListener('complete', (event: MessageEvent) => {
        const response: StreamingResponse = JSON.parse(event.data);
        
        // Try to extract risk flags from the complete response
        let finalFlags: Array<{category: string, title: string, description: string}> = [];
        
        console.log('Processing complete response for flags:', response);
        
        // Check if we have structured data
        if (response.data?.risk_flags) {
          finalFlags = response.data.risk_flags;
          console.log('Found structured risk_flags in response.data:', finalFlags);
        }
        // Check for alternative structure (e.g., lease_flags)
        else if ((response.data as any)?.lease_flags) {
          finalFlags = (response.data as any).lease_flags;
          console.log('Found lease_flags in response.data:', finalFlags);
        }
        // Try to parse from response text if available
        else if (response.text) {
          console.log('Parsing from response.text:', response.text);
          finalFlags = parseStreamingText(response.text);
        }
        // Fallback: check if the accumulated responses contain any flags or text
        else {
          console.log('Fallback: parsing from all accumulated responses');
          const allText = allResponses
            .filter(r => r.text)
            .map(r => r.text)
            .join('\n');
          if (allText) {
            finalFlags = parseStreamingText(allText);
          }
          
          // Also check if any response has data with flags
          const flagsFromResponses = allResponses
            .filter(r => r.data?.risk_flags || (r.data as any)?.lease_flags)
            .flatMap(r => r.data?.risk_flags || (r.data as any)?.lease_flags || []);
          
          if (flagsFromResponses.length > 0) {
            finalFlags = flagsFromResponses;
            console.log('Found flags in accumulated responses:', finalFlags);
          }
        }
        
        console.log(`Final extracted flags count: ${finalFlags.length}`, finalFlags);
        
        // Create enhanced response with parsed flags
        const enhancedResponse = {
          ...response,
          data: { risk_flags: finalFlags }
        };
        
        setCurrentResponse(enhancedResponse);
        setAllResponses(prev => [...prev, enhancedResponse]);
        setIsStreaming(false);
        setIsConnected(false);
        onComplete?.(enhancedResponse);
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
  
  // Enhanced parsing logic to extract risk flags from LLM response
  const lines = text.split('\n');
  let currentFlag: Partial<{category: string, title: string, description: string}> = {};
  let inDescription = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) continue;
    
    // Look for header patterns that indicate a new risk flag
    if (/^##?\s+(.+)$/.test(trimmedLine)) {
      // Save previous flag if complete
      if (currentFlag.category && currentFlag.title && currentFlag.description) {
        flags.push(currentFlag as {category: string, title: string, description: string});
      }
      
      // Start new flag with the header as title
      const title = trimmedLine.replace(/^##?\s+/, '');
      currentFlag = {
        title: title,
        category: inferCategory(title),
        description: ''
      };
      inDescription = false;
    }
    // Look for specific risk flag patterns
    else if (/^(Early Termination|Insurance|Maintenance|Operating Expense|Service Charge|Fee|Use Clause|Competition|Termination|Renewal|Holdover|Sublease|Assignment|Indemnification)/i.test(trimmedLine)) {
      // Save previous flag if complete
      if (currentFlag.category && currentFlag.title && currentFlag.description) {
        flags.push(currentFlag as {category: string, title: string, description: string});
      }
      
      currentFlag = {
        title: trimmedLine,
        category: inferCategory(trimmedLine),
        description: ''
      };
      inDescription = false;
    }
    // Look for numbered list items
    else if (/^\d+\.\s+(.+)$/.test(trimmedLine)) {
      // Save previous flag if complete
      if (currentFlag.category && currentFlag.title && currentFlag.description) {
        flags.push(currentFlag as {category: string, title: string, description: string});
      }
      
      const title = trimmedLine.replace(/^\d+\.\s+/, '');
      currentFlag = {
        title: title,
        category: inferCategory(title),
        description: ''
      };
      inDescription = false;
    }
    // Look for bullet point items
    else if (/^[-*]\s+(.+)$/.test(trimmedLine)) {
      // Save previous flag if complete
      if (currentFlag.category && currentFlag.title && currentFlag.description) {
        flags.push(currentFlag as {category: string, title: string, description: string});
      }
      
      const title = trimmedLine.replace(/^[-*]\s+/, '');
      currentFlag = {
        title: title,
        category: inferCategory(title),
        description: ''
      };
      inDescription = false;
    }
    // Accumulate description for current flag
    else if (currentFlag.title && trimmedLine) {
      if (currentFlag.description) {
        currentFlag.description += ' ' + trimmedLine;
      } else {
        currentFlag.description = trimmedLine;
      }
      inDescription = true;
    }
  }
  
  // Add the last flag if complete
  if (currentFlag.category && currentFlag.title && currentFlag.description) {
    flags.push(currentFlag as {category: string, title: string, description: string});
  }
  
  return flags;
};

// Helper function to infer category from title
const inferCategory = (title: string): string => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('termination') || lowerTitle.includes('early') || lowerTitle.includes('break')) {
    return 'Lease Term & Renewal';
  } else if (lowerTitle.includes('insurance') || lowerTitle.includes('liability') || lowerTitle.includes('indemnif')) {
    return 'Insurance & Liability';
  } else if (lowerTitle.includes('maintenance') || lowerTitle.includes('repair') || lowerTitle.includes('expense') || lowerTitle.includes('cost') || lowerTitle.includes('fee') || lowerTitle.includes('charge')) {
    return 'Financial Exposure & Cost Uncertainty';
  } else if (lowerTitle.includes('use') || lowerTitle.includes('compete') || lowerTitle.includes('restrict') || lowerTitle.includes('assign') || lowerTitle.includes('sublease')) {
    return 'Operational Constraints & Legal Risks';
  } else if (lowerTitle.includes('renewal') || lowerTitle.includes('holdover') || lowerTitle.includes('extension')) {
    return 'Lease Term & Renewal';
  } else {
    return 'Miscellaneous';
  }
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
      let url = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5601'}/stream-lease-flags`;
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