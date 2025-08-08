"use client"

import { ReactNode } from "react"
import { Upload, FileX, Search, Share, Building2 } from "lucide-react"
import { Button } from "@/components/ui/form/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  variant: 'no-documents' | 'no-search-results' | 'no-owned' | 'no-external' | 'no-firm' | 'upload-first'
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: ReactNode
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const EMPTY_STATE_CONFIG = {
  'no-documents': {
    icon: FileX,
    title: 'No documents found',
    description: 'You don\'t have any documents yet. Upload your first document to get started.',
    iconColor: 'text-muted-foreground'
  },
  'no-search-results': {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search terms or filters to find what you\'re looking for.',
    iconColor: 'text-muted-foreground'
  },
  'no-owned': {
    icon: FileX,
    title: 'No owned documents',
    description: 'You haven\'t uploaded any documents yet. Upload your first lease or property document to begin analysis.',
    iconColor: 'text-muted-foreground'
  },
  'no-external': {
    icon: Share,
    title: 'No external documents',
    description: 'You don\'t have access to any shared or licensed documents yet. Documents shared with you will appear here.',
    iconColor: 'text-blue-500'
  },
  'no-firm': {
    icon: Building2,
    title: 'No firm documents',
    description: 'Your firm hasn\'t uploaded any documents yet. Firm documents and licenses will appear here.',
    iconColor: 'text-purple-500'
  },
  'upload-first': {
    icon: Upload,
    title: 'Get started with document analysis',
    description: 'Upload your first lease agreement or property document to begin extracting insights and identifying risks.',
    iconColor: 'text-primary'
  }
}

export function EmptyState({
  variant,
  title,
  description,
  action,
  secondaryAction,
  className
}: EmptyStateProps) {
  const config = EMPTY_STATE_CONFIG[variant]
  const IconComponent = config.icon

  const finalTitle = title || config.title
  const finalDescription = description || config.description

  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-12 px-6", className)}>
      <div className={cn("rounded-full p-4 mb-4 bg-muted/50", config.iconColor)}>
        <IconComponent className="h-12 w-12" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">{finalTitle}</h3>
      <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
        {finalDescription}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <Button onClick={action.onClick} size="lg" className="gap-2">
            {action.icon}
            {action.label}
          </Button>
        )}
        
        {secondaryAction && (
          <Button 
            variant="outline" 
            onClick={secondaryAction.onClick}
            size="lg"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>

      {/* Helpful tips based on variant */}
      {variant === 'upload-first' && (
        <div className="mt-8 p-4 bg-muted/30 rounded-lg max-w-md">
          <p className="text-sm text-muted-foreground">
            <strong>Supported formats:</strong> PDF, DOC, DOCX, JPG, PNG
            <br />
            <strong>Max file size:</strong> 50MB per document
          </p>
        </div>
      )}

      {variant === 'no-search-results' && (
        <div className="mt-6 text-sm text-muted-foreground">
          <p>Try:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Using different keywords</li>
            <li>Removing some filters</li>
            <li>Checking for typos</li>
            <li>Using broader search terms</li>
          </ul>
        </div>
      )}

      {variant === 'no-external' && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md">
          <p className="text-sm text-blue-700">
            <strong>Need access to documents?</strong>
            <br />
            Contact your colleagues or firm administrators to request access to shared documents and licenses.
          </p>
        </div>
      )}

      {variant === 'no-firm' && (
        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg max-w-md">
          <p className="text-sm text-purple-700">
            <strong>Firm Administrator?</strong>
            <br />
            Upload documents to your firm's library to make them available to all team members.
          </p>
        </div>
      )}
    </div>
  )
}