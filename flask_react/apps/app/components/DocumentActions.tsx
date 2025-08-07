"use client"

import { useState } from "react"
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Share, 
  Download, 
  Copy, 
  Archive, 
  Trash2, 
  Tag, 
  ExternalLink,
  FileText,
  Star,
  StarOff
} from "lucide-react"
import { Button } from "@/components/ui/form/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuLabel
} from "@/components/ui/overlay/dropdown-menu"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/feedback/alert-dialog"
import { useToast } from "@/components/ui/hooks/use-toast"

interface Document {
  id: string
  name: string
  relationship: string
  isShared?: boolean
  isLicensed?: boolean
  isFavorited?: boolean
}

interface DocumentActionsProps {
  document: Document
  onView?: (document: Document) => void
  onEdit?: (document: Document) => void
  onShare?: (document: Document) => void
  onDownload?: (document: Document) => void
  onDuplicate?: (document: Document) => void
  onArchive?: (document: Document) => void
  onDelete?: (document: Document) => void
  onAddTags?: (document: Document) => void
  onToggleFavorite?: (document: Document) => void
  showFavorite?: boolean
  disabled?: boolean
}

export function DocumentActions({
  document,
  onView,
  onEdit,
  onShare,
  onDownload,
  onDuplicate,
  onArchive,
  onDelete,
  onAddTags,
  onToggleFavorite,
  showFavorite = true,
  disabled = false
}: DocumentActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const { toast } = useToast()

  const isOwned = document.relationship === "owned" || document.relationship === "firm-owned"
  const canEdit = isOwned
  const canDelete = isOwned
  const canShare = isOwned
  const canArchive = isOwned

  const handleAction = (action: () => void, actionName: string) => {
    try {
      action()
      toast({
        title: "Success",
        description: `${actionName} completed successfully.`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${actionName.toLowerCase()}. Please try again.`,
        variant: "destructive"
      })
    }
  }

  const handleDelete = () => {
    onDelete?.(document)
    setShowDeleteDialog(false)
    toast({
      title: "Document Deleted",
      description: `${document.name} has been deleted.`
    })
  }

  const handleArchive = () => {
    onArchive?.(document)
    setShowArchiveDialog(false)
    toast({
      title: "Document Archived",
      description: `${document.name} has been archived.`
    })
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/documents/${document.id}`
    navigator.clipboard.writeText(url)
    toast({
      title: "Link Copied",
      description: "Document link copied to clipboard."
    })
  }

  const handleToggleFavorite = () => {
    onToggleFavorite?.(document)
    toast({
      title: document.isFavorited ? "Removed from Favorites" : "Added to Favorites",
      description: `${document.name} ${document.isFavorited ? 'removed from' : 'added to'} favorites.`
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            disabled={disabled}
            className="h-8 w-8 p-0"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          
          {/* View */}
          {onView && (
            <DropdownMenuItem onClick={() => handleAction(() => onView(document), "View")}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
          )}

          {/* Edit */}
          {onEdit && canEdit && (
            <DropdownMenuItem onClick={() => handleAction(() => onEdit(document), "Edit")}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Document
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Download */}
          {onDownload && (
            <DropdownMenuItem onClick={() => handleAction(() => onDownload(document), "Download")}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
          )}

          {/* Share */}
          {onShare && canShare && (
            <DropdownMenuItem onClick={() => handleAction(() => onShare(document), "Share")}>
              <Share className="mr-2 h-4 w-4" />
              Share Document
            </DropdownMenuItem>
          )}

          {/* Copy Link */}
          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </DropdownMenuItem>

          {/* Duplicate */}
          {onDuplicate && canEdit && (
            <DropdownMenuItem onClick={() => handleAction(() => onDuplicate(document), "Duplicate")}>
              <FileText className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Favorite */}
          {onToggleFavorite && showFavorite && (
            <DropdownMenuItem onClick={handleToggleFavorite}>
              {document.isFavorited ? (
                <>
                  <StarOff className="mr-2 h-4 w-4" />
                  Remove from Favorites
                </>
              ) : (
                <>
                  <Star className="mr-2 h-4 w-4" />
                  Add to Favorites
                </>
              )}
            </DropdownMenuItem>
          )}

          {/* Add Tags */}
          {onAddTags && canEdit && (
            <DropdownMenuItem onClick={() => handleAction(() => onAddTags(document), "Add Tags")}>
              <Tag className="mr-2 h-4 w-4" />
              Add Tags
            </DropdownMenuItem>
          )}

          {/* Open in New Tab */}
          <DropdownMenuItem onClick={() => window.open(`/documents/${document.id}`, '_blank')}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in New Tab
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Archive */}
          {onArchive && canArchive && (
            <DropdownMenuItem 
              onClick={() => setShowArchiveDialog(true)}
              className="text-orange-600 focus:text-orange-600"
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
          )}

          {/* Delete */}
          {onDelete && canDelete && (
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{document.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive "{document.name}"? You can restore it later from the archived documents section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}