"use client"

import { useState } from "react"
import { Search, DollarSign, Share2, CheckCircle, FileText, AlertTriangle, ExternalLink, Clock, Info } from "lucide-react"
import type { DocumentUpdate } from "../types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator, Input, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui"
import { PrivacySettings } from "../../try-it-now/privacy-settings"

export default function DocumentDetailView({ document, onBack }: { document: DocumentUpdate; onBack: () => void }) {
  const [activityFilter, setActivityFilter] = useState("all")
  const [activitySearchQuery, setActivitySearchQuery] = useState("")
  const [sharingLevel, setSharingLevel] = useState<"private" | "firm" | "external" | "license" | "coop">("private")

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
              {[
                {
                  id: "8",
                  action: "REGISTER_ASSET",
                  timestamp: "2025-01-10T14:22:05Z",
                  actor: "0xBrokerWallet",
                  txHash: "0xabc123...",
                  type: "origination",
                  status: "success",
                  details: "Document registered as digital asset",
                },
                {
                  id: "7",
                  action: "DECLARE_OWNER",
                  timestamp: "2025-01-10T14:22:07Z",
                  actor: "0xBrokerWallet",
                  txHash: "0xdef456...",
                  type: "origination",
                  status: "success",
                  details: "Document ownership declared on-chain",
                },
                {
                  id: "6",
                  action: "AI_ABSTRACT_SUBMIT",
                  timestamp: "2025-01-10T15:22:55Z",
                  actor: "AtlasAIService",
                  txHash: "0x789aaa...",
                  type: "validation",
                  status: "success",
                  details: "AI-generated abstract submitted for review",
                },
                {
                  id: "5",
                  action: "ABSTRACT_VALIDATE",
                  timestamp: "2025-01-10T16:04:13Z",
                  actor: "0xLeaseAdmin",
                  txHash: "0x789aab...",
                  type: "validation",
                  status: "success",
                  details: "Document abstract validated by administrator",
                },
                {
                  id: "4",
                  action: "CREATE_LICENSE_OFFER",
                  timestamp: "2025-01-11T09:15:00Z",
                  actor: "0xBrokerWallet",
                  txHash: "0x112233...",
                  type: "licensing",
                  status: "success",
                  details: "License offer published to marketplace",
                },
                {
                  id: "13",
                  action: "INVITE_PARTNER",
                  timestamp: "2025-05-12T14:03:00Z",
                  actor: "Beto Juárez (Owner)",
                  txHash: "0x9a4...21e",
                  type: "sharing",
                  status: "success",
                  details: "Sent view + download rights to anna@acmeCRE.com",
                },
                {
                  id: "12",
                  action: "EMAIL_DISPATCHED",
                  timestamp: "2025-05-12T14:03:15Z",
                  actor: "Atlas Mailer",
                  txHash: "0xf1c...aa7",
                  type: "sharing",
                  status: "success",
                  details: "Invitation email delivered to external partner",
                },
                {
                  id: "11",
                  action: "ACCEPT_INVITE",
                  timestamp: "2025-05-12T14:08:00Z",
                  actor: "Anna Lee (Acme CRE)",
                  txHash: "0xbc3...e55",
                  type: "sharing",
                  status: "success",
                  details: "Wallet 0xA11...a78 linked to access invitation",
                },
                {
                  id: "10",
                  action: "ACCESS_TOKEN_MINTED",
                  timestamp: "2025-05-12T14:09:00Z",
                  actor: "Atlas Contracts",
                  txHash: "0xef0...c29",
                  type: "sharing",
                  status: "success",
                  details: "ERC-1155 ID 556 issued (view + download rights)",
                },
                {
                  id: "9",
                  action: "REVOKE_ACCESS",
                  timestamp: "2025-06-03T19:17:00Z",
                  actor: "Beto Juárez",
                  txHash: "0x6d9...09f",
                  type: "sharing",
                  status: "success",
                  details: "Token 556 burned - access revoked",
                },
                {
                  id: "3",
                  action: "REQUEST_LICENSE",
                  timestamp: "2025-01-14T14:01:44Z",
                  actor: "0xOtherBroker",
                  txHash: "0x223344...",
                  type: "licensing",
                  status: "success",
                  details: "License request submitted with payment",
                },
                {
                  id: "2",
                  action: "ACCEPT_LICENSE",
                  timestamp: "2025-01-14T14:02:10Z",
                  actor: "0xBrokerWallet",
                  txHash: "0x334455...",
                  type: "licensing",
                  status: "success",
                  details: "License agreement accepted by licensee",
                },
                {
                  id: "1",
                  action: "RELEASE_ESCROW",
                  timestamp: "2025-01-14T14:03:05Z",
                  actor: "EscrowContract",
                  txHash: "0x667788...",
                  type: "licensing",
                  status: "success",
                  details: "Escrow funds released to document owner",
                  revenue: "$200 USDC",
                },
              ]
                .filter((activity) => {
                  const matchesFilter = activityFilter === 'all' || activity.type === activityFilter
                  const matchesSearch =
                    activitySearchQuery === '' ||
                    activity.actor.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
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
                  const getTypeColor = (type: string) => {
                    switch (type) {
                      case 'licensing':
                        return 'bg-green-50 text-green-700 border-green-200'
                      case 'sharing':
                        return 'bg-blue-50 text-blue-700 border-blue-200'
                      case 'validation':
                        return 'bg-purple-50 text-purple-700 border-purple-200'
                      case 'origination':
                        return 'bg-blue-50 text-blue-700 border-blue-200'
                      default:
                        return 'bg-gray-50 text-gray-700 border-gray-200'
                    }
                  }
                  return (
                    <div
                      key={activity.id}
                      className={`relative flex gap-3 p-3 rounded-lg border ${
                        activity.type === 'licensing' && activity.revenue ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {index < filteredArray.length - 1 && <div className="absolute left-6 top-12 w-px h-6 bg-gray-200" />}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-200">
                          {getActivityIcon(activity.type)}
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
                              <span>{activity.actor}</span>
                              <span>•</span>
                              <span>{new Date(activity.timestamp).toLocaleString()}</span>
                              {activity.txHash && (
                                <>
                                  <span>•</span>
                                  <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                                    <span>{activity.txHash}</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          {activity.revenue && (
                            <div className="text-right">
                              <p className="font-semibold text-green-600">{activity.revenue}</p>
                              <p className="text-xs text-gray-500">Just now</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Total Activities</p>
                  <p className="font-semibold">8</p>
                </div>
                <div>
                  <p className="text-gray-500">Revenue Generated</p>
                  <p className="font-semibold">$200 USDC</p>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">Licensed to</h4>
                <div className="space-y-2">
                  {[
                    { name: 'Blackstone Real Estate', type: 'Investors', since: '2 hours ago', amount: '$200 USDC' },
                    { name: 'JLL Property Management', type: 'Property Management Company', since: '1 day ago', amount: '$200 USDC' },
                  ].map((participant, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded">
                      <div>
                        <p className="text-sm font-medium">{participant.name}</p>
                        <p className="text-xs text-muted-foreground">{participant.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">{participant.amount}</p>
                        <p className="text-xs text-muted-foreground">Since {participant.since}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
