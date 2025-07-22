"use client"

import type { Document } from "../types"
import DocumentCard from "./DocumentCard"

interface Props {
  documents: Document[]
  badgeVariant: (doc: Document) => string
  badgeText: (doc: Document) => string
}

export default function DocumentList({ documents, badgeVariant, badgeText }: Props) {
  return (
    <div className="grid gap-4">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} badgeVariant={badgeVariant} badgeText={badgeText} />
      ))}
    </div>
  )
}
