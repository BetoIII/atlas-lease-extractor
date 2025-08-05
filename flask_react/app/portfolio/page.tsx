"use client"

import { useState } from "react"
import { TrendingUp, Search, FileText, UsersIcon, Briefcase, Settings, Plus } from "lucide-react"
import { Button } from "@/components/ui"
import { Navbar } from "@/components/navbar"
import DashboardSidebar from "@/app/dashboard/components/DashboardSidebar"
import PortfolioTab from "@/app/dashboard/components/PortfolioTab"
import { portfolios, properties } from "@/app/dashboard/sample-data"

export default function PortfolioPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp, href: "/dashboard" },
    { id: "marketplace", label: "Marketplace", icon: Search, href: "/marketplace" },
    { id: "documents", label: "My Documents", icon: FileText, href: "/documents" },
    { id: "contracts", label: "Contracts", icon: UsersIcon, href: "/contracts" },
    { id: "portfolio", label: "Portfolio", icon: Briefcase, href: "/portfolio" },
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Portfolio</h1>
              <p className="text-muted-foreground mt-2">
                View and manage all properties identified in your documents, shared, or licensed assets
              </p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Portfolio
            </Button>
          </div>
          <PortfolioTab portfolios={portfolios} />
          </div>
          </div>
        </main>
      </div>
    </div>
  )
}