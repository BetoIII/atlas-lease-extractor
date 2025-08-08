"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { DocumentUpdate } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from "@atlas/ui"
import { ChevronRight, Loader2, FileText, MoreHorizontal } from "lucide-react"

interface DocumentActivityProps {
  updates: DocumentUpdate[]
  sampleUpdates: DocumentUpdate[]
  isLoading: boolean
  hasUserDocuments: boolean
}

const PAGE_SIZE = 5

export default function DocumentActivity({ updates, sampleUpdates, isLoading, hasUserDocuments }: DocumentActivityProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)

  // Determine what to show
  const documentsToShow = hasUserDocuments ? updates : sampleUpdates
  const showSampleDataNote = !hasUserDocuments && !isLoading

  // Reset pagination when source data changes
  useEffect(() => {
    setCurrentPage(1)
  }, [updates, sampleUpdates, hasUserDocuments])

  // Sort documents by most recent activity first
  const sortedDocuments = [...documentsToShow].sort((a, b) => {
    // Parse timestamps to compare properly
    const timestampA = new Date(a.lastActivity.timestamp).getTime()
    const timestampB = new Date(b.lastActivity.timestamp).getTime()
    return timestampB - timestampA // Most recent first
  })

  // Calculate visible documents for current page
  const visibleDocs = sortedDocuments.slice(0, PAGE_SIZE * currentPage)
  const hasMore = sortedDocuments.length > visibleDocs.length

  const loadMore = () => {
    setCurrentPage(prev => prev + 1)
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Activity</CardTitle>
        <CardDescription>
          {showSampleDataNote 
            ? "Sample data - upload documents to see your activity"
            : "Recent actions across your document lifecycle"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          // Loading state
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-3">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading your document activity...</p>
            </div>
          </div>
        ) : documentsToShow.length === 0 ? (
          // Empty state
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-3">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">No Document Activity</p>
                <p className="text-xs text-muted-foreground">Upload your first document to get started</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Document list */}
            {visibleDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${doc.lastActivity.color}`} />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{doc.title}</p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{doc.lastActivity.action.replace(/_/g, ' ')}</span>
                      <span>•</span>
                      <span>{doc.lastActivity.timestamp}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {doc.hasMoreActivities && (
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => router.push(`/documents/${doc.id}`)}>
                      View All ({doc.totalActivities})
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Load more button */}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={loadMore}
                >
                  <MoreHorizontal className="mr-1 h-3 w-3" />
                  Load More ({sortedDocuments.length - visibleDocs.length} remaining)
                </Button>
              </div>
            )}
          </>
        )}
        
        {showSampleDataNote && documentsToShow.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              This is sample data to demonstrate the interface. Upload documents to see your real activity.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
