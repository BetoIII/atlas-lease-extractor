"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, Check, Clock, ExternalLink, Building, Users, Mail, Database } from "lucide-react"
import { FirmShareState } from "@/hooks/useFirmSharing"

interface FirmSharingSuccessDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  firmShareState: FirmShareState
  getFirmSharingJson: () => string
  handleCopyToClipboard: (text: string, type: string) => void
  copySuccess: string | null
}

export function FirmSharingSuccessDialog({
  open,
  onOpenChange,
  firmShareState,
  getFirmSharingJson,
  handleCopyToClipboard,
  copySuccess,
}: FirmSharingSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            Document Successfully Shared with Firm
          </DialogTitle>
          <DialogDescription>
            Your document has been shared firm-wide and notifications have been sent to all active members.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          <div className="space-y-3">
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Firm ID:</span>
              <div className="flex items-center min-w-0">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all">{firmShareState.firmId}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 ml-1"
                  onClick={() => firmShareState.firmId && handleCopyToClipboard(firmShareState.firmId, 'firmId')}
                >
                  {copySuccess === 'firmId' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Shared:</span>
              <div className="flex items-center">
                <span className="text-sm flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-gray-400" />
                  {firmShareState.events.find(e => e.name === 'BulkEmailSent')?.timestamp
                    ? new Date(
                        firmShareState.events.find(e => e.name === 'BulkEmailSent')?.timestamp || new Date().toISOString()
                      ).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Dataset ID:</span>
              <div className="flex items-center min-w-0">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all max-w-[500px]">
                  {firmShareState.datasetId || 'N/A'}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 ml-1"
                  onClick={() => {
                    if (firmShareState.datasetId) handleCopyToClipboard(firmShareState.datasetId, 'datasetId')
                  }}
                >
                  {copySuccess === 'datasetId' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Batch ID:</span>
              <div className="flex items-center min-w-0">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all max-w-[500px]">
                  {firmShareState.batchId || 'N/A'}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 ml-1"
                  onClick={() => {
                    if (firmShareState.batchId) handleCopyToClipboard(firmShareState.batchId, 'batchId')
                  }}
                >
                  {copySuccess === 'batchId' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Access Method:</span>
              <div className="space-y-1">
                <div className="flex items-center text-sm">
                  <Database className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="font-medium">SCIM-Managed Directory</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2 text-gray-400" />
                  ERC-1155 Group Token #600
                </div>
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Firm Members:</span>
              <div className="flex items-center text-sm">
                <Users className="h-4 w-4 mr-2 text-blue-500" />
                <span className="font-medium text-blue-600">{firmShareState.memberCount} active members</span>
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Blockchain:</span>
              <div className="flex items-center">
                <Badge className="mr-2 bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Ethereum</Badge>
                <span className="text-sm text-gray-600">
                  {firmShareState.events.filter(e => e.status === 'completed').length} events logged
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Building className="h-5 w-5 text-blue-600 mr-2" />
              <h4 className="text-sm font-medium text-blue-800">Firm-Wide Access Details</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs text-blue-700">
              <div>
                <div className="flex justify-between">
                  <span>Share Type:</span>
                  <span className="font-medium">Firm-Wide</span>
                </div>
                <div className="flex justify-between">
                  <span>Access Control:</span>
                  <span className="font-medium">SCIM Directory</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span>Token Efficiency:</span>
                  <span className="font-medium">Single Group Token</span>
                </div>
                <div className="flex justify-between">
                  <span>Auto-Revocation:</span>
                  <span className="font-medium">SCIM Sync</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Firm Share Details (JSON)</h4>
            <div className="relative">
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40 border">
                {getFirmSharingJson()}
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => handleCopyToClipboard(getFirmSharingJson(), 'json')}
              >
                {copySuccess === 'json' ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3 text-gray-500" />
                )}
              </Button>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-start">
              <Database className="h-5 w-5 text-emerald-600 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-emerald-800">Gas-Efficient Design</h4>
                <div className="text-xs text-emerald-700 mt-2 space-y-1">
                  <p>• Uses a single ERC-1155 group token instead of {firmShareState.memberCount} individual tokens</p>
                  <p>• Reduces gas costs by ~{Math.round((firmShareState.memberCount - 1) / firmShareState.memberCount * 100)}% compared to individual token approach</p>
                  <p>• SCIM integration provides automatic access management</p>
                  <p>• Members automatically lose access when removed from firm directory</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start">
              <Building className="h-5 w-5 text-gray-600 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-800">What happens next?</h4>
                <div className="text-xs text-gray-700 mt-2 space-y-1">
                  <p>• All {firmShareState.memberCount} firm members will receive email notifications</p>
                  <p>• Members will link their wallets to corporate email addresses</p>
                  <p>• A single group access token will be granted to the SCIM group address</p>
                  <p>• Members can access the document through the firm's shared workspace</p>
                  <p>• Access is automatically managed through your SCIM directory</p>
                </div>
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