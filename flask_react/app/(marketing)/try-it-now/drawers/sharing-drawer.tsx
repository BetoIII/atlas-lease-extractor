"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@atlas/ui"
import { ShareState } from "../../../../hooks/useSharing"
import { CheckCircle, Loader2, AlertCircle, Users, Mail, Link as LinkIcon } from "lucide-react"

interface SharingDrawerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  shareState: ShareState
}

export function SharingDrawer({ open, onOpenChange, shareState }: SharingDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-500" />
            Document Sharing Progress
          </SheetTitle>
          <SheetDescription>
            Live status of blockchain sharing events
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {shareState.events.map((event, index) => (
            <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg border">
              <div className="flex-shrink-0 mt-1">
                {event.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : event.status === 'processing' ? (
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
                    {event.details.invitationId && (
                      <div className="flex items-center text-xs">
                        <LinkIcon className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="text-gray-500">Invitation ID: </span>
                        <span className="font-mono ml-1">{event.details.invitationId.substring(0, 12)}...</span>
                      </div>
                    )}
                    {event.details.emailTxId && (
                      <div className="flex items-center text-xs">
                        <Mail className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="text-gray-500">Email TX: </span>
                        <span className="font-mono ml-1">{event.details.emailTxId.substring(0, 12)}...</span>
                      </div>
                    )}
                    {event.details.datasetId && (
                      <div className="flex items-center text-xs">
                        <span className="text-gray-500">Dataset: </span>
                        <span className="font-mono ml-1">{event.details.datasetId.substring(0, 12)}...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {shareState.isComplete && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">Invitations Sent</h4>
                  <p className="text-xs text-green-700 mt-1">
                    Share invitations have been sent to {shareState.sharedEmails.length} recipient{shareState.sharedEmails.length > 1 ? 's' : ''}. 
                    You'll be notified when they accept and access your document.
                  </p>
                </div>
              </div>
            </div>
          )}

          {shareState.sharedEmails.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center mb-2">
                <Users className="h-4 w-4 text-blue-600 mr-2" />
                <h4 className="text-sm font-medium text-blue-800">Recipients</h4>
              </div>
              <div className="space-y-1">
                {shareState.sharedEmails.map((email, index) => (
                  <div key={index} className="text-xs text-blue-700 flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    {email}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-xs font-medium text-gray-700 mb-2">What happens next?</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">3.</span>
                <span>Recipients will receive email invitations with secure access links</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">4.</span>
                <span>When they accept, access tokens will be minted and granted</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">5.</span>
                <span>You'll receive notifications when your document is accessed</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 