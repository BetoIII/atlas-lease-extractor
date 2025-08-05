"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, DollarSign, Share2, CheckCircle, FileText, AlertTriangle, ExternalLink, Clock, Info, Loader2, RefreshCw, Shield, Eye, Scale, Gavel } from "lucide-react"
import type { DocumentUpdate } from "../types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Alert, AlertDescription } from "@/components/ui"
import { PrivacySettings } from "../../try-it-now/privacy-settings"
import { lazy } from "react"
import { LedgerEventsDrawer } from "./LedgerEventsDrawer"
import { useDocumentData } from "@/hooks/useDocumentData"

// Lazy load heavy drawer and dialog components
const ExternalSharingDrawer = lazy(() => import("../../try-it-now/drawers/external-sharing-drawer").then(m => ({ default: m.ExternalSharingDrawer })))
const FirmSharingDrawer = lazy(() => import("../../try-it-now/drawers/firm-sharing-drawer").then(m => ({ default: m.FirmSharingDrawer })))
const CoopSharingDrawer = lazy(() => import("../../try-it-now/drawers/coop-sharing-drawer").then(m => ({ default: m.CoopSharingDrawer })))
const LicensingDrawer = lazy(() => import("../../try-it-now/drawers/licensing-drawer").then(m => ({ default: m.LicensingDrawer })))
const ExternalSharingSuccessDialog = lazy(() => import("../../try-it-now/dialogs/external-sharing-success-dialog").then(m => ({ default: m.ExternalSharingSuccessDialog })))
const FirmSharingSuccessDialog = lazy(() => import("../../try-it-now/dialogs/firm-sharing-success-dialog").then(m => ({ default: m.FirmSharingSuccessDialog })))
const CoopSharingSuccessDialog = lazy(() => import("../../try-it-now/dialogs/coop-sharing-success-dialog").then(m => ({ default: m.CoopSharingSuccessDialog })))
const LicensingSuccessDialog = lazy(() => import("../../try-it-now/dialogs/licensing-success-dialog").then(m => ({ default: m.LicensingSuccessDialog })))
import { useExternalSharing } from "@/hooks/useExternalSharing"
import { useFirmSharing } from "@/hooks/useFirmSharing"
import { useCoopSharing } from "@/hooks/useCoopSharing"
import { useLicensing } from "@/hooks/useLicensing"
import { API_BASE_URL } from "@/lib/config"
import { useToast } from "@/components/ui"

// Document Activity: High-level action performed on a document (e.g., "share with external", "create license")
// Each activity consists of multiple ledger events that define the blockchain transactions
interface ActivityExtraData {
  recipients?: string[]
  monthly_fee?: number
  price_usdc?: number
  license_template?: string
  firm_id?: string
  member_count?: number
  [key: string]: unknown
}

interface Activity {
  id: string
  action: string
  activity_type: string
  status: string
  actor: string
  actor_name?: string
  tx_hash?: string
  block_number?: number
  details: string
  revenue_impact: number
  timestamp: string
  extra_data?: ActivityExtraData
}

interface DocumentDetailViewProps {
  document: DocumentUpdate;
  onBack: () => void;
  activities?: Activity[]; // Optional activities prop
}

