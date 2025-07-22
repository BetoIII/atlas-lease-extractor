"use client"

import type { Document } from "../types"
import { Card, CardContent, Badge, Button, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui"
import { MoreHorizontal } from "lucide-react"

interface Props {
  document: Document
  badgeVariant: (doc: Document) => string
  badgeText: (doc: Document) => string
}

export default function DocumentCard({ document, badgeVariant, badgeText }: Props) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{document.title}</h3>
                <p className="text-sm text-muted-foreground">{document.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={badgeVariant(document)} className="text-xs">
                  {badgeText(document)}
                </Badge>
                {document.expirationDate !== 'N/A' && (
                  <Badge variant="outline" className="text-xs">Expires: {document.expirationDate}</Badge>
                )}
                {document.relationship === 'firm-licensed' && document.firmAccess && (
                  <Badge variant="secondary" className="text-xs">Firm Access</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Owner: {document.owner}</span>
              {document.licenseAmount && <span>License Cost: {document.licenseAmount}</span>}
              {document.revenue > 0 && <span className="text-green-600">Revenue: ${document.revenue} USDC</span>}
            </div>
            {document.sharedWith.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Shared with</h4>
                <div className="flex flex-wrap gap-2">
                  {document.sharedWith.map((p, i) => (
                    <div key={i} className="flex items-center space-x-1">
                      <Badge variant="outline" className="text-xs">{p.name}</Badge>
                      <span className="text-xs text-muted-foreground">({p.type}) • Expires: {p.expires}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {document.licensedTo.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Licensed to</h4>
                <div className="flex flex-wrap gap-2">
                  {document.licensedTo.map((p, i) => (
                    <div key={i} className="flex items-center space-x-1">
                      <Badge variant="default" className="text-xs">{p.name}</Badge>
                      <span className="text-xs text-muted-foreground">({p.type}) • {p.amount} • Expires: {p.expires}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {document.relationship.startsWith('firm') || document.relationship === 'owned' ? (
                  <>
                    <DropdownMenuItem>Edit License Terms</DropdownMenuItem>
                    <DropdownMenuItem>View Analytics</DropdownMenuItem>
                    <DropdownMenuItem>Manage Access</DropdownMenuItem>
                    <DropdownMenuItem>Pause Listing</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">Revoke Document</DropdownMenuItem>
                  </>
                ) : null}
                {document.relationship.includes('licensed') && (
                  <>
                    <DropdownMenuItem>View License Terms</DropdownMenuItem>
                    <DropdownMenuItem>Download Document</DropdownMenuItem>
                    <DropdownMenuItem>Renew License</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
