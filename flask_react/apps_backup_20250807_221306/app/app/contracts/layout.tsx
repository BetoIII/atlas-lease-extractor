"use client"

import { ReactNode } from "react"
import { SidebarProvider } from "@/contexts/SidebarContext"
import { DashboardLayout } from "@/components/DashboardLayout"

interface ContractsLayoutProps {
  children: ReactNode
}

export default function Layout({ children }: ContractsLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </SidebarProvider>
  )
}