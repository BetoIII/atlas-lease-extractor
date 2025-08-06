"use client"

import { Loader2, FileText, Upload, Download, Trash2, Archive, Share } from "lucide-react"
import { Skeleton } from "@/components/ui/feedback/skeleton"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  variant: 'documents' | 'upload' | 'download' | 'delete' | 'archive' | 'share' | 'search'
  message?: string
  count?: number
  className?: string
}

const LOADING_CONFIG = {
  documents: {
    icon: FileText,
    message: 'Loading documents...',
    description: 'Fetching your document library'
  },
  upload: {
    icon: Upload,
    message: 'Uploading documents...',
    description: 'Processing and analyzing your files'
  },
  download: {
    icon: Download,
    message: 'Preparing download...',
    description: 'Generating files for download'
  },
  delete: {
    icon: Trash2,
    message: 'Deleting documents...',
    description: 'Removing selected documents'
  },
  archive: {
    icon: Archive,
    message: 'Archiving documents...',
    description: 'Moving documents to archive'
  },
  share: {
    icon: Share,
    message: 'Sharing documents...',
    description: 'Setting up document sharing'
  },
  search: {
    icon: Loader2,
    message: 'Searching...',
    description: 'Looking through your documents'
  }
}

export function LoadingState({ variant, message, count, className }: LoadingStateProps) {
  const config = LOADING_CONFIG[variant]
  const IconComponent = config.icon

  const displayMessage = message || config.message
  const displayCount = count ? ` (${count} documents)` : ''

  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-12 px-6", className)}>
      {/* Spinner Icon */}
      <div className="relative mb-4">
        <div className="rounded-full p-4 bg-primary/10">
          <IconComponent className={cn(
            "h-8 w-8 text-primary",
            variant === 'search' || variant === 'upload' ? "animate-spin" : "animate-pulse"
          )} />
        </div>
        
        {variant === 'upload' && (
          <div className="absolute -top-1 -right-1">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Loading Message */}
      <h3 className="text-lg font-medium mb-2">
        {displayMessage}
        {displayCount}
      </h3>
      
      <p className="text-muted-foreground text-sm mb-8">
        {config.description}
      </p>

      {/* Progress indicator for specific variants */}
      {(variant === 'upload' || variant === 'download') && (
        <div className="w-full max-w-sm mb-6">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}
    </div>
  )
}

// Document list skeleton for loading states
export function DocumentListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Search skeleton for search loading states
export function SearchSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-20" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-14" />
      </div>
    </div>
  )
}

// Bulk actions skeleton
export function BulkActionsSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  )
}