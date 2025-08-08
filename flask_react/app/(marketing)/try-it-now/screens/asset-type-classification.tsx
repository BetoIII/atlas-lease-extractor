"use client"

import { useState } from "react"
import { Button } from "@atlas/ui"
import { Card, CardContent, CardHeader, CardTitle } from "@atlas/ui"
import { Badge } from "@atlas/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@atlas/ui"
import {
  Building2,
  ShoppingCart,
  Factory,
  Home,
  Bed,
  Stethoscope,
  Layers,
  HelpCircle,
  CheckCircle,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Alert, AlertDescription } from "@atlas/ui"

interface AssetTypeClassificationProps {
  classification: {
    asset_type: string
    confidence: number
  } | null
  isLoading: boolean
  onReclassify: (newAssetType: string) => void
  isReclassifying?: boolean
}

const assetTypes = [
  {
    value: "office",
    label: "Office",
    description: "Commercial office buildings",
    icon: Building2,
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    value: "retail",
    label: "Retail",
    description: "Shopping centers, stores, and retail spaces",
    icon: ShoppingCart,
    color: "bg-green-100 text-green-800 border-green-200",
  },
  {
    value: "industrial",
    label: "Industrial",
    description: "Warehouses, manufacturing facilities, and industrial parks",
    icon: Factory,
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
  {
    value: "multifamily",
    label: "Multifamily",
    description: "Apartment buildings and residential complexes",
    icon: Home,
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    value: "hospitality",
    label: "Hospitality",
    description: "Hotels, motels, and lodging facilities",
    icon: Bed,
    color: "bg-pink-100 text-pink-800 border-pink-200",
  },
  {
    value: "healthcare",
    label: "Healthcare",
    description: "Medical offices, hospitals, and healthcare facilities",
    icon: Stethoscope,
    color: "bg-red-100 text-red-800 border-red-200",
  },
  {
    value: "mixed_use",
    label: "Mixed Use",
    description: "Properties with multiple uses",
    icon: Layers,
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  {
    value: "other",
    label: "Other",
    description: "Any other property type",
    icon: HelpCircle,
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
]

export function AssetTypeClassification({
  classification,
  isLoading,
  onReclassify,
  isReclassifying = false,
}: AssetTypeClassificationProps) {
  const [showReclassify, setShowReclassify] = useState(false)
  const [selectedAssetType, setSelectedAssetType] = useState<string>("")

  const handleReclassify = () => {
    if (selectedAssetType) {
      onReclassify(selectedAssetType)
      setShowReclassify(false)
      setSelectedAssetType("")
    }
  }

  const getAssetTypeInfo = (assetType: string) => {
    return assetTypes.find((type) => type.value === assetType) || assetTypes[assetTypes.length - 1]
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600"
    if (confidence >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High"
    if (confidence >= 0.6) return "Medium"
    return "Low"
  }

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-600" />
            Identifying Asset Type...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3">
            <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Our AI is analyzing your document to determine the property type...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!classification) {
    return null
  }

  const assetInfo = getAssetTypeInfo(classification.asset_type)
  const IconComponent = assetInfo.icon

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            Asset Type Identified
          </div>
          {!showReclassify && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReclassify(true)}
              className="text-xs h-7"
              disabled={isReclassifying}
            >
              {isReclassifying ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Re-classify
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showReclassify ? (
          <>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg border ${assetInfo.color}`}>
                <IconComponent className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-lg">{assetInfo.label}</span>
                  <Badge variant="outline" className={`text-xs ${getConfidenceColor(classification.confidence)}`}>
                    {getConfidenceLabel(classification.confidence)} ({Math.round(classification.confidence * 100)}%)
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{assetInfo.description}</p>
              </div>
            </div>

            {classification.confidence < 0.6 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  The AI has low confidence in this classification. You may want to re-classify this document manually.
                </AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select the correct asset type:</label>
              <Select value={selectedAssetType} onValueChange={setSelectedAssetType}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose asset type..." />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map((type) => {
                    const TypeIcon = type.icon
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <TypeIcon className="h-4 w-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handleReclassify}
                disabled={!selectedAssetType || isReclassifying}
                className="flex-1"
              >
                {isReclassifying ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                Confirm
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowReclassify(false)
                  setSelectedAssetType("")
                }}
                disabled={isReclassifying}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}