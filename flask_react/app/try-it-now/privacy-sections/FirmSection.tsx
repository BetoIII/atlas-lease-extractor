"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

import { Label } from "@/components/ui"
import { Button } from "@/components/ui"
import { Alert, AlertDescription } from "@/components/ui"
import { Input } from "@/components/ui"
import { Badge } from "@/components/ui"
import {
  Users,
  Send,
  Loader2,
  Info,
  CheckCircle,
  Eye,
  Building,
} from "lucide-react"
import { useDocumentRegistration } from "@/hooks/useDocumentRegistration"
import { useLeaseContext } from "../screens/lease-context"
import { authClient } from "@/lib/auth-client"
import { documentStore } from "@/lib/documentStore"
import { FirmShareState } from "@/hooks/useFirmSharing"

interface FirmSectionProps {
  documentRegistered: boolean;
  onShareWithFirm?: (documentId?: string, adminEmail?: string, isUserAdmin?: boolean) => void;
  onDocumentRegistered?: (documentId: string) => void;
  firmShareState?: FirmShareState;
  onViewFirmAuditTrail?: () => void;
  onFirmSharingCompleted?: () => void;
}

export function FirmSection({ 
  documentRegistered, 
  onShareWithFirm, 
  onDocumentRegistered, 
  firmShareState,
  onViewFirmAuditTrail,
  onFirmSharingCompleted
}: FirmSectionProps) {
  // Firm admin states
  const [firmAdminEmail, setFirmAdminEmail] = useState("")
  const [isUserFirmAdmin, setIsUserFirmAdmin] = useState(false)
  const [isSharingWithFirm, setIsSharingWithFirm] = useState(false)
  const [localShareError, setLocalShareError] = useState<string | null>(null)
  const [registeredDocumentId, setRegisteredDocumentId] = useState<string | null>(null)
  const [authRequired, setAuthRequired] = useState(false)
  const [workflowCompleted, setWorkflowCompleted] = useState(false)

  // Document registration hook
  const { registerDocument, isRegistering } = useDocumentRegistration()
  
  // Lease context for data
  const {
    uploadedFile,
    uploadedFilePath,
    extractedData,
    riskFlags,
    assetTypeClassification
  } = useLeaseContext()

  // Email validation helper
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Check if firm sharing is complete - only when workflow is fully done AND user has been notified
  const isFirmShareComplete = firmShareState?.isComplete && workflowCompleted

  // Handle sharing with firm
  const handleShareWithFirm = async () => {
    if (!isUserFirmAdmin && (!firmAdminEmail.trim() || !isValidEmail(firmAdminEmail.trim()))) return

    setIsSharingWithFirm(true)
    setLocalShareError(null)
    setAuthRequired(false)

    try {
      if (isUserFirmAdmin) {
        // User claims to be admin - authentication required
        const session = await authClient.getSession()
        if (!session?.data?.user?.id) {
          // Show auth requirement message
          setAuthRequired(true)
          setIsSharingWithFirm(false)
          return
        }

        // Register document with firm sharing (user as admin)
        const registrationData = {
          file_path: uploadedFilePath || '',
          title: uploadedFile?.name || 'Untitled Document',
          sharing_type: 'firm' as const,
          user_id: session.data.user.id,
          extracted_data: extractedData,
          risk_flags: riskFlags,
          asset_type: assetTypeClassification?.asset_type || 'office',
          firm_admin_email: session.data.user.email || session.data.user.id, // Use user's email as admin
          is_user_admin: true
        }

        const registeredDoc = await registerDocument(registrationData)
        
        if (registeredDoc) {
          setRegisteredDocumentId(registeredDoc.id)
          
          // Notify parent component about document registration
          if (onDocumentRegistered) {
            onDocumentRegistered(registeredDoc.id)
          }
          
          // Trigger the firm sharing workflow - success will be set by watching firmShareState
          if (onShareWithFirm) {
            onShareWithFirm(registeredDoc.id, undefined, true)
          }
        } else {
          throw new Error('Failed to register document')
        }
      } else {
        // User provided another admin's email - no auth required
        // Save pending document data for after admin approval
        const pendingData = {
          file_path: uploadedFilePath || '',
          title: uploadedFile?.name || 'Untitled Document',
          sharing_type: 'firm' as const,
          firm_admin_email: firmAdminEmail.trim(),
          is_user_admin: false,
          extracted_data: extractedData,
          risk_flags: riskFlags,
          asset_type: assetTypeClassification?.asset_type || 'office',
          created_at: Math.floor(Date.now() / 1000)
        };
        
        // In a real app, you'd send this to your backend to email the admin
        console.log('Firm sharing request saved for admin approval:', pendingData);
        
        // Trigger the mock sharing workflow - success will be set by watching firmShareState
        if (onShareWithFirm) {
          onShareWithFirm(undefined, firmAdminEmail.trim(), false)
        }
      }
    } catch (error) {
      console.error('Error sharing with firm:', error)
      setLocalShareError(error instanceof Error ? error.message : 'Failed to share with firm')
      setIsSharingWithFirm(false)
    }
    // Don't set setIsSharingWithFirm(false) here - let it be controlled by the workflow state
  }

  // Handle selecting user as firm admin
  const handleSelectAsAdmin = () => {
    setIsUserFirmAdmin(!isUserFirmAdmin)
    setAuthRequired(false) // Clear auth requirement when changing selection
    setLocalShareError(null) // Clear any errors when changing selection
    if (!isUserFirmAdmin) {
      setFirmAdminEmail("") // Clear email input when user selects themselves
    }
  }

  // Watch firm sharing state for completion and errors
  useEffect(() => {
    if (firmShareState) {
      // Update loading state based on workflow activity
      if (firmShareState.isActive) {
        setIsSharingWithFirm(true)
        setLocalShareError(null)
      } else if (firmShareState.isComplete) {
        setIsSharingWithFirm(false)
        // Don't set success here - wait for user to see the success dialog first
      }

      // Check for errors in the workflow
      const hasErrors = firmShareState.events.some(event => event.status === 'error')
      if (hasErrors && !firmShareState.isActive) {
        setIsSharingWithFirm(false)
        const errorEvent = firmShareState.events.find(event => event.status === 'error')
        setLocalShareError(errorEvent?.details?.message || 'Firm sharing workflow failed')
      }
    }
  }, [firmShareState])

  // Call the completion callback when the firm sharing completes successfully
  useEffect(() => {
    if (firmShareState?.isComplete && !firmShareState.isActive && !workflowCompleted && onFirmSharingCompleted) {
      // Notify parent that firm sharing workflow is complete
      onFirmSharingCompleted()
      setWorkflowCompleted(true)
    }
  }, [firmShareState?.isComplete, firmShareState?.isActive, workflowCompleted, onFirmSharingCompleted])

  return (
    <div className="border-t bg-gray-50 p-3 space-y-4">
      {/* Success Status Badge */}
      {isFirmShareComplete && (
        <div className="flex items-right justify-end pb-2">
          <Badge
            variant="outline"
            className="w-fit bg-green-100 text-green-800 border-green-200"
          >
            Shared with Firm
          </Badge>
        </div>
      )}

      {/* Success Status Card */}
      {isFirmShareComplete ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Building className="h-4 w-4 mr-2 text-green-600" />
              <div className="text-sm font-medium text-green-800">
                Document Shared with Firm
              </div>
            </div>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          
          {firmShareState?.memberCount && (
            <div className="text-xs text-green-700">
              Shared with {firmShareState.memberCount} firm members
            </div>
          )}

          <div className="flex justify-center items-center pt-2">
            <Button variant="outline" size="sm" onClick={onViewFirmAuditTrail}>
              <Eye className="h-3 w-3 mr-2" />
              View Sharing Details
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <Label className="font-medium">
              Firm Admin Approval Required
            </Label>
            <div className="text-xs text-gray-600 mb-3">
              Sharing with your firm requires approval from a firm administrator. Select yourself if you are an admin, or provide the admin&apos;s email address.
            </div>
            
            {/* Option to select self as admin */}
            <div className="flex items-center space-x-2 p-3 rounded-lg border bg-white">
              <input
                type="checkbox"
                id="self-admin"
                checked={isUserFirmAdmin}
                onChange={handleSelectAsAdmin}
                className="rounded border-gray-300"
              />
              <Label htmlFor="self-admin" className="text-sm cursor-pointer flex items-center">
                <Users className="h-4 w-4 mr-2 text-primary" />
                I am the firm&apos;s administrator
              </Label>
            </div>

            {/* Email input for firm admin (only show if user is not admin) */}
            {!isUserFirmAdmin && (
              <div className="space-y-2">
                <Label htmlFor="firm-admin-email" className="font-medium">
                  Firm Administrator Email
                </Label>
                <Input
                  id="firm-admin-email"
                  type="email"
                  placeholder="Enter firm admin email address..."
                  value={firmAdminEmail}
                  onChange={(e) => {
                    setFirmAdminEmail(e.target.value)
                    setAuthRequired(false) // Clear auth requirement when user types
                    setLocalShareError(null) // Clear any errors when user types
                  }}
                  className="bg-white"
                />
                <div className="text-xs text-gray-500">
                  The firm administrator will receive a request to approve firm-wide access to this document
                </div>
              </div>
            )}

            {/* Current selection display */}
            {isUserFirmAdmin && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center text-sm text-blue-800">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  You are designated as the Firm Administrator for this share
                </div>
              </div>
            )}
          </div>

          {localShareError && (
            <Alert className="bg-red-50 border-red-200 text-red-800">
              <Info className="h-4 w-4" />
              <AlertDescription>
                {localShareError}
              </AlertDescription>
            </Alert>
          )}

          {authRequired && (
            <Alert className="bg-orange-50 border-orange-200 text-orange-800">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div>You need to log in or register to share as the firm administrator.</div>
                  <div className="flex gap-2 text-sm">
                    <Link 
                      href="/auth/signin" 
                      className="text-orange-900 hover:text-orange-700 underline font-medium"
                    >
                      Sign In
                    </Link>
                    <span>or</span>
                    <Link 
                      href="/auth/signup" 
                      className="text-orange-900 hover:text-orange-700 underline font-medium"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleShareWithFirm}
            disabled={(!isUserFirmAdmin && (!firmAdminEmail.trim() || !isValidEmail(firmAdminEmail.trim()))) || isSharingWithFirm || isRegistering}
            className="w-full"
            size="sm"
          >
            {(isSharingWithFirm || isRegistering) ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isUserFirmAdmin ? "Registering & Sharing..." : "Sending Request..."}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {isUserFirmAdmin ? "Share with Firm" : "Request Firm Access"}
              </>
            )}
          </Button>
        </>
      )}
    </div>
  )
} 