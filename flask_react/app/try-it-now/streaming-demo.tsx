'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Zap, 
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { StreamingRiskFlagsExtractor } from '@/components/StreamingRiskFlagsExtractor';
import { RiskFlag } from '@/hooks/useStreamingExtraction';

interface RiskFlagsData {
  risk_flags: RiskFlag[];
}

export const StreamingDemo: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<RiskFlagsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('upload');

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setExtractedData(null);
      setError(null);
      setActiveTab('extract');
    }
  }, []);

  const handleExtractionComplete = (flags: RiskFlag[]) => {
    setExtractedData({ risk_flags: flags });
  };

  const handleError = (error: string) => {
    console.error('Extraction error:', error);
  };

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setExtractedData(null);
    setError(null);
    setActiveTab('upload');
  }, []);

  const flagsByCategory = extractedData?.risk_flags.reduce((acc, flag) => {
    if (!acc[flag.category]) {
      acc[flag.category] = [];
    }
    acc[flag.category].push(flag);
    return acc;
  }, {} as Record<string, typeof extractedData.risk_flags>) || {};

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">
          Streaming Risk Flags Extraction
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Experience real-time AI-powered lease analysis with live streaming results from LlamaIndex
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span>Real-time LLM streaming</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4 text-blue-500" />
            <span>RAG-powered analysis</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Structured output</span>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-4xl mx-auto">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <h3 className="font-semibold text-blue-900 mb-2">Enhanced Streaming Experience</h3>
              <p className="text-blue-800 text-sm">
                This demo now uses our updated LlamaIndex pipeline with real streaming enabled. 
                You'll see live progress through document loading, indexing, querying, and real-time 
                LLM response generation. The streaming provides immediate feedback and shows lease flags 
                as they're being identified by the AI.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Document
          </TabsTrigger>
          <TabsTrigger value="extract" disabled={!selectedFile} className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Stream Extract
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!extractedData} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            View Results
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Lease Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Choose a lease document to analyze</p>
                  <p className="text-sm text-gray-500">
                    Supports PDF, DOC, DOCX files up to 10MB
                  </p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="mt-4 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>

              {selectedFile && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    File selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </AlertDescription>
                </Alert>
              )}

              {/* Demo Options */}
              {/* Removed demo/sample lease options */}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Extract Tab */}
        <TabsContent value="extract" className="space-y-6">
          <StreamingRiskFlagsExtractor
            file={selectedFile || undefined}
            onExtractionComplete={handleExtractionComplete}
            onError={handleError}
          />

          {/* Clear/Reset */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={handleClearFile}>
              Start Over with New Document
            </Button>
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {extractedData && (
            <>
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Extraction Summary</span>
                    <Badge variant="outline">
                      {extractedData.risk_flags.length} flags found
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(flagsByCategory).map(([category, flags]) => (
                      <div key={category} className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{flags.length}</div>
                        <div className="text-sm text-gray-600">{category}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Lease Flags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.entries(flagsByCategory).map(([category, flags]) => (
                      <div key={category} className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">
                          {category} ({flags.length})
                        </h3>
                        <div className="space-y-3">
                          {flags.map((flag, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <h4 className="font-medium text-lg mb-2">{flag.title}</h4>
                              <p className="text-gray-700">{flag.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-center gap-4">
                <Button onClick={handleClearFile}>
                  Analyze Another Document
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const dataStr = JSON.stringify(extractedData, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'lease-flags-extraction.json';
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download Results
                </Button>
              </div>
            </>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      {/* Info Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How Streaming Extraction Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">1. Document Upload</h3>
              <p className="text-sm text-gray-600">
                Upload your lease document or select from indexed documents
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">2. Real-time Analysis</h3>
              <p className="text-sm text-gray-600">
                AI analyzes the document using RAG pipeline with streaming responses
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">3. Structured Results</h3>
              <p className="text-sm text-gray-600">
                Get categorized lease flags with detailed descriptions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 