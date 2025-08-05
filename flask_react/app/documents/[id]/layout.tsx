"use client"

import { ReactNode } from "react"
import { SidebarProvider } from "@/contexts/SidebarContext"
import { DashboardLayout } from "@/components/DashboardLayout"

interface DocumentDetailLayoutProps {
  children: ReactNode
}

export default function Layout({ children }: DocumentDetailLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </SidebarProvider>
  )
}