"use client"

import { useEffect } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui"
import DashboardStats from "./components/DashboardStats"
import MarketplaceTransactions from "./components/MarketplaceTransactions"
import DocumentActivity from "./components/DocumentActivity"
import { marketplaceTransactions } from "./sample-data"
import { useUserDocuments } from "@/hooks/useUserDocuments"
import { documentUpdates as sampleDocumentUpdates } from "./sample-data"

export default function AtlasDAODashboard() {
  // Load user documents
  const { documentUpdates: realDocumentUpdates, isLoading, testPendingRegistration } = useUserDocuments()
  
  // Determine if user has documents (not just falling back to sample data)
  const hasUserDocuments = realDocumentUpdates.length > 0

  // Debug: Add global test function for console access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugPendingRegistration = testPendingRegistration;
      (window as any).debugPendingDocument = () => {
        console.log('=== MANUAL DEBUG ===');
        const pending = localStorage.getItem('atlas_pending_document');
        console.log('Has pending:', !!pending);
        if (pending) {
          console.log('Pending data:', JSON.parse(pending));
        }
        console.log('==================');
      };
    }
  }, [testPendingRegistration]);


  return (
    <div className="p-4 lg:p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back to Atlas Data Co-op</p>
          </div>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
        <div className="grid gap-8 md:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <DocumentActivity 
              updates={realDocumentUpdates} 
              sampleUpdates={sampleDocumentUpdates}
              isLoading={isLoading}
              hasUserDocuments={hasUserDocuments}
            />
            <MarketplaceTransactions transactions={marketplaceTransactions} />
          </div>
          <div>
            <DashboardStats />
          </div>
        </div>
      </div>
    </div>
  )
}
