"use client"

import { useState } from "react"
import { Separator, Switch } from "@/components/ui"
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
  Users,
  Eye,
} from "lucide-react"
import { format } from "date-fns"
import { useEmailList } from "@/hooks/useEmailList"
import { GranularDataAccess } from "./GranularDataAccess"
import { useDocumentRegistration } from "@/hooks/useDocumentRegistration"
import { useLeaseContext, type RiskFlag } from "../screens/lease-context"
import { authClient } from "@/lib/auth-client"
import { documentStore } from "@/lib/documentStore"
import { useExternalSharing } from "@/hooks/useExternalSharing"

interface ExternalSectionProps {
  documentRegistered: boolean;
  onShareDocument?: (sharedEmails: string[], documentId?: string) => void;
  onDocumentRegistered?: (documentId: string) => void;
  performDocumentRegistration?: (sharingType: "private" | "firm" | "external" | "license" | "coop") => Promise<any>;
  externalShareState?: any;
  handleShareWithExternal?: (sharedEmails: string[], expirationDate?: Date, allowDownloads?: boolean, shareAllData?: boolean, sharedFields?: Record<string, boolean>) => void;
  // Optional props for when used outside of try-it-now flow
  documentId?: string;
  documentTitle?: string;
  resetExternalSharingState?: () => void;
  setShowExternalSharingDrawer?: (open: boolean) => void;
  showExternalSharingDrawer?: boolean;
  showExternalSharingDialog?: boolean;
  setShowExternalSharingDialog?: (open: boolean) => void;
}

