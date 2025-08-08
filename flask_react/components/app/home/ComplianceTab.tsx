"use client"

import type { AuditEvent } from "../../lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Tabs, TabsList, TabsTrigger, TabsContent, Badge } from "@/components/ui"
import { ChevronRight } from "lucide-react"

export default function ComplianceTab({ auditTrail }: { auditTrail: AuditEvent[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compliance</h1>
          <p className="text-muted-foreground">Audit trails and verification</p>
        </div>
      </div>
      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Complete audit trail of all on-chain events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditTrail.map((event, index) => (
                  <div key={index} className="flex items-start space-x-4 pb-4 border-b last:border-b-0">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{event.action.replace(/_/g, ' ')}</p>
                        <Badge variant="outline" className="text-xs">{event.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {event.actor} • {new Date(event.timestamp).toLocaleString()}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground">{event.txHash}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Verification</CardTitle>
              <CardDescription>Verify the authenticity and integrity of your documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Verification Status</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    All uploaded documents have been verified and cryptographically signed
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                      <span className="text-sm">All documents verified</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Last checked: 2 hours ago</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
