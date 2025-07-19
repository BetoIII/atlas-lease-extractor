"use client"

import { useState } from "react"

import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import {
  Users,
  Send,
  Loader2,
  Info,
  CheckCircle,
} from "lucide-react"

interface FirmSectionProps {
  documentRegistered: boolean;
  onShareWithFirm?: () => void;
}

export function FirmSection({ documentRegistered, onShareWithFirm }: FirmSectionProps) {
  // Firm admin states
  const [firmAdminEmail, setFirmAdminEmail] = useState("")
  const [isUserFirmAdmin, setIsUserFirmAdmin] = useState(false)
  const [isSharingWithFirm, setIsSharingWithFirm] = useState(false)
  const [firmShareSuccess, setFirmShareSuccess] = useState(false)

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

    // Use the prop callback to trigger the firm sharing workflow (only for firm admin)
    if (isUserFirmAdmin && onShareWithFirm) {
      onShareWithFirm()
      
      // Simulate success for UI feedback
      await new Promise(resolve => setTimeout(resolve, 1500))
      setIsSharingWithFirm(false)
      setFirmShareSuccess(true)
      
      // Reset success message after 3 seconds
      setTimeout(() => setFirmShareSuccess(false), 3000)
    } else {
      // Fallback to original mock behavior for non-admin or no callback
      await new Promise(resolve => setTimeout(resolve, 1500))
      setIsSharingWithFirm(false)
      setFirmShareSuccess(true)
      setTimeout(() => setFirmShareSuccess(false), 3000)
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

      {!documentRegistered && (
        <Alert className="bg-amber-50 border-amber-200 text-amber-800">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Document registration is required before sharing with your firm. Please register your document first.
          </AlertDescription>
        </Alert>
      )}

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
        disabled={!documentRegistered || (!isUserFirmAdmin && (!firmAdminEmail.trim() || !isValidEmail(firmAdminEmail.trim()))) || isSharingWithFirm}
        className="w-full"
        size="sm"
      >
        {isSharingWithFirm ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {isUserFirmAdmin ? "Sharing..." : "Sending Request..."}
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