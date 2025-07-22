"use client"

import { useState } from "react"
import {
  Bell,
  Search,
  Wallet,
  TrendingUp,
  FileText,
  Shield,
  Settings,
  Menu,
  X,
  Eye,
  Download,
  Clock,
  DollarSign,
  Activity,
  ChevronRight,
  Filter,
  MoreHorizontal,
  SeparatorVerticalIcon as Separator,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Input } from "@/components/ui"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"
import { Share2, AlertTriangle, UsersIcon, CheckCircle, ExternalLink } from "lucide-react"

const allDocuments = [
  {
    id: 1,
    title: "Market Research Q4",
    description: "Detailed analysis of Q4 market trends",
    docType: "Research",
    region: "Global",
    status: "active",
    price: 500,
    duration: "1 year",
    scope: "Comprehensive",
    trending: true,
    relationship: "owned",
    isLicensed: false,
    isShared: true,
    expirationDate: "2025-12-31",
    sharedWith: [
      { name: "Meridian Capital", type: "Asset Management Firm", since: "2 days ago", expires: "2025-12-31" },
      { name: "CBRE", type: "Real Estate Brokers", since: "1 week ago", expires: "2025-12-31" },
    ],
    licensedTo: [],
    owner: "You",
    revenue: 0,
  },
  {
    id: 2,
    title: "Industrial Property Valuations",
    description: "Valuations of industrial properties",
    docType: "Valuation",
    region: "North America",
    status: "active",
    price: 1000,
    duration: "2 years",
    scope: "Regional",
    trending: false,
    relationship: "owned",
    isLicensed: true,
    isShared: true,
    expirationDate: "2026-07-15",
    sharedWith: [{ name: "MRI Software", type: "Lease Administrator", since: "3 days ago", expires: "2026-07-15" }],
    licensedTo: [
      {
        name: "Brookfield Asset Management",
        type: "Asset Management Firm",
        since: "2 hours ago",
        expires: "2026-07-15",
        amount: "$1000 USDC",
      },
    ],
    owner: "You",
    revenue: 1000,
  },
  {
    id: 3,
    title: "Premium Office Lease Comps",
    description: "20,000 sqft office space lease data with 10-year terms",
    docType: "Lease",
    region: "Northeast",
    status: "active",
    price: 200,
    duration: "12 months",
    scope: "Internal analytics",
    trending: true,
    relationship: "personal-licensed",
    isLicensed: true,
    isShared: false,
    expirationDate: "2025-07-10",
    sharedWith: [],
    licensedTo: [],
    owner: "0xBrokerWallet",
    revenue: 0,
    licenseAmount: "$200 USDC",
  },
  {
    id: 4,
    title: "Retail Space Analysis",
    description: "Comprehensive retail market analysis for downtown area",
    docType: "Analysis",
    region: "Midwest",
    status: "active",
    price: 0,
    duration: "6 months",
    scope: "Market research",
    trending: false,
    relationship: "shared",
    isLicensed: false,
    isShared: true,
    expirationDate: "2025-06-15",
    sharedWith: [],
    licensedTo: [],
    owner: "CoStar Group",
    revenue: 0,
  },
  {
    id: 5,
    title: "Downtown Office Market Report",
    description: "Quarterly analysis of downtown office market conditions",
    docType: "Report",
    region: "West Coast",
    status: "active",
    price: 750,
    duration: "18 months",
    scope: "Regional analysis",
    trending: false,
    relationship: "firm-licensed",
    isLicensed: true,
    isShared: false,
    expirationDate: "2026-01-15",
    sharedWith: [],
    licensedTo: [],
    owner: "JLL Research",
    revenue: 0,
    licenseAmount: "$750 USDC",
    firmAccess: true,
  },
  {
    id: 6,
    title: "Internal Property Assessment",
    description: "Confidential assessment for internal use only",
    docType: "Assessment",
    region: "Local",
    status: "active",
    price: 0,
    duration: "Permanent",
    scope: "Internal use",
    trending: false,
    relationship: "owned",
    isLicensed: false,
    isShared: false,
    expirationDate: "N/A",
    sharedWith: [],
    licensedTo: [],
    owner: "You",
    revenue: 0,
  },
  {
    id: 7,
    title: "Draft Market Analysis",
    description: "Work-in-progress market analysis document",
    docType: "Draft",
    region: "Regional",
    status: "draft",
    price: 0,
    duration: "N/A",
    scope: "Internal review",
    trending: false,
    relationship: "owned",
    isLicensed: false,
    isShared: false,
    expirationDate: "N/A",
    sharedWith: [],
    licensedTo: [],
    owner: "You",
    revenue: 0,
  },
  {
    id: 8,
    title: "Firm Portfolio Analysis",
    description: "Comprehensive analysis of firm's real estate portfolio",
    docType: "Portfolio",
    region: "National",
    status: "active",
    price: 0,
    duration: "Permanent",
    scope: "Firm-wide access",
    trending: false,
    relationship: "firm-owned",
    isLicensed: false,
    isShared: false,
    expirationDate: "N/A",
    sharedWith: [],
    licensedTo: [],
    owner: "Your Firm",
    revenue: 0,
  },
  {
    id: 9,
    title: "Regional Market Intelligence",
    description: "Firm-owned market intelligence database",
    docType: "Database",
    region: "Multi-region",
    status: "active",
    price: 0,
    duration: "Permanent",
    scope: "Firm-wide access",
    trending: false,
    relationship: "firm-owned",
    isLicensed: true,
    isShared: true,
    expirationDate: "N/A",
    sharedWith: [{ name: "Partner Firms", type: "Strategic Partners", since: "1 month ago", expires: "2026-12-31" }],
    licensedTo: [
      {
        name: "External Consultants",
        type: "Consulting Firm",
        since: "2 weeks ago",
        expires: "2025-12-31",
        amount: "$2500 USDC",
      },
    ],
    owner: "Your Firm",
    revenue: 2500,
  },
]

