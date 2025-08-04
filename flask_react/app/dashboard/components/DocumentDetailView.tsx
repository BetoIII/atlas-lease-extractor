"use client"

import { useState, useEffect } from "react"
import { Search, DollarSign, Share2, CheckCircle, FileText, AlertTriangle, ExternalLink, Clock, Info } from "lucide-react"
import type { DocumentUpdate } from "../types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui"
import { PrivacySettings } from "../../try-it-now/privacy-settings"
import { LedgerEventsDrawer } from "./LedgerEventsDrawer"
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

  // Debug: Log the document object to see what data we're receiving
  console.log('DocumentDetailView: Received document object:', document)
  console.log('DocumentDetailView: Document ID:', document?.id)
  console.log('DocumentDetailView: Document title:', document?.title)
  console.log('DocumentDetailView: Document totalEvents:', document?.totalEvents)

  // Privacy settings handlers
  const handleShareDocument = (sharedEmails: string[], documentId?: string) => {
    console.log('Sharing document with:', sharedEmails, 'Document ID:', documentId)
    // TODO: Implement sharing logic for already registered document
  }

  const handleCreateLicense = (licensedEmails: string[], monthlyFee: number, documentId?: string) => {
    console.log('Creating license for:', licensedEmails, 'Fee:', monthlyFee, 'Document ID:', documentId)
    // TODO: Implement licensing logic for already registered document
  }

  const handleShareWithFirm = (documentId?: string) => {
    console.log('Sharing with firm, Document ID:', documentId)
    // TODO: Implement firm sharing logic for already registered document
  }

  const handleShareWithCoop = (priceUSDC: number, licenseTemplate: string, documentId?: string) => {
    console.log('Sharing with coop, Price:', priceUSDC, 'Template:', licenseTemplate, 'Document ID:', documentId)
    // TODO: Implement coop sharing logic for already registered document
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

  const handleActivityHashClick = (activity: Activity) => {
    setSelectedActivity(activity)
    setShowLedgerDrawer(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Back to Dashboard
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

      {/* Privacy Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control who can access your data</CardDescription>
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
          <PrivacySettings 
            onSharingLevelChange={setSharingLevel} 
            documentRegistered={true}
            onShareDocument={handleShareDocument}
            onCreateLicense={handleCreateLicense}
            onShareWithFirm={handleShareWithFirm}
            onShareWithCoop={handleShareWithCoop}
            onDocumentRegistered={handleDocumentRegistered}
          />
        </CardContent>
      </Card>
    </div>
  )
}
