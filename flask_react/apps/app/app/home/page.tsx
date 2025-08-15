"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Upload } from "lucide-react"
import { Button } from "@atlas/ui"
import DashboardStats from "../../components/home/DashboardStats"
import MarketplaceTransactions from "../../components/home/MarketplaceTransactions"
import DocumentActivity from "../../components/home/DocumentActivity"
import { marketplaceTransactions } from "../../lib/sample-data"
import { useUserDocuments } from "../../hooks/useUserDocuments"
import { documentUpdates as sampleDocumentUpdates } from "../../lib/sample-data"

export default function AppHome() {
  const router = useRouter()
  const { documentUpdates: realDocumentUpdates, isLoading, testPendingRegistration } = useUserDocuments()
  const hasUserDocuments = realDocumentUpdates.length > 0

  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      ;(window as any).debugPendingRegistration = testPendingRegistration
      ;(window as any).debugPendingDocument = () => {
        console.log('=== MANUAL DEBUG ===')
        const pending = localStorage.getItem('atlas_pending_document')
        console.log('Has pending:', !!pending)
        if (pending) {
          console.log('Pending data:', JSON.parse(pending))
        }
        console.log('==================')
      }
    }
  }, [testPendingRegistration])

  return (
    <div className="p-4 lg:p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">App Home</h1>
            <p className="text-muted-foreground">Welcome back to Atlas Data Co-op</p>
          </div>
          <Button onClick={() => router.push('/try-it-now')}>
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


