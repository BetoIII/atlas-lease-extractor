"use client"

import { useState } from "react"
import { Switch } from "@/components/ui"
import { Label } from "@/components/ui"
import { Button } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Alert, AlertDescription } from "@/components/ui"
import { Input } from "@/components/ui"
import { Calendar } from "@/components/ui"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui"
import {
  Mail,
  X,
  Send,
  Loader2,
  Info,
  CheckCircle,
  CalendarIcon,
  Database,
  Shield,
  Lock,
  ExternalLink,
} from "lucide-react"
import { format } from "date-fns"
import { useEmailList } from "@/hooks/useEmailList"
import { GranularDataAccess } from "./GranularDataAccess"
import { useDocumentRegistration } from "@/hooks/useDocumentRegistration"
import { useLeaseContext } from "../screens/lease-context"
import { authClient } from "@/lib/auth-client"

interface ExternalSectionProps {
  documentRegistered: boolean;
  onShareDocument?: (sharedEmails: string[], documentId?: string) => void;
  onDocumentRegistered?: (documentId: string) => void;
}

export function ExternalSection({ documentRegistered, onShareDocument, onDocumentRegistered }: ExternalSectionProps) {
  const {
    emailInput,
    setEmailInput,
    sharedEmails,
    handleAddEmail,
    handleRemoveEmail,
    handleEmailKeyPress,
    isValidEmail
  } = useEmailList()

  // Share functionality states
  const [isSharing, setIsSharing] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)

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

  // Shared fields state for granular data sharing controls
  const [sharedFields, setSharedFields] = useState<Record<string, boolean>>({})
  const [shareAllData, setShareAllData] = useState(true)

  // Access expiration state
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined)

  // Allow downloads state
  const [allowDownloads, setAllowDownloads] = useState(false)

  // Handle sharing the document
  const handleShareDocument = async () => {
    if (sharedEmails.length === 0) return

    setIsSharing(true)
    setShareSuccess(false)

    try {
      // Get current user session
      const session = await authClient.getSession()
      if (!session?.data?.user?.id) {
        throw new Error('User not authenticated')
      }

      // Register document with external sharing
      const registrationData = {
        file_path: uploadedFilePath || '',
        title: uploadedFile?.name || 'Untitled Document',
        sharing_type: 'external' as const,
        user_id: session.data.user.id,
        shared_emails: sharedEmails,
        extracted_data: extractedData,
        risk_flags: riskFlags,
        asset_type: assetTypeClassification?.asset_type || 'office'
      }

      const registeredDoc = await registerDocument(registrationData)
      
      if (registeredDoc) {
        // Notify parent component about document registration
        if (onDocumentRegistered) {
          onDocumentRegistered(registeredDoc.id)
        }
        
        // Use the prop callback to trigger any additional sharing workflow
        if (onShareDocument) {
          onShareDocument(sharedEmails, registeredDoc.id)
        }
        
        setShareSuccess(true)
        
        // Remove auto-redirect to let user choose via Manage Doc button
        // setTimeout(() => {
        //   window.location.href = '/dashboard'
        // }, 2000)
      }
    } catch (error) {
      console.error('Error sharing document:', error)
      // Handle error - could set an error state here
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="border-t bg-gray-50 p-3 space-y-4">
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            id="team-email-input"
            type="email"
            placeholder="Enter email address..."
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyPress={handleEmailKeyPress}
            className="flex-1 bg-white"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddEmail}
            disabled={!emailInput.trim() || !isValidEmail(emailInput.trim())}
          >
            Add
          </Button>
        </div>
        <div className="text-xs text-gray-500">
          Press Enter or click Add to include an email address
        </div>
      </div>

      {sharedEmails.length > 0 && (
        <div className="space-y-2">
          <Label className="font-medium">Recipients ({sharedEmails.length})</Label>
          <div className="flex flex-wrap gap-2">
            {sharedEmails.map((email) => (
              <Badge
                key={email}
                variant="secondary"
                className="flex items-center gap-1 pr-1 bg-white"
              >
                <Mail className="h-3 w-3" />
                {email}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-red-100"
                  onClick={() => handleRemoveEmail(email)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Licensing Terms section - only show when there are shared emails */}
      {sharedEmails.length > 0 && (
        <div className="space-y-3">
          <Label className="font-medium">Licensing Terms</Label>
          <div className="rounded-lg border bg-white p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm">CBE-1 Personal</span>
                  <Lock className="h-3 w-3 text-gray-400" />
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0 hover:bg-blue-100"
                        onClick={() => window.open('/licensing-info', '_blank')}
                      >
                        <Info className="h-3 w-3 text-blue-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to learn more about licensing terms</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Badge variant="outline" className="text-xs bg-gray-50">
                Required
              </Badge>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-medium">✓</span>
                  <span>View, copy, back-up, and display privately</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-medium">✓</span>
                  <span>Internal analytics and due diligence allowed</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 font-medium">✗</span>
                  <span>No commercial resale, public posting, or sublicensing</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => window.open('/licensing-info', '_blank')}
                  className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 hover:underline"
                >
                  Learn more about CBE licensing
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            This license is automatically applied to external sharing to protect your data while enabling legitimate business use.
          </div>
        </div>
      )}

      {/* Access Expiration section - only show when there are shared emails */}
      {sharedEmails.length > 0 && (
        <div className="flex space-x-4">
          {/* Access Expiration section */}
          <div className="flex-1 space-y-2">
            <Label className="font-medium">Access Expiration (Optional)</Label>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`flex-1 justify-start text-left font-normal bg-white ${
                      !expirationDate && "text-muted-foreground"
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expirationDate ? format(expirationDate, "PPP") : "Select expiration date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-fit p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expirationDate}
                    onSelect={setExpirationDate}
                    disabled={(date: Date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
              {expirationDate && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setExpirationDate(undefined)} 
                  className="px-2 hover:bg-red-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Set when external party access should automatically expire. Leave blank for permanent access.
            </div>

            {expirationDate && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                <p className="font-medium">
                  External access will expire on {format(expirationDate, "MMMM d, yyyy")}
                </p>
              </div>
            )}
          </div>

          {/* Allow Downloads section */}
          <div className="flex-1 space-y-2">
            <Label className="font-medium">Allow Downloads (Optional)</Label>
            <div className="flex items-center justify-between rounded-lg border p-3 bg-white">
              <div className="flex items-center">
                <Database className="h-4 w-4 mr-2 text-primary" />
                <div>
                  <div className="text-sm">Download Permission</div>
                  <div className="text-xs text-gray-500">Allow recipients to download the data</div>
                </div>
              </div>
              <Switch checked={allowDownloads} onCheckedChange={setAllowDownloads} />
            </div>
            <div className="text-xs text-gray-500">
              When enabled, recipients can download the shared data for offline use.
            </div>
          </div>
        </div>
      )}

      {/* Granular Data Access section - only show when there are shared emails */}
      {sharedEmails.length > 0 && (
        <GranularDataAccess
          shareAllData={shareAllData}
          setShareAllData={setShareAllData}
          sharedFields={sharedFields}
          setSharedFields={setSharedFields}
          fieldPrefix="external"
        />
      )}

      {!documentRegistered && (
        <Alert className="bg-amber-50 border-amber-200 text-amber-800">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Document registration is required before sharing with external parties. Please register your document first.
          </AlertDescription>
        </Alert>
      )}

      {shareSuccess && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Document successfully shared with {sharedEmails.length} team member{sharedEmails.length > 1 ? 's' : ''}!
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleShareDocument}
        disabled={sharedEmails.length === 0 || isSharing || isRegistering}
        className="w-full"
        size="sm"
      >
        {(isSharing || isRegistering) ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Registering & Sharing...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Share Document ({sharedEmails.length})
          </>
        )}
      </Button>
    </div>
  )
} 