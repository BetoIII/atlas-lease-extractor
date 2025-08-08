"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui"
import PortfolioTab from "@/components/home/PortfolioTab"
import { portfolios } from "../../lib/sample-data"

export default function CompliancePage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Compliance</h1>
            <p className="text-muted-foreground mt-2">
              Manage compliance requirements and regulatory oversight
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Requirement
          </Button>
        </div>
        <PortfolioTab portfolios={portfolios} />
      </div>
    </div>
  )
}