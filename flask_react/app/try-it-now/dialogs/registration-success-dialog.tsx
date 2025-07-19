"use client"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Button } from "@/components/ui"
import { CheckCircle, Copy, Check, Clock, ExternalLink, Shield } from "lucide-react"
import { RegistrationState } from "../screens/document-tracking-card"

interface RegistrationSuccessDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  registrationState: RegistrationState
  getRegistrationJson: () => string
  handleCopyToClipboard: (text: string, type: string) => void
  copySuccess: string | null
}

export function RegistrationSuccessDialog({
  open,
  onOpenChange,
  registrationState,
  getRegistrationJson,
  handleCopyToClipboard,
  copySuccess,
}: RegistrationSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            Document Successfully Registered
          </DialogTitle>
          <DialogDescription>
            Your document has been registered and is now cryptographically verifiable.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          <div className="space-y-3">
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Record ID:</span>
              <div className="flex items-center min-w-0">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all">{registrationState.recordId}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 ml-1"
                  onClick={() => registrationState.recordId && handleCopyToClipboard(registrationState.recordId, 'recordId')}
                >
                  {copySuccess === 'recordId' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Created:</span>
              <div className="flex items-center">
                <span className="text-sm flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-gray-400" />
                  {registrationState.events.find(e => e.name === 'RegistrationCompleted')?.timestamp
                    ? new Date(
                        registrationState.events.find(e => e.name === 'RegistrationCompleted')?.timestamp || new Date().toISOString()
                      ).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Document Hash:</span>
              <div className="flex items-center min-w-0">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all max-w-[500px]">
                  {registrationState.events.find(e => e.name === 'RegistrationCompleted')?.details?.sha256 || 'N/A'}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 ml-1"
                  onClick={() => {
                    const hash = registrationState.events.find(e => e.name === 'RegistrationCompleted')?.details?.sha256
                    if (hash) handleCopyToClipboard(hash, 'hash')
                  }}
                >
                  {copySuccess === 'hash' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>
            {registrationState.txHash && (
              <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                <span className="text-sm font-medium text-gray-500 pt-1">Blockchain:</span>
                <div className="flex items-center">
                  <Badge className="mr-2 bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Ethereum</Badge>
                  <a href={registrationState.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center">
                    View Transaction
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Registration Data</h4>
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleCopyToClipboard(getRegistrationJson(), 'json')}>
                {copySuccess === 'json' ? <Check className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
                Copy JSON
              </Button>
            </div>
            <div className="bg-gray-900 text-gray-100 p-3 text-xs font-mono overflow-auto rounded-md min-h-[200px] max-h-[400px] whitespace-pre-wrap">
              {getRegistrationJson()}
            </div>
          </div>
          <div className="rounded-lg border border-green-100 bg-green-50 p-3">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-green-800">Verification Status</h4>
                <p className="text-xs text-green-700 mt-1">
                  This document has been cryptographically signed and is now immutable. It can be used immediately for all purposes.
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-shrink-0">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
