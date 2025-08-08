"use client"

import type { Document } from "../../lib/types"
import DocumentCard from "./DocumentCard"

interface Props {
  documents: Document[]
  badgeVariant: (doc: Document) => "default" | "destructive" | "outline" | "secondary"
  badgeText: (doc: Document) => string
  selectedDocuments?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
}

export default function DocumentList({ documents, badgeVariant, badgeText, selectedDocuments = [], onSelectionChange }: Props) {
  return (
    <div className="grid gap-4">
      {documents.map((doc) => {
        const isSelected = selectedDocuments.includes(doc.id.toString())
        const handleSelectionToggle = () => {
          if (!onSelectionChange) return
          
          if (isSelected) {
            onSelectionChange(selectedDocuments.filter(id => id !== doc.id.toString()))
          } else {
            onSelectionChange([...selectedDocuments, doc.id.toString()])
          }
        }
        
        return (
          <DocumentCard 
            key={doc.id} 
            document={doc} 
            badgeVariant={badgeVariant} 
            badgeText={badgeText}
            isSelected={isSelected}
            onSelectionToggle={handleSelectionToggle}
          />
        )
      })}
    </div>
  )
}
