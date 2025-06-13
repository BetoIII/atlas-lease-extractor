"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertTriangle,
  Copy,
  Check,
  AlertCircle,
  FileText,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface RiskFlag {
  title: string
  clause: string
  page: number
  severity: "high" | "medium" | "low"
  reason: string
  recommendation?: string
}

interface LeaseRiskFlagsProps {
  fileName: string
  riskFlags: RiskFlag[]
}

export function LeaseRiskFlags({ fileName, riskFlags }: LeaseRiskFlagsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [expandedFlags, setExpandedFlags] = useState<number[]>([0]) // First flag expanded by default

  const toggleExpand = (index: number) => {
    setExpandedFlags((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  const handleCopy = (index: number, content: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
      })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="h-4 w-4" />
      case "medium":
        return <AlertCircle className="h-4 w-4" />
      case "low":
        return <Info className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
            Lease Risk Flags
          </div>
          <Badge variant="outline" className="text-xs">
            {riskFlags.length} issues found
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {riskFlags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Risk Flags Detected</h3>
            <p className="text-sm text-gray-500 max-w-md">
              We didn't identify any significant risk factors in this lease. However, we always recommend a thorough
              review by qualified legal counsel.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {riskFlags.map((flag, index) => (
              <Collapsible
                key={index}
                open={expandedFlags.includes(index)}
                onOpenChange={() => toggleExpand(index)}
                className="border rounded-lg overflow-hidden"
              >
                <div
                  className={`px-4 py-3 flex items-center justify-between cursor-pointer ${
                    flag.severity === "high" ? "bg-red-50" : flag.severity === "medium" ? "bg-amber-50" : "bg-blue-50"
                  }`}
                >
                  <div className="flex items-center">
                    <Badge variant="outline" className={`mr-3 ${getSeverityColor(flag.severity)}`}>
                      {getSeverityIcon(flag.severity)}
                      <span className="ml-1 capitalize">{flag.severity}</span>
                    </Badge>
                    <span className="font-medium">{flag.title}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-2">Page {flag.page}</span>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        {expandedFlags.includes(index) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
                <CollapsibleContent>
                  <div className="p-4 space-y-4 bg-white">
                    <div className="bg-gray-50 p-4 rounded-md border text-sm italic">"{flag.clause}"</div>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-sm">Issue:</span>
                        <p className="text-sm text-gray-700">{flag.reason}</p>
                      </div>
                      {flag.recommendation && (
                        <div>
                          <span className="font-medium text-sm">Recommendation:</span>
                          <p className="text-sm text-gray-700">{flag.recommendation}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-500">{fileName}</span>
                      </div>
                      <div className="flex space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleCopy(
                                    index,
                                    `Risk: ${flag.title}\n\nClause: "${flag.clause}"\n\nIssue: ${flag.reason}\n\nRecommendation: ${flag.recommendation}\n\nSource: ${fileName}, Page ${flag.page}`,
                                  )
                                }
                              >
                                {copiedIndex === index ? (
                                  <Check className="h-3 w-3 mr-1" />
                                ) : (
                                  <Copy className="h-3 w-3 mr-1" />
                                )}
                                {copiedIndex === index ? "Copied" : "Copy"}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Copy risk details to clipboard</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View in Document
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">View this clause in the original document</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-6">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Legal Disclaimer</h4>
              <p className="text-xs text-blue-700 mt-1">
                This analysis is provided for informational purposes only and does not constitute legal advice. Always
                consult with qualified legal counsel regarding your specific lease agreement.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
