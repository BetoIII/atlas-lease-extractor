"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { TrendingUp, Search, FileText, UsersIcon, Shield, Settings, Loader2 } from "lucide-react"
import { Navbar } from "@/components/navbar"
import DashboardSidebar from "@/app/dashboard/components/DashboardSidebar"
import DocumentDetailView from "@/app/dashboard/components/DocumentDetailView"
import { useUserDocuments } from "@/hooks/useUserDocuments"
import { allDocuments, documentUpdates as sampleDocumentUpdates } from "@/app/dashboard/sample-data"
import type { DocumentUpdate } from "@/app/dashboard/types"
import { API_BASE_URL } from "@/lib/config"
import { authClient } from "@/lib/auth-client"

export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [document, setDocument] = useState<DocumentUpdate | null>(null)
  const [documentActivities, setDocumentActivities] = useState<any[]>([])

  // Convert backend activity format to expected frontend format
  const convertBackendActivities = (backendActivities: any[]) => {
    return backendActivities.map((activity: any) => ({
      id: activity.id,
      action: activity.action,
      activity_type: activity.type || activity.activity_type, // Handle both field names
      status: activity.status,
      actor: activity.actor,
      actor_name: activity.actor_name,
      tx_hash: activity.tx_hash,
      block_number: activity.block_number,
      details: activity.details,
      revenue_impact: activity.revenue_impact || 0,
      timestamp: typeof activity.timestamp === 'number' 
        ? new Date(activity.timestamp * 1000).toISOString() 
        : activity.timestamp,
      extra_data: activity.extra_data || activity.metadata
    }))
  }
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const { dashboardDocuments, userDocuments, documentUpdates: realDocumentUpdates } = useUserDocuments()
  
  // Use real documents if available, otherwise fall back to sample data
  const documentUpdates = realDocumentUpdates.length > 0 ? realDocumentUpdates : sampleDocumentUpdates

  // Function to directly fetch a document by ID from Flask API
  const fetchDocumentById = useCallback(async (documentId: string) => {
    setIsLoading(true)
    try {
      console.log('Attempting direct fetch for document:', documentId)
      const session = await authClient.getSession()
      if (!session?.data?.user?.id) {
        console.log('No user session found')
        return null
      }

      // First try to get all user documents and find our document
      const response = await fetch(`${API_BASE_URL}/user-documents/${session.data.user.id}`)
      if (!response.ok) {
        console.error('Failed to fetch user documents:', response.status, response.statusText)
        return null
      }

      const docs = await response.json()
      console.log('Direct API fetch response:', docs)
      
      const documentsArray = Array.isArray(docs) ? docs : docs.documents || []
      const foundDoc = documentsArray.find((doc: any) => doc.id === documentId)
      
      if (foundDoc) {
        console.log('Found document via direct API call:', foundDoc)
        console.log('Direct API call activities:', foundDoc.activities)
        
        // Store activities separately for passing to DocumentDetailView
        if (foundDoc.activities) {
          setDocumentActivities(convertBackendActivities(foundDoc.activities))
        }
        
        return {
          id: foundDoc.id,
          title: foundDoc.title || 'Untitled Document',
          lastActivity: {
            action: foundDoc.activities?.length > 0 ? foundDoc.activities[foundDoc.activities.length - 1].action : 'DOCUMENT_CREATED',
            timestamp: foundDoc.activities?.length > 0 ? new Date(foundDoc.activities[foundDoc.activities.length - 1].timestamp * 1000).toLocaleString() : 'just now',
            color: 'bg-blue-500'
          },
          hasMoreEvents: (foundDoc.activities?.length || 0) > 1,
          totalEvents: foundDoc.activities?.length || 1
        }
      }
      
      return null
    } catch (error) {
      console.error('Error in direct document fetch:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp, href: "/dashboard" },
    { id: "marketplace", label: "Marketplace", icon: Search, href: "/marketplace" },
    { id: "documents", label: "My Documents", icon: FileText, href: "/documents" },
    { id: "contracts", label: "Contracts", icon: UsersIcon, href: "/contracts" },
    { id: "compliance", label: "Compliance", icon: Shield, href: "/compliance" },
    { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
  ]

  useEffect(() => {
    const documentId = params.id as string
    if (!documentId) return

    // Reset states for new document lookup
    setDocument(null)
    setIsInitialLoad(true)

    console.log('Looking for document ID:', documentId)
    console.log('Available dashboardDocuments:', dashboardDocuments.map(d => ({ id: d.id, title: d.title })))
    console.log('Available allDocuments:', allDocuments.map(d => ({ id: d.id, title: d.title })))
    console.log('Available userDocuments:', userDocuments.map(d => ({ id: d.id, title: d.title })))
    console.log('Available realDocumentUpdates:', realDocumentUpdates.map(d => ({ id: d.id, title: d.title })))
    console.log('Available documentUpdates (with fallback):', documentUpdates.map(d => ({ id: d.id, title: d.title })))
    console.log('Using real documents?', realDocumentUpdates.length > 0)

    // Try to find in documentUpdates first (these are what show in DocumentActivity)
    const foundDocument = documentUpdates.find((doc: any) => doc.id === documentId)
    
    if (foundDocument) {
      console.log('Found in documentUpdates:', foundDocument)
      setDocument(foundDocument as DocumentUpdate)
      
      // Also try to find the full document data with activities in userDocuments
      const fullUserDoc = userDocuments.find((doc: any) => doc.id === documentId)
      if (fullUserDoc && fullUserDoc.activities) {
        console.log('Found activities in userDocuments:', fullUserDoc.activities)
        setDocumentActivities(convertBackendActivities(fullUserDoc.activities))
      }
      
      setIsInitialLoad(false)
      return
    }

    // Try to find in userDocuments 
    const userDoc = userDocuments.find((doc: any) => doc.id === documentId)
    if (userDoc) {
      console.log('Found in userDocuments:', userDoc)
      console.log('UserDoc activities:', userDoc.activities)
      
      // Convert to DocumentUpdate format
      setDocument({
        id: userDoc.id,
        title: userDoc.title || 'Untitled Document',
        lastActivity: {
          action: 'DOCUMENT_CREATED',
          timestamp: userDoc.created_at || new Date().toISOString(),
          color: 'bg-blue-500'
        },
        hasMoreEvents: true,
        totalEvents: userDoc.activities?.length || 1
      })
      
      // Store activities if available
      if (userDoc.activities) {
        setDocumentActivities(convertBackendActivities(userDoc.activities))
      }
      
      setIsInitialLoad(false)
      return
    }

    // Finally try sample data
    const sampleDoc = allDocuments.find((doc: any) => doc.id.toString() === documentId)
    if (sampleDoc) {
      console.log('Found in allDocuments:', sampleDoc)
      setDocument({
        id: sampleDoc.id.toString(),
        title: sampleDoc.title || 'Untitled Document',
        lastActivity: {
          action: 'DOCUMENT_CREATED',
          timestamp: new Date().toISOString(),
          color: 'bg-blue-500'
        },
        hasMoreEvents: true,
        totalEvents: 8
      })
      setIsInitialLoad(false)
      return
    }
    
    // Last resort: try direct API fetch for real documents (UUID format)
    if (documentId.includes('-')) {  // UUID format check
      console.log('Trying direct API fetch for UUID document:', documentId)
      setIsInitialLoad(false) // We're about to start fetching
      fetchDocumentById(documentId).then(fetchedDoc => {
        if (fetchedDoc) {
          console.log('Successfully fetched document via direct API:', fetchedDoc)
          setDocument(fetchedDoc)
        } else {
          console.log('Direct API fetch failed, redirecting to /documents')
          router.push('/documents')
        }
      })
      return
    }
    
    console.log('Document not found, redirecting to /documents')
    // Document not found, redirect to documents page
    router.push('/documents')
  }, [params.id, dashboardDocuments, userDocuments, realDocumentUpdates, documentUpdates, router])

  const handleBack = () => {
    router.push('/documents')
  }

  // Show loading state while fetching or initial load
  if (!document && (isLoading || isInitialLoad)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar 
          sidebarOpen={sidebarOpen} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        />
        <div className="flex">
          <DashboardSidebar 
            open={sidebarOpen} 
            items={navigationItems} 
            onClose={() => setSidebarOpen(false)}
          />
          <main className="flex-1 lg:ml-0">
            <div className="container mx-auto px-4 py-6">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Loading Document</h2>
                    <p className="text-muted-foreground">
                      Fetching document details...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Show error state if no document found and not loading
  if (!document && !isLoading && !isInitialLoad) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar 
          sidebarOpen={sidebarOpen} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        />
        <div className="flex">
          <DashboardSidebar 
            open={sidebarOpen} 
            items={navigationItems} 
            onClose={() => setSidebarOpen(false)}
          />
          <main className="flex-1 lg:ml-0">
            <div className="container mx-auto px-4 py-6">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">Document Not Found</h2>
                  <p className="text-muted-foreground">
                    The document you're looking for doesn't exist or you don't have access to it.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        sidebarOpen={sidebarOpen} 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
      />
      <div className="flex">
        <DashboardSidebar 
          open={sidebarOpen} 
          items={navigationItems} 
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 lg:ml-0">
          <div className="container mx-auto px-4 py-6">
            {document && (
              <DocumentDetailView 
                document={document} 
                onBack={handleBack}
                activities={documentActivities}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}