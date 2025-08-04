"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Search, FileText, UsersIcon, Shield, Settings, Upload } from "lucide-react"
import { Button } from "@/components/ui"
import { Navbar } from "@/components/navbar"
import DashboardSidebar from "./components/DashboardSidebar"
import DashboardStats from "./components/DashboardStats"
import MarketplaceTransactions from "./components/MarketplaceTransactions"
import DocumentActivity from "./components/DocumentActivity"
import { marketplaceTransactions } from "./sample-data"
import { useUserDocuments } from "@/hooks/useUserDocuments"
import { documentUpdates as sampleDocumentUpdates } from "./sample-data"

export default function AtlasDAODashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Load user documents
  const { documentUpdates: realDocumentUpdates, isLoading, testPendingRegistration } = useUserDocuments()
  
  // Use real documents if available, otherwise fall back to sample data
  const documentUpdates = realDocumentUpdates.length > 0 ? realDocumentUpdates : sampleDocumentUpdates

  // Debug: Add global test function for console access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugPendingRegistration = testPendingRegistration;
      (window as any).debugPendingDocument = () => {
        console.log('=== MANUAL DEBUG ===');
        const pending = localStorage.getItem('atlas_pending_document');
        console.log('Has pending:', !!pending);
        if (pending) {
          console.log('Pending data:', JSON.parse(pending));
        }
        console.log('==================');
      };
    }
  }, [testPendingRegistration]);

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp, href: "/dashboard" },
    { id: "marketplace", label: "Marketplace", icon: Search, href: "/marketplace" },
    { id: "documents", label: "My Documents", icon: FileText, href: "/documents" },
    { id: "contracts", label: "Contracts", icon: UsersIcon, href: "/contracts" },
    { id: "compliance", label: "Compliance", icon: Shield, href: "/compliance" },
    { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
  ]


  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        sidebarOpen={sidebarOpen} 
        toggleSidebar={() => {
          console.log('Toggle sidebar called, current state:', sidebarOpen)
          setSidebarOpen(!sidebarOpen)
        }} 
      />
      <DashboardSidebar 
        open={sidebarOpen} 
        items={navigationItems} 
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1">
        <div className="p-4 lg:p-6">
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
              <DocumentActivity updates={documentUpdates} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
