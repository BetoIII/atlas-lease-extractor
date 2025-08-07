"use client"

import { ReactNode } from "react"
import { TrendingUp, Search, FileText, UsersIcon, Briefcase, Settings } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/Sidebar"
import { SidebarToggle } from "@/components/SidebarToggle"
import { useSidebar } from "@/contexts/SidebarContext"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isOpen, toggle } = useSidebar()

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
      <Navbar />
      
      <div className="flex h-full">
        {/* Sidebar with collapse animation */}
        <div
          className={`transition-all duration-300 ease-in-out h-full ${
            isOpen
              ? "w-64 opacity-100"
              : "w-0 min-w-0 overflow-hidden pointer-events-none opacity-0"
          }`}
        >
          {isOpen && <Sidebar items={navigationItems} />}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Sidebar Toggle Button */}
          <div className="bg-white px-4 py-2">
            <SidebarToggle isCollapsed={!isOpen} onToggle={toggle} />
          </div>

          {/* Main Content */}
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  )
}