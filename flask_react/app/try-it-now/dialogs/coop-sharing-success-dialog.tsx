"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Button } from "@/components/ui"
import { CheckCircle, Copy, Check, Clock, ExternalLink, Database, DollarSign, FileText } from "lucide-react"
import { CoopShareState } from "@/hooks/useCoopSharing"

interface CoopSharingSuccessDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  coopShareState: CoopShareState
  getCoopSharingJson: () => string
  handleCopyToClipboard: (text: string, type: string) => void
  copySuccess: string | null
}

export function CoopSharingSuccessDialog({
  open,
  onOpenChange,
  coopShareState,
  getCoopSharingJson,
  handleCopyToClipboard,
  copySuccess,
}: CoopSharingSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            Listing Live in Data Co-op Marketplace
          </DialogTitle>
          <DialogDescription>
            Your data is now available for purchase in the Atlas Data Co-op marketplace.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          <div className="space-y-3">
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Listing ID:</span>
              <div className="flex items-center min-w-0">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all">{coopShareState.listingId}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 ml-1"
                  onClick={() => coopShareState.listingId && handleCopyToClipboard(coopShareState.listingId, 'listingId')}
                >
                  {copySuccess === 'listingId' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Published:</span>
              <div className="flex items-center">
                <span className="text-sm flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-gray-400" />
                  {coopShareState.events.find(e => e.name === 'CoopListingPublished')?.timestamp
                    ? new Date(
                        coopShareState.events.find(e => e.name === 'CoopListingPublished')?.timestamp || new Date().toISOString()
                      ).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Dataset ID:</span>
              <div className="flex items-center min-w-0">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all max-w-[500px]">
                  {coopShareState.datasetId || 'N/A'}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 ml-1"
                  onClick={() => {
                    if (coopShareState.datasetId) handleCopyToClipboard(coopShareState.datasetId, 'datasetId')
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
              <span className="text-sm font-medium text-gray-500 pt-1">License Terms:</span>
              <div className="space-y-1">
                <div className="flex items-center text-sm">
                  <DollarSign className="h-4 w-4 mr-2 text-emerald-500" />
                  <span className="font-medium text-emerald-600">${coopShareState.priceUSDC} USDC per license</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FileText className="h-4 w-4 mr-2 text-gray-400" />
                  {coopShareState.licenseTemplate}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Revenue Split:</span>
              <div className="flex items-center">
                <Badge className="mr-2 bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200 flex items-center">
                  <Database className="h-3 w-3 mr-1" />
                  95% / 5%
                </Badge>
                <span className="text-sm text-gray-600">
                  You keep ${(coopShareState.priceUSDC * 0.95).toFixed(2)} USDC per license
                </span>
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Marketplace:</span>
              <div className="flex items-center">
                <Badge className="mr-2 bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Live & Searchable</Badge>
                <button 
                  className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center"
                  onClick={() => window.open(`/marketplace?listingId=${coopShareState.listingId}`, '_blank')}
                >
                  View Listing <ExternalLink className="h-3 w-3 ml-1" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Blockchain:</span>
              <div className="flex items-center">
                <Badge className="mr-2 bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Ethereum</Badge>
                <span className="text-sm text-gray-600">
                  {coopShareState.events.filter(e => e.status === 'completed').length} events logged
                </span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <DollarSign className="h-5 w-5 text-emerald-600 mr-2" />
              <h4 className="text-sm font-medium text-emerald-800">Revenue Projections</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs text-emerald-700">
              <div>
                <div className="flex justify-between">
                  <span>Per License Sale:</span>
                  <span className="font-medium">${(coopShareState.priceUSDC * 0.95).toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span>Per 10 Licenses:</span>
                  <span className="font-medium">${(coopShareState.priceUSDC * 10 * 0.95).toFixed(2)} USDC</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span>DAO Fee per Sale:</span>
                  <span className="font-medium">${(coopShareState.priceUSDC * 0.05).toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span>Your Share:</span>
                  <span className="font-medium">95%</span>
                </div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-emerald-300">
              <p className="text-xs text-emerald-600 font-medium">
                💡 Revenue is automatically distributed to your wallet on each purchase
              </p>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Database className="h-5 w-5 text-purple-600 mr-2" />
              <h4 className="text-sm font-medium text-purple-800">Marketplace Benefits</h4>
            </div>
            <div className="text-xs text-purple-700 space-y-1">
              <p>• <strong>Automated Revenue:</strong> Earn USDC on every license purchase</p>
              <p>• <strong>Global Reach:</strong> Your data is discoverable by the entire Atlas network</p>
              <p>• <strong>Industry Benchmarks:</strong> Contribute to valuable market insights</p>
              <p>• <strong>Smart Contracts:</strong> Trustless, automated revenue distribution</p>
              <p>• <strong>Full Control:</strong> Suspend or modify your listing anytime</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Listing Details (JSON)</h4>
            <div className="relative">
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40 border">
                {getCoopSharingJson()}
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => handleCopyToClipboard(getCoopSharingJson(), 'json')}
              >
                {copySuccess === 'json' ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3 text-gray-500" />
                )}
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <FileText className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Activity Tracking</h4>
                <div className="text-xs text-blue-700 mt-2 space-y-1">
                  <p>• All marketplace events are logged with block numbers for finance reconciliation</p>
                  <p>• Track listing views, license purchases, and revenue distribution</p>
                  <p>• Export transaction history for accounting and tax purposes</p>
                  <p>• Real-time notifications when your data is purchased</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start">
              <Database className="h-5 w-5 text-gray-600 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-800">What happens next?</h4>
                <div className="text-xs text-gray-700 mt-2 space-y-1">
                  <p>• Your listing will be indexed and made searchable in the marketplace</p>
                  <p>• Buyers can discover and purchase licenses using USDC</p>
                  <p>• Revenue is automatically split and distributed on each sale</p>
                  <p>• You'll receive notifications and can track all activity</p>
                  <p>• Manage your listing from the marketplace dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-shrink-0 flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => window.open(`/marketplace?listingId=${coopShareState.listingId}`, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View in Marketplace
          </Button>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 