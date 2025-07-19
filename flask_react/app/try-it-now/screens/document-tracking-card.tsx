"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Switch } from "@/components/ui"
import { Button } from "@/components/ui"
import { Progress } from "@/components/ui"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui"
import { Key, Info, ExternalLink, Loader2, Eye, Shield, Fingerprint } from "lucide-react"

export interface RegistrationEvent {
  id: number
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  timestamp?: string
  details?: {
    txHash?: string
    explorerUrl?: string
    tokenId?: string
    manifestCID?: string
    sha256?: string
    simhash?: string
    tlsh?: string
    datasetId?: string
    storageCID?: string
    block?: string
    message?: string
  }
}

export interface RegistrationState {
  isActive: boolean
  currentStep: number
  events: RegistrationEvent[]
  isComplete: boolean
  recordId?: string
  txHash?: string
  explorerUrl?: string
  tokenId?: string
}

interface DocumentTrackingCardProps {
  sharingLevel: "private" | "firm" | "external" | "license" | "coop"
  enableDocumentTracking: boolean
  setEnableDocumentTracking: (v: boolean) => void
  registrationState: RegistrationState
  onRegister: () => void
  onViewAuditTrail: () => void
}

export function DocumentTrackingCard({
  sharingLevel,
  enableDocumentTracking,
  setEnableDocumentTracking,
  registrationState,
  onRegister,
  onViewAuditTrail,
}: DocumentTrackingCardProps) {
  return (
    <Card className="">
      <CardHeader>
        <CardTitle className="flex items-center text-base">Enable Document Tracking</CardTitle>
        <CardDescription className="text-xs ">
          Generate a unique record that maintains an immutable audit trail with Atlas DAO.
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button>
                  <Info className="h-4 w-4 text-gray-400 ml-2" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="mb-2">
                  Atlas DAO is a non-profit third-party that maintains a unique hash record of your document and its activity - providing a tamper-proof and verifiable audit trail of your data.
                </p>
                <div className="flex justify-end">
                  <a href="https://atlasdao.com" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-900 font-bold flex items-center gap-1">
                    Learn more
                    <ExternalLink className="h-3 w-3 text-gray-400" />
                  </a>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-right justify-end pb-2">
          <Badge
            variant="outline"
            className={`w-fit ${
              registrationState.isComplete
                ? "bg-green-100 text-green-800 border-green-200"
                : sharingLevel === "external" || sharingLevel === "coop" || sharingLevel === "license"
                ? "bg-red-100 text-red-800 border-red-200"
                : "bg-green-100 text-green-800 border-green-200"
            }`}
          >
            {registrationState.isComplete
              ? "Verified"
              : sharingLevel === "external" || sharingLevel === "coop" || sharingLevel === "license"
              ? "Required"
              : "Recommended"}
          </Badge>
        </div>
        <div
          className={`rounded-lg border p-3 space-y-3 ${
            registrationState.isComplete
              ? "border-green-200 bg-green-50"
              : sharingLevel === "external" || sharingLevel === "coop" || sharingLevel === "license"
              ? "border-red-200 bg-red-50"
              : "border-blue-200 bg-blue-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Key className={`h-4 w-4 mr-2 ${registrationState.isComplete ? "text-green-600" : "text-gray-500"}`} />
              <div className={`text-sm font-medium ${registrationState.isComplete ? "text-green-800" : ""}`}>
                {registrationState.isComplete ? "Document Registered" : "Enable Tracking"}
              </div>
            </div>
            <Switch
              checked={registrationState.isComplete || enableDocumentTracking}
              onCheckedChange={registrationState.isComplete ? undefined : setEnableDocumentTracking}
              disabled={registrationState.isComplete}
              className={registrationState.isComplete ? "data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 disabled:opacity-100" : ""}
            />
          </div>
        </div>
        {registrationState.isActive && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">
                {registrationState.currentStep === 0
                  ? "Initializing..."
                  : registrationState.currentStep === 1
                  ? "Preparing registration..."
                  : "Registration Complete"}
              </span>
              <span className="text-gray-500">
                {registrationState.currentStep === 1 ? "0%" : registrationState.currentStep === 2 ? "50%" : "100%"}
              </span>
            </div>
            <Progress value={registrationState.currentStep === 1 ? 50 : 100} className="h-1" />
          </div>
        )}
        <div className="flex justify-center items-center pt-4">
          {registrationState.isActive ? (
            <Button variant="default" size="sm" disabled>
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              Registering...
            </Button>
          ) : registrationState.isComplete ? (
            <Button variant="outline" size="sm" onClick={onViewAuditTrail}>
              <Eye className="h-3 w-3 mr-2" />
              View Audit Trail
            </Button>
          ) : (
            <Button variant="default" size="sm" disabled={!enableDocumentTracking} onClick={onRegister}>
              <Fingerprint className="h-3 w-3 mr-2" />
              Register Document
            </Button>
          )}
        </div>
        <div className="text-xs text-gray-500 flex justify-center pt-4">
          <span className="flex items-center">
            <Shield className="h-3 w-3 mr-1 text-green-600" />
            {registrationState.isComplete ? "Powered by Ethereum" : "Powered by Ethereum"}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
