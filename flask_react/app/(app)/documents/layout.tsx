"use client"

import { ReactNode } from "react"
import { SidebarProvider } from "@/contexts/SidebarContext"
import { DashboardLayout } from "@/components/app/DashboardLayout"

interface DocumentsLayoutProps {
  children: ReactNode
}

export default function Layout({ children }: DocumentsLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </SidebarProvider>
  )
}