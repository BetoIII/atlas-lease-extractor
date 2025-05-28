'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Play, 
  Square,
  RefreshCw
} from 'lucide-react';
import { useStreamingExtraction, StreamingResponse } from '@/hooks/useStreamingExtraction';

interface LeaseFlag {
  category: string;
  title: string;
  description: string;
}

interface LeaseFlagsData {
  lease_flags: LeaseFlag[];
}

interface StreamingLeaseFlagsExtractorProps {
  file?: File;
  filename?: string;
  onComplete?: (data: LeaseFlagsData) => void;
  onError?: (error: string) => void;
  className?: string;
}

const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'Financial Exposure & Cost Uncertainty':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Operational Constraints & Legal Risks':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Insurance & Liability':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Lease Term & Renewal':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Miscellaneous':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Financial Exposure & Cost Uncertainty':
      return <AlertTriangle className="h-4 w-4" />;
    case 'Operational Constraints & Legal Risks':
      return <XCircle className="h-4 w-4" />;
    case 'Insurance & Liability':
      return <FileText className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

export const StreamingLeaseFlagsExtractor: React.FC<StreamingLeaseFlagsExtractorProps> = ({
  file,
  filename,
  onComplete,
  onError,
  className = ''
}) => {
  const [extractedFlags, setExtractedFlags] = useState<LeaseFlag[]>([]);
  const [streamingFlags, setStreamingFlags] = useState<LeaseFlag[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [stageMessage, setStageMessage] = useState<string>('');

  const handleProgress = useCallback((response: StreamingResponse) => {
    console.log('Progress:', response);
    
    // Update stage and message
    if (response.stage) {
      setCurrentStage(response.stage);
    }
    if (response.message) {
      setStageMessage(response.message);
    }
    
    // Update progress based on stage
    if (response.stage) {
      switch (response.stage) {
        case 'loading':
          setProgress(10);
          break;
        case 'loaded':
          setProgress(20);
          break;
        case 'indexing':
          setProgress(30);
          break;
        case 'loading_index':
          setProgress(40);
          break;
        case 'querying':
          setProgress(50);
          break;
        case 'streaming_llm':
          setProgress(60);
          break;
        case 'llm_response':
          setProgress(Math.min(70 + (streamingFlags.length * 5), 90));
          break;
        case 'processing':
          setProgress(95);
          break;
      }
    }
    
    if (response.data?.lease_flags) {
      setStreamingFlags(response.data.lease_flags);
    }
  }, [streamingFlags.length]);

  const handleComplete = useCallback((response: StreamingResponse) => {
    console.log('Complete:', response);
    
    if (response.data?.lease_flags) {
      setExtractedFlags(response.data.lease_flags);
      setStreamingFlags([]);
      setProgress(100);
      setCurrentStage('complete');
      setStageMessage('Extraction completed successfully');
      onComplete?.(response.data);
    }
  }, [onComplete]);

  const handleError = useCallback((response: StreamingResponse) => {
    console.error('Error:', response);
    setProgress(0);
    setCurrentStage('error');
    setStageMessage(response.error || 'Unknown error occurred');
    onError?.(response.error || 'Unknown error occurred');
  }, [onError]);

  const handleConnected = useCallback((response: StreamingResponse) => {
    console.log('Connected:', response);
    setProgress(5);
    setCurrentStage('connected');
    setStageMessage('Connected to streaming service');
  }, []);

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
    onProgress: handleProgress,
    onComplete: handleComplete,
    onError: handleError,
    onConnected: handleConnected
  });

  const handleStart = useCallback(() => {
    setExtractedFlags([]);
    setStreamingFlags([]);
    setProgress(0);
    setCurrentStage('');
    setStageMessage('');
    startStreaming(file, filename);
  }, [file, filename, startStreaming]);

  const handleStop = useCallback(() => {
    stopStreaming();
    setProgress(0);
    setCurrentStage('stopped');
    setStageMessage('Extraction stopped by user');
  }, [stopStreaming]);

  const handleClear = useCallback(() => {
    clearResponses();
    setExtractedFlags([]);
    setStreamingFlags([]);
    setProgress(0);
    setCurrentStage('');
    setStageMessage('');
  }, [clearResponses]);

  const displayFlags = isStreaming ? streamingFlags : extractedFlags;
  const totalFlags = displayFlags.length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Streaming Lease Flags Extraction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Info */}
          {(file || filename) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              <span>Document: {file?.name || filename || 'All indexed documents'}</span>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleStart}
              disabled={isStreaming}
              className="flex items-center gap-2"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isStreaming ? 'Extracting...' : 'Start Extraction'}
            </Button>

            {isStreaming && (
              <Button
                onClick={handleStop}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            )}

            <Button
              onClick={handleClear}
              variant="outline"
              className="flex items-center gap-2"
              disabled={isStreaming}
            >
              <RefreshCw className="h-4 w-4" />
              Clear
            </Button>
          </div>

          {/* Progress */}
          {(isStreaming || progress > 0) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              
              {/* Current Stage */}
              {currentStage && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Stage:</span> {currentStage.replace('_', ' ')}
                </div>
              )}
              
              {/* Stage Message */}
              {stageMessage && (
                <div className="text-sm text-gray-500 italic">
                  {stageMessage}
                </div>
              )}
              
              {/* Status */}
              <div className="flex items-center gap-2 text-sm">
                {isConnected && (
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                )}
                {isStreaming && (
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Streaming
                  </Badge>
                )}
                {currentStage === 'llm_response' && (
                  <Badge variant="outline" className="text-purple-600 border-purple-200">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    LLM Responding
                  </Badge>
                )}
                {currentResponse?.status && (
                  <span className="text-gray-600">
                    Status: {currentResponse.status}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {totalFlags > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Extracted Lease Flags</span>
              <Badge variant="outline">
                {totalFlags} flag{totalFlags !== 1 ? 's' : ''} found
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayFlags.map((flag, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  {/* Flag Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{flag.title}</h3>
                      <Badge 
                        variant="outline" 
                        className={`mt-2 ${getCategoryColor(flag.category)}`}
                      >
                        {getCategoryIcon(flag.category)}
                        <span className="ml-1">{flag.category}</span>
                      </Badge>
                    </div>
                    {isStreaming && index === displayFlags.length - 1 && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500 mt-1" />
                    )}
                  </div>

                  <Separator />

                  {/* Flag Description */}
                  <div className="text-gray-700">
                    <p>{flag.description}</p>
                  </div>
                </div>
              ))}

              {/* Streaming Indicator */}
              {isStreaming && (
                <div className="flex items-center justify-center py-4 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Analyzing document for additional flags...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Info (Development) */}
      {process.env.NODE_ENV === 'development' && allResponses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Debug: Streaming Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allResponses.map((response, index) => (
                <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                  <div className="font-mono">
                    <span className="font-semibold">#{index + 1}</span> - 
                    <span className={`ml-1 px-1 rounded ${
                      response.status === 'complete' ? 'bg-green-100 text-green-800' :
                      response.status === 'error' ? 'bg-red-100 text-red-800' :
                      response.status === 'streaming' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {response.status}
                    </span>
                  </div>
                  {response.data && (
                    <pre className="mt-1 text-xs overflow-x-auto">
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 