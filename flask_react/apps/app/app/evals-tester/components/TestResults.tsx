"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Progress } from "@/components/ui"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui"
import { 
  RefreshCw, 
  ExternalLink, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  AlertTriangle,
  Key,
  TrendingUp,
  Filter
} from "lucide-react"

interface TestResult {
  test_id: string
  test_name: string
  test_type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  model_config: {
    provider: string
    model: string
    temperature: number
    streaming: boolean
  }
  duration_seconds?: number
  extraction_result?: any
  error_message?: string
  phoenix_trace_url?: string
  start_time?: string
  end_time?: string
}

interface TestResultsProps {
  results: TestResult[]
  onRefresh: () => void
}

export function TestResults({ results, onRefresh }: TestResultsProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedTestType, setSelectedTestType] = useState<string>("all")
  const [selectedModel, setSelectedModel] = useState<string>("all")
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null)

  // Filter results
  const filteredResults = useMemo(() => {
    return results.filter(result => {
      if (selectedStatus !== "all" && result.status !== selectedStatus) return false
      if (selectedTestType !== "all" && result.test_type !== selectedTestType) return false
      if (selectedModel !== "all" && result.model_config.model !== selectedModel) return false
      return true
    })
  }, [results, selectedStatus, selectedTestType, selectedModel])

  // Analytics
  const analytics = useMemo(() => {
    const completed = results.filter(r => r.status === 'completed')
    const failed = results.filter(r => r.status === 'failed')
    
    const avgDuration = completed.length > 0 
      ? completed.reduce((sum, r) => sum + (r.duration_seconds || 0), 0) / completed.length
      : 0

    const testTypeStats = results.reduce((acc, result) => {
      if (!acc[result.test_type]) {
        acc[result.test_type] = { total: 0, completed: 0, failed: 0 }
      }
      acc[result.test_type].total++
      if (result.status === 'completed') acc[result.test_type].completed++
      if (result.status === 'failed') acc[result.test_type].failed++
      return acc
    }, {} as Record<string, { total: number, completed: number, failed: number }>)

    const modelStats = results.reduce((acc, result) => {
      const model = result.model_config.model
      if (!acc[model]) {
        acc[model] = { total: 0, completed: 0, failed: 0, avgDuration: 0 }
      }
      acc[model].total++
      if (result.status === 'completed') {
        acc[model].completed++
        acc[model].avgDuration += result.duration_seconds || 0
      }
      if (result.status === 'failed') acc[model].failed++
      return acc
    }, {} as Record<string, { total: number, completed: number, failed: number, avgDuration: number }>)

    // Calculate average durations
    Object.keys(modelStats).forEach(model => {
      if (modelStats[model].completed > 0) {
        modelStats[model].avgDuration = modelStats[model].avgDuration / modelStats[model].completed
      }
    })

    return {
      total: results.length,
      completed: completed.length,
      failed: failed.length,
      running: results.filter(r => r.status === 'running').length,
      successRate: results.length > 0 ? (completed.length / results.length) * 100 : 0,
      avgDuration,
      testTypeStats,
      modelStats
    }
  }, [results])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      running: 'bg-blue-100 text-blue-800',
      pending: 'bg-gray-100 text-gray-800'
    }
    return <Badge className={variants[status as keyof typeof variants] || variants.pending}>{status}</Badge>
  }

  const getTestTypeIcon = (testType: string) => {
    switch (testType) {
      case 'lease_summary': return <FileText className="h-4 w-4" />
      case 'risk_flags': return <AlertTriangle className="h-4 w-4" />
      case 'key_terms': return <Key className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds.toFixed(1)}s`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  // Get unique values for filters
  const uniqueStatuses = [...new Set(results.map(r => r.status))]
  const uniqueTestTypes = [...new Set(results.map(r => r.test_type))]
  const uniqueModels = [...new Set(results.map(r => r.model_config.model))]

  return (
    <div className="space-y-6">
      {/* Analytics Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <CardTitle>Test Analytics</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.total}</div>
              <div className="text-sm text-gray-600">Total Tests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{analytics.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{analytics.successRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Test Type Performance */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Test Type Performance
              </h4>
              <div className="space-y-3">
                {Object.entries(analytics.testTypeStats).map(([testType, stats]) => (
                  <div key={testType} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTestTypeIcon(testType)}
                      <span className="text-sm">{testType.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(stats.completed / stats.total) * 100} 
                        className="w-16 h-2"
                      />
                      <span className="text-xs text-gray-500">
                        {stats.completed}/{stats.total}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Performance */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Model Performance
              </h4>
              <div className="space-y-3">
                {Object.entries(analytics.modelStats).slice(0, 5).map(([model, stats]) => (
                  <div key={model} className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{model}</span>
                      <span className="text-xs text-gray-500">
                        Avg: {formatDuration(stats.avgDuration)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(stats.completed / stats.total) * 100} 
                        className="w-16 h-2"
                      />
                      <span className="text-xs text-gray-500">
                        {stats.completed}/{stats.total}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Test Type</label>
              <Select value={selectedTestType} onValueChange={setSelectedTestType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTestTypes.map(type => (
                    <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Model</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {uniqueModels.map(model => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results ({filteredResults.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No test results match the current filters</p>
              </div>
            ) : (
              filteredResults.map((result) => (
                <Card key={result.test_id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTestTypeIcon(result.test_type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{result.test_name}</span>
                            {getStatusBadge(result.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span>{result.model_config.model}</span>
                            <span>{formatDate(result.start_time)}</span>
                            {result.duration_seconds && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatDuration(result.duration_seconds)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {result.phoenix_trace_url && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(result.phoenix_trace_url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Trace
                          </Button>
                        )}
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedResult(result)}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Test Result Details</DialogTitle>
                            </DialogHeader>
                            {selectedResult && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Test ID</label>
                                    <p className="text-sm text-gray-600 font-mono">{selectedResult.test_id}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <div className="flex items-center gap-2">
                                      {getStatusIcon(selectedResult.status)}
                                      <span>{selectedResult.status}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Duration</label>
                                    <p className="text-sm text-gray-600">{formatDuration(selectedResult.duration_seconds)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Model</label>
                                    <p className="text-sm text-gray-600">{selectedResult.model_config.model}</p>
                                  </div>
                                </div>
                                
                                {selectedResult.error_message && (
                                  <div>
                                    <label className="text-sm font-medium text-red-600">Error Message</label>
                                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                      {selectedResult.error_message}
                                    </p>
                                  </div>
                                )}
                                
                                {selectedResult.extraction_result && (
                                  <div>
                                    <label className="text-sm font-medium">Extraction Result</label>
                                    <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-64">
                                      {JSON.stringify(selectedResult.extraction_result, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}