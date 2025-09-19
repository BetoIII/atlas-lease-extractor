"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
import { useToast } from "@/components/ui"
import { Toaster } from "@/components/ui"
import { authClient } from "@/lib/auth-client"
import { 
  Play, 
  RefreshCw, 
  Settings, 
  FileText, 
  AlertTriangle, 
  Key,
  TestTube2,
  Building
} from "lucide-react"

import { ModelSelector } from "./components/ModelSelector"
import { EvalTestCard } from "./components/EvalTestCard"
import { FileSelector } from "./components/FileSelector"
import { TestResults } from "./components/TestResults"

// Types
interface ModelConfig {
  provider: string
  model: string
  temperature: number
  streaming: boolean
}

interface TestConfig {
  test_type: string
  test_name: string
  file_path: string
  model_config: ModelConfig
  user_id?: string
}

interface TestResult {
  test_id: string
  test_name: string
  test_type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  model_config: ModelConfig
  duration_seconds?: number
  extraction_result?: any
  error_message?: string
  phoenix_trace_url?: string
}

interface AvailableModels {
  available_models: Record<string, string[]>
  presets: Record<string, ModelConfig>
  display_info: Record<string, any>
}

interface AvailableFile {
  path: string
  name: string
  size: number
  directory: string
}

export default function EvalsTesterPage() {
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Data states
  const [availableModels, setAvailableModels] = useState<AvailableModels | null>(null)
  const [availableFiles, setAvailableFiles] = useState<AvailableFile[]>([])
  const [testResults, setTestResults] = useState<TestResult[]>([])
  
  // UI states
  const [selectedFile, setSelectedFile] = useState<string>("")
  const [defaultModelConfig, setDefaultModelConfig] = useState<ModelConfig>({
    provider: "openai",
    model: "gpt-4o-mini",
    temperature: 0.1,
    streaming: true
  })
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set())
  const [isRunningBatch, setIsRunningBatch] = useState(false)

  // Test configurations for the extractors
  const testTypes = [
    {
      id: "lease_summary",
      name: "Lease Summary Extractor",
      description: "Extract structured lease data including property info, tenant details, and financial terms",
      icon: FileText,
      color: "blue"
    },
    {
      id: "risk_flags",
      name: "Risk Flags Extractor",
      description: "Identify potential risk factors and compliance issues in lease documents",
      icon: AlertTriangle,
      color: "red"
    },
    {
      id: "key_terms",
      name: "Key Terms Extractor",
      description: "Extract key lease terms using hybrid LlamaCloud approach",
      icon: Key,
      color: "green"
    },
    {
      id: "key_terms_llamacloud",
      name: "Key Terms (LlamaCloud)",
      description: "Intelligent LlamaCloud extraction with index checking and smart caching",
      icon: Key,
      color: "emerald"
    },
    {
      id: "key_terms_local",
      name: "Key Terms Extractor (Local)",
      description: "Local vector-enhanced key terms extraction using ChromaDB and local LLMs",
      icon: Key,
      color: "orange"
    },
    {
      id: "key_terms_simple",
      name: "Key Terms Extractor (Simple)",
      description: "Simple structured prediction using SimpleDirectoryReader with no indexing or caching",
      icon: Key,
      color: "cyan"
    },
    {
      id: "key_terms_llamaextract",
      name: "Key Terms (LlamaExtract)",
      description: "Extract key lease terms using lightweight LlamaExtract agent",
      icon: Key,
      color: "violet"
    },
    {
      id: "asset_type_classification",
      name: "Asset Type Classifier",
      description: "Classify property asset type (office, retail, industrial, multifamily, etc.) from lease documents",
      icon: Building,
      color: "purple"
    }
  ]

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession()
        if (session?.data?.user) {
          setUser(session.data.user)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  // Load initial data
  useEffect(() => {
    if (!loading) {
      loadAvailableModels()
      loadAvailableFiles()
      loadTestResults()
    }
  }, [loading])

  const loadAvailableModels = async () => {
    try {
      const response = await fetch("/api/evals/models")
      if (response.ok) {
        const data = await response.json()
        setAvailableModels(data)
      }
    } catch (error) {
      console.error("Failed to load available models:", error)
      toast({
        title: "Error",
        description: "Failed to load available models",
        variant: "destructive"
      })
    }
  }

  const loadAvailableFiles = async () => {
    try {
      const response = await fetch("/api/evals/files")
      if (response.ok) {
        const data = await response.json()
        setAvailableFiles(data.files || [])
      }
    } catch (error) {
      console.error("Failed to load available files:", error)
      toast({
        title: "Error", 
        description: "Failed to load available files",
        variant: "destructive"
      })
    }
  }

  const loadTestResults = async () => {
    try {
      const response = await fetch(`/api/evals/results${user?.id ? `?user_id=${user.id}` : '?user_id=dev-user'}`)
      if (response.ok) {
        const data = await response.json()
        setTestResults(data.results || [])
      }
    } catch (error) {
      console.error("Failed to load test results:", error)
    }
  }

  const runSingleTest = async (testType: string, modelConfig: ModelConfig) => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to test with",
        variant: "destructive"
      })
      return
    }

    setRunningTests(prev => new Set(prev).add(testType))

    try {
      const testConfig: TestConfig = {
        test_type: testType,
        test_name: `${testType}_${modelConfig.model}_${new Date().toISOString()}`,
        file_path: selectedFile,
        model_config: modelConfig,
        user_id: user?.id || 'dev-user'
      }

      const response = await fetch("/api/evals/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(testConfig)
      })

      if (response.ok) {
        const data = await response.json()
        setTestResults(prev => [data.test_result, ...prev])
        toast({
          title: "Test Completed",
          description: `${testType} test completed successfully`,
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || "Test failed")
      }
    } catch (error: any) {
      console.error("Test failed:", error)
      toast({
        title: "Test Failed",
        description: error.message || "An error occurred during testing",
        variant: "destructive"
      })
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev)
        newSet.delete(testType)
        return newSet
      })
    }
  }

  const runBatchTests = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to test with",
        variant: "destructive"
      })
      return
    }

    setIsRunningBatch(true)

    try {
      const tests = testTypes.map(testType => ({
        test_type: testType.id,
        test_name: `batch_${testType.id}_${defaultModelConfig.model}_${new Date().toISOString()}`,
        file_path: selectedFile,
        model_config: defaultModelConfig,
        user_id: user?.id || 'dev-user'
      }))

      const response = await fetch("/api/evals/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ tests })
      })

      if (response.ok) {
        const data = await response.json()
        setTestResults(prev => [...data.results, ...prev])
        toast({
          title: "Batch Tests Completed",
          description: `${data.test_count} tests completed successfully`,
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || "Batch tests failed")
      }
    } catch (error: any) {
      console.error("Batch tests failed:", error)
      toast({
        title: "Batch Tests Failed",
        description: error.message || "An error occurred during batch testing",
        variant: "destructive"
      })
    } finally {
      setIsRunningBatch(false)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Allow access in development mode for testing
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (!user && !isDevelopment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access the evaluation testing interface.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Toaster />
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TestTube2 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">AI Agent Evaluation Testing</h1>
        </div>
        <p className="text-gray-600">
          Test and compare different AI models across our four extraction workflows.
          Run individual tests or batch comparisons to evaluate model performance.
        </p>
      </div>

      <Tabs defaultValue="testing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="testing">Testing Interface</TabsTrigger>
          <TabsTrigger value="results">Results & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="testing" className="space-y-6">
          {/* Global Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Global Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Default Model Configuration</label>
                  {availableModels && (
                    <ModelSelector
                      availableModels={availableModels}
                      value={defaultModelConfig}
                      onChange={setDefaultModelConfig}
                    />
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Test File</label>
                  <FileSelector
                    availableFiles={availableFiles}
                    value={selectedFile}
                    onChange={setSelectedFile}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={runBatchTests}
                  disabled={!selectedFile || isRunningBatch}
                  className="flex items-center gap-2"
                >
                  {isRunningBatch ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Run All Tests
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={loadTestResults}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Results
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {testTypes.map((testType) => (
              <EvalTestCard
                key={testType.id}
                testType={testType}
                defaultModelConfig={defaultModelConfig}
                availableModels={availableModels}
                selectedFile={selectedFile}
                isRunning={runningTests.has(testType.id)}
                onRunTest={(modelConfig) => runSingleTest(testType.id, modelConfig)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="results">
          <TestResults 
            results={testResults}
            onRefresh={loadTestResults}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}