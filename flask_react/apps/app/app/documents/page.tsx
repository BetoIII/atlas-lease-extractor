"use client"

import { useState, useRef, useMemo } from "react"
import { Upload, Plus } from "lucide-react"
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/overlay/dialog"
import DocumentList from "@/app/dashboard/components/DocumentList"
import { DocumentUpload } from "@/components/DocumentUpload"
import { DocumentSearch, type SearchFilters } from "@/components/DocumentSearch"
import { BulkActions } from "@/components/BulkActions"
import { DocumentSort, type SortOption } from "@/components/DocumentSort"
import { EmptyState } from "@/components/EmptyState"
import { DocumentListSkeleton } from "@/components/LoadingState"
import { allDocuments } from "@/app/dashboard/sample-data"
import { useUserDocuments } from "@/hooks/useUserDocuments"
import { useKeyboardShortcuts, createDocumentShortcuts, useShortcutsHelp } from "@/hooks/useKeyboardShortcuts"
import { useToast } from "@/components/ui/hooks/use-toast"

export default function DocumentsPage() {
  const [documentView, setDocumentView] = useState("owned")
  const [ownedFilters, setOwnedFilters] = useState({ private: true, shared: true, licensed: true })
  const [externalFilters, setExternalFilters] = useState({ personalLicensed: true, shared: true })
  const [firmFilters, setFirmFilters] = useState({ ownedByFirm: true, licensedToFirm: true })
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({ query: "", assetType: "all", dateRange: "all", status: "all", tags: [] })
  const [sortOption, setSortOption] = useState<SortOption>({ field: 'date', direction: 'desc' })
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { dashboardDocuments } = useUserDocuments()

  // Filter and sort documents based on search, filters, and sort options
  const filteredAndSortedDocuments = useMemo(() => {
    // Combine user documents with sample documents
    const combinedDocuments = [...dashboardDocuments, ...allDocuments]
    let filtered = combinedDocuments
    
    // Apply search filters
    if (searchFilters.query) {
      const query = searchFilters.query.toLowerCase()
      filtered = filtered.filter(doc => 
        doc.name?.toLowerCase().includes(query) ||
        doc.title?.toLowerCase().includes(query) ||
        doc.property?.toLowerCase().includes(query) ||
        doc.assetType?.toLowerCase().includes(query)
      )
    }
    
    if (searchFilters.assetType !== "all") {
      filtered = filtered.filter(doc => doc.assetType === searchFilters.assetType)
    }
    
    if (searchFilters.status !== "all") {
      filtered = filtered.filter(doc => doc.status === searchFilters.status)
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const { field, direction } = sortOption
      let aValue: any = a[field as keyof typeof a]
      let bValue: any = b[field as keyof typeof b]
      
      // Handle different field types
      if (field === 'date' || field === 'lastModified') {
        aValue = new Date(aValue || 0).getTime()
        bValue = new Date(bValue || 0).getTime()
      } else if (field === 'size') {
        aValue = aValue || 0
        bValue = bValue || 0
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue?.toLowerCase() || ''
      }
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1
      if (aValue > bValue) return direction === 'asc' ? 1 : -1
      return 0
    })
    
    return filtered
  }, [dashboardDocuments, searchFilters, sortOption])
  
  const ownedDocuments = filteredAndSortedDocuments.filter((d) => d.relationship === "owned")
  const externalDocuments = filteredAndSortedDocuments.filter((d) => d.relationship === "personal-licensed" || d.relationship === "shared")
  const firmDocuments = filteredAndSortedDocuments.filter((d) => d.relationship === "firm-owned" || d.relationship === "firm-licensed")

  const filteredOwnedDocuments = ownedDocuments.filter((doc) => {
    if (!ownedFilters.private && !doc.isShared && !doc.isLicensed) return false
    if (!ownedFilters.shared && doc.isShared && !doc.isLicensed) return false
    if (!ownedFilters.licensed && doc.isLicensed) return false
    return true
  })

  const filteredExternalDocuments = externalDocuments.filter((doc) => {
    if (doc.relationship === "personal-licensed" && !externalFilters.personalLicensed) return false
    if (doc.relationship === "shared" && !externalFilters.shared) return false
    return true
  })

  const filteredFirmDocuments = firmDocuments.filter((doc) => {
    if (doc.relationship === "firm-owned" && !firmFilters.ownedByFirm) return false
    if (doc.relationship === "firm-licensed" && !firmFilters.licensedToFirm) return false
    return true
  })
  
  // Get current tab documents
  const getCurrentTabDocuments = () => {
    switch (documentView) {
      case "owned": return filteredOwnedDocuments
      case "external": return filteredExternalDocuments
      case "firm": return filteredFirmDocuments
      default: return []
    }
  }
  
  const currentTabDocuments = getCurrentTabDocuments()

  const getDocumentBadgeVariant = (doc: any) => {
    if (doc.relationship === "owned") {
      if (doc.isLicensed) return "default"
      if (doc.isShared) return "secondary"
      return "outline"
    }
    if (doc.relationship === "personal-licensed" || doc.relationship === "firm-licensed") return "default"
    if (doc.relationship === "shared") return "secondary"
    if (doc.relationship === "firm-owned") return "default"
    return "outline"
  }

  const getDocumentBadgeText = (doc: any) => {
    if (doc.relationship === "owned") {
      if (doc.isLicensed && doc.isShared) return "Owned • Licensed"
      if (doc.isLicensed) return "Owned • Licensed"
      if (doc.isShared) return "Owned • Shared"
      return "Owned • Private"
    }
    if (doc.relationship === "personal-licensed") return "Personal License"
    if (doc.relationship === "firm-licensed") return "Licensed to Firm"
    if (doc.relationship === "shared") return "Shared with Me"
    if (doc.relationship === "firm-owned") {
      if (doc.isLicensed && doc.isShared) return "Firm Owned • Licensed"
      if (doc.isLicensed) return "Firm Owned • Licensed"
      if (doc.isShared) return "Firm Owned • Shared"
      return "Firm Owned"
    }
    return doc.relationship
  }
  
  // Document action handlers
  const handleUploadComplete = (files: File[]) => {
    toast({
      title: "Upload Complete",
      description: `Successfully uploaded ${files.length} document${files.length === 1 ? '' : 's'}.`
    })
    setIsUploadDialogOpen(false)
  }
  
  const handleSelectAll = () => {
    setSelectedDocuments(currentTabDocuments.map(doc => doc.id.toString()))
  }
  
  const handleSelectNone = () => {
    setSelectedDocuments([])
  }
  
  const handleDelete = (ids: string[]) => {
    // Simulate deletion
    toast({
      title: "Documents Deleted",
      description: `Successfully deleted ${ids.length} document${ids.length === 1 ? '' : 's'}.`
    })
    setSelectedDocuments([])
  }
  
  const handleExport = (ids: string[], format: string) => {
    toast({
      title: "Export Started",
      description: `Exporting ${ids.length} documents to ${format.toUpperCase()} format.`
    })
  }
  
  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }
  
  const focusSearch = () => {
    searchInputRef.current?.focus()
  }
  
  // Keyboard shortcuts
  const shortcuts = createDocumentShortcuts({
    onUpload: () => setIsUploadDialogOpen(true),
    onSearch: focusSearch,
    onSelectAll: handleSelectAll,
    onDeselectAll: handleSelectNone,
    onDelete: selectedDocuments.length > 0 ? () => handleDelete(selectedDocuments) : undefined,
    onExport: selectedDocuments.length > 0 ? () => handleExport(selectedDocuments, 'excel') : undefined,
    onRefresh: handleRefresh
  })
  
  useKeyboardShortcuts({ shortcuts })
  useShortcutsHelp(shortcuts)

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Documents</h1>
            <p className="text-muted-foreground mt-2">
              Manage documents you own and have access to
            </p>
          </div>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload New Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Documents</DialogTitle>
              </DialogHeader>
              <DocumentUpload onUploadComplete={handleUploadComplete} />
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Search and Controls */}
        <div className="space-y-4">
          <DocumentSearch 
            ref={searchInputRef}
            onSearch={(query, filters) => setSearchFilters(filters)}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DocumentSort 
                currentSort={sortOption}
                onSortChange={setSortOption}
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              {currentTabDocuments.length} documents
            </div>
          </div>
        </div>
        
        {/* Bulk Actions */}
        {currentTabDocuments.length > 0 && (
          <BulkActions
            selectedItems={selectedDocuments}
            totalItems={currentTabDocuments.length}
            onSelectAll={handleSelectAll}
            onSelectNone={handleSelectNone}
            onDelete={handleDelete}
            onExport={handleExport}
          />
        )}

        {/* Document Tabs */}
        <Tabs value={documentView} onValueChange={setDocumentView} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="owned">My Owned Documents ({ownedDocuments.length})</TabsTrigger>
            <TabsTrigger value="external">External Access ({externalDocuments.length})</TabsTrigger>
            <TabsTrigger value="firm">Firm Documents ({firmDocuments.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="owned" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={ownedFilters.private ? "default" : "outline"} 
                size="sm" 
                onClick={() => setOwnedFilters(prev => ({ ...prev, private: !prev.private }))}
              >
                Private
              </Button>
              <Button 
                variant={ownedFilters.shared ? "default" : "outline"} 
                size="sm" 
                onClick={() => setOwnedFilters(prev => ({ ...prev, shared: !prev.shared }))}
              >
                Shared with Others
              </Button>
              <Button 
                variant={ownedFilters.licensed ? "default" : "outline"} 
                size="sm" 
                onClick={() => setOwnedFilters(prev => ({ ...prev, licensed: !prev.licensed }))}
              >
                Licensed to Others
              </Button>
            </div>
            
            {isLoading ? (
              <DocumentListSkeleton />
            ) : filteredOwnedDocuments.length === 0 ? (
              <EmptyState 
                variant={ownedDocuments.length === 0 ? "no-owned" : "no-search-results"}
                action={{
                  label: "Upload Document",
                  onClick: () => setIsUploadDialogOpen(true),
                  icon: <Plus className="h-4 w-4" />
                }}
              />
            ) : (
              <DocumentList 
                documents={filteredOwnedDocuments} 
                badgeVariant={getDocumentBadgeVariant} 
                badgeText={getDocumentBadgeText}
                selectedDocuments={selectedDocuments}
                onSelectionChange={setSelectedDocuments}
              />
            )}
          </TabsContent>
          
          <TabsContent value="external" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={externalFilters.personalLicensed ? "default" : "outline"} 
                size="sm" 
                onClick={() => setExternalFilters(prev => ({ ...prev, personalLicensed: !prev.personalLicensed }))}
              >
                Personal License
              </Button>
              <Button 
                variant={externalFilters.shared ? "default" : "outline"} 
                size="sm" 
                onClick={() => setExternalFilters(prev => ({ ...prev, shared: !prev.shared }))}
              >
                Shared with Me
              </Button>
            </div>
            
            {isLoading ? (
              <DocumentListSkeleton />
            ) : filteredExternalDocuments.length === 0 ? (
              <EmptyState 
                variant={externalDocuments.length === 0 ? "no-external" : "no-search-results"}
              />
            ) : (
              <DocumentList 
                documents={filteredExternalDocuments} 
                badgeVariant={getDocumentBadgeVariant} 
                badgeText={getDocumentBadgeText}
                selectedDocuments={selectedDocuments}
                onSelectionChange={setSelectedDocuments}
              />
            )}
          </TabsContent>
          
          <TabsContent value="firm" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={firmFilters.ownedByFirm ? "default" : "outline"} 
                size="sm" 
                onClick={() => setFirmFilters(prev => ({ ...prev, ownedByFirm: !prev.ownedByFirm }))}
              >
                Owned by Firm
              </Button>
              <Button 
                variant={firmFilters.licensedToFirm ? "default" : "outline"} 
                size="sm" 
                onClick={() => setFirmFilters(prev => ({ ...prev, licensedToFirm: !prev.licensedToFirm }))}
              >
                Licensed to Firm
              </Button>
            </div>
            
            {isLoading ? (
              <DocumentListSkeleton />
            ) : filteredFirmDocuments.length === 0 ? (
              <EmptyState 
                variant={firmDocuments.length === 0 ? "no-firm" : "no-search-results"}
              />
            ) : (
              <DocumentList 
                documents={filteredFirmDocuments} 
                badgeVariant={getDocumentBadgeVariant} 
                badgeText={getDocumentBadgeText}
                selectedDocuments={selectedDocuments}
                onSelectionChange={setSelectedDocuments}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}