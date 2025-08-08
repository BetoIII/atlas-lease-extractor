"use client"

import { ReactNode } from "react"
import { SidebarProvider } from "@/contexts/SidebarContext"
import { DashboardLayout } from "@/components/DashboardLayout"

interface ComplianceLayoutProps {
  children: ReactNode
}

export default function Layout({ children }: ComplianceLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </SidebarProvider>
  )
}