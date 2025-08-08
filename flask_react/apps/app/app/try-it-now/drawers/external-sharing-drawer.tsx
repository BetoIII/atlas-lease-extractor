"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui"
import { ExternalShareState } from "@/hooks/useExternalSharing"
import { CheckCircle, Loader2, AlertCircle, Users, Mail, Link as LinkIcon, Shield, Calendar, Download } from "lucide-react"

interface ExternalSharingDrawerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  externalShareState: ExternalShareState
}

export function ExternalSharingDrawer({ open, onOpenChange, externalShareState }: ExternalSharingDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-green-500" />
            External Sharing Progress
          </SheetTitle>
          <SheetDescription>
            Live status of external sharing events
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {externalShareState.events.map((event, index) => (
            <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg border">
              <div className="flex-shrink-0 mt-1">
                {event.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : event.status === 'in_progress' ? (
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                ) : event.status === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    {index + 1}. {event.name.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  {event.status === 'completed' && event.timestamp && (
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {event.details?.message || 'Processing...'}
                </p>
                {event.status === 'completed' && event.details && (
                  <div className="mt-2 space-y-1">
                    {event.details.invitation_id && (
                      <div className="flex items-center text-xs">
                        <LinkIcon className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="text-gray-500">Invitation ID: </span>
                        <span className="font-mono ml-1">{event.details.invitation_id.substring(0, 12)}...</span>
                      </div>
                    )}
                    {event.details.dataset_id && (
                      <div className="flex items-center text-xs">
                        <span className="text-gray-500">Dataset: </span>
                        <span className="font-mono ml-1">{event.details.dataset_id.substring(0, 12)}...</span>
                      </div>
                    )}
                    {event.details.transaction_hash && (
                      <div className="flex items-center text-xs">
                        <span className="text-gray-500">TX Hash: </span>
                        <span className="font-mono ml-1">{event.details.transaction_hash.substring(0, 12)}...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {externalShareState.isComplete && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">External Invitations Sent</h4>
                  <p className="text-xs text-green-700 mt-1">
                    Share invitations have been sent to {externalShareState.sharedEmails.length} external recipient{externalShareState.sharedEmails.length > 1 ? 's' : ''}. 
                    They can now access your document with the specified permissions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {externalShareState.sharedEmails.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center mb-2">
                <Users className="h-4 w-4 text-blue-600 mr-2" />
                <h4 className="text-sm font-medium text-blue-800">External Recipients</h4>
              </div>
              <div className="space-y-1">
                {externalShareState.sharedEmails.map((email, index) => (
                  <div key={index} className="text-xs text-blue-700 flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    {email}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sharing Settings Summary */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Sharing Configuration</h4>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <span>Data Access:</span>
                <span className="font-medium">{externalShareState.shareAllData ? 'Full Access' : 'Partial Access'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Downloads:</span>
                <span className="font-medium flex items-center">
                  <Download className="h-3 w-3 mr-1" />
                  {externalShareState.allowDownloads ? 'Allowed' : 'Restricted'}
                </span>
              </div>
              {externalShareState.expirationDate && (
                <div className="flex items-center justify-between">
                  <span>Expires:</span>
                  <span className="font-medium flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {externalShareState.expirationDate.toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-xs font-medium text-gray-700 mb-2">What happens next?</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">1.</span>
                <span>External recipients receive secure access invitations via email</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">2.</span>
                <span>Access tokens are granted with specified permissions and expiration</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">3.</span>
                <span>All access activity is logged and tracked on the blockchain</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">4.</span>
                <span>You'll receive notifications when your document is accessed</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 