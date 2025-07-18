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
} from "lucide-react"
import { format } from "date-fns"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"

interface PrivacySettingsProps {
  onSharingLevelChange?: (level: "none" | "firm" | "external" | "coop") => void;
  documentRegistered?: boolean;
}

export function PrivacySettings({ onSharingLevelChange, documentRegistered = false }: PrivacySettingsProps) {
  const [sharingLevel, setSharingLevel] = useState<"none" | "firm" | "external" | "coop">("none")
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

  // Handle sharing the report
  const handleShareReport = async () => {
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
      {/* Data Sharing Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-500" />
              Data Sharing Settings
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button>
                    <Info className="h-4 w-4 text-gray-400" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Control how and with whom you share this lease data. Different sharing levels provide different
                    collaboration and monetization opportunities.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>
            Control who can access your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Data Visibility</h3>
            <RadioGroup value={sharingLevel} onValueChange={(value) => {
              const newLevel = value as "none" | "firm" | "external" | "coop";
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
                      <Label className="text-xs font-medium">
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
                          <Label htmlFor="firm-admin-email" className="text-xs font-medium">
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
                            The firm administrator will receive a request to approve firm-wide access to this report
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
                            ? "Report approved and shared with your firm!"
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
                      <div className="font-medium">Share with an external party</div>
                      <div className="text-xs text-gray-500">Your trusted partners can access this data</div>
                    </div>
                  </Label>
                </div>
                
                {sharingLevel === "external" && (
                  <div className="border-t bg-gray-50 p-3 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="team-email-input" className="text-xs font-medium">
                        Share with trusted partners
                      </Label>
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
                        <Label className="text-xs font-medium">Recipients ({sharedEmails.length})</Label>
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
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Access Expiration (Optional)</Label>
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
                          Report successfully shared with {sharedEmails.length} team member{sharedEmails.length > 1 ? 's' : ''}!
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={handleShareReport}
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
                          Share Report ({sharedEmails.length})
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
                      <Label className="text-xs font-medium">
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
          {(sharingLevel === "external" || sharingLevel === "coop") && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Granular Data Access</h3>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center">
                  <Database className="h-4 w-4 mr-2 text-primary" />
                  <div>
                    <div className="font-medium">Share All Data</div>
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
                            <Label htmlFor={`field-${field}`} className="cursor-pointer">
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
                            id={`field-${field}`}
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
        </CardContent>
      </Card>
    </div>
  )
}
