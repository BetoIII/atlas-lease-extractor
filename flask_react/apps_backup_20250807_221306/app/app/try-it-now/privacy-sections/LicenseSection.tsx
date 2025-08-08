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
import {
  Mail,
  X,
  Send,
  Loader2,
  Info,
  CheckCircle,
  CalendarIcon,
  Database,
  DollarSign,
} from "lucide-react"
import { format } from "date-fns"
import { useEmailList } from "@/hooks/useEmailList"
import { GranularDataAccess } from "./GranularDataAccess"

interface LicenseSectionProps {
  documentRegistered: boolean;
  onCreateLicense?: (licensedEmails: string[], monthlyFee: number) => void;
  existingLicenses?: Array<{
    created_at: string;
    actor: string;
    details: string;
    extra_data: any;
    monthly_fee: number;
    licensed_emails: string[];
  }>;
}

export function LicenseSection({ documentRegistered, onCreateLicense, existingLicenses }: LicenseSectionProps) {
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

  // Shared fields state for granular data sharing controls
  const [sharedFields, setSharedFields] = useState<Record<string, boolean>>({})
  const [shareAllData, setShareAllData] = useState(true)

  // Access expiration state
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined)

  // Allow downloads state
  const [allowDownloads, setAllowDownloads] = useState(false)

  // Pricing controls state
  const [showPricingControls] = useState(true)
  const [monthlyFee, setMonthlyFee] = useState(50)
  const [displayValue, setDisplayValue] = useState("50")

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

  // Handle monthly fee change
  const handleMonthlyFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const numericValue = parseCurrencyValue(inputValue)
    
    // Update the actual fee value
    setMonthlyFee(numericValue)
    
    // Update display value with proper formatting
    if (inputValue === '') {
      setDisplayValue('')
    } else {
      setDisplayValue(formatCurrencyDisplay(numericValue))
    }
  }

  // Handle input blur to ensure proper formatting
  const handleMonthlyFeeBlur = () => {
    if (displayValue === '' || monthlyFee === 0) {
      setMonthlyFee(50)
      setDisplayValue("50")
    } else {
      setDisplayValue(formatCurrencyDisplay(monthlyFee))
    }
  }

  // Handle creating license
  const handleCreateLicense = async () => {
    if (sharedEmails.length === 0) return

    setIsSharing(true)
    setShareSuccess(false)

    // Use the prop callback to trigger the licensing workflow
    if (onCreateLicense) {
      onCreateLicense(sharedEmails, monthlyFee)
      
      // Simulate success for UI feedback
      await new Promise(resolve => setTimeout(resolve, 1500))
      setIsSharing(false)
      setShareSuccess(true)
      
      // Reset success message after 3 seconds
      setTimeout(() => setShareSuccess(false), 3000)
    } else {
      // Fallback to original mock behavior if no callback provided
      await new Promise(resolve => setTimeout(resolve, 1500))
      setIsSharing(false)
      setShareSuccess(true)
      setTimeout(() => setShareSuccess(false), 3000)
    }
  }

  return (
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
              type="text"
              value={displayValue}
              onChange={handleMonthlyFeeChange}
              onBlur={handleMonthlyFeeBlur}
              placeholder="50"
              className="pl-10"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Set the monthly fee for accessing your lease data. Payment will be processed automatically each month.
          </p>
          {monthlyFee <= 0 && sharedEmails.length > 0 && (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
              <p className="font-medium">Monthly fee required</p>
              <p>Please enter a monthly fee greater than $0 to create the license.</p>
            </div>
          )}

          {monthlyFee > 0 && (
            <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-sm text-emerald-800">
              <p className="font-medium">License Revenue Projection</p>
              <div className="mt-1 space-y-1">
                <p>Monthly: ${monthlyFee}</p>
                <p>Annual: ${monthlyFee * 12}</p>
                <p className="text-xs text-emerald-600">
                  Atlas takes a 15% platform fee. You keep ${Math.round(monthlyFee * 0.85)}/month.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
       
      {/* Granular Data Access section - only show when there are shared emails */}
      {sharedEmails.length > 0 && (
        <GranularDataAccess
          shareAllData={shareAllData}
          setShareAllData={setShareAllData}
          sharedFields={sharedFields}
          setSharedFields={setSharedFields}
          fieldPrefix="license"
        />
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
        onClick={handleCreateLicense}
        disabled={!documentRegistered || sharedEmails.length === 0 || isSharing || monthlyFee <= 0}
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
  )
} 