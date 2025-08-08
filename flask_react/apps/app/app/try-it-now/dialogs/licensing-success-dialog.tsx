"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Button } from "@/components/ui"
import { CheckCircle, Copy, Check, Clock, ExternalLink, DollarSign, Mail, FileText } from "lucide-react"
import { LicenseState } from "@/hooks/useLicensing"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

interface LicensingSuccessDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  licenseState: LicenseState
  getLicensingJson: () => string
  handleCopyToClipboard: (text: string, type: string) => void
  copySuccess: string | null
  documentId?: string
}

export function LicensingSuccessDialog({
  open,
  onOpenChange,
  licenseState,
  getLicensingJson,
  handleCopyToClipboard,
  copySuccess,
  documentId,
}: LicensingSuccessDialogProps) {
  const router = useRouter()

  const handleManageDoc = async () => {
    if (!documentId) return
    
    try {
      const session = await authClient.getSession()
      if (session?.data?.user) {
        // User is logged in, navigate to document details
        router.push(`/documents/${documentId}`)
      } else {
        // User is not logged in, navigate to signup
        router.push('/auth/signup')
      }
    } catch (error) {
      // If there's an error checking auth, assume not logged in
      router.push('/auth/signup')
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            License Offer Successfully Published
          </DialogTitle>
          <DialogDescription>
            Your license offer has been published and notifications have been sent to potential licensees.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          <div className="space-y-3">
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Offer ID:</span>
              <div className="flex items-center min-w-0">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all">{licenseState.offerId}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 ml-1"
                  onClick={() => licenseState.offerId && handleCopyToClipboard(licenseState.offerId, 'offerId')}
                >
                  {copySuccess === 'offerId' ? (
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
                  {licenseState.events.find(e => e.name === 'OfferEmailSent')?.timestamp
                    ? new Date(
                        licenseState.events.find(e => e.name === 'OfferEmailSent')?.timestamp || new Date().toISOString()
                      ).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Dataset ID:</span>
              <div className="flex items-center min-w-0">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all max-w-[500px]">
                  {licenseState.datasetId || 'N/A'}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 ml-1"
                  onClick={() => {
                    if (licenseState.datasetId) handleCopyToClipboard(licenseState.datasetId, 'datasetId')
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
                  <span className="font-medium text-emerald-600">${licenseState.monthlyFee}/month</span>
                  <span className="text-gray-500 ml-2">(You keep ${(licenseState.monthlyFee * 0.85).toFixed(2)})</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FileText className="h-4 w-4 mr-2 text-gray-400" />
                  A16Z "Can't Be Evil" License Template
                </div>
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Potential Licensees:</span>
              <div className="space-y-1">
                {licenseState.licensedEmails.map((email, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {email}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Blockchain:</span>
              <div className="flex items-center">
                <Badge className="mr-2 bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Ethereum</Badge>
                <span className="text-sm text-gray-600">
                  {licenseState.events.filter(e => e.status === 'completed').length} events logged
                </span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <DollarSign className="h-5 w-5 text-emerald-600 mr-2" />
              <h4 className="text-sm font-medium text-emerald-800">Revenue Projection</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs text-emerald-700">
              <div>
                <div className="flex justify-between">
                  <span>Monthly Revenue:</span>
                  <span className="font-medium">${(licenseState.monthlyFee * 0.85).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual Potential:</span>
                  <span className="font-medium">${(licenseState.monthlyFee * 12 * 0.85).toFixed(2)}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span>Platform Fee:</span>
                  <span className="font-medium">${(licenseState.monthlyFee * 0.15).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>License Fee:</span>
                  <span className="font-medium">${licenseState.monthlyFee.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">License Details (JSON)</h4>
            <div className="relative">
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40 border">
                {getLicensingJson()}
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => handleCopyToClipboard(getLicensingJson(), 'json')}
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
              <DollarSign className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">What happens next?</h4>
                <div className="text-xs text-blue-700 mt-2 space-y-1">
                  <p>• Potential licensees will receive license offer notifications</p>
                  <p>• When they accept, payment will be automatically escrowed</p>
                  <p>• Time-bounded License NFTs (ERC-4907) will be minted</p>
                  <p>• Revenue will be distributed to you monthly (85% share)</p>
                  <p>• You can track all activity from your licensing dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-shrink-0 flex justify-between">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
          {documentId && (
            <Button onClick={handleManageDoc} variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Manage Doc
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 