const documentUpdates = [
  {
    id: "lease_123",
    title: "Premium Office Lease Comps",
    lastActivity: {
      action: "RELEASE_ESCROW",
      stage: "Marketplace & licensing",
      timestamp: "2 hours ago",
      color: "bg-green-500",
    },
    totalEvents: 8,
    hasMoreEvents: true,
  },
  {
    id: "market_456",
    title: "Q4 Market Analysis Report",
    lastActivity: {
      action: "DATA_ACCESS_LOG",
      stage: "Data access monitoring",
      timestamp: "30 minutes ago",
      color: "bg-orange-500",
    },
    totalEvents: 15,
    hasMoreEvents: true,
  },
  {
    id: "appraisal_789",
    title: "Industrial Property Valuations",
    lastActivity: {
      action: "ABSTRACT_VALIDATE",
      stage: "Structured data capture",
      timestamp: "1 day ago",
      color: "bg-purple-500",
    },
    totalEvents: 4,
    hasMoreEvents: true,
  },
  {
    id: "office_101",
    title: "Office Building Analysis",
    lastActivity: {
      action: "REGISTER_ASSET",
      stage: "Document origination",
      timestamp: "5 hours ago",
      color: "bg-blue-500",
    },
    totalEvents: 2,
    hasMoreEvents: false,
  },
]

