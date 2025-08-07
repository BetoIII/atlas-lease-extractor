"use client"

import { ReactNode } from "react"
import { SidebarProvider } from "../../contexts/SidebarContext"
import { DashboardLayout } from "../../components/DashboardLayout"

interface DashboardLayoutProps {
  children: ReactNode
}

export default function Layout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </SidebarProvider>
  )
}