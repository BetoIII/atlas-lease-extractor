"use client"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@atlas/ui"
import { RegistrationState } from "../screens/document-tracking-card"
import { CheckCircle, Loader2, AlertCircle, Fingerprint, Shield, Link as LinkIcon } from "lucide-react"

interface RegistrationDrawerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  registrationState: RegistrationState
}

export function RegistrationDrawer({ open, onOpenChange, registrationState }: RegistrationDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <Fingerprint className="h-5 w-5 mr-2 text-blue-500" />
            Document Registration Progress
          </SheetTitle>
          <SheetDescription>
            Live status of blockchain registration events
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {registrationState.events.map((event, index) => (
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
                    {event.details.txHash && (
                      <div className="flex items-center text-xs">
                        <LinkIcon className="h-3 w-3 mr-1 text-gray-400" />
                        <a
                          href={event.details.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-mono"
                        >
                          {event.details.txHash.substring(0, 10)}...
                        </a>
                      </div>
                    )}
                    {event.details.tokenId && (
                      <div className="flex items-center text-xs">
                        <span className="text-gray-500">Token ID: </span>
                        <span className="font-mono ml-1">#{event.details.tokenId}</span>
                      </div>
                    )}
                    {event.details.block && (
                      <div className="flex items-center text-xs">
                        <span className="text-gray-500">Block: </span>
                        <span className="font-mono ml-1">{event.details.block}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {registrationState.isComplete && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">Registration Complete</h4>
                  <p className="text-xs text-green-700 mt-1">
                    Your document is now cryptographically verifiable and tamper-proof.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