export default function AtlasDAODashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [documentView, setDocumentView] = useState("owned") // "owned", "external", or "firm"
  const [ownedFilters, setOwnedFilters] = useState({
    private: true,
    shared: true,
    licensed: true,
  })
  const [externalFilters, setExternalFilters] = useState({
    personalLicensed: true,
    shared: true,
  })
  const [firmFilters, setFirmFilters] = useState({
    ownedByFirm: true,
    licensedToFirm: true,
  })

  const [sharingLevel, setSharingLevel] = useState("none")
  const [sharedFields, setSharedFields] = useState({
    "Property Address": false,
    Landlord: false,
    Tenant: false,
    "Leased Area (sq ft)": false,
    "Commencement Date": false,
    "Expiration Date": false,
    "Base Rent": false,
    "Operating Expenses": false,
    Utilities: false,
    "Real Estate Taxes": false,
    CAM: false,
    "Term Length": false,
    "Renewal Options": false,
    "Early Termination": false,
    "Lease Type": false,
    Concessions: false,
    Subordination: false,
    "Insurance/Condemnation": false,
    "Purchase Options": false,
  })

  const [activityFilter, setActivityFilter] = useState("all")
  const [activitySearchQuery, setActivitySearchQuery] = useState("")

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "marketplace", label: "Marketplace", icon: Search },
    { id: "documents", label: "My Documents", icon: FileText },
    { id: "contracts", label: "Contracts", icon: UsersIcon },
    { id: "compliance", label: "Compliance", icon: Shield },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  const marketplaceTransactions = [
    {
      id: 1,
      type: "credit",
      description: "License fee received",
      asset: "Premium Office Lease Comps",
      amount: "$200 USDC",
      timestamp: "2 hours ago",
      status: "completed",
      counterparty: "Blackstone Real Estate",
    },
    {
      id: 2,
      type: "debit",
      description: "License purchase",
      asset: "Q4 Market Analysis Report",
      amount: "$500 USDC",
      timestamp: "5 hours ago",
      status: "completed",
      counterparty: "CoStar Group",
    },
    {
      id: 3,
      type: "credit",
      description: "Escrow release",
      asset: "Industrial Property Valuations",
      amount: "$350 USDC",
      timestamp: "1 day ago",
      status: "completed",
      counterparty: "Brookfield Asset Management",
    },
    {
      id: 4,
      type: "debit",
      description: "Platform fee",
      asset: "Office Building Analysis",
      amount: "$25 USDC",
      timestamp: "2 days ago",
      status: "completed",
      counterparty: "Atlas DAO Treasury",
    },
  ]

  const auditTrail = [
    {
      stage: "Document origination",
      action: "REGISTER_ASSET",
      timestamp: "2025-07-10T18:22:05Z",
      actor: "0xBrokerWallet",
      txHash: "0xabc123...",
      status: "completed",
    },
    {
      stage: "Structured data capture",
      action: "AI_ABSTRACT_SUBMIT",
      timestamp: "2025-07-10T18:22:55Z",
      actor: "AtlasAIService",
      txHash: "0x789aaa...",
      status: "completed",
    },
    {
      stage: "Marketplace & licensing",
      action: "CREATE_LICENSE_OFFER",
      timestamp: "2025-07-11T02:15:00Z",
      actor: "0xBrokerWallet",
      txHash: "0x112233...",
      status: "completed",
    },
    {
      stage: "Payment & settlement",
      action: "RELEASE_ESCROW",
      timestamp: "2025-07-11T05:03:05Z",
      actor: "EscrowContract",
      txHash: "0x667788...",
      status: "completed",
    },
  ]

  const ownedDocuments = allDocuments.filter((doc) => doc.relationship === "owned")
  const externalDocuments = allDocuments.filter(
    (doc) => doc.relationship === "personal-licensed" || doc.relationship === "shared",
  )
  const firmDocuments = allDocuments.filter(
    (doc) => doc.relationship === "firm-owned" || doc.relationship === "firm-licensed",
  )

  const filteredOwnedDocuments = ownedDocuments.filter((doc) => {
    if (!ownedFilters.private && !doc.isShared && !doc.isLicensed) return false
    if (!ownedFilters.shared && doc.isShared && !doc.isLicensed) return false
    if (!ownedFilters.licensed && doc.isLicensed) return false
    return true
  })

  const filteredExternalDocuments = externalDocuments.filter((doc) => {
    if (doc.relationship === "personal-licensed" && !externalFilters.personalLicensed) return false
    if (doc.relationship === "shared" && !externalFilters.shared) return false
    return true
  })

  const filteredFirmDocuments = firmDocuments.filter((doc) => {
    if (doc.relationship === "firm-owned" && !firmFilters.ownedByFirm) return false
    if (doc.relationship === "firm-licensed" && !firmFilters.licensedToFirm) return false
    return true
  })

  const getDocumentBadgeVariant = (doc: any) => {
    if (doc.relationship === "owned") {
      if (doc.isLicensed) return "default" // Blue for licensed
      if (doc.isShared) return "secondary" // Gray for shared only
      return "outline" // Outline for owned only
    }
    if (doc.relationship === "personal-licensed" || doc.relationship === "firm-licensed") return "default" // Blue for licensed
    if (doc.relationship === "shared") return "secondary" // Gray for shared
    if (doc.relationship === "firm-owned") return "default" // Blue for firm owned
    return "outline"
  }

  const getDocumentBadgeText = (doc: any) => {
    if (doc.relationship === "owned") {
      if (doc.isLicensed && doc.isShared) return "Owned • Licensed"
      if (doc.isLicensed) return "Owned • Licensed"
      if (doc.isShared) return "Owned • Shared"
      return "Owned • Private"
    }
    if (doc.relationship === "personal-licensed") return "Personal License"
    if (doc.relationship === "firm-licensed") return "Licensed to Firm"
    if (doc.relationship === "shared") return "Shared with Me"
    if (doc.relationship === "firm-owned") {
      if (doc.isLicensed && doc.isShared) return "Firm Owned • Licensed"
      if (doc.isLicensed) return "Firm Owned • Licensed"
      if (doc.isShared) return "Firm Owned • Shared"
      return "Firm Owned"
    }
    return doc.relationship
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex h-16 items-center px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <div className="flex items-center space-x-2 lg:space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">A</span>
              </div>
              <span className="font-bold text-xl">Atlas DAO</span>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center px-4 lg:px-8">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search assets, contracts, or transactions..." className="pl-10 w-full" />
            </div>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
            </Button>

            <div className="flex items-center space-x-2 bg-muted/50 rounded-lg px-3 py-2">
              <Wallet className="h-4 w-4" />
              <span className="text-sm font-medium">$2,450.00</span>
              <Badge variant="secondary" className="text-xs">
                USDC
              </Badge>
            </div>

            <Avatar>
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>BR</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-background border-r transition-transform duration-200 ease-in-out lg:transition-none`}
        >
          <div className="flex flex-col h-full pt-16 lg:pt-0">
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab(item.id)
                      setSidebarOpen(false)
                    }}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Button>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="p-4 lg:p-6">
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back to Atlas DAO</p>
                  </div>
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload New Document
                  </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$12,450</div>
                      <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">23</div>
                      <p className="text-xs text-muted-foreground">+3 new this week</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">My Documents</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">8</div>
                      <p className="text-xs text-muted-foreground">2 pending validation</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$2,450</div>
                      <p className="text-xs text-muted-foreground">USDC balance</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Marketplace Transactions</CardTitle>
                      <CardDescription>Recent debits and credits from marketplace activity</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {marketplaceTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                transaction.type === "credit" ? "bg-green-500" : "bg-red-500"
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{transaction.asset}</p>
                            <div className="flex items-center space-x-2">
                              <p className="text-xs text-muted-foreground">
                                {transaction.description} • {transaction.timestamp}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">{transaction.counterparty}</p>
                          </div>
                          <div
                            className={`text-sm font-medium ${
                              transaction.type === "credit" ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {transaction.type === "credit" ? "+" : "-"}
                            {transaction.amount}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Document Activity</CardTitle>
                      <CardDescription>Recent actions across your document lifecycle</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {documentUpdates.map((document) => (
                        <div
                          key={document.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${document.lastActivity.color}`} />
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{document.title}</p>
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <span>{document.lastActivity.action.replace(/_/g, " ")}</span>
                                <span>•</span>
                                <span>{document.lastActivity.timestamp}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {document.lastActivity.stage}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {document.hasMoreEvents && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => setActiveTab(`document-${document.id}`)}
                              >
                                View All ({document.totalEvents})
                                <ChevronRight className="ml-1 h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === "marketplace" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">Marketplace</h1>
                    <p className="text-muted-foreground">Discover and license data assets</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                    <Button>Browse All Assets</Button>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {allDocuments.slice(0, 3).map((document) => (
                    <Card key={document.id} className="relative">
                      {document.trending && <Badge className="absolute top-4 right-4 bg-orange-500">Trending</Badge>}
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{document.title}</CardTitle>
                            <CardDescription>{document.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{document.docType}</Badge>
                          <Badge variant="outline">{document.region}</Badge>
                          <Badge variant={document.status === "active" ? "default" : "secondary"}>
                            {document.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Price</span>
                          <span className="font-medium">${document.price} USDC</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Duration</span>
                          <span>{document.duration}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Scope</span>
                          <span>{document.scope}</span>
                        </div>
                        <Separator />
                        <div className="flex space-x-2">
                          <Button className="flex-1" disabled={document.status === "paused"}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                          <Button variant="outline" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">My Documents</h1>
                    <p className="text-muted-foreground">Documents you own and have access to</p>
                  </div>
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload New Document
                  </Button>
                </div>

                {/* Main Category Tabs */}
                <Tabs value={documentView} onValueChange={setDocumentView} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="owned">My Owned Documents ({ownedDocuments.length})</TabsTrigger>
                    <TabsTrigger value="external">External Access ({externalDocuments.length})</TabsTrigger>
                    <TabsTrigger value="firm">Firm Documents ({firmDocuments.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="owned" className="space-y-4">
                    {/* Owned Documents Sub-filters */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={ownedFilters.private ? "default" : "outline"}
                        size="sm"
                        onClick={() => setOwnedFilters((prev) => ({ ...prev, private: !prev.private }))}
                      >
                        Private
                      </Button>
                      <Button
                        variant={ownedFilters.shared ? "default" : "outline"}
                        size="sm"
                        onClick={() => setOwnedFilters((prev) => ({ ...prev, shared: !prev.shared }))}
                      >
                        Shared with Others
                      </Button>
                      <Button
                        variant={ownedFilters.licensed ? "default" : "outline"}
                        size="sm"
                        onClick={() => setOwnedFilters((prev) => ({ ...prev, licensed: !prev.licensed }))}
                      >
                        Licensed to Others
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      {filteredOwnedDocuments.map((document) => (
                        <Card key={document.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-3 flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="font-semibold">{document.title}</h3>
                                    <p className="text-sm text-muted-foreground">{document.description}</p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant={getDocumentBadgeVariant(document)} className="text-xs">
                                      {getDocumentBadgeText(document)}
                                    </Badge>
                                    {document.expirationDate !== "N/A" && (
                                      <Badge variant="outline" className="text-xs">
                                        Expires: {document.expirationDate}
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {/* Revenue Information */}
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span>Owner: {document.owner}</span>
                                  {document.revenue > 0 && (
                                    <span className="text-green-600">Revenue: ${document.revenue} USDC</span>
                                  )}
                                </div>

                                {/* Shared With Section */}
                                {document.sharedWith.length > 0 && (
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-muted-foreground">Shared with</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {document.sharedWith.map((participant, index) => (
                                        <div key={index} className="flex items-center space-x-1">
                                          <Badge variant="outline" className="text-xs">
                                            {participant.name}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            ({participant.type}) • Expires: {participant.expires}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Licensed To Section */}
                                {document.licensedTo.length > 0 && (
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-muted-foreground">Licensed to</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {document.licensedTo.map((participant, index) => (
                                        <div key={index} className="flex items-center space-x-1">
                                          <Badge variant="default" className="text-xs">
                                            {participant.name}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            ({participant.type}) • {participant.amount} • Expires: {participant.expires}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center space-x-2 ml-4">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>Edit License Terms</DropdownMenuItem>
                                    <DropdownMenuItem>View Analytics</DropdownMenuItem>
                                    <DropdownMenuItem>Manage Access</DropdownMenuItem>
                                    <DropdownMenuItem>Pause Listing</DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">Revoke Document</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="external" className="space-y-4">
                    {/* External Documents Sub-filters */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={externalFilters.personalLicensed ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setExternalFilters((prev) => ({ ...prev, personalLicensed: !prev.personalLicensed }))
                        }
                      >
                        Personal License
                      </Button>
                      <Button
                        variant={externalFilters.shared ? "default" : "outline"}
                        size="sm"
                        onClick={() => setExternalFilters((prev) => ({ ...prev, shared: !prev.shared }))}
                      >
                        Shared with Me
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      {filteredExternalDocuments.map((document) => (
                        <Card key={document.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-3 flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="font-semibold">{document.title}</h3>
                                    <p className="text-sm text-muted-foreground">{document.description}</p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant={getDocumentBadgeVariant(document)} className="text-xs">
                                      {getDocumentBadgeText(document)}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      Expires: {document.expirationDate}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Owner and License Information */}
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span>Owner: {document.owner}</span>
                                  {document.licenseAmount && <span>License Cost: {document.licenseAmount}</span>}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 ml-4">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {document.relationship === "personal-licensed" && (
                                      <>
                                        <DropdownMenuItem>View License Terms</DropdownMenuItem>
                                        <DropdownMenuItem>Download Document</DropdownMenuItem>
                                        <DropdownMenuItem>Renew License</DropdownMenuItem>
                                      </>
                                    )}
                                    {document.relationship === "shared" && (
                                      <>
                                        <DropdownMenuItem>View Document</DropdownMenuItem>
                                        <DropdownMenuItem>Request License</DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="firm" className="space-y-4">
                    {/* Firm Documents Sub-filters */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={firmFilters.ownedByFirm ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFirmFilters((prev) => ({ ...prev, ownedByFirm: !prev.ownedByFirm }))}
                      >
                        Owned by Firm
                      </Button>
                      <Button
                        variant={firmFilters.licensedToFirm ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFirmFilters((prev) => ({ ...prev, licensedToFirm: !prev.licensedToFirm }))}
                      >
                        Licensed to Firm
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      {filteredFirmDocuments.map((document) => (
                        <Card key={document.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-3 flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="font-semibold">{document.title}</h3>
                                    <p className="text-sm text-muted-foreground">{document.description}</p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant={getDocumentBadgeVariant(document)} className="text-xs">
                                      {getDocumentBadgeText(document)}
                                    </Badge>
                                    {document.expirationDate !== "N/A" && (
                                      <Badge variant="outline" className="text-xs">
                                        Expires: {document.expirationDate}
                                      </Badge>
                                    )}
                                    {document.relationship === "firm-licensed" && (
                                      <Badge variant="secondary" className="text-xs">
                                        Firm Access
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {/* Owner and License Information */}
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span>Owner: {document.owner}</span>
                                  {document.licenseAmount && <span>License Cost: {document.licenseAmount}</span>}
                                  {document.revenue > 0 && (
                                    <span className="text-green-600">Revenue: ${document.revenue} USDC</span>
                                  )}
                                </div>

                                {/* Shared With Section */}
                                {document.sharedWith.length > 0 && (
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-muted-foreground">Shared with</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {document.sharedWith.map((participant, index) => (
                                        <div key={index} className="flex items-center space-x-1">
                                          <Badge variant="outline" className="text-xs">
                                            {participant.name}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            ({participant.type}) • Expires: {participant.expires}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Licensed To Section */}
                                {document.licensedTo.length > 0 && (
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-muted-foreground">Licensed to</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {document.licensedTo.map((participant, index) => (
                                        <div key={index} className="flex items-center space-x-1">
                                          <Badge variant="default" className="text-xs">
                                            {participant.name}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            ({participant.type}) • {participant.amount} • Expires: {participant.expires}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center space-x-2 ml-4">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {document.relationship === "firm-owned" && (
                                      <>
                                        <DropdownMenuItem>Edit License Terms</DropdownMenuItem>
                                        <DropdownMenuItem>View Analytics</DropdownMenuItem>
                                        <DropdownMenuItem>Manage Access</DropdownMenuItem>
                                        <DropdownMenuItem>Pause Listing</DropdownMenuItem>
                                      </>
                                    )}
                                    {document.relationship === "firm-licensed" && (
                                      <>
                                        <DropdownMenuItem>View License Terms</DropdownMenuItem>
                                        <DropdownMenuItem>Download Document</DropdownMenuItem>
                                        <DropdownMenuItem>Renew License</DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {activeTab === "contracts" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">Contracts</h1>
                    <p className="text-muted-foreground">Manage license agreements and requests</p>
                  </div>
                </div>

                <Tabs defaultValue="pending" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="pending">Pending Requests</TabsTrigger>
                    <TabsTrigger value="active">Active Contracts</TabsTrigger>
                    <TabsTrigger value="expired">Expired</TabsTrigger>
                  </TabsList>

                  <TabsContent value="pending" className="space-y-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold">License Request - Market Research Q4</h3>
                            <p className="text-sm text-muted-foreground">Requested by 0xAssetManager</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="secondary">Research</Badge>
                              <Badge variant="outline">$500 USDC</Badge>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="mr-1 h-3 w-3" />1 day ago
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline">Decline</Button>
                            <Button>Accept</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="active" className="space-y-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold">Premium Office Lease Comps</h3>
                            <p className="text-sm text-muted-foreground">Licensed to 0xOtherBroker</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="default">Active</Badge>
                              <Badge variant="outline">$200 USDC</Badge>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="mr-1 h-3 w-3" />
                                Expires in 11 months
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline">View Contract</Button>
                            <Button>Renew</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {activeTab === "compliance" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">Compliance & Governance</h1>
                    <p className="text-muted-foreground">Audit trails and DAO governance</p>
                  </div>
                </div>

                <Tabs defaultValue="audit" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                    <TabsTrigger value="governance">DAO Governance</TabsTrigger>
                    <TabsTrigger value="verification">Verification</TabsTrigger>
                  </TabsList>

                  <TabsContent value="audit" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>Complete audit trail of all on-chain events</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {auditTrail.map((event, index) => (
                            <div key={index} className="flex items-start space-x-4 pb-4 border-b last:border-b-0">
                              <div className="flex-shrink-0 mt-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">{event.action.replace(/_/g, " ")}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {event.stage}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {event.actor} • {new Date(event.timestamp).toLocaleString()}
                                </p>
                                <p className="text-xs font-mono text-muted-foreground">{event.txHash}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="governance" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Active Proposals</CardTitle>
                        <CardDescription>Participate in DAO governance decisions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium">Proposal #12: Adjust Platform Fee Structure</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Reduce platform fees from 10% to 8% to increase market participation
                            </p>
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex space-x-2">
                                <Button size="sm">Vote For</Button>
                                <Button size="sm" variant="outline">
                                  Vote Against
                                </Button>
                              </div>
                              <span className="text-xs text-muted-foreground">Ends in 3 days</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
            {activeTab.startsWith("document-") && (
              <div className="space-y-6">
                {(() => {
                  const documentId = activeTab.replace("document-", "")
                  const document = documentUpdates.find((a) => a.id === documentId)
                  if (!document) return null

                  return (
                    <>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab("dashboard")}>
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
                        {/* Asset Activity History */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Activity History</CardTitle>
                            <CardDescription>Complete ledger event timeline</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Filters */}
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

                            {/* Activity Timeline */}
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {[
                                {
                                  id: "8",
                                  action: "REGISTER_ASSET",
                                  stage: "Document origination",
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
                                  stage: "Document origination",
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
                                  stage: "Structured data capture",
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
                                  stage: "Structured data capture",
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
                                  stage: "Marketplace & licensing",
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
                                  stage: "Data sharing & collaboration",
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
                                  stage: "Data sharing & collaboration",
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
                                  stage: "Data sharing & collaboration",
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
                                  stage: "Data sharing & collaboration",
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
                                  stage: "Data sharing & collaboration",
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
                                  stage: "Marketplace & licensing",
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
                                  stage: "Marketplace & licensing",
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
                                  stage: "Marketplace & licensing",
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
                                  const matchesFilter = activityFilter === "all" || activity.type === activityFilter
                                  const matchesSearch =
                                    activitySearchQuery === "" ||
                                    activity.actor.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
                                    activity.action.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
                                    activity.details.toLowerCase().includes(activitySearchQuery.toLowerCase())
                                  return matchesFilter && matchesSearch
                                })
                                .map((activity, index, filteredArray) => {
                                  const getActivityIcon = (type: string) => {
                                    switch (type) {
                                      case "licensing":
                                        return <DollarSign className="h-4 w-4 text-green-600" />
                                      case "sharing":
                                        return <Share2 className="h-4 w-4 text-blue-600" />
                                      case "validation":
                                        return <CheckCircle className="h-4 w-4 text-purple-600" />
                                      case "origination":
                                        return <FileText className="h-4 w-4 text-blue-600" />
                                      default:
                                        return <FileText className="h-4 w-4 text-gray-600" />
                                    }
                                  }

                                  const getStatusIcon = (status: string) => {
                                    switch (status) {
                                      case "success":
                                        return <CheckCircle className="h-3 w-3 text-green-500" />
                                      case "warning":
                                        return <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                      case "error":
                                        return <AlertTriangle className="h-3 w-3 text-red-500" />
                                      default:
                                        return <Clock className="h-3 w-3 text-gray-500" />
                                    }
                                  }

                                  const getTypeColor = (type: string) => {
                                    switch (type) {
                                      case "licensing":
                                        return "bg-green-50 text-green-700 border-green-200"
                                      case "sharing":
                                        return "bg-blue-50 text-blue-700 border-blue-200"
                                      case "validation":
                                        return "bg-purple-50 text-purple-700 border-purple-200"
                                      case "origination":
                                        return "bg-blue-50 text-blue-700 border-blue-200"
                                      default:
                                        return "bg-gray-50 text-gray-700 border-gray-200"
                                    }
                                  }

                                  return (
                                    <div
                                      key={activity.id}
                                      className={`relative flex gap-3 p-3 rounded-lg border ${
                                        activity.type === "licensing" && activity.revenue
                                          ? "bg-green-50 border-green-200"
                                          : "bg-gray-50 border-gray-200"
                                      }`}
                                    >
                                      {/* Timeline connector */}
                                      {index < filteredArray.length - 1 && (
                                        <div className="absolute left-6 top-12 w-px h-6 bg-gray-200" />
                                      )}

                                      {/* Activity Icon */}
                                      <div className="flex-shrink-0 mt-0.5">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-200">
                                          {getActivityIcon(activity.type)}
                                        </div>
                                      </div>

                                      {/* Activity Content */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <p className="font-medium text-gray-900">
                                                {activity.action.replace(/_/g, " ")}
                                              </p>
                                              {getStatusIcon(activity.status)}
                                              <Badge
                                                variant="outline"
                                                className={`text-xs ${getTypeColor(activity.type)}`}
                                              >
                                                {activity.stage}
                                              </Badge>
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

                            {/* Summary Stats */}
                            <div className="border-t pt-4 mt-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-500">Total Activities</p>
                                  <p className="font-semibold">8</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Revenue Generated</p>
                                  <p className="font-semibold text-green-600">$200 USDC</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Share Activity */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Share Activity</CardTitle>
                            <CardDescription>Current participants and access levels</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-3">
                              <div>
                                <h4 className="text-sm font-medium mb-2">Shared with</h4>
                                <div className="space-y-2">
                                  {[
                                    { name: "Meridian Capital", type: "Broker", since: "2 days ago" },
                                    { name: "CBRE", type: "Real Estate Brokers", since: "1 week ago" },
                                    {
                                      name: "First American Title",
                                      type: "Title & Escrow Companies",
                                      since: "3 days ago",
                                    },
                                  ].map((participant, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-2 bg-muted/30 rounded"
                                    >
                                      <div>
                                        <p className="text-sm font-medium">{participant.name}</p>
                                        <p className="text-xs text-muted-foreground">{participant.type}</p>
                                      </div>
                                      <span className="text-xs text-muted-foreground">Since {participant.since}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <Separator />

                              <div>
                                <h4 className="text-sm font-medium mb-2">Licensed to</h4>
                                <div className="space-y-2">
                                  {[
                                    {
                                      name: "Blackstone Real Estate",
                                      type: "Investors",
                                      since: "2 hours ago",
                                      amount: "$200 USDC",
                                    },
                                    {
                                      name: "JLL Property Management",
                                      type: "Property Management Company",
                                      since: "1 day ago",
                                      amount: "$200 USDC",
                                    },
                                  ].map((participant, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded"
                                    >
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
                      </div>

                      {/* Marketplace Transactions for this Asset */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Marketplace Transactions</CardTitle>
                          <CardDescription>All financial transactions related to this document</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {[
                              {
                                type: "credit",
                                description: "License fee received",
                                amount: "$200 USDC",
                                timestamp: "2 hours ago",
                                counterparty: "Blackstone Real Estate",
                                txHash: "0x667788...",
                              },
                              {
                                type: "credit",
                                description: "License fee received",
                                amount: "$200 USDC",
                                timestamp: "1 day ago",
                                counterparty: "JLL Property Management",
                                txHash: "0x556677...",
                              },
                              {
                                type: "debit",
                                description: "Platform fee",
                                amount: "$40 USDC",
                                timestamp: "1 day ago",
                                counterparty: "Atlas DAO Treasury",
                                txHash: "0x445566...",
                              },
                            ].map((transaction, index) => (
                              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div
                                    className={`w-2 h-2 rounded-full ${transaction.type === "credit" ? "bg-green-500" : "bg-red-500"}`}
                                  />
                                  <div>
                                    <p className="text-sm font-medium">{transaction.description}</p>
                                    <p className="text-xs text-muted-foreground">{transaction.counterparty}</p>
                                    <p className="text-xs font-mono text-muted-foreground">{transaction.txHash}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p
                                    className={`text-sm font-medium ${transaction.type === "credit" ? "text-green-600" : "text-red-600"}`}
                                  >
                                    {transaction.type === "credit" ? "+" : "-"}
                                    {transaction.amount}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{transaction.timestamp}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
