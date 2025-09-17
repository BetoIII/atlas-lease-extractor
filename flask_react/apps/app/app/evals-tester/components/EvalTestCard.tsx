"use client"

import { useState } from "react"
import { Button } from "@/components/ui"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Progress } from "@/components/ui"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui"
import { 
  Play, 
  Square, 
  RefreshCw, 
  Settings, 
  ChevronDown,
  FileText,
  AlertTriangle,
  Key,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"

import { ModelSelector } from "./ModelSelector"

interface ModelConfig {
  provider: string
  model: string
  temperature: number
  streaming: boolean
}

interface AvailableModels {
  available_models: Record<string, string[]>
  presets: Record<string, ModelConfig>
  display_info: Record<string, any>
}

interface TestType {
  id: string
  name: string
  description: string
  icon: any
  color: string
}

interface EvalTestCardProps {
  testType: TestType
  defaultModelConfig: ModelConfig
  availableModels: AvailableModels | null
  selectedFile: string
  isRunning: boolean
  onRunTest: (modelConfig: ModelConfig) => void
}

export function EvalTestCard({ 
  testType, 
  defaultModelConfig, 
  availableModels, 
  selectedFile, 
  isRunning, 
  onRunTest 
}: EvalTestCardProps) {
  const [modelConfig, setModelConfig] = useState<ModelConfig>(defaultModelConfig)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [useGlobalConfig, setUseGlobalConfig] = useState(true)

  const handleRunTest = () => {
    const configToUse = useGlobalConfig ? defaultModelConfig : modelConfig
    onRunTest(configToUse)
  }

  const getIconComponent = () => {
    const IconComponent = testType.icon
    return <IconComponent className="h-6 w-6" />
  }

  const getColorClasses = () => {
    switch (testType.color) {
      case 'blue':
        return {
          border: 'border-blue-200',
          icon: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-800'
        }
      case 'red':
        return {
          border: 'border-red-200',
          icon: 'text-red-600',
          badge: 'bg-red-100 text-red-800'
        }
      case 'green':
        return {
          border: 'border-green-200',
          icon: 'text-green-600',
          badge: 'bg-green-100 text-green-800'
        }
      default:
        return {
          border: 'border-gray-200',
          icon: 'text-gray-600',
          badge: 'bg-gray-100 text-gray-800'
        }
    }
  }

  const colorClasses = getColorClasses()
  const currentConfig = useGlobalConfig ? defaultModelConfig : modelConfig

  return (
    <Card className={`relative transition-all duration-200 hover:shadow-md ${colorClasses.border}`}>
      {isRunning && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-sm font-medium">Running test...</span>
            <Progress value={undefined} className="w-32" />
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={colorClasses.icon}>
              {getIconComponent()}
            </div>
            <div>
              <CardTitle className="text-lg">{testType.name}</CardTitle>
            </div>
          </div>
          <Badge className={`${colorClasses.badge} text-center justify-center`}>
            {testType.id.replace('_', ' ')}
          </Badge>
        </div>
        <CardDescription className="text-sm">
          {testType.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Information */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              Model: {currentConfig.model}
            </span>
          </div>
          {selectedFile ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">File ready</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-600">
              <XCircle className="h-4 w-4" />
              <span className="text-xs">No file</span>
            </div>
          )}
        </div>

        {/* Model Configuration Toggle */}
        <Collapsible open={isConfigOpen} onOpenChange={setIsConfigOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-between h-8"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="text-sm">
                  {useGlobalConfig ? 'Using global config' : 'Custom config'}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isConfigOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`global-${testType.id}`}
                checked={useGlobalConfig}
                onChange={(e) => setUseGlobalConfig(e.target.checked)}
                className="rounded"
              />
              <label 
                htmlFor={`global-${testType.id}`}
                className="text-sm text-gray-700"
              >
                Use global model configuration
              </label>
            </div>
            
            {!useGlobalConfig && availableModels && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <ModelSelector
                  availableModels={availableModels}
                  value={modelConfig}
                  onChange={setModelConfig}
                  showAdvanced={false}
                />
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Action Button */}
        <Button 
          onClick={handleRunTest}
          disabled={!selectedFile || isRunning}
          className="w-full"
          variant={selectedFile ? "default" : "secondary"}
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Test
            </>
          )}
        </Button>

        {/* Quick Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Provider:</span>
            <span className="font-medium">{currentConfig.provider}</span>
          </div>
          <div className="flex justify-between">
            <span>Temperature:</span>
            <span className="font-medium">{currentConfig.temperature}</span>
          </div>
          <div className="flex justify-between">
            <span>Streaming:</span>
            <span className="font-medium">{currentConfig.streaming ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}