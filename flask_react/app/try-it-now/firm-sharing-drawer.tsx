"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { FirmShareState } from "@/hooks/useFirmSharing"
import { CheckCircle, Loader2, AlertCircle, Building, Users, Mail, Link as LinkIcon, Database } from "lucide-react"

interface FirmSharingDrawerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  firmShareState: FirmShareState
}

export function FirmSharingDrawer({ open, onOpenChange, firmShareState }: FirmSharingDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2 text-blue-500" />
            Firm-Wide Sharing Progress
          </SheetTitle>
          <SheetDescription>
            Live status of blockchain firm sharing events
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {firmShareState.events.map((event, index) => (
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
                    {event.details.firmId && (
                      <div className="flex items-center text-xs">
                        <Building className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="text-gray-500">Firm ID: </span>
                        <span className="font-mono ml-1">{event.details.firmId.substring(0, 12)}...</span>
                      </div>
                    )}
                    {event.details.batchId && (
                      <div className="flex items-center text-xs">
                        <Mail className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="text-gray-500">Batch ID: </span>
                        <span className="font-mono ml-1">{event.details.batchId.substring(0, 12)}...</span>
                      </div>
                    )}
                    {event.details.memberCount && (
                      <div className="flex items-center text-xs">
                        <Users className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="text-gray-500">Members: </span>
                        <span className="ml-1 font-medium text-blue-600">{event.details.memberCount}</span>
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

          {firmShareState.isComplete && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <Building className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Firm-Wide Access Enabled</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Document has been shared with all {firmShareState.memberCount} active firm members. 
                    They'll receive notifications and can access the document once they link their wallets.
                  </p>
                </div>
              </div>
            </div>
          )}

          {firmShareState.memberCount > 0 && (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center mb-2">
                <Users className="h-4 w-4 text-emerald-600 mr-2" />
                <h4 className="text-sm font-medium text-emerald-800">SCIM-Managed Access</h4>
              </div>
              <div className="space-y-1 text-xs text-emerald-700">
                <div className="flex justify-between">
                  <span>Active Firm Members:</span>
                  <span className="font-medium">{firmShareState.memberCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Access Method:</span>
                  <span className="font-medium">SCIM Directory</span>
                </div>
                <div className="flex justify-between">
                  <span>Token Type:</span>
                  <span className="font-medium">ERC-1155 Group Token</span>
                </div>
                <div className="flex justify-between">
                  <span>Group Token ID:</span>
                  <span className="font-medium">#600</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-xs font-medium text-gray-700 mb-2">What happens next?</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">4.</span>
                <span>Firm members will link their wallets to corporate email addresses</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">5.</span>
                <span>A single ERC-1155 group token will be granted to the SCIM group address</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">6.</span>
                <span>Members can access the document through the firm's shared workspace</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">7.</span>
                <span>Access is automatically revoked if members leave the firm (SCIM sync)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start">
              <Database className="h-4 w-4 text-amber-600 mr-2 mt-0.5" />
              <div>
                <h4 className="text-xs font-medium text-amber-800">Gas-Efficient Design</h4>
                <p className="text-xs text-amber-700 mt-1">
                  Uses a single ERC-1155 group token instead of individual tokens for each member, 
                  significantly reducing gas costs while maintaining granular access control through SCIM integration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 