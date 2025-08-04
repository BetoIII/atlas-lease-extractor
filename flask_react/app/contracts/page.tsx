"use client"

import { Navbar } from "@/components/navbar"
import ContractsTab from "@/app/dashboard/components/ContractsTab"

export default function ContractsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Contracts</h1>
            <p className="text-muted-foreground mt-2">
              Manage your data licensing contracts and agreements
            </p>
          </div>
          <ContractsTab />
        </div>
      </div>
    </div>
  )
}