"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@atlas/ui"
import { CoopShareState } from "../../../../hooks/useCoopSharing"
import { CheckCircle, Loader2, AlertCircle, Database, DollarSign, FileText, Link as LinkIcon, ExternalLink } from "lucide-react"
import { Badge } from "@atlas/ui"

interface CoopSharingDrawerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  coopShareState: CoopShareState
}

export function CoopSharingDrawer({ open, onOpenChange, coopShareState }: CoopSharingDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2 text-purple-500" />
            Data Co-op Publishing Progress
          </SheetTitle>
          <SheetDescription>
            Live status of marketplace listing events
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {coopShareState.events.map((event, index) => (
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
                    {event.details.listingId && (
                      <div className="flex items-center text-xs">
                        <LinkIcon className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="text-gray-500">Listing ID: </span>
                        <span className="font-mono ml-1">{event.details.listingId.substring(0, 12)}...</span>
                      </div>
                    )}
                    {event.details.priceUSDC && (
                      <div className="flex items-center text-xs">
                        <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="text-gray-500">Price: </span>
                        <span className="ml-1 font-medium text-emerald-600">{event.details.priceUSDC}</span>
                      </div>
                    )}
                    {event.details.licenseTemplateId && (
                      <div className="flex items-center text-xs">
                        <FileText className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="text-gray-500">Template: </span>
                        <span className="ml-1">{event.details.licenseTemplateId}</span>
                      </div>
                    )}
                    {event.details.royaltyPct && (
                      <div className="flex items-center text-xs">
                        <span className="text-gray-500">Revenue Split: </span>
                        <span className="ml-1 font-medium text-purple-600">{event.details.royaltyPct} owner</span>
                      </div>
                    )}
                    {event.details.blockNumber && (
                      <div className="flex items-center text-xs">
                        <span className="text-gray-500">Block: </span>
                        <span className="font-mono ml-1">{event.details.blockNumber}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {coopShareState.isComplete && (
            <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center">
                <Database className="h-5 w-5 text-purple-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-purple-800">Listing Live in Marketplace</h4>
                  <p className="text-xs text-purple-700 mt-1">
                    Your data is now available in the Atlas Data Co-op marketplace. 
                    You'll earn revenue on every license purchase.
                  </p>
                </div>
              </div>
            </div>
          )}

          {coopShareState.priceUSDC > 0 && (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center mb-2">
                <DollarSign className="h-4 w-4 text-emerald-600 mr-2" />
                <h4 className="text-sm font-medium text-emerald-800">Revenue Model</h4>
              </div>
              <div className="space-y-1 text-xs text-emerald-700">
                <div className="flex justify-between">
                  <span>Price per License:</span>
                  <span className="font-medium">${coopShareState.priceUSDC} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span>Your Share (95%):</span>
                  <span className="font-medium">${(coopShareState.priceUSDC * 0.95).toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span>DAO Fee (5%):</span>
                  <span className="font-medium">${(coopShareState.priceUSDC * 0.05).toFixed(2)} USDC</span>
                </div>
                <div className="border-t border-emerald-300 pt-1 mt-2">
                  <div className="flex justify-between font-medium">
                    <span>Revenue per 10 licenses:</span>
                    <span>${(coopShareState.priceUSDC * 10 * 0.95).toFixed(2)} USDC</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center mb-2">
              <FileText className="h-4 w-4 text-blue-600 mr-2" />
              <h4 className="text-sm font-medium text-blue-800">Listing Details</h4>
            </div>
            <div className="space-y-1 text-xs text-blue-700">
              <div className="flex justify-between">
                <span>License Template:</span>
                <span className="font-medium">{coopShareState.licenseTemplate}</span>
              </div>
              <div className="flex justify-between">
                <span>NFT Type:</span>
                <span className="font-medium">ERC-721 Listing NFT</span>
              </div>
              <div className="flex justify-between">
                <span>Revenue Split:</span>
                <span className="font-medium">Automated</span>
              </div>
              <div className="flex justify-between">
                <span>Marketplace Status:</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  Live & Searchable
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-xs font-medium text-gray-700 mb-2">What happens next?</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">4.</span>
                <span>Off-chain indexer will flag your listing as searchable</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">5.</span>
                <span>Buyers can discover and purchase licenses from the marketplace</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">6.</span>
                <span>Revenue is automatically distributed on each purchase</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">7.</span>
                <span>You can suspend the listing anytime from your dashboard</span>
              </div>
            </div>
          </div>

          {coopShareState.listingId && (
            <div className="mt-6 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ExternalLink className="h-4 w-4 text-purple-600 mr-2" />
                  <span className="text-sm font-medium text-purple-800">View in Marketplace</span>
                </div>
                <button 
                  className="text-xs text-purple-600 hover:text-purple-800 underline"
                  onClick={() => window.open(`/marketplace?listingId=${coopShareState.listingId}`, '_blank')}
                >
                  Open →
                </button>
              </div>
              <p className="text-xs text-purple-700 mt-1">
                Track views, purchases, and revenue from your marketplace listing
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
} 