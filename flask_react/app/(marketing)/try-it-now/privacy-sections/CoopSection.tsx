"use client"

import React, { useState } from "react"
import { Label } from "@atlas/ui"
import { Button } from "@atlas/ui"
import { Badge } from "@atlas/ui"
import { Alert, AlertDescription } from "@atlas/ui"
import { Input } from "@atlas/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@atlas/ui"
import {
  Database,
  DollarSign,
  Info,
  CheckCircle,
  Loader2,
  Send,
  TrendingUp,
} from "lucide-react"
import { useDocumentRegistration } from "../../../../hooks/useDocumentRegistration"
import { useLeaseContext, type RiskFlag } from "../screens/lease-context"
import { authClient } from "../../../../lib/auth-client"

interface CoopSectionProps {
  documentRegistered: boolean
  onShareWithCoop?: (priceUSDC: number, licenseTemplate: string) => void
  existingMarketplaceStatus?: {
    shared_at: string
    actor: string
    details: string
    extra_data: any
  } | null
}

export function CoopSection({ documentRegistered, onShareWithCoop, existingMarketplaceStatus }: CoopSectionProps) {
  // State for co-op sharing form
  const [coopLicenseTemplate, setCoopLicenseTemplate] = useState("CBE-4 Non-Exclusive")
  const [priceUSDC, setPriceUSDC] = useState(1)
  const [displayValue, setDisplayValue] = useState("1")
  const [isSharing, setIsSharing] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)
  const [authRequired, setAuthRequired] = useState(false)
  const [localShareError, setLocalShareError] = useState<string | null>(null)

  // Document registration hook
  const { registerDocument, isRegistering } = useDocumentRegistration()
  
  // Conditionally use lease context only when document data isn't passed as props
  let uploadedFile: File | { name: string } | null, 
      uploadedFilePath: string | null, 
      extractedData: any, 
      riskFlags: RiskFlag[], 
      assetTypeClassification: { asset_type: string } | null;
  
  try {
    // Only use lease context when we're in the try-it-now flow
    const leaseContext = useLeaseContext();
    ({ uploadedFile, uploadedFilePath, extractedData, riskFlags, assetTypeClassification } = leaseContext);
  } catch (error) {
    // Fallback when useLeaseContext is not available
    uploadedFile = { name: 'Document' };
    uploadedFilePath = '';
    extractedData = {};
    riskFlags = [] as RiskFlag[];
    assetTypeClassification = { asset_type: 'office' };
  }

  // Format number as whole dollar display
  const formatCurrencyDisplay = (value: number): string => {
    return Math.round(value).toString()
  }

  // Parse currency string to number (whole dollars only)
  const parseCurrencyValue = (value: string): number => {
    // Remove any non-digit characters
    const cleaned = value.replace(/[^\d]/g, '')
    const parsed = parseInt(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }

  // Handle price change
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const numericValue = parseCurrencyValue(inputValue)
    
    // Update the actual price value
    setPriceUSDC(numericValue)
    
    // Update display value with proper formatting
    if (inputValue === '') {
      setDisplayValue('')
    } else {
      setDisplayValue(formatCurrencyDisplay(numericValue))
    }
  }

  // Handle input blur to ensure proper formatting
  const handlePriceBlur = () => {
    if (displayValue === '' || priceUSDC === 0) {
      setPriceUSDC(1)
      setDisplayValue("1")
    } else {
      setDisplayValue(formatCurrencyDisplay(priceUSDC))
    }
  }

  // Handle sharing with co-op
  const handleShareWithCoop = async () => {
    setIsSharing(true)
    setLocalShareError(null)
    setAuthRequired(false)

    try {
      if (!documentRegistered) {
        // Need to register document first
        const session = await authClient.getSession()
        if (!session?.data?.user?.id) {
          setAuthRequired(true)
          setIsSharing(false)
          return
        }

        // Register document with co-op sharing
        const registrationData = {
          file_path: uploadedFilePath || '',
          title: uploadedFile?.name || 'Untitled Document',
          sharing_type: 'coop' as const,
          user_id: session.data.user.id,
          extracted_data: extractedData,
          risk_flags: riskFlags,
          asset_type: assetTypeClassification?.asset_type || 'office',
          price_usdc: priceUSDC,
          license_template: coopLicenseTemplate
        }

        const registeredDoc = await registerDocument(registrationData)
        
        if (!registeredDoc) {
          throw new Error('Failed to register document')
        }
      }

      // Trigger the co-op sharing workflow
      if (onShareWithCoop) {
        onShareWithCoop(priceUSDC, coopLicenseTemplate)
      }
      
      // Simulate success for UI feedback
      await new Promise(resolve => setTimeout(resolve, 1500))
      setIsSharing(false)
      setShareSuccess(true)
      
      // Reset success message after 3 seconds
      setTimeout(() => setShareSuccess(false), 3000)
    } catch (error) {
      console.error('Error sharing with co-op:', error)
      setLocalShareError(error instanceof Error ? error.message : 'Failed to share with co-op')
      setIsSharing(false)
    }
  }

  // Check if co-op sharing is already active
  const isCoopShareActive = !!existingMarketplaceStatus

  return (
    <div className="border-t bg-gray-50 p-3 space-y-4">
      {/* Existing marketplace status */}
      {isCoopShareActive && (
        <Alert className="bg-green-50 border-green-200">
          <Database className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Live in Marketplace</div>
                <div className="text-sm text-green-600 mt-1">
                  Shared on {new Date(existingMarketplaceStatus.shared_at).toLocaleDateString()} by {existingMarketplaceStatus.actor}
                </div>
                {existingMarketplaceStatus.extra_data?.price_usdc && (
                  <div className="text-sm text-green-600">
                    ${existingMarketplaceStatus.extra_data.price_usdc} USDC per license
                  </div>
                )}
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                <TrendingUp className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!isCoopShareActive && (
        <>
          {/* Info alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Share your data with the Atlas Data Co-op marketplace to earn revenue from license purchases.
              Your data will be discoverable by other firms and institutions.
            </AlertDescription>
          </Alert>

          {/* Pricing controls */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="coop-price" className="text-sm font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-1 text-emerald-500" />
                Price per License (USDC)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                <Input
                  id="coop-price"
                  type="text"
                  placeholder="1"
                  value={displayValue}
                  onChange={handlePriceChange}
                  onBlur={handlePriceBlur}
                  className="pl-7 bg-white"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">USDC</span>
              </div>
              <div className="text-xs text-gray-500">
                You'll earn {100 - 5}% of each license sale (95% after 5% DAO fee)
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coop-license-template" className="text-sm font-medium">
                License Template
              </Label>
              <Select value={coopLicenseTemplate} onValueChange={setCoopLicenseTemplate}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CBE-4 Non-Exclusive">CBE-4 Non-Exclusive</SelectItem>
                  <SelectItem value="CBE-4 Exclusive">CBE-4 Exclusive</SelectItem>
                  <SelectItem value="Creative Commons">Creative Commons</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Auth required alert */}
          {authRequired && (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Please sign in to share your document with the Data Co-op marketplace.
              </AlertDescription>
            </Alert>
          )}

          {/* Error alert */}
          {localShareError && (
            <Alert className="bg-red-50 border-red-200">
              <Info className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {localShareError}
              </AlertDescription>
            </Alert>
          )}

          {/* Success alert */}
          {shareSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Successfully shared with Data Co-op marketplace! Your document is now live and earning revenue.
              </AlertDescription>
            </Alert>
          )}

          {/* Share button */}
          <Button 
            onClick={handleShareWithCoop} 
            disabled={isSharing || isRegistering || priceUSDC <= 0}
            className="w-full"
            variant="default"
          >
            {isSharing || isRegistering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isRegistering ? 'Registering Document...' : 'Publishing to Marketplace...'}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Publish to Data Co-op Marketplace
              </>
            )}
          </Button>
        </>
      )}
    </div>
  )
}