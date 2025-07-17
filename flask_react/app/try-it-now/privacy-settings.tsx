"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Lock,
  Users,
  Building,
  Globe,
  Shield,
  Key,
  FileText,
  CheckCircle,
  Info,
  Database,
  Loader2,
  Check,
  Copy,
  ExternalLink,
  Clock,
  Send,
  X,
  Mail,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"

export function PrivacySettings() {
  const [sharingLevel, setSharingLevel] = useState<"none" | "firm" | "external" | "coop">("none")
  const [allowAnonymousData, setAllowAnonymousData] = useState(false)
  const [tokenizeData, setTokenizeData] = useState(true)
  const [tokenizationLevel, setTokenizationLevel] = useState("metadata")
  const [blockchainAnchor, setBlockchainAnchor] = useState(false)
  const [auditTrail, setAuditTrail] = useState(true)
  const [verificationRequired, setVerificationRequired] = useState(false)

  // Token generation states
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStep, setGenerationStep] = useState("")
  const [generatedToken, setGeneratedToken] = useState<null | {
    tokenId: string
    timestamp: string
    hash: string
    txHash?: string
    explorerUrl?: string
  }>(null)
  const [showTokenDialog, setShowTokenDialog] = useState(false)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

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

  // Generate a random hash
  const generateRandomHash = () => {
    return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
  }

  // Simulate token generation process
  const handleGenerateToken = () => {
    if (!tokenizeData) return

    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationStep("Preparing document metadata")

    // Simulate the token generation process with multiple steps
    const steps = [
      { progress: 20, message: "Preparing document metadata" },
      { progress: 40, message: "Generating cryptographic hash" },
      { progress: 60, message: "Creating token structure" },
      { progress: 80, message: blockchainAnchor ? "Anchoring to blockchain" : "Finalizing token" },
      { progress: 100, message: "Token generation complete" },
    ]

    let currentStep = 0

    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setGenerationProgress(steps[currentStep].progress)
        setGenerationStep(steps[currentStep].message)
        currentStep++
      } else {
        clearInterval(interval)

        // Generate token data
        const tokenData = {
          tokenId: `tkn-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
          timestamp: new Date().toISOString(),
          hash: `0x${generateRandomHash().substring(0, 40)}`,
          ...(blockchainAnchor
            ? {
                txHash: `0x${generateRandomHash().substring(0, 40)}`,
                explorerUrl: `https://etherscan.io/tx/0x${generateRandomHash().substring(0, 40)}`,
              }
            : {}),
        }

        setGeneratedToken(tokenData)
        setIsGenerating(false)
        setShowTokenDialog(true)
      }
    }, 800)
  }

  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopySuccess(type)
    setTimeout(() => setCopySuccess(null), 2000)
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

  // Generate token JSON for display
  const getTokenJson = () => {
    if (!generatedToken) return ""

    return JSON.stringify(
      {
        document_type: "Lease Agreement",
        token_id: generatedToken.tokenId,
        issued_timestamp: generatedToken.timestamp,
        source_hash: generatedToken.hash,
        qa_verified: verificationRequired,
        authors: [
          {
            name: "Current User",
            role: "Abstractor",
          },
        ],
        owning_firm: {
          name: "Atlas Data Co-op User",
          firm_id: "FIRM-0193",
        },
        data_fields: {
          term_start: "2023-07-01",
          base_rent: "$48.00/SF",
          tenant: "Acme Corporation",
        },
        permissioning: {
          visibility: sharingLevel,
          allowed_viewers: [
            "internal",
            ...(sharingLevel === "external" ? ["external"] : []),
            ...(sharingLevel === "firm" ? ["firm"] : []),
            ...(sharingLevel === "coop" ? ["coop"] : []),
          ],
          revocable: true,
        },
        ...(blockchainAnchor && generatedToken.txHash
          ? {
              blockchain_anchor: {
                chain: "Ethereum",
                tx_hash: generatedToken.txHash,
                explorer_url: generatedToken.explorerUrl,
              },
            }
          : {}),
      },
      null,
      2,
    )
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
            <RadioGroup value={sharingLevel} onValueChange={(value) => setSharingLevel(value as "none" | "firm" | "external" | "coop")} className="space-y-3">
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
                      disabled={(!isUserFirmAdmin && (!firmAdminEmail.trim() || !isValidEmail(firmAdminEmail.trim()))) || isSharingWithFirm}
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
                      <div className="text-xs text-gray-500">Your team members can access this data</div>
                    </div>
                  </Label>
                </div>
                
                {sharingLevel === "external" && (
                  <div className="border-t bg-gray-50 p-3 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="team-email-input" className="text-xs font-medium">
                        Share with specific team members
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
                      disabled={sharedEmails.length === 0 || isSharing}
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
                        Your selected lease data will be available for licensing through the Atlas Data Co-op marketplace. You'll earn revenue while contributing to industry-wide benchmarks.
                      </div>
                      
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center text-sm text-purple-800">
                          <Database className="h-4 w-4 mr-2" />
                          Marketplace Benefits
                        </div>
                        <ul className="mt-2 text-xs text-purple-700 space-y-1">
                          <li>• Generate revenue from your lease data</li>
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
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Data Sharing Control</h3>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center">
                <Database className="h-4 w-4 mr-2 text-primary" />
                <div>
                  <div className="font-medium">Share All Data</div>
                  <div className="text-xs text-gray-500">Share all extracted lease information with selected audience</div>
                </div>
              </div>
              <Switch checked={shareAllData} onCheckedChange={setShareAllData} />
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Note: When enabled, all extracted lease information will be shared. When disabled, you can select specific fields to share below.
            </div>
          </div>

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

      {/* Tokenization Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2 text-primary" />
              Enable Document Tracking
            </CardTitle>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Recommended
            </Badge>
          </div>
          <CardDescription>Generate a unique record that proves authorship, verification status, and maintains an immutable audit trail with our trusted third-party.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">       
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center">
                <Key className="h-4 w-4 mr-2 text-gray-500" />
                <div className="flex items-center gap-2">
                  <div className="font-medium">Register Document with Atlas DAO</div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button>
                          <Info className="h-4 w-4 text-gray-400" />
                        </button>
                      </TooltipTrigger>
                                              <TooltipContent className="max-w-xs">
                          <p className="mb-2">
                            Atlas DAO is a non-profit third-party that maintains a unique record of your data - proving authorship, verification status, and maintaining an immutable audit trail.
                          </p>
                          <div className="flex justify-end">
                            <a href="https://atlasdao.com" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-900 font-bold flex items-center gap-1">                          
                              Learn more
                              <ExternalLink className="h-3 w-3 text-gray-400" />
                            </a>
                          </div>
                        </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <Switch checked={tokenizeData} onCheckedChange={setTokenizeData} />
            </div>
          </div>
          {isGenerating && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{generationStep}</span>
                <span className="text-gray-500">{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="h-1" />
            </div>
          )}
          <div className="text-xs text-gray-500 mt-2">
            <p className="mb-1">Benefits of tokenization:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Regulatory compliance (ASC 842, FIRREA)</li>
              <li>Legal protection with immutable proof of methodology</li>
              <li>Defensible audit trail for internal reviews</li>
              <li>Cryptographically secured chain of custody</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="">
          <div className="w-full flex justify-between items-center">
            <div className="text-xs text-gray-500">
              <span className="flex items-center">
                <Shield className="h-3 w-3 mr-1 text-green-600" />
                Tamper-proof and verifiable
              </span>
            </div>
            {isGenerating ? (
              <Button variant="outline" size="sm" disabled>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Generating...
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled={!tokenizeData} onClick={handleGenerateToken}>
                <Key className="h-3 w-3 mr-2" />
                Generate Token
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Token Generation Success Dialog */}
      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              Token Successfully Generated
            </DialogTitle>
            <DialogDescription>
              Your document has been tokenized and is now cryptographically verifiable.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Token Details */}
            <div className="space-y-3">
              <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                <span className="text-sm font-medium text-gray-500">Token ID:</span>
                <div className="flex items-center">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{generatedToken?.tokenId}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 ml-1"
                    onClick={() => generatedToken && handleCopyToClipboard(generatedToken.tokenId, "tokenId")}
                  >
                    {copySuccess === "tokenId" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                <span className="text-sm font-medium text-gray-500">Created:</span>
                <div className="flex items-center">
                  <span className="text-sm flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-gray-400" />
                    {generatedToken && new Date(generatedToken.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                <span className="text-sm font-medium text-gray-500">Document Hash:</span>
                <div className="flex items-center">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono truncate max-w-[300px]">
                    {generatedToken?.hash}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 ml-1"
                    onClick={() => generatedToken && handleCopyToClipboard(generatedToken.hash, "hash")}
                  >
                    {copySuccess === "hash" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>
              {blockchainAnchor && generatedToken?.txHash && (
                <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                  <span className="text-sm font-medium text-gray-500">Blockchain:</span>
                  <div className="flex items-center">
                    <Badge className="mr-2 bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Ethereum</Badge>
                    <a
                      href={generatedToken.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center"
                    >
                      View Transaction
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </div>
              )}
            </div>
            {/* Token JSON */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Token Data</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => handleCopyToClipboard(getTokenJson(), "json")}
                >
                  {copySuccess === "json" ? (
                    <Check className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}
                  Copy JSON
                </Button>
              </div>
              <div className="bg-gray-900 text-gray-100 p-3 text-xs font-mono overflow-auto rounded-md max-h-[200px]">
                {getTokenJson()}
              </div>
            </div>
            {/* Verification Status */}
            <div className="rounded-lg border border-green-100 bg-green-50 p-3">
              <div className="flex items-start">
                <Shield className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">Verification Status</h4>
                  <p className="text-xs text-green-700 mt-1">
                    This token has been cryptographically signed and is now immutable.
                    {verificationRequired
                      ? " It requires verification by a second team member before it can be used for regulatory purposes."
                      : " It can be used immediately for all purposes."}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTokenDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
