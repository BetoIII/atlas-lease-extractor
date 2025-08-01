"use client"

import { useState } from "react"

import { Label } from "@/components/ui"
import { Button } from "@/components/ui"
import { Alert, AlertDescription } from "@/components/ui"
import { Input } from "@/components/ui"
import {
  Users,
  Send,
  Loader2,
  Info,
  CheckCircle,
} from "lucide-react"
import { useDocumentRegistration } from "@/hooks/useDocumentRegistration"
import { useLeaseContext } from "../screens/lease-context"
import { authClient } from "@/lib/auth-client"

interface FirmSectionProps {
  documentRegistered: boolean;
  onShareWithFirm?: (documentId?: string) => void;
  onDocumentRegistered?: (documentId: string) => void;
}

export function FirmSection({ documentRegistered, onShareWithFirm, onDocumentRegistered }: FirmSectionProps) {
  // Firm admin states
  const [firmAdminEmail, setFirmAdminEmail] = useState("")
  const [isUserFirmAdmin, setIsUserFirmAdmin] = useState(false)
  const [isSharingWithFirm, setIsSharingWithFirm] = useState(false)
  const [firmShareSuccess, setFirmShareSuccess] = useState(false)
  const [registeredDocumentId, setRegisteredDocumentId] = useState<string | null>(null)

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

  // Handle sharing with firm
  const handleShareWithFirm = async () => {
    if (!isUserFirmAdmin && (!firmAdminEmail.trim() || !isValidEmail(firmAdminEmail.trim()))) return

    setIsSharingWithFirm(true)
    setFirmShareSuccess(false)

    try {
      // Get current user session
      const session = await authClient.getSession()
      if (!session?.data?.user?.id) {
        throw new Error('User not authenticated')
      }

      // Register document with firm sharing
      const registrationData = {
        file_path: uploadedFilePath || '',
        title: uploadedFile?.name || 'Untitled Document',
        sharing_type: 'firm' as const,
        user_id: session.data.user.id,
        extracted_data: extractedData,
        risk_flags: riskFlags,
        asset_type: assetTypeClassification?.asset_type || 'office'
      }

      const registeredDoc = await registerDocument(registrationData)
      
      if (registeredDoc) {
        setRegisteredDocumentId(registeredDoc.id)
        
        // Notify parent component about document registration
        if (onDocumentRegistered) {
          onDocumentRegistered(registeredDoc.id)
        }
        
        // Use the prop callback to trigger any additional firm sharing workflow
        if (onShareWithFirm) {
          onShareWithFirm(registeredDoc.id)
        }
        
        setFirmShareSuccess(true)
        
        // Remove auto-redirect to let user choose via Manage Doc button
        // setTimeout(() => {
        //   window.location.href = '/dashboard'
        // }, 2000)
      }
    } catch (error) {
      console.error('Error sharing with firm:', error)
      // Handle error - could set an error state here
    } finally {
      setIsSharingWithFirm(false)
    }
  }

  // Handle selecting user as firm admin
  const handleSelectAsAdmin = () => {
    setIsUserFirmAdmin(!isUserFirmAdmin)
    if (!isUserFirmAdmin) {
      setFirmAdminEmail("") // Clear email input when user selects themselves
    }
  }

  return (
    <div className="border-t bg-gray-50 p-3 space-y-4">
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
              onChange={(e) => setFirmAdminEmail(e.target.value)}
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


      {firmShareSuccess && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {isUserFirmAdmin 
              ? "Document approved and shared with your firm!"
              : `Approval request sent to ${firmAdminEmail}. They will receive an email to approve firm access.`
            }
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
    </div>
  )
} 