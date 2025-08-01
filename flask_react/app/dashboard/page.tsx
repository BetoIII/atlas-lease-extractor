"use client"

import { useState } from "react"
import { TrendingUp, Search, FileText, UsersIcon, Shield, Settings, Upload } from "lucide-react"
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
import { Navbar } from "@/components/navbar"
import DashboardSidebar from "./components/DashboardSidebar"
import DashboardStats from "./components/DashboardStats"
import MarketplaceTransactions from "./components/MarketplaceTransactions"
import DocumentActivity from "./components/DocumentActivity"
import DocumentList from "./components/DocumentList"
import ContractsTab from "./components/ContractsTab"
import ComplianceTab from "./components/ComplianceTab"
import DocumentDetailView from "./components/DocumentDetailView"
import { allDocuments, marketplaceTransactions, auditTrail } from "./sample-data"
import { useUserDocuments } from "@/hooks/useUserDocuments"

export default function AtlasDAODashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [documentView, setDocumentView] = useState("owned")
  const [ownedFilters, setOwnedFilters] = useState({ private: true, shared: true, licensed: true })
  const [externalFilters, setExternalFilters] = useState({ personalLicensed: true, shared: true })
  const [firmFilters, setFirmFilters] = useState({ ownedByFirm: true, licensedToFirm: true })

  // Load user documents
  const { documentUpdates, dashboardDocuments, isLoading } = useUserDocuments()

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "marketplace", label: "Marketplace", icon: Search },
    { id: "documents", label: "My Documents", icon: FileText },
    { id: "contracts", label: "Contracts", icon: UsersIcon },
    { id: "compliance", label: "Compliance", icon: Shield },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  // Combine user documents with sample documents
  const combinedDocuments = [...dashboardDocuments, ...allDocuments]
  
  const ownedDocuments = combinedDocuments.filter((d) => d.relationship === "owned")
  const externalDocuments = combinedDocuments.filter((d) => d.relationship === "personal-licensed" || d.relationship === "shared")
  const firmDocuments = combinedDocuments.filter((d) => d.relationship === "firm-owned" || d.relationship === "firm-licensed")

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
      if (doc.isLicensed) return "default"
      if (doc.isShared) return "secondary"
      return "outline"
    }
    if (doc.relationship === "personal-licensed" || doc.relationship === "firm-licensed") return "default"
    if (doc.relationship === "shared") return "secondary"
    if (doc.relationship === "firm-owned") return "default"
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
      <Navbar 
        sidebarOpen={sidebarOpen} 
        toggleSidebar={() => {
          console.log('Toggle sidebar called, current state:', sidebarOpen)
          setSidebarOpen(!sidebarOpen)
        }} 
      />
      <div className="flex">
        <DashboardSidebar 
          open={sidebarOpen} 
          items={navigationItems} 
          active={activeTab} 
          onSelect={(id) => { setActiveTab(id); setSidebarOpen(false) }} 
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 lg:ml-0">
          <div className="p-4 lg:p-6">
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back to Atlas Data Co-op</p>
                  </div>
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                </div>
                <DashboardStats />
                <div className="grid gap-6 lg:grid-cols-2">
                  <MarketplaceTransactions transactions={marketplaceTransactions} />
                  <DocumentActivity updates={documentUpdates} onView={(id) => setActiveTab(`document-${id}`)} />
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
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {allDocuments.slice(0, 3).map((document) => (
                    <DocumentList key={document.id} documents={[document]} badgeVariant={getDocumentBadgeVariant} badgeText={getDocumentBadgeText} />
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
                <Tabs value={documentView} onValueChange={setDocumentView} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="owned">My Owned Documents ({ownedDocuments.length})</TabsTrigger>
                    <TabsTrigger value="external">External Access ({externalDocuments.length})</TabsTrigger>
                    <TabsTrigger value="firm">Firm Documents ({firmDocuments.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="owned" className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button variant={ownedFilters.private ? "default" : "outline"} size="sm" onClick={() => setOwnedFilters(prev => ({ ...prev, private: !prev.private }))}>Private</Button>
                      <Button variant={ownedFilters.shared ? "default" : "outline"} size="sm" onClick={() => setOwnedFilters(prev => ({ ...prev, shared: !prev.shared }))}>Shared with Others</Button>
                      <Button variant={ownedFilters.licensed ? "default" : "outline"} size="sm" onClick={() => setOwnedFilters(prev => ({ ...prev, licensed: !prev.licensed }))}>Licensed to Others</Button>
                    </div>
                    <DocumentList documents={filteredOwnedDocuments} badgeVariant={getDocumentBadgeVariant} badgeText={getDocumentBadgeText} />
                  </TabsContent>
                  <TabsContent value="external" className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button variant={externalFilters.personalLicensed ? "default" : "outline"} size="sm" onClick={() => setExternalFilters(prev => ({ ...prev, personalLicensed: !prev.personalLicensed }))}>Personal License</Button>
                      <Button variant={externalFilters.shared ? "default" : "outline"} size="sm" onClick={() => setExternalFilters(prev => ({ ...prev, shared: !prev.shared }))}>Shared with Me</Button>
                    </div>
                    <DocumentList documents={filteredExternalDocuments} badgeVariant={getDocumentBadgeVariant} badgeText={getDocumentBadgeText} />
                  </TabsContent>
                  <TabsContent value="firm" className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button variant={firmFilters.ownedByFirm ? "default" : "outline"} size="sm" onClick={() => setFirmFilters(prev => ({ ...prev, ownedByFirm: !prev.ownedByFirm }))}>Owned by Firm</Button>
                      <Button variant={firmFilters.licensedToFirm ? "default" : "outline"} size="sm" onClick={() => setFirmFilters(prev => ({ ...prev, licensedToFirm: !prev.licensedToFirm }))}>Licensed to Firm</Button>
                    </div>
                    <DocumentList documents={filteredFirmDocuments} badgeVariant={getDocumentBadgeVariant} badgeText={getDocumentBadgeText} />
                  </TabsContent>
                </Tabs>
              </div>
            )}
            {activeTab === "contracts" && <ContractsTab />}
            {activeTab === "compliance" && <ComplianceTab auditTrail={auditTrail} />}
            {activeTab.startsWith("document-") && (() => {
              const documentId = activeTab.replace("document-", "")
              const doc = documentUpdates.find((d) => d.id === documentId)
              if (!doc) return null
              return <DocumentDetailView document={doc} onBack={() => setActiveTab("dashboard")} />
            })()}
          </div>
        </main>
      </div>
    </div>
  )
}
