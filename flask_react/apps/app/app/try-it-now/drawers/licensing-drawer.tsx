"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui"
import { LicenseState } from "@/hooks/useLicensing"
import { CheckCircle, Loader2, AlertCircle, DollarSign, Mail, Link as LinkIcon, FileText } from "lucide-react"

interface LicensingDrawerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  licenseState: LicenseState
}

export function LicensingDrawer({ open, onOpenChange, licenseState }: LicensingDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-emerald-500" />
            Document Licensing Progress
          </SheetTitle>
          <SheetDescription>
            Live status of blockchain licensing events
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {licenseState.events.map((event, index) => (
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
                    {event.details.offerId && (
                      <div className="flex items-center text-xs">
                        <LinkIcon className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="text-gray-500">Offer ID: </span>
                        <span className="font-mono ml-1">{event.details.offerId.substring(0, 12)}...</span>
                      </div>
                    )}
                    {event.details.templateId && (
                      <div className="flex items-center text-xs">
                        <FileText className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="text-gray-500">Template: </span>
                        <span className="ml-1">{event.details.templateId}</span>
                      </div>
                    )}
                    {event.details.price && (
                      <div className="flex items-center text-xs">
                        <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="text-gray-500">Price: </span>
                        <span className="ml-1 font-medium text-emerald-600">{event.details.price}</span>
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

          {licenseState.isComplete && (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-emerald-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-emerald-800">License Offer Published</h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    License offer has been published at ${licenseState.monthlyFee}/month for {licenseState.licensedEmails.length} potential licensee{licenseState.licensedEmails.length > 1 ? 's' : ''}. 
                    You'll be notified when they accept and payments begin.
                  </p>
                </div>
              </div>
            </div>
          )}

          {licenseState.licensedEmails.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center mb-2">
                <Mail className="h-4 w-4 text-blue-600 mr-2" />
                <h4 className="text-sm font-medium text-blue-800">Potential Licensees</h4>
              </div>
              <div className="space-y-1">
                {licenseState.licensedEmails.map((email, index) => (
                  <div key={index} className="text-xs text-blue-700 flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    {email}
                  </div>
                ))}
              </div>
            </div>
          )}

          {licenseState.monthlyFee > 0 && (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center mb-2">
                <DollarSign className="h-4 w-4 text-emerald-600 mr-2" />
                <h4 className="text-sm font-medium text-emerald-800">Revenue Projection</h4>
              </div>
              <div className="space-y-1 text-xs text-emerald-700">
                <div className="flex justify-between">
                  <span>Monthly License Fee:</span>
                  <span className="font-medium">${licenseState.monthlyFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Your Share (85%):</span>
                  <span className="font-medium">${(licenseState.monthlyFee * 0.85).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee (15%):</span>
                  <span className="font-medium">${(licenseState.monthlyFee * 0.15).toFixed(2)}</span>
                </div>
                <div className="border-t border-emerald-300 pt-1 mt-2">
                  <div className="flex justify-between font-medium">
                    <span>Annual Potential:</span>
                    <span>${(licenseState.monthlyFee * 12 * 0.85).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-xs font-medium text-gray-700 mb-2">What happens next?</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">3.</span>
                <span>Potential licensees will receive license offer notifications</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">4.</span>
                <span>When they accept, payment will be escrowed automatically</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">5.</span>
                <span>License NFTs will be minted with time-bounded access</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">6.</span>
                <span>Revenue will be distributed to you monthly (85% share)</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 