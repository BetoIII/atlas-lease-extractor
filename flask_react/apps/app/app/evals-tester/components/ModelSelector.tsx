"use client"

import { useState } from "react"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui"
import { Button } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { Slider } from "@/components/ui"
import { Switch } from "@/components/ui"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui"
import { ChevronDown, Settings, Zap, Brain, DollarSign } from "lucide-react"

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

interface ModelSelectorProps {
  availableModels: AvailableModels
  value: ModelConfig
  onChange: (config: ModelConfig) => void
  showAdvanced?: boolean
}

export function ModelSelector({ 
  availableModels, 
  value, 
  onChange, 
  showAdvanced = true 
}: ModelSelectorProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  
  const handleProviderChange = (provider: string) => {
    // When provider changes, select the first available model for that provider
    const availableForProvider = availableModels.available_models[provider] || []
    const firstModel = availableForProvider[0] || value.model
    
    onChange({
      ...value,
      provider,
      model: firstModel
    })
  }
  
  const handleModelChange = (model: string) => {
    onChange({
      ...value,
      model
    })
  }
  
  const handleTemperatureChange = (temperature: number[]) => {
    onChange({
      ...value,
      temperature: temperature[0]
    })
  }
  
  const handleStreamingChange = (streaming: boolean) => {
    onChange({
      ...value,
      streaming
    })
  }
  
  const applyPreset = (presetName: string) => {
    const preset = availableModels.presets[presetName]
    if (preset) {
      onChange(preset)
    }
  }
  
  const getProviderBadgeColor = (provider: string) => {
    switch (provider) {
      case 'openai': return 'bg-green-100 text-green-800'
      case 'anthropic': return 'bg-purple-100 text-purple-800'  
      case 'llama': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getModelInfo = (provider: string, model: string) => {
    const providerInfo = availableModels.display_info[provider]
    if (!providerInfo) return null
    return providerInfo.models[model]
  }
  
  const currentModelInfo = getModelInfo(value.provider, value.model)
  
  return (
    <div className="space-y-4">
      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-600">Quick presets:</span>
        {Object.entries(availableModels.presets).map(([name, preset]) => (
          <Button
            key={name}
            variant="outline" 
            size="sm"
            onClick={() => applyPreset(name)}
            className="h-7 text-xs"
          >
            {name === 'fast_cheap' && <DollarSign className="h-3 w-3 mr-1" />}
            {name === 'high_quality' && <Brain className="h-3 w-3 mr-1" />}
            {name === 'balanced' && <Zap className="h-3 w-3 mr-1" />}
            {name.replace('_', ' ')}
          </Button>
        ))}
      </div>
      
      {/* Main Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Provider</label>
          <Select value={value.provider} onValueChange={handleProviderChange}>
            <SelectTrigger>
              <SelectValue>
                <div className="flex items-center gap-2">
                  <Badge className={getProviderBadgeColor(value.provider)}>
                    {availableModels.display_info[value.provider]?.name || value.provider}
                  </Badge>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.keys(availableModels.available_models).map((provider) => (
                <SelectItem key={provider} value={provider}>
                  <div className="flex items-center gap-2">
                    <Badge className={getProviderBadgeColor(provider)}>
                      {availableModels.display_info[provider]?.name || provider}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Model</label>
          <Select value={value.model} onValueChange={handleModelChange}>
            <SelectTrigger>
              <SelectValue>
                <div className="flex flex-col items-start">
                  <span className="font-medium">
                    {currentModelInfo?.name || value.model}
                  </span>
                  {currentModelInfo?.description && (
                    <span className="text-xs text-gray-500 truncate">
                      {currentModelInfo.description}
                    </span>
                  )}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(availableModels.available_models[value.provider] || []).map((model) => {
                const modelInfo = getModelInfo(value.provider, model)
                return (
                  <SelectItem key={model} value={model}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">
                        {modelInfo?.name || model}
                      </span>
                      {modelInfo?.description && (
                        <span className="text-xs text-gray-500">
                          {modelInfo.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Advanced Settings */}
      {showAdvanced && (
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-1 text-sm">
              <Settings className="h-4 w-4" />
              Advanced Settings
              <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4">
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Temperature
                    </label>
                    <span className="text-sm text-gray-500">
                      {value.temperature}
                    </span>
                  </div>
                  <Slider
                    value={[value.temperature]}
                    onValueChange={handleTemperatureChange}
                    min={0}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Conservative (0)</span>
                    <span>Creative (2)</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Streaming
                    </label>
                    <p className="text-xs text-gray-500">
                      Enable real-time response streaming
                    </p>
                  </div>
                  <Switch
                    checked={value.streaming}
                    onCheckedChange={handleStreamingChange}
                  />
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}
      
      {/* Current Configuration Summary */}
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
        <strong>Current:</strong> {currentModelInfo?.name || value.model} 
        (temp: {value.temperature}, streaming: {value.streaming ? 'on' : 'off'})
      </div>
    </div>
  )
}