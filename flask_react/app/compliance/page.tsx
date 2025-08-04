"use client"

import { Navbar } from "@/components/navbar"
import ComplianceTab from "@/app/dashboard/components/ComplianceTab"
import { auditTrail } from "@/app/dashboard/sample-data"

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
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
    </div>
  )
}