export default function DocumentDetailView({ document, onBack, activities: propActivities }: DocumentDetailViewProps) {
  // Use the new batched document data hook
  const {
    activities: hookActivities,
    sharingState,
    isLoading: isLoadingData,
    isRefreshing: isRefreshingData,
    refreshData,
    scheduleRefresh,
    invalidateCache,
    setActivities: setHookActivities
  } = useDocumentData(document.id)
  
  const [activityFilter, setActivityFilter] = useState("all")
  const [activitySearchQuery, setActivitySearchQuery] = useState("")
  const [, setSharingLevel] = useState<"private" | "firm" | "external" | "license" | "coop">("private")
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [showLedgerDrawer, setShowLedgerDrawer] = useState(false)
  const [isProcessingActivity, setIsProcessingActivity] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState({ title: '', description: '' })
  const [currentActivityType, setCurrentActivityType] = useState<string | null>(null)
  
  // Use prop activities if available, otherwise use hook activities
  const activities = propActivities && propActivities.length > 0 ? propActivities : hookActivities
  const documentSharingState = sharingState
  const isLoadingActivities = propActivities ? false : isLoadingData
  const isRefreshingActivities = isRefreshingData
  const [showInfringementAlert, setShowInfringementAlert] = useState(false)
  const [infringementStage, setInfringementStage] = useState<string>('none')
  const [infringementData, setInfringementData] = useState<{
    infringingAddress: string
    similarityScore: number
    klerosCaseId?: string
    proposedResolution?: { amount: number; currency: string }
  }>({
    infringingAddress: '0xBAD7f3e123456789abcdef',
    similarityScore: 98,
  })

  // Sharing hooks integration
  const externalSharingHook = useExternalSharing({})
  const firmSharingHook = useFirmSharing({})
  const coopSharingHook = useCoopSharing({})
  const licensingHook = useLicensing({})


  // Wrapper function for backward compatibility with existing activity handlers
  const refreshActivities = useCallback(() => {
    refreshData(true)
  }, [refreshData])

  // Show success dialog with message
  const showSuccess = (title: string, description: string) => {
    setSuccessMessage({ title, description })
    setShowSuccessDialog(true)
    // Auto-close after 3 seconds
    setTimeout(() => setShowSuccessDialog(false), 3000)
  }

  // Demo function to simulate infringement detection flow
  const simulateInfringementDetection = () => {
    setShowInfringementAlert(true)
    setInfringementStage('detected')
    
    // Create infringement detection activities
    const baseTimestamp = new Date()
    const infringementActivities: Activity[] = [
      {
        id: `infringement-detected-${Date.now()}`,
        action: 'Infringement Detected',
        activity_type: 'infringement',
        status: 'warning',
        actor: 'Atlas Scanner',
        actor_name: 'Atlas Scanner',
        tx_hash: '0x1a2b3c4d5e6f7890',
        block_number: 12345678,
        details: `Unlicensed copy detected on ${infringementData.infringingAddress} with ${infringementData.similarityScore}% similarity match`,
        revenue_impact: 0,
        timestamp: baseTimestamp.toISOString(),
        extra_data: {
          infringing_address: infringementData.infringingAddress,
          similarity_score: infringementData.similarityScore
        }
      }
    ]

    // Add activities with delays to simulate real-time progression
    setActivities(prev => [...infringementActivities, ...prev])

    // Simulate progression through stages
    setTimeout(() => {
      setInfringementStage('notice_sent')
      const noticeActivity: Activity = {
        id: `notice-sent-${Date.now()}`,
        action: 'Conflict Notice Sent',
        activity_type: 'infringement',
        status: 'info',
        actor: 'Atlas Protocol',
        actor_name: 'Atlas Protocol',
        tx_hash: '0x2b3c4d5e6f789012',
        block_number: 12345679,
        details: `Conflict notice emailed to alleged infringer at ${infringementData.infringingAddress}`,
        revenue_impact: 0,
        timestamp: new Date(Date.now() + 3000).toISOString(),
        extra_data: {
          recipient: infringementData.infringingAddress
        }
      }
      setActivities(prev => [noticeActivity, ...prev])
    }, 3000)

    setTimeout(() => {
      setInfringementStage('counter_response')
      const counterActivity: Activity = {
        id: `counter-response-${Date.now()}`,
        action: 'Counter-Response Filed',
        activity_type: 'infringement',
        status: 'info',
        actor: infringementData.infringingAddress,
        actor_name: 'Alleged Infringer',
        tx_hash: '0x3c4d5e6f78901234',
        block_number: 12345680,
        details: `${infringementData.infringingAddress} responded: "Request retroactive license"`,
        revenue_impact: 0,
        timestamp: new Date(Date.now() + 6000).toISOString(),
        extra_data: {
          response_type: 'license_request'
        }
      }
      setActivities(prev => [counterActivity, ...prev])
    }, 6000)

    setTimeout(() => {
      setInfringementStage('resolution_proposed')
      setInfringementData(prev => ({
        ...prev,
        proposedResolution: { amount: 1500, currency: 'USDC' }
      }))
      const resolutionActivity: Activity = {
        id: `resolution-proposed-${Date.now()}`,
        action: 'Resolution Proposed',
        activity_type: 'infringement',
        status: 'success',
        actor: 'Document Owner',
        actor_name: 'You',
        tx_hash: '0x4d5e6f7890123456',
        block_number: 12345681,
        details: 'You proposed retroactive license at 1,500 USDC',
        revenue_impact: 1500,
        timestamp: new Date(Date.now() + 9000).toISOString(),
        extra_data: {
          proposed_amount: 1500,
          currency: 'USDC'
        }
      }
      setActivities(prev => [resolutionActivity, ...prev])
    }, 9000)

    setTimeout(() => {
      setInfringementStage('arbitration_started')
      setInfringementData(prev => ({
        ...prev,
        klerosCaseId: '#77'
      }))
      const arbitrationActivity: Activity = {
        id: `kleros-case-${Date.now()}`,
        action: 'Arbitration Started',
        activity_type: 'infringement',
        status: 'info',
        actor: 'Kleros Protocol',
        actor_name: 'Kleros Protocol',
        tx_hash: '0x5e6f789012345678',
        block_number: 12345682,
        details: 'Kleros case #77 opened; jurors are voting',
        revenue_impact: 0,
        timestamp: new Date(Date.now() + 12000).toISOString(),
        extra_data: {
          kleros_case_id: '#77'
        }
      }
      setActivities(prev => [arbitrationActivity, ...prev])
    }, 12000)

    setTimeout(() => {
      setInfringementStage('verdict_enforced')
      const verdictActivity: Activity = {
        id: `verdict-enforced-${Date.now()}`,
        action: 'Verdict Enforced',
        activity_type: 'infringement',
        status: 'success',
        actor: 'Kleros Protocol',
        actor_name: 'Kleros Protocol',
        tx_hash: '0x6f78901234567890',
        block_number: 12345683,
        details: 'Case closed – retroactive license minted and payment received',
        revenue_impact: 1500,
        timestamp: new Date(Date.now() + 15000).toISOString(),
        extra_data: {
          final_amount: 1500,
          currency: 'USDC'
        }
      }
      setActivities(prev => [verdictActivity, ...prev])
    }, 15000)
  }

  // Privacy settings handlers
  const handleShareDocument = async (sharedEmails: string[]) => {
    setIsProcessingActivity(true)
    setCurrentActivityType('external')
    
    try {
      // Start the external sharing workflow using the hook
      // This will show the drawer and handle the UI flow
      externalSharingHook.handleShareWithExternal(sharedEmails)
      
      // Wait for a reasonable time for the workflow to complete
      // External sharing has 6 events, each taking ~1100-1500ms, so we need at least 10 seconds
      await new Promise(resolve => setTimeout(resolve, 12000)) // 12 seconds to ensure all events complete
      
      // Get all ledger events (not just completed ones, since timing is tricky)
      const allEvents = externalSharingHook.externalShareState.events
      const completedEvents = externalSharingHook.getCompletedLedgerEvents()
      
      // Ledger Events: Individual blockchain transactions that make up the sharing activity
      // These are different from the high-level activity record we'll create in the backend
      const ledgerEvents = allEvents.length > 0 ? allEvents : completedEvents
      
      // Call the actual API endpoint with ledger events
      const response = await fetch(`${API_BASE_URL}/share-with-external/${document.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          shared_emails: sharedEmails,
          ledger_events: ledgerEvents
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        // Invalidate cache and refresh data to show the new activity
        invalidateCache()
        await refreshData(true)
        // Schedule another refresh to catch any delayed updates
        scheduleRefresh(2000)
        
        // Note: Success dialog is handled by the external sharing hook
      } else {
        throw new Error(result.message || 'Failed to share document')
      }
    } catch (error) {
      // Show fallback error dialog
      showSuccess(
        'Error Sharing Document',
        `Failed to share document: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsProcessingActivity(false)
      setCurrentActivityType(null)
    }
  }

  const handleCreateLicense = async (licensedEmails: string[], monthlyFee: number) => {
    setIsProcessingActivity(true)
    setCurrentActivityType('licensing')
    
    // Start the licensing workflow using the hook (this shows the drawer and simulates blockchain events)
    licensingHook.handleCreateLicense(licensedEmails, monthlyFee)
    
    try {
      // Use a simpler approach: wait a fixed time for the workflow, then proceed
      
      // Wait for a reasonable time for the workflow to complete
      // Licensing has 6 events, each taking ~900-2200ms, so we need at least 12 seconds
      await new Promise(resolve => setTimeout(resolve, 14000)) // 14 seconds to ensure all events complete
      
      // Get all ledger events (not just completed ones, since timing is tricky)
      const allEvents = licensingHook.licenseState.events
      const completedEvents = licensingHook.getCompletedLedgerEvents()
      
      // Ledger Events: Individual blockchain transactions that make up the licensing activity
      const ledgerEvents = allEvents.length > 0 ? allEvents : completedEvents
      
      // Call the actual API endpoint with ledger events
      const response = await fetch(`${API_BASE_URL}/create-license/${document.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          licensed_emails: licensedEmails,
          monthly_fee: monthlyFee,
          ledger_events: ledgerEvents
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        // Invalidate cache and refresh data to show the new activity
        invalidateCache()
        await refreshData(true)
        // Schedule another refresh to catch any delayed updates
        scheduleRefresh(2000)
      } else {
        throw new Error(result.message || 'Failed to create license')
      }
    } catch (error) {
      showSuccess(
        'Error Creating License',
        `Failed to create license: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsProcessingActivity(false)
      setCurrentActivityType(null)
    }
  }

  const handleShareWithFirm = async (adminEmail?: string, isUserAdmin?: boolean) => {
    setIsProcessingActivity(true)
    setCurrentActivityType('firm')
    
    // Start the firm sharing workflow using the hook
    firmSharingHook.handleShareWithFirm(adminEmail, isUserAdmin)
    
    try {
      // Use a simpler approach: wait a fixed time for the workflow, then proceed
      
      // Wait for a reasonable time for the workflow to complete
      // Firm sharing has 6 events, each taking ~1000-4000ms, so we need at least 15 seconds
      await new Promise(resolve => setTimeout(resolve, 16000)) // 16 seconds to ensure all events complete
      
      // Get all ledger events (not just completed ones, since timing is tricky)
      const allEvents = firmSharingHook.firmShareState.events
      const completedEvents = firmSharingHook.getCompletedLedgerEvents()
      
      // Ledger Events: Individual blockchain transactions that make up the firm sharing activity
      const ledgerEvents = allEvents.length > 0 ? allEvents : completedEvents
      
      // Call the actual API endpoint with ledger events
      const response = await fetch(`${API_BASE_URL}/share-with-firm/${document.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ledger_events: ledgerEvents
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        // Invalidate cache and refresh data to show the new activity
        invalidateCache()
        await refreshData(true)
        // Schedule another refresh to catch any delayed updates
        scheduleRefresh(2000)
      } else {
        throw new Error(result.message || 'Failed to share with firm')
      }
    } catch (error) {
      showSuccess(
        'Error Sharing with Firm',
        `Failed to share with firm: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsProcessingActivity(false)
      setCurrentActivityType(null)
    }
  }

  const handleShareWithCoop = async (priceUSDC: number, licenseTemplate: string) => {
    setIsProcessingActivity(true)
    setCurrentActivityType('coop')
    
    // Start the coop sharing workflow using the hook
    coopSharingHook.handlePublishToCoop(priceUSDC, licenseTemplate)
    
    // Wait for the coop sharing workflow to complete
    const waitForCompletion = () => {
      return new Promise<void>((resolve) => {
        const checkCompletion = () => {
          if (coopSharingHook.coopShareState.isComplete && !coopSharingHook.coopShareState.isActive) {
            resolve()
          } else {
            setTimeout(checkCompletion, 500)
          }
        }
        checkCompletion()
      })
    }
    
    try {
      // Wait for the workflow to complete
      await waitForCompletion()
      
      // Get the completed ledger events
      const ledgerEvents = coopSharingHook.getCompletedLedgerEvents()
      
      // Call the actual API endpoint with ledger events
      const response = await fetch(`${API_BASE_URL}/share-with-coop/${document.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          price_usdc: priceUSDC,
          license_template: licenseTemplate,
          ledger_events: ledgerEvents
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        // Invalidate cache and refresh data to show the new activity
        invalidateCache()
        await refreshData(true)
        // Schedule another refresh to catch any delayed updates
        scheduleRefresh(2000)
      } else {
        throw new Error(result.message || 'Failed to share with data co-op')
      }
    } catch (error) {
      showSuccess(
        'Error Publishing to Data Co-op',
        `Failed to publish to marketplace: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsProcessingActivity(false)
      setCurrentActivityType(null)
    }
  }

  const handleDocumentRegistered = () => {
    // Document is already registered, this shouldn't be called
  }

  // Update activities if using prop activities and they change
  useEffect(() => {
    if (propActivities && propActivities.length > 0) {
      // When using prop activities, update the hook state to maintain consistency
      setHookActivities(propActivities)
    }
  }, [propActivities, setHookActivities])

  // Watch for sharing hook completions to refresh activities and sharing state
  useEffect(() => {
    if (externalSharingHook.externalShareState.isComplete && !externalSharingHook.externalShareState.isActive) {
      scheduleRefresh(1000)
    }
  }, [externalSharingHook.externalShareState.isComplete, externalSharingHook.externalShareState.isActive, scheduleRefresh])

  useEffect(() => {
    if (firmSharingHook.firmShareState.isComplete && !firmSharingHook.firmShareState.isActive) {
      scheduleRefresh(1000)
    }
  }, [firmSharingHook.firmShareState.isComplete, firmSharingHook.firmShareState.isActive, scheduleRefresh])

  useEffect(() => {
    if (coopSharingHook.coopShareState.isComplete && !coopSharingHook.coopShareState.isActive) {
      scheduleRefresh(1000)
    }
  }, [coopSharingHook.coopShareState.isComplete, coopSharingHook.coopShareState.isActive, scheduleRefresh])

  // Watch for licensing completion
  useEffect(() => {
    if (licensingHook.licenseState.isComplete && !licensingHook.licenseState.isActive) {
      scheduleRefresh(1000)
    }
  }, [licensingHook.licenseState.isComplete, licensingHook.licenseState.isActive, scheduleRefresh])


  const handleActivityHashClick = (activity: Activity) => {
    setSelectedActivity(activity)
    setShowLedgerDrawer(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back to Documents
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground">Document Details</span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={simulateInfringementDetection}
          className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
          disabled={infringementStage !== 'none'}
        >
          <Shield className="h-4 w-4 mr-2" />
          Demo: Trigger Infringement Detection
        </Button>
      </div>
      <div>
        <h1 className="text-3xl font-bold">{document.title}</h1>
        <p className="text-muted-foreground">Complete activity history and participant details</p>
      </div>

      {/* Infringement Alert */}
      {showInfringementAlert && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <div className="ml-2">
            <div className="font-semibold text-orange-800">
              ! Unlicensed near-duplicate spotted ({infringementData.similarityScore}% match)
            </div>
            <AlertDescription className="text-orange-700 mt-1">
              {infringementStage === 'detected' && (
                <>
                  <strong>What happened:</strong> Our Atlas scanner detected an unlicensed copy of your document on address {infringementData.infringingAddress} with {infringementData.similarityScore}% similarity.
                  <br />
                  <strong>Why this matters:</strong> Unauthorized use of your intellectual property could impact your licensing revenue and data rights.
                  <br />
                  <strong>Next steps:</strong> We've automatically initiated our conflict resolution process. A formal notice will be sent to the alleged infringer shortly.
                </>
              )}
              {infringementStage === 'notice_sent' && (
                <>
                  A conflict notice has been emailed to the alleged infringer. They have 48 hours to respond with either a license request or dispute claim.
                </>
              )}
              {infringementStage === 'counter_response' && (
                <>
                  The alleged infringer has responded requesting a retroactive license. You can now propose licensing terms or escalate to arbitration.
                </>
              )}
              {infringementStage === 'resolution_proposed' && (
                <>
                  You've proposed a retroactive license for {infringementData.proposedResolution?.amount} {infringementData.proposedResolution?.currency}. Awaiting the other party's response.
                </>
              )}
              {infringementStage === 'arbitration_started' && (
                <>
                  The case has been escalated to Kleros arbitration (Case {infringementData.klerosCaseId}). Independent jurors are now reviewing the evidence and will render a binding decision.
                </>
              )}
              {infringementStage === 'verdict_enforced' && (
                <>
                  ✓ Case resolved! The arbitration panel ruled in your favor. A retroactive license has been minted and payment has been transferred to your wallet.
                </>
              )}
              <div className="mt-2 flex gap-2">
                {infringementStage === 'detected' && (
                  <Button size="sm" variant="outline" className="text-orange-700 border-orange-300 hover:bg-orange-100">
                    <Eye className="h-3 w-3 mr-1" />
                    Review Claim
                  </Button>
                )}
                {infringementStage === 'counter_response' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-100">
                      <DollarSign className="h-3 w-3 mr-1" />
                      Propose License
                    </Button>
                    <Button size="sm" variant="outline" className="text-blue-700 border-blue-300 hover:bg-blue-100">
                      <Scale className="h-3 w-3 mr-1" />
                      Escalate to Arbitration
                    </Button>
                  </div>
                )}
                {infringementStage === 'arbitration_started' && (
                  <Button size="sm" variant="outline" className="text-blue-700 border-blue-300 hover:bg-blue-100">
                    <Gavel className="h-3 w-3 mr-1" />
                    View Kleros Case
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setShowInfringementAlert(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Dismiss
                </Button>
              </div>
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  Activity History
                  {isRefreshingActivities && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={refreshActivities}
                  disabled={isRefreshingActivities}
                  className="h-8 px-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshingActivities ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
              <CardDescription>
                {isRefreshingActivities 
                  ? 'Updating activity timeline...'
                  : 'Complete ledger event timeline'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={activityFilter} onValueChange={setActivityFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activities</SelectItem>
                    <SelectItem value="licensing">Licensing</SelectItem>
                    <SelectItem value="sharing">Sharing</SelectItem>
                    <SelectItem value="origination">Origination</SelectItem>
                    <SelectItem value="validation">Validation</SelectItem>
                    <SelectItem value="infringement">Infringement</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search activities..."
                    value={activitySearchQuery}
                    onChange={(e) => setActivitySearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {isLoadingActivities ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center space-y-3">
                      <Clock className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Loading activities...</p>
                    </div>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center space-y-3">
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">No Activities Found</p>
                        <p className="text-xs text-muted-foreground">Activities will appear as you interact with this document</p>
                      </div>
                    </div>
                  </div>
                ) : activities
                  .filter((activity) => {
                    const matchesFilter = activityFilter === 'all' || activity.activity_type === activityFilter
                    const matchesSearch =
                      activitySearchQuery === '' ||
                      (activity.actor_name || activity.actor).toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
                      activity.action.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
                      activity.details.toLowerCase().includes(activitySearchQuery.toLowerCase())
                    return matchesFilter && matchesSearch
                  })
                  .map((activity, index, filteredArray) => {
                    const getActivityIcon = (type: string) => {
                      switch (type) {
                        case 'licensing':
                          return <DollarSign className="h-4 w-4 text-green-600" />
                        case 'sharing':
                          return <Share2 className="h-4 w-4 text-blue-600" />
                        case 'validation':
                          return <CheckCircle className="h-4 w-4 text-purple-600" />
                        case 'origination':
                          return <FileText className="h-4 w-4 text-blue-600" />
                        case 'infringement':
                          return <Shield className="h-4 w-4 text-orange-600" />
                        default:
                          return <FileText className="h-4 w-4 text-gray-600" />
                      }
                    }
                    const getStatusIcon = (status: string) => {
                      switch (status) {
                        case 'success':
                          return <CheckCircle className="h-3 w-3 text-green-500" />
                        case 'warning':
                          return <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        case 'error':
                          return <AlertTriangle className="h-3 w-3 text-red-500" />
                        default:
                          return <Clock className="h-3 w-3 text-gray-500" />
                      }
                    }
                    return (
                      <div
                        key={activity.id}
                        className={`relative flex gap-3 p-3 rounded-lg border ${
                          activity.activity_type === 'licensing' && activity.revenue_impact > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        {index < filteredArray.length - 1 && <div className="absolute left-6 top-12 w-px h-6 bg-gray-200" />}
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-200">
                            {getActivityIcon(activity.activity_type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-gray-900">{activity.action.replace(/_/g, ' ')}</p>
                                {getStatusIcon(activity.status)}
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{activity.details}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{activity.actor_name || activity.actor}</span>
                                <span>•</span>
                                <span>{new Date(activity.timestamp).toLocaleString()}</span>
                                {activity.tx_hash && (
                                  <>
                                    <span>•</span>
                                    <button 
                                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                                      onClick={() => handleActivityHashClick(activity)}
                                    >
                                      <span>{activity.tx_hash}</span>
                                      <ExternalLink className="h-3 w-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            {activity.revenue_impact > 0 && (
                              <div className="text-right">
                                <p className="font-semibold text-green-600">${activity.revenue_impact} USDC</p>
                                <p className="text-xs text-gray-500">Revenue</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
              {!isLoadingActivities && activities.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Total Activities</p>
                      <p className="font-semibold">{activities.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Revenue Generated</p>
                      <p className="font-semibold">${activities.reduce((sum, a) => sum + (a.revenue_impact || 0), 0)} USDC</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Privacy Settings Card - moved to main section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Update Privacy Settings
                    {isProcessingActivity && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    {isProcessingActivity 
                      ? `Processing ${currentActivityType} sharing activity...`
                      : 'Control who can access your data'
                    }
                  </CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button>
                        <Info className="h-4 w-4 text-gray-400" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs" side="left" align="start">
                      <p>
                        Select data visibility to enable different collaboration and monetization opportunities.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              {isProcessingActivity && (
                <Alert className="mb-4 bg-blue-50 border-blue-200 text-blue-800">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Processing your sharing request. Please wait while we update the blockchain and send notifications...
                  </AlertDescription>
                </Alert>
              )}
              <div className={isProcessingActivity ? 'opacity-50 pointer-events-none' : ''}>
                <PrivacySettings 
                  onSharingLevelChange={setSharingLevel} 
                  documentRegistered={true}
                  onShareDocument={handleShareDocument}
                  onCreateLicense={handleCreateLicense}
                  onShareWithFirm={handleShareWithFirm}
                  onShareWithCoop={handleShareWithCoop}
                  onDocumentRegistered={handleDocumentRegistered}
                  documentId={document.id}
                  documentTitle={document.title}
                  // External sharing props from hook
                  externalShareState={externalSharingHook.externalShareState}
                  handleShareWithExternal={externalSharingHook.handleShareWithExternal}
                  resetExternalSharingState={externalSharingHook.resetExternalSharingState}
                  setShowExternalSharingDrawer={externalSharingHook.setShowExternalSharingDrawer}
                  showExternalSharingDrawer={externalSharingHook.showExternalSharingDrawer}
                  showExternalSharingDialog={externalSharingHook.showExternalSharingDialog}
                  setShowExternalSharingDialog={externalSharingHook.setShowExternalSharingDialog}
                  handleExternalSharingCopyToClipboard={externalSharingHook.handleCopyToClipboard}
                  getExternalSharingJson={externalSharingHook.getExternalSharingJson}
                  externalShareCopySuccess={externalSharingHook.copySuccess}
                  // Firm sharing props from hook
                  firmShareState={firmSharingHook.firmShareState}
                  onViewFirmAuditTrail={() => firmSharingHook.setShowFirmSharingDrawer(true)}
                  onFirmSharingCompleted={() => firmSharingHook.setShowFirmSharingDialog(true)}
                  // Document sharing state
                  documentSharingState={documentSharingState as any || undefined}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Marketplace Transactions</CardTitle>
              <CardDescription>All financial transactions related to this document</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: 'credit', description: 'License fee received', amount: '$200 USDC', timestamp: '2 hours ago', counterparty: 'Blackstone Real Estate', txHash: '0x667788...' },
                  { type: 'credit', description: 'License fee received', amount: '$200 USDC', timestamp: '1 day ago', counterparty: 'JLL Property Management', txHash: '0x556677...' },
                  { type: 'debit', description: 'Platform fee', amount: '$40 USDC', timestamp: '1 day ago', counterparty: 'Atlas DAO Treasury', txHash: '0x445566...' },
                ].map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${transaction.type === 'credit' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="text-sm font-medium">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">{transaction.counterparty}</p>
                        <p className="text-xs font-mono text-muted-foreground">{transaction.txHash}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>{transaction.type === 'credit' ? '+' : '-'}{transaction.amount}</p>
                      <p className="text-xs text-muted-foreground">{transaction.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ledger Events Drawer */}
      <LedgerEventsDrawer 
        open={showLedgerDrawer}
        onOpenChange={setShowLedgerDrawer}
        activity={selectedActivity}
      />

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-left">{successMessage.title}</DialogTitle>
                <DialogDescription className="text-left mt-1">
                  {successMessage.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowSuccessDialog(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>



      {/* External Sharing Drawer */}
      <ExternalSharingDrawer 
        open={externalSharingHook.showExternalSharingDrawer}
        onOpenChange={externalSharingHook.setShowExternalSharingDrawer}
        externalShareState={externalSharingHook.externalShareState}
      />

      {/* Firm Sharing Drawer */}
      <FirmSharingDrawer 
        open={firmSharingHook.showFirmSharingDrawer}
        onOpenChange={firmSharingHook.setShowFirmSharingDrawer}
        firmShareState={firmSharingHook.firmShareState}
      />

      {/* Coop Sharing Drawer */}
      <CoopSharingDrawer 
        open={coopSharingHook.showCoopSharingDrawer}
        onOpenChange={coopSharingHook.setShowCoopSharingDrawer}
        coopShareState={coopSharingHook.coopShareState}
      />

      {/* External Sharing Success Dialog */}
      <ExternalSharingSuccessDialog 
        open={externalSharingHook.showExternalSharingDialog}
        onOpenChange={externalSharingHook.setShowExternalSharingDialog}
        externalShareState={externalSharingHook.externalShareState}
        getExternalSharingJson={externalSharingHook.getExternalSharingJson}
        handleCopyToClipboard={externalSharingHook.handleCopyToClipboard}
        copySuccess={externalSharingHook.copySuccess}
        documentId={document.id}
      />

      {/* Firm Sharing Success Dialog */}
      <FirmSharingSuccessDialog 
        open={firmSharingHook.showFirmSharingDialog}
        onOpenChange={firmSharingHook.setShowFirmSharingDialog}
        firmShareState={firmSharingHook.firmShareState}
        getFirmSharingJson={firmSharingHook.getFirmSharingJson}
        handleCopyToClipboard={firmSharingHook.handleCopyToClipboard}
        copySuccess={firmSharingHook.copySuccess}
        documentId={document.id}
      />

      {/* Coop Sharing Success Dialog */}
      <CoopSharingSuccessDialog 
        open={coopSharingHook.showCoopSharingDialog}
        onOpenChange={coopSharingHook.setShowCoopSharingDialog}
        coopShareState={coopSharingHook.coopShareState}
        getCoopSharingJson={coopSharingHook.getCoopSharingJson}
        handleCopyToClipboard={coopSharingHook.handleCopyToClipboard}
        copySuccess={coopSharingHook.copySuccess}
        documentId={document.id}
      />

      {/* Licensing Drawer */}
      <LicensingDrawer 
        open={licensingHook.showLicensingDrawer}
        onOpenChange={licensingHook.setShowLicensingDrawer}
        licenseState={licensingHook.licenseState}
      />

      {/* Licensing Success Dialog */}
      <LicensingSuccessDialog 
        open={licensingHook.showLicensingDialog}
        onOpenChange={licensingHook.setShowLicensingDialog}
        licenseState={licensingHook.licenseState}
        getLicensingJson={licensingHook.getLicensingJson}
        handleCopyToClipboard={licensingHook.handleCopyToClipboard}
        copySuccess={licensingHook.copySuccess}
        documentId={document.id}
      />
    </div>
  )
}
