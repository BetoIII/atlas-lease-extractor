"use client"

import { useState } from "react"
import { 
  Trash2, 
  Share, 
  Download, 
  Archive, 
  Tag, 
  CheckSquare,
  Square,
  MinusSquare 
} from "lucide-react"
import { Button } from "@atlas/ui"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@atlas/ui"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@atlas/ui"
import { Badge } from "@atlas/ui"
import { cn } from "@/lib/utils"

interface BulkActionsProps {
  selectedItems: string[]
  totalItems: number
  onSelectAll: () => void
  onSelectNone: () => void
  onDelete?: (ids: string[]) => void
  onShare?: (ids: string[]) => void
  onExport?: (ids: string[], format: string) => void
  onArchive?: (ids: string[]) => void
  onAddTags?: (ids: string[], tags: string[]) => void
  className?: string
}

export function BulkActions({
  selectedItems,
  totalItems,
  onSelectAll,
  onSelectNone,
  onDelete,
  onShare,
  onExport,
  onArchive,
  onAddTags,
  className
}: BulkActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)

  const allSelected = selectedItems.length === totalItems && totalItems > 0
  const someSelected = selectedItems.length > 0 && selectedItems.length < totalItems
  const noneSelected = selectedItems.length === 0

  const handleSelectToggle = () => {
    if (allSelected || someSelected) {
      onSelectNone()
    } else {
      onSelectAll()
    }
  }

  const getCheckboxIcon = () => {
    if (allSelected) return CheckSquare
    if (someSelected) return MinusSquare
    return Square
  }

  const CheckboxIcon = getCheckboxIcon()

  const handleDelete = () => {
    onDelete?.(selectedItems)
    setShowDeleteDialog(false)
  }

  const handleArchive = () => {
    onArchive?.(selectedItems)
    setShowArchiveDialog(false)
  }

  const handleExport = (format: string) => {
    onExport?.(selectedItems, format)
  }

  if (totalItems === 0) return null

  return (
    <>
      <div className={cn("flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg", className)}>
        {/* Selection Status */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectToggle}
            className="p-0 h-auto"
          >
            <CheckboxIcon className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            {noneSelected ? (
              <span className="text-sm text-muted-foreground">
                Select documents to perform bulk actions
              </span>
            ) : (
              <>
                <Badge variant="secondary">
                  {selectedItems.length} selected
                </Badge>
                <span className="text-sm text-muted-foreground">
                  of {totalItems} documents
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        {!noneSelected && (
          <div className="flex items-center gap-2">
            {/* Share */}
            {onShare && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onShare(selectedItems)}
              >
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}

            {/* Export */}
            {onExport && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport("pdf")}>
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("excel")}>
                    Export to Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("costar")}>
                    Export to CoStar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport("json")}>
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Archive */}
            {onArchive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowArchiveDialog(true)}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
            )}

            {/* Add Tags */}
            {onAddTags && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddTags(selectedItems, [])}
              >
                <Tag className="h-4 w-4 mr-2" />
                Add Tags
              </Button>
            )}

            {/* Delete */}
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Documents</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedItems.length} document{selectedItems.length === 1 ? '' : 's'}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Documents</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive {selectedItems.length} document{selectedItems.length === 1 ? '' : 's'}? 
              Archived documents can be restored later.
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