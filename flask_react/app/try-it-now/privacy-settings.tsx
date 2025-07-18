"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Lock,
  Users,
  Building,
  Globe,
  Shield,
  Database,
  Loader2,
  Send,
  X,
  Mail,
  Info,
  CheckCircle,
  CalendarIcon,
  DollarSign,
} from "lucide-react"
import { format } from "date-fns"


import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"

interface PrivacySettingsProps {
  onSharingLevelChange?: (level: "private" | "firm" | "external" | "license" | "coop") => void;
  documentRegistered?: boolean;
}

export function PrivacySettings({ onSharingLevelChange, documentRegistered = false }: PrivacySettingsProps) {
  const [sharingLevel, setSharingLevel] = useState<"private" | "firm" | "external" | "license" | "coop">("private")
  const [allowAnonymousData, setAllowAnonymousData] = useState(false)
  const [blockchainAnchor, setBlockchainAnchor] = useState(false)
  const [auditTrail, setAuditTrail] = useState(true)
  const [verificationRequired, setVerificationRequired] = useState(false)

  // Share functionality states
  const [emailInput, setEmailInput] = useState("")
  const [sharedEmails, setSharedEmails] = useState<string[]>([])
  const [isSharing, setIsSharing] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)

  // Firm admin states
  const [firmAdminEmail, setFirmAdminEmail] = useState("")
  const [isUserFirmAdmin, setIsUserFirmAdmin] = useState(false)
  const [isSharingWithFirm, setIsSharingWithFirm] = useState(false)
  const [firmShareSuccess, setFirmShareSuccess] = useState(false)

  // Shared fields state for new data sharing controls
  const [sharedFields, setSharedFields] = useState<Record<string, boolean>>({})
  const [shareAllData, setShareAllData] = useState(true)

  // Access expiration state
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined)

  // Allow downloads state
  const [allowDownloads, setAllowDownloads] = useState(false)

  // Pricing controls state
  const [showPricingControls, setShowPricingControls] = useState(true)
  const [monthlyFee, setMonthlyFee] = useState(0)

  // Handle monthly fee change
  const handleMonthlyFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0
    setMonthlyFee(value)
  }

  // Email validation helper
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Handle adding email to the list
  const handleAddEmail = () => {
    const trimmedEmail = emailInput.trim().toLowerCase()
    if (trimmedEmail && isValidEmail(trimmedEmail) && !sharedEmails.includes(trimmedEmail)) {
      setSharedEmails([...sharedEmails, trimmedEmail])
      setEmailInput("")
    }
  }

  // Handle removing email from the list
  const handleRemoveEmail = (emailToRemove: string) => {
    setSharedEmails(sharedEmails.filter(email => email !== emailToRemove))
  }

  // Handle Enter key press in email input
  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddEmail()
    }
  }

  // Handle sharing the document
  const handleShareDocument = async () => {
    if (sharedEmails.length === 0) return

    setIsSharing(true)
    setShareSuccess(false)

    // Simulate API call for now
    await new Promise(resolve => setTimeout(resolve, 1500))

    // For now, just simulate success
    setIsSharing(false)
    setShareSuccess(true)
    
    // Reset success message after 3 seconds
    setTimeout(() => setShareSuccess(false), 3000)
  }

  // Handle sharing with firm
  const handleShareWithFirm = async () => {
    if (!isUserFirmAdmin && (!firmAdminEmail.trim() || !isValidEmail(firmAdminEmail.trim()))) return

    setIsSharingWithFirm(true)
    setFirmShareSuccess(false)

    // Simulate API call for now
    await new Promise(resolve => setTimeout(resolve, 1500))

    // For now, just simulate success
    setIsSharingWithFirm(false)
    setFirmShareSuccess(true)
    
    // Reset success message after 3 seconds
    setTimeout(() => setFirmShareSuccess(false), 3000)
  }

  // Handle selecting user as firm admin
  const handleSelectAsAdmin = () => {
    setIsUserFirmAdmin(!isUserFirmAdmin)
    if (!isUserFirmAdmin) {
      setFirmAdminEmail("") // Clear email input when user selects themselves
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-500" />
            Data Visibility
          </h3>
        </div>
            <RadioGroup value={sharingLevel} onValueChange={(value) => {
              const newLevel = value as "private" | "firm" | "external" | "license" | "coop";
              
              // Clear shared emails when switching between external and license modes
              // to avoid confusion about who is being shared with
              if ((sharingLevel === "external" && newLevel === "license") || 
                  (sharingLevel === "license" && newLevel === "external")) {
                setSharedEmails([]);
                setEmailInput("");
              }
              
              setSharingLevel(newLevel);
              onSharingLevelChange?.(newLevel);
            }} className="space-y-3">
              <div className="flex items-center space-x-3 rounded-lg border p-3">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="flex items-center cursor-pointer">
                  <Lock className="h-4 w-4 mr-2 text-gray-500" />
                  <div>
                    <div className="font-medium">Only Me</div>
                    <div className="text-xs text-gray-500">Only you can access this data</div>
                  </div>
                </Label>
              </div>
              <div className="rounded-lg border">
                <div className="flex items-center space-x-3 p-3">
                  <RadioGroupItem value="firm" id="firm" />
                  <Label htmlFor="firm" className="flex items-center cursor-pointer">
                    <Building className="h-4 w-4 mr-2 text-blue-500" />
                    <div>
                      <div className="font-medium">My Firm</div>
                      <div className="text-xs text-gray-500">Everyone at your firm can access this data</div>
                    </div>
                  </Label>
                </div>
                
                {sharingLevel === "firm" && (
                  <div className="border-t bg-gray-50 p-3 space-y-4">
                    <div className="space-y-3">
                      <Label className="font-medium">
                        Firm Admin Approval Required
                      </Label>
                      <div className="text-xs text-gray-600 mb-3">
                        Sharing with your firm requires approval from a firm administrator. Select yourself if you are an admin, or provide the admin's email address.
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
                          I am the firm's administrator
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
                )}
              </div>
              <div className="rounded-lg border">
                <div className="flex items-center space-x-3 p-3">
                  <RadioGroupItem value="external" id="external" />
                  <Label htmlFor="external" className="flex items-center cursor-pointer">
                    <Users className="h-4 w-4 mr-2 text-green-500" />
                    <div>
                      <div className="font-medium">Share with External Party</div>
                      <div className="text-xs text-gray-500">Your trusted partners can access this data</div>
                    </div>
                  </Label>
                </div>
                
                {sharingLevel === "external" && (
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
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">Granular Data Access</h3>
                          <div className="flex items-center justify-between rounded-lg border p-3 bg-white">
                            <div className="flex items-center">
                              <Database className="h-4 w-4 mr-2 text-primary" />
                              <div>
                                <div className="text-sm">Share All Data</div>
                                <div className="text-xs text-gray-500">Share all extracted data with selected audience</div>
                              </div>
                            </div>
                            <Switch checked={shareAllData} onCheckedChange={setShareAllData} />
                          </div>
                          {shareAllData && (
                            <div className="text-xs text-gray-500 m-2">
                              Note: When enabled, all extracted data will be shared. When disabled, you can select specific fields to share below.
                            </div>
                          )}

                          {!shareAllData && (
                            <div className="space-y-6">
                              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                                <p className="font-medium">Why are some fields always shared?</p>
                                <p className="mt-1">
                                  Fields marked with a lock icon are essential for creating accurate market benchmarks. These fields are
                                  anonymized and only used in aggregate form.
                                </p>
                              </div>

                              {[
                                {
                                  name: "General Information",
                                  fields: ["Property Address", "Landlord", "Tenant", "Leased Area (sq ft)", "Commencement Date", "Expiration Date"],
                                },
                                {
                                  name: "Financial Terms",
                                  fields: ["Base Rent", "Operating Expenses", "Utilities", "Real Estate Taxes", "CAM"],
                                },
                                {
                                  name: "Lease Terms",
                                  fields: ["Term Length", "Renewal Options", "Early Termination", "Lease Type"],
                                },
                                {
                                  name: "Other Details",
                                  fields: ["Concessions", "Subordination", "Insurance/Condemnation", "Purchase Options"],
                                },
                              ].map((group) => (
                                <div key={group.name} className="space-y-3">
                                  <h4 className="font-medium text-gray-700">{group.name}</h4>
                                  <div className="space-y-3">
                                    {group.fields.map((field) => {
                                      const isNonHideableField = ["Property Address", "Leased Area (sq ft)", "Commencement Date"].includes(field)
                                      const getTooltipForField = (field: string) => {
                                        if (field === "Property Address") {
                                          return "Required for geographical benchmarking and comparables accuracy."
                                        }
                                        if (field === "Leased Area (sq ft)") {
                                          return "Needed for computing market averages and regional benchmarking."
                                        }
                                        if (field === "Commencement Date") {
                                          return "Essential for reliable temporal benchmarking and lease trends."
                                        }
                                        return "Toggle to share this field with the selected audience."
                                      }
                                      return (
                                        <div key={field} className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Label htmlFor={`field-external-${field}`} className="cursor-pointer">
                                              {field}
                                            </Label>
                                            {isNonHideableField && (
                                              <TooltipProvider>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Lock className="h-3.5 w-3.5 text-gray-500" />
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                    <p>{getTooltipForField(field)}</p>
                                                  </TooltipContent>
                                                </Tooltip>
                                              </TooltipProvider>
                                            )}
                                          </div>
                                          <Switch
                                            id={`field-external-${field}`}
                                            checked={isNonHideableField || sharedFields[field]}
                                            onCheckedChange={(checked) => setSharedFields(prev => ({ ...prev, [field]: checked }))}
                                            disabled={isNonHideableField}
                                          />
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
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
                      disabled={!documentRegistered || sharedEmails.length === 0 || isSharing}
                      className="w-full"
                      size="sm"
                    >
                      {isSharing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sharing...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Share Document ({sharedEmails.length})
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              <div className="rounded-lg border">
                <div className="flex items-center space-x-3 p-3">
                  <RadioGroupItem value="license" id="license" />
                  <Label htmlFor="license" className="flex items-center cursor-pointer">
                    <DollarSign className="h-4 w-4 mr-2 text-emerald-500" />
                    <div>
                      <div className="font-medium">License to External Party</div>
                      <div className="text-xs text-gray-500">License your data to partners with terms</div>
                    </div>
                  </Label>
                </div>
                
                {sharingLevel === "license" && (
                  <div className="border-t bg-gray-50 p-3 space-y-4">
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          id="license-email-input"
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
                        <Label className="font-medium">Licensees ({sharedEmails.length})</Label>
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

                    {/* License Expiration section - only show when there are shared emails */}
                    {sharedEmails.length > 0 && (
                      <div className="flex space-x-4">
                        {/* License Expiration section */}
                        <div className="flex-1 space-y-2">
                          <Label className="font-medium">License Expiration (Optional)</Label>
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
                            Set when the license should automatically expire. Leave blank for perpetual license.
                          </div>

                          {expirationDate && (
                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                              <p className="font-medium">
                                License will expire on {format(expirationDate, "MMMM d, yyyy")}
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
                                <div className="text-xs text-gray-500">Allow licensees to download the data</div>
                              </div>
                            </div>
                            <Switch checked={allowDownloads} onCheckedChange={setAllowDownloads} />
                          </div>
                          <div className="text-xs text-gray-500">
                            When enabled, licensees can download the licensed data for offline use.
                          </div>
                        </div>
                      </div>
                    )}

                    {showPricingControls && sharedEmails.length > 0 && (
                      <div className="mb-6">
                        <Label htmlFor="monthly-fee" className="mb-2 block">
                          Monthly Licensing Fee (USD)
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="monthly-fee"
                            type="number"
                            min="0"
                            step="0.01"
                            value={monthlyFee}
                            onChange={handleMonthlyFeeChange}
                            placeholder="0.00"
                            className="pl-10"
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          Set the monthly fee for accessing your lease data. Payment will be processed automatically each month.
                        </p>

                        {monthlyFee > 0 && (
                          <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-sm text-emerald-800">
                            <p className="font-medium">License Revenue Projection</p>
                            <div className="mt-1 space-y-1">
                              <p>Monthly: ${monthlyFee.toFixed(2)}</p>
                              <p>Annual: ${(monthlyFee * 12).toFixed(2)}</p>
                              <p className="text-xs text-emerald-600">
                                Atlas takes a 15% platform fee. You keep ${(monthlyFee * 0.85).toFixed(2)}/month.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                     
                    {/* Granular Data Access section - only show when there are shared emails */}
                    {sharedEmails.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Granular Data Access</h3>
                        <div className="flex items-center justify-between rounded-lg border p-3 bg-white">
                          <div className="flex items-center">
                            <Database className="h-4 w-4 mr-2 text-primary" />
                            <div>
                              <div className="text-sm">Share All Data</div>
                              <div className="text-xs text-gray-500">Share all extracted data with selected audience</div>
                            </div>
                          </div>
                          <Switch checked={shareAllData} onCheckedChange={setShareAllData} />
                        </div>
                        {shareAllData && (
                          <div className="text-xs text-gray-500 m-2">
                            Note: When enabled, all extracted data will be shared. When disabled, you can select specific fields to share below.
                          </div>
                        )}

                        {!shareAllData && (
                          <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                              <p className="font-medium">Why are some fields always shared?</p>
                              <p className="mt-1">
                                Fields marked with a lock icon are essential for creating accurate market benchmarks. These fields are
                                anonymized and only used in aggregate form.
                              </p>
                            </div>

                            {[
                              {
                                name: "General Information",
                                fields: ["Property Address", "Landlord", "Tenant", "Leased Area (sq ft)", "Commencement Date", "Expiration Date"],
                              },
                              {
                                name: "Financial Terms",
                                fields: ["Base Rent", "Operating Expenses", "Utilities", "Real Estate Taxes", "CAM"],
                              },
                              {
                                name: "Lease Terms",
                                fields: ["Term Length", "Renewal Options", "Early Termination", "Lease Type"],
                              },
                              {
                                name: "Other Details",
                                fields: ["Concessions", "Subordination", "Insurance/Condemnation", "Purchase Options"],
                              },
                            ].map((group) => (
                              <div key={group.name} className="space-y-3">
                                <h4 className="font-medium text-gray-700">{group.name}</h4>
                                <div className="space-y-3">
                                  {group.fields.map((field) => {
                                    const isNonHideableField = ["Property Address", "Leased Area (sq ft)", "Commencement Date"].includes(field)
                                    const getTooltipForField = (field: string) => {
                                      if (field === "Property Address") {
                                        return "Required for geographical benchmarking and comparables accuracy."
                                      }
                                      if (field === "Leased Area (sq ft)") {
                                        return "Needed for computing market averages and regional benchmarking."
                                      }
                                      if (field === "Commencement Date") {
                                        return "Essential for reliable temporal benchmarking and lease trends."
                                      }
                                      return "Toggle to share this field with the selected audience."
                                    }
                                    return (
                                      <div key={field} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Label htmlFor={`field-license-${field}`} className="cursor-pointer">
                                            {field}
                                          </Label>
                                          {isNonHideableField && (
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Lock className="h-3.5 w-3.5 text-gray-500" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p>{getTooltipForField(field)}</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          )}
                                        </div>
                                        <Switch
                                          id={`field-license-${field}`}
                                          checked={isNonHideableField || sharedFields[field]}
                                          onCheckedChange={(checked) => setSharedFields(prev => ({ ...prev, [field]: checked }))}
                                          disabled={isNonHideableField}
                                        />
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {!documentRegistered && (
                      <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Document registration is required before licensing to external parties. Please register your document first.
                        </AlertDescription>
                      </Alert>
                    )}

                    {shareSuccess && (
                      <Alert className="bg-green-50 border-green-200 text-green-800">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Data successfully licensed to {sharedEmails.length} partner{sharedEmails.length > 1 ? 's' : ''}!
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={handleShareDocument}
                      disabled={!documentRegistered || sharedEmails.length === 0 || isSharing}
                      className="w-full"
                      size="sm"
                    >
                      {isSharing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating License...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Create License ({sharedEmails.length})
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              <div className="rounded-lg border">
                <div className="flex items-center space-x-3 p-3">
                  <RadioGroupItem value="coop" id="coop" />
                  <Label htmlFor="coop" className="flex items-center cursor-pointer">
                    <Database className="h-4 w-4 mr-2 text-purple-500" />
                    <div>
                      <div className="font-medium">Share with Data Co-op</div>
                      <div className="text-xs text-gray-500">Contribute to marketplace and earn revenue</div>
                    </div>
                  </Label>
                </div>
                
                {sharingLevel === "coop" && (
                  <div className="border-t bg-gray-50 p-3 space-y-4">
                    <div className="space-y-3">
                      <Label className="font-medium">
                        Data Co-op Marketplace
                      </Label>
                      <div className="text-xs text-gray-600 mb-3">
                        Your selected data will be available for licensing through the Atlas Data Co-op marketplace. You'll earn revenue while contributing to industry-wide benchmarks.
                      </div>
                      
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center text-sm text-purple-800">
                          <Database className="h-4 w-4 mr-2" />
                          Marketplace Benefits
                        </div>
                        <ul className="mt-2 text-xs text-purple-700 space-y-1">
                          <li>• Generate revenue from your data</li>
                          <li>• Access premium market insights</li>
                          <li>• Contribute to industry benchmarks</li>
                          <li>• Maintain control over licensing terms</li>
                        </ul>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Configure Data Co-op Settings
                    </Button>
                  </div>
                )}
              </div>
            </RadioGroup>
          </div>
    </div>
  )
}
