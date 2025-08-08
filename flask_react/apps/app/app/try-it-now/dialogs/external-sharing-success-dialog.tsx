"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Button } from "@/components/ui"
import { CheckCircle, Copy, Check, Clock, ExternalLink, Users, Mail, FileText } from "lucide-react"
import { ExternalShareState } from "@/hooks/useExternalSharing"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

interface ExternalSharingSuccessDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  externalShareState: ExternalShareState
  getExternalSharingJson: () => string
  handleCopyToClipboard: (text: string, type: string) => void
  copySuccess: string | null
  documentId?: string
}

export function ExternalSharingSuccessDialog({
  open,
  onOpenChange,
  externalShareState,
  getExternalSharingJson,
  handleCopyToClipboard,
  copySuccess,
  documentId,
}: ExternalSharingSuccessDialogProps) {
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
            Document Successfully Shared Externally
          </DialogTitle>
          <DialogDescription>
            Your document has been shared with external parties and invitations have been sent to recipients.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          <div className="space-y-3">
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Invitation ID:</span>
              <div className="flex items-center min-w-0">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all">{externalShareState.invitationId || 'N/A'}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 ml-1"
                  onClick={() => externalShareState.invitationId && handleCopyToClipboard(externalShareState.invitationId, 'invitationId')}
                >
                  {copySuccess === 'invitationId' ? (
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
                  {externalShareState.events.find(e => e.name === 'InvitationEmailSent')?.timestamp
                    ? new Date(
                        externalShareState.events.find(e => e.name === 'InvitationEmailSent')?.timestamp || new Date().toISOString()
                      ).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Dataset ID:</span>
              <div className="flex items-center min-w-0">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all max-w-[500px]">
                  {externalShareState.datasetId || 'N/A'}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 ml-1"
                  onClick={() => {
                    if (externalShareState.datasetId) handleCopyToClipboard(externalShareState.datasetId, 'datasetId')
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
              <span className="text-sm font-medium text-gray-500 pt-1">Recipients:</span>
              <div className="space-y-1">
                {externalShareState.sharedEmails.map((email, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {email}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Permissions:</span>
              <div className="space-y-1">
                <div className="flex items-center text-sm">
                  <span className="text-gray-600">Data Access: </span>
                  <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">
                    {externalShareState.shareAllData ? 'Full Access' : 'Partial Access'}
                  </Badge>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-600">Downloads: </span>
                  <Badge className={`ml-2 ${externalShareState.allowDownloads ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'} hover:bg-current`}>
                    {externalShareState.allowDownloads ? 'Allowed' : 'Restricted'}
                  </Badge>
                </div>
                {externalShareState.expirationDate && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600">Expires: </span>
                    <span className="ml-2 text-gray-800">
                      {new Date(externalShareState.expirationDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-gray-500 pt-1">Blockchain:</span>
              <div className="flex items-center">
                <Badge className="mr-2 bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Ethereum</Badge>
                <span className="text-sm text-gray-600">
                  {externalShareState.events.filter(e => e.status === 'completed').length} events logged
                </span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Share Details (JSON)</h4>
            <div className="relative">
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40 border">
                {getExternalSharingJson()}
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => handleCopyToClipboard(getExternalSharingJson(), 'json')}
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
              <Users className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">What happens next?</h4>
                <div className="text-xs text-blue-700 mt-2 space-y-1">
                  <p>• External recipients will receive secure email invitations</p>
                  <p>• When they accept, access tokens will be minted automatically</p>
                  <p>• You'll receive notifications when your document is accessed</p>
                  <p>• You can revoke access at any time from your dashboard</p>
                  <p>• Access permissions are enforced according to your sharing settings</p>
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