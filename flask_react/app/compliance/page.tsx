"use client"

import { useState } from "react"
import { TrendingUp, Search, FileText, UsersIcon, Shield, Settings } from "lucide-react"
import { Navbar } from "@/components/navbar"
import DashboardSidebar from "@/app/dashboard/components/DashboardSidebar"
import ComplianceTab from "@/app/dashboard/components/ComplianceTab"
import { auditTrail } from "@/app/dashboard/sample-data"

export default function CompliancePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
          <div>
            <h1 className="text-3xl font-bold">Compliance</h1>
            <p className="text-muted-foreground mt-2">
              Monitor compliance status and audit trails for your data assets
            </p>
          </div>
          <ComplianceTab auditTrail={auditTrail} />
          </div>
          </div>
        </main>
      </div>
    </div>
  )
}