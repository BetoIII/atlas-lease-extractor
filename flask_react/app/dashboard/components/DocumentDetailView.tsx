"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, DollarSign, Share2, CheckCircle, FileText, AlertTriangle, ExternalLink, Clock, Info, Loader2 } from "lucide-react"
import type { DocumentUpdate } from "../types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Alert, AlertDescription } from "@/components/ui"
import { PrivacySettings } from "../../try-it-now/privacy-settings"
import { LedgerEventsDrawer } from "./LedgerEventsDrawer"
import { ExternalSharingDrawer } from "../../try-it-now/drawers/external-sharing-drawer"
import { FirmSharingDrawer } from "../../try-it-now/drawers/firm-sharing-drawer"
import { CoopSharingDrawer } from "../../try-it-now/drawers/coop-sharing-drawer"
import { ExternalSharingSuccessDialog } from "../../try-it-now/dialogs/external-sharing-success-dialog"
import { FirmSharingSuccessDialog } from "../../try-it-now/dialogs/firm-sharing-success-dialog"
import { CoopSharingSuccessDialog } from "../../try-it-now/dialogs/coop-sharing-success-dialog"
import { useExternalSharing } from "@/hooks/useExternalSharing"
import { useFirmSharing } from "@/hooks/useFirmSharing"
import { useCoopSharing } from "@/hooks/useCoopSharing"
import { API_BASE_URL } from "@/lib/config"

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
  extra_data?: any
}

interface DocumentDetailViewProps {
  document: DocumentUpdate;
  onBack: () => void;
  activities?: Activity[]; // Optional activities prop
}

