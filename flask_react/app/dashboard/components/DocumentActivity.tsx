"use client"

import type { DocumentUpdate } from "../types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge } from "@/components/ui"
import { ChevronRight } from "lucide-react"

export default function DocumentActivity({ updates, onView }: { updates: DocumentUpdate[]; onView: (id: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Activity</CardTitle>
        <CardDescription>Recent actions across your document lifecycle</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {updates.map((doc) => (
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
                <Badge variant="outline" className="text-xs">
                  {doc.lastActivity.stage}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {doc.hasMoreEvents && (
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => onView(doc.id)}>
                  View All ({doc.totalEvents})
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