export function ExternalSection({ 
  documentRegistered, 
  onShareDocument, 
  onDocumentRegistered, 
  performDocumentRegistration,
  externalShareState: propExternalShareState,
  handleShareWithExternal: propHandleShareWithExternal,
  resetExternalSharingState: propResetExternalSharingState,
  setShowExternalSharingDrawer: propSetShowExternalSharingDrawer,
  showExternalSharingDrawer: propShowExternalSharingDrawer,
  showExternalSharingDialog: propShowExternalSharingDialog,
  setShowExternalSharingDialog: propSetShowExternalSharingDialog,
  documentId: propDocumentId,
  documentTitle: propDocumentTitle,
}: ExternalSectionProps) {
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
  
  // Conditionally use lease context only when document data isn't passed as props
  let uploadedFile: any, uploadedFilePath: string | null, extractedData: any, riskFlags: RiskFlag[], assetTypeClassification: any, temporaryUserId: string | null, setTemporaryUserId: (id: string | null) => void, generateTemporaryUserId: () => string;
  
  try {
    // Only use lease context when we're in the try-it-now flow (no props passed)
    if (!propDocumentId && !propDocumentTitle) {
      const leaseContext = useLeaseContext();
      ({ uploadedFile, uploadedFilePath, extractedData, riskFlags, assetTypeClassification, temporaryUserId, setTemporaryUserId, generateTemporaryUserId } = leaseContext);
    } else {
      // Use fallback data when used outside of try-it-now flow
      uploadedFile = { name: propDocumentTitle || 'Document' };
      uploadedFilePath = '';
      extractedData = {};
      riskFlags = [];
      assetTypeClassification = { asset_type: 'office' };
      temporaryUserId = null;
      setTemporaryUserId = () => {};
      generateTemporaryUserId = () => 'temp_fallback_' + Date.now();
    }
  } catch (error) {
    // Fallback when useLeaseContext is not available
    uploadedFile = { name: propDocumentTitle || 'Document' };
    uploadedFilePath = '';
    extractedData = {};
    riskFlags = [];
    assetTypeClassification = { asset_type: 'office' };
    temporaryUserId = null;
    setTemporaryUserId = () => {};
    generateTemporaryUserId = () => 'temp_fallback_' + Date.now();
  }

  // Shared fields state for granular data sharing controls
  const [sharedFields, setSharedFields] = useState<Record<string, boolean>>({})
  const [shareAllData, setShareAllData] = useState(true)

  // Access expiration state
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined)

  // Allow downloads state
  const [allowDownloads, setAllowDownloads] = useState(false)

  // Use local external sharing hook if props are not provided (fallback)
  const localExternalSharing = useExternalSharing({})
  
  // Use props if provided, otherwise fallback to local hook
  const externalShareState = propExternalShareState || localExternalSharing.externalShareState
  const handleShareWithExternal = propHandleShareWithExternal || localExternalSharing.handleShareWithExternal
  const resetExternalSharingState = propResetExternalSharingState || localExternalSharing.resetExternalSharingState
  const setShowExternalSharingDrawer = propSetShowExternalSharingDrawer || localExternalSharing.setShowExternalSharingDrawer
  const showExternalSharingDrawer = propShowExternalSharingDrawer !== undefined ? propShowExternalSharingDrawer : localExternalSharing.showExternalSharingDrawer
  const showExternalSharingDialog = propShowExternalSharingDialog !== undefined ? propShowExternalSharingDialog : localExternalSharing.showExternalSharingDialog
  const setShowExternalSharingDialog = propSetShowExternalSharingDialog || localExternalSharing.setShowExternalSharingDialog

  // Handle sharing the document
  const handleShareDocument = async () => {
    if (sharedEmails.length === 0) return

    setIsSharing(true)
    setShareSuccess(false)

    try {
      // Use the new registration function if available
      if (performDocumentRegistration) {
        const registeredDoc = await performDocumentRegistration('external')
        
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
          handleShareWithExternal(sharedEmails, expirationDate, allowDownloads, shareAllData, sharedFields)
        }
      } else {
        // Always allow sharing without authentication - use temporary user ID
        let temporaryUserId = null;
        
        try {
          // Check if user is authenticated
          const session = await authClient.getSession()
          if (session?.data?.user?.id) {
            // User is authenticated, use their real ID for registration
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
              handleShareWithExternal(sharedEmails, expirationDate, allowDownloads, shareAllData, sharedFields)
            }
            return;
          }
        } catch (error) {
          // Authentication check failed, continue with temporary user flow
          console.log('User not authenticated, using temporary user flow');
        }

        // Generate or use existing temporary user ID for tracking this action
        let currentTempUserId: string | null = temporaryUserId;
        if (!currentTempUserId) {
          const newTempUserId = generateTemporaryUserId();
          currentTempUserId = newTempUserId;
          setTemporaryUserId(currentTempUserId);
        }
        
        // Save pending document data with temporary user ID
        const pendingData = {
          file_path: uploadedFilePath || '',
          title: uploadedFile?.name || 'Untitled Document',
          sharing_type: 'external' as const,
          shared_emails: sharedEmails,
          extracted_data: extractedData,
          risk_flags: riskFlags,
          asset_type: assetTypeClassification?.asset_type || 'office',
          created_at: Math.floor(Date.now() / 1000),
          temporary_user_id: currentTempUserId || undefined
        };
        
        documentStore.savePendingDocument(pendingData);
        console.log('External sharing document data saved with temporary user ID:', currentTempUserId);
        
        // Always trigger success for UI flow - user can complete registration later
        setShareSuccess(true)
        handleShareWithExternal(sharedEmails, expirationDate, allowDownloads, shareAllData, sharedFields)
        
        // Use the prop callback to trigger additional sharing workflow
        if (onShareDocument) {
          onShareDocument(sharedEmails, undefined) // No document ID yet, but use temporary user context
        }
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
      {/* Success Status Badge */}
      {externalShareState.isComplete && (
        <div className="flex items-right justify-end pb-2">
          <Badge
            variant="outline"
            className="w-fit bg-green-100 text-green-800 border-green-200"
          >
            Shared with External Party
          </Badge>
        </div>
      )}

      {/* Success Status Card */}
      {externalShareState.isComplete ? (
        <div className="space-y-4">
          {/* Header with summary */}
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 mr-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-green-800">
                    Document Successfully Shared
                  </div>
                  <div className="text-xs text-green-600">
                    {externalShareState.sharingInstances.length} sharing batch{externalShareState.sharingInstances.length > 1 ? 'es' : ''} • {externalShareState.sharingInstances.reduce((total: number, instance: any) => total + instance.emails.length, 0)} total recipients
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowExternalSharingDialog(true)}
                className="bg-white hover:bg-green-50 border-green-300 text-green-700"
              >
                <Eye className="h-3 w-3 mr-2" />
                View Details
              </Button>
            </div>   
          </div>

          {/* Individual sharing instances */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Sharing History ({externalShareState.sharingInstances.length})
            </div>
            
            {externalShareState.sharingInstances.map((instance: any, index: number) => (
              <div key={instance.id} className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 mr-2 text-xs font-medium text-blue-600">
                      {index + 1}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      Batch {index + 1}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={instance.status === 'active' ? 'default' : instance.status === 'expired' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {instance.status}
                    </Badge>
                    <div className="text-xs text-gray-500">
                      {new Date(instance.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Recipients */}
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-600">
                    Recipients ({instance.emails.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {instance.emails.map((email: string) => (
                      <Badge key={email} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                        <Mail className="h-2 w-2 mr-1" />
                        {email}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Permissions and settings */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-600">Data Access</div>
                    <div className="flex items-center text-xs text-gray-700">
                      <Database className="h-3 w-3 mr-1" />
                      {instance.shareAllData ? 'Full Access' : 'Partial Access'}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-600">Downloads</div>
                    <div className="flex items-center text-xs text-gray-700">
                      {instance.allowDownloads ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                          Allowed
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3 mr-1 text-gray-500" />
                          Restricted
                        </>
                      )}
                    </div>
                  </div>

                  {instance.expirationDate && (
                    <div className="col-span-2 space-y-1">
                      <div className="text-xs font-medium text-gray-600">Expiration</div>
                      <div className="flex items-center text-xs text-gray-700">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {instance.expirationDate.toLocaleDateString()} at {instance.expirationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <Separator />
          <div className="flex justify-center">
            <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => {
                      // Reset form to allow sharing again
                      setEmailInput('')
                      // Keep existing sharing instances but allow new ones
                    }}
                  >
                    <Send className="h-3 w-3 mr-2" />
                    Share Again
              </Button>
          </div>
        </div>
      ) : (
        <>
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
            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Share your document instantly! No registration required. You can sign up later to manage your documents.
              </AlertDescription>
            </Alert>
          )}

          {shareSuccess && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Document successfully shared with {sharedEmails.length} external partner{sharedEmails.length > 1 ? 's' : ''}! {temporaryUserId && "Sign up anytime to manage your documents and track all sharing activity."}
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
                Preparing & Sharing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Share Document ({sharedEmails.length})
              </>
            )}
          </Button>
        </>
      )}
    </div>
  )
} 