export default function DocumentDetailView({ document, onBack, activities: propActivities }: DocumentDetailViewProps) {
  const [activityFilter, setActivityFilter] = useState("all")
  const [activitySearchQuery, setActivitySearchQuery] = useState("")
  const [, setSharingLevel] = useState<"private" | "firm" | "external" | "license" | "coop">("private")
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(true)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [showLedgerDrawer, setShowLedgerDrawer] = useState(false)
  const [isProcessingActivity, setIsProcessingActivity] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState({ title: '', description: '' })
  const [currentActivityType, setCurrentActivityType] = useState<string | null>(null)

  // Sharing hooks integration
  const externalSharingHook = useExternalSharing({})
  const firmSharingHook = useFirmSharing({})
  const coopSharingHook = useCoopSharing({})

  // Debug: Log the document object to see what data we're receiving
  console.log('DocumentDetailView: Received document object:', document)
  console.log('DocumentDetailView: Document ID:', document?.id)
  console.log('DocumentDetailView: Document title:', document?.title)
  console.log('DocumentDetailView: Document totalEvents:', document?.totalEvents)

  // Refresh activities after new activity
  const refreshActivities = useCallback(async () => {
    if (!document.id) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/document-activities/${document.id}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error refreshing activities:', error)
    }
  }, [document.id])

  // Show success dialog with message
  const showSuccess = (title: string, description: string) => {
    setSuccessMessage({ title, description })
    setShowSuccessDialog(true)
    // Auto-close after 3 seconds
    setTimeout(() => setShowSuccessDialog(false), 3000)
  }


  // Privacy settings handlers
  const handleShareDocument = async (sharedEmails: string[], documentId?: string) => {
    console.log('Sharing document with:', sharedEmails, 'Document ID:', documentId)
    setIsProcessingActivity(true)
    setCurrentActivityType('external')
    
    // Start the external sharing workflow using the hook
    // This will show the drawer and handle the UI flow
    externalSharingHook.handleShareWithExternal(sharedEmails)
    
    try {
      // Call the actual API endpoint
      const response = await fetch(`${API_BASE_URL}/share-with-external/${document.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          shared_emails: sharedEmails
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        // Refresh activities to show the new activity
        await refreshActivities()
        
        // Note: Success dialog is handled by the external sharing hook
        console.log('External sharing API call successful')
      } else {
        throw new Error(result.message || 'Failed to share document')
      }
    } catch (error) {
      console.error('Error sharing document:', error)
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

  const handleCreateLicense = async (licensedEmails: string[], monthlyFee: number, documentId?: string) => {
    console.log('Creating license for:', licensedEmails, 'Fee:', monthlyFee, 'Document ID:', documentId)
    setIsProcessingActivity(true)
    setCurrentActivityType('license')
    setShowLedgerDrawer(true)
    
    try {
      // Call the actual API endpoint
      const response = await fetch(`${API_BASE_URL}/create-license/${document.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          licensed_emails: licensedEmails,
          monthly_fee: monthlyFee
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        // Refresh activities to show the new activity
        await refreshActivities()
        
        showSuccess(
          'License Offer Created',
          `License offer published for $${monthlyFee} USDC/month. Invitations sent to ${licensedEmails.length} potential licensee${licensedEmails.length > 1 ? 's' : ''}. You'll be notified when payments begin.`
        )
      } else {
        throw new Error(result.message || 'Failed to create license')
      }
    } catch (error) {
      console.error('Error creating license:', error)
      showSuccess(
        'Error Creating License',
        `Failed to create license: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsProcessingActivity(false)
      setCurrentActivityType(null)
      setTimeout(() => setShowLedgerDrawer(false), 1000)
    }
  }

  const handleShareWithFirm = async (documentId?: string, adminEmail?: string, isUserAdmin?: boolean) => {
    console.log('Sharing with firm, Document ID:', documentId)
    setIsProcessingActivity(true)
    setCurrentActivityType('firm')
    
    // Start the firm sharing workflow using the hook
    firmSharingHook.handleShareWithFirm(adminEmail, isUserAdmin)
    
    try {
      // Call the actual API endpoint
      const response = await fetch(`${API_BASE_URL}/share-with-firm/${document.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      const result = await response.json()
      
      if (response.ok) {
        // Refresh activities to show the new activity
        await refreshActivities()
        
        console.log('Firm sharing API call successful')
      } else {
        throw new Error(result.message || 'Failed to share with firm')
      }
    } catch (error) {
      console.error('Error sharing with firm:', error)
      showSuccess(
        'Error Sharing with Firm',
        `Failed to share with firm: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsProcessingActivity(false)
      setCurrentActivityType(null)
    }
  }

  const handleShareWithCoop = async (priceUSDC: number, licenseTemplate: string, documentId?: string) => {
    console.log('Sharing with coop, Price:', priceUSDC, 'Template:', licenseTemplate, 'Document ID:', documentId)
    setIsProcessingActivity(true)
    setCurrentActivityType('coop')
    
    // Start the coop sharing workflow using the hook
    coopSharingHook.handlePublishToCoop(priceUSDC, licenseTemplate)
    
    try {
      // Call the actual API endpoint
      const response = await fetch(`${API_BASE_URL}/share-with-coop/${document.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          price_usdc: priceUSDC,
          license_template: licenseTemplate
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        // Refresh activities to show the new activity
        await refreshActivities()
        
        console.log('Coop sharing API call successful')
      } else {
        throw new Error(result.message || 'Failed to share with data co-op')
      }
    } catch (error) {
      console.error('Error sharing with coop:', error)
      showSuccess(
        'Error Publishing to Data Co-op',
        `Failed to publish to marketplace: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsProcessingActivity(false)
      setCurrentActivityType(null)
    }
  }

  const handleDocumentRegistered = (documentId: string) => {
    console.log('Document registered with ID:', documentId)
    // Document is already registered, this shouldn't be called
  }

  // Use prop activities if available, otherwise fetch from API
  useEffect(() => {
    const initializeActivities = async () => {
      // If activities are passed as props, use them directly
      if (propActivities && propActivities.length > 0) {
        console.log('DocumentDetailView: Using prop activities:', propActivities)
        setActivities(propActivities)
        setIsLoadingActivities(false)
        return
      }

      // Otherwise, fetch from API
      if (!document.id) {
        console.log('DocumentDetailView: No document.id provided')
        setIsLoadingActivities(false)
        return
      }
      
      console.log('DocumentDetailView: Fetching activities for document ID:', document.id)
      setIsLoadingActivities(true)
      try {
        const url = `${API_BASE_URL}/document-activities/${document.id}`
        console.log('DocumentDetailView: Making request to:', url)
        
        const response = await fetch(url, {
          credentials: 'include'
        })
        
        console.log('DocumentDetailView: Response status:', response.status)
        console.log('DocumentDetailView: Response ok:', response.ok)
        
        if (response.ok) {
          const data = await response.json()
          console.log('DocumentDetailView: API response data:', data)
          console.log('DocumentDetailView: Activities array:', data.activities)
          console.log('DocumentDetailView: Activities count:', data.activities?.length || 0)
          setActivities(data.activities || [])
        } else {
          const errorText = await response.text()
          console.error('DocumentDetailView: Failed to fetch activities:', response.status, response.statusText, errorText)
          // Fall back to empty array instead of sample data
          setActivities([])
        }
      } catch (error) {
        console.error('DocumentDetailView: Error fetching activities:', error)
        setActivities([])
      } finally {
        setIsLoadingActivities(false)
      }
    }

    initializeActivities()
  }, [document.id, propActivities])

  // Watch for sharing hook completions to refresh activities
  useEffect(() => {
    if (externalSharingHook.externalShareState.isComplete && !externalSharingHook.externalShareState.isActive) {
      console.log('External sharing completed, refreshing activities')
      refreshActivities()
    }
  }, [externalSharingHook.externalShareState.isComplete, externalSharingHook.externalShareState.isActive, refreshActivities])

  useEffect(() => {
    if (firmSharingHook.firmShareState.isComplete && !firmSharingHook.firmShareState.isActive) {
      console.log('Firm sharing completed, refreshing activities')
      refreshActivities()
    }
  }, [firmSharingHook.firmShareState.isComplete, firmSharingHook.firmShareState.isActive, refreshActivities])

  useEffect(() => {
    if (coopSharingHook.coopShareState.isComplete && !coopSharingHook.coopShareState.isActive) {
      console.log('Coop sharing completed, refreshing activities')
      refreshActivities()
    }
  }, [coopSharingHook.coopShareState.isComplete, coopSharingHook.coopShareState.isActive, refreshActivities])

  const handleActivityHashClick = (activity: Activity) => {
    setSelectedActivity(activity)
    setShowLedgerDrawer(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Back to Documents
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm text-muted-foreground">Document Details</span>
      </div>
      <div>
        <h1 className="text-3xl font-bold">{document.title}</h1>
        <p className="text-muted-foreground">Complete activity history and participant details</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activity History</CardTitle>
            <CardDescription>Complete ledger event timeline</CardDescription>
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

      {/* Privacy Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Privacy Settings
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
            />
          </div>
        </CardContent>
      </Card>

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
    </div>
  )
}
