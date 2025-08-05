"use client"

import { useState } from "react"
import { TrendingUp, Search, FileText, UsersIcon, Briefcase, Settings, Upload } from "lucide-react"
import { Button, Input } from "@/components/ui"
import { Navbar } from "@/components/navbar"
import DashboardSidebar from "@/app/dashboard/components/DashboardSidebar"
import DocumentList from "@/app/dashboard/components/DocumentList"
import { allDocuments } from "@/app/dashboard/sample-data"

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp, href: "/dashboard" },
    { id: "marketplace", label: "Marketplace", icon: Search, href: "/marketplace" },
    { id: "documents", label: "My Documents", icon: FileText, href: "/documents" },
    { id: "contracts", label: "Contracts", icon: UsersIcon, href: "/contracts" },
    { id: "portfolio", label: "Portfolio", icon: Briefcase, href: "/portfolio" },
    { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
  ]

  const filteredDocuments = allDocuments.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc as any).assetType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
      />
      <div className="flex">
        <DashboardSidebar 
          open={sidebarOpen} 
          items={navigationItems} 
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 lg:ml-0">
          <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Marketplace</h1>
              <p className="text-muted-foreground mt-2">
                Discover and license data assets from the Atlas Data Co-op
              </p>
            </div>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              List Asset
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets, locations, or property types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">Filter</Button>
            <Button variant="outline">Sort</Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((document) => (
              <div key={document.id} className="space-y-4">
                <DocumentList 
                  documents={[document]} 
                  badgeVariant={getDocumentBadgeVariant} 
                  badgeText={getDocumentBadgeText} 
                />
              </div>
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No assets found matching your search criteria.</p>
            </div>
          )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}