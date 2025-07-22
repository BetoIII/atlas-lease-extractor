"use client"

import { Card, CardContent, Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent, CardHeader, CardTitle, CardDescription } from "@/components/ui"
import { Clock } from "lucide-react"

export default function ContractsTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contracts</h1>
          <p className="text-muted-foreground">Manage license agreements and requests</p>
        </div>
      </div>
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Requests</TabsTrigger>
          <TabsTrigger value="active">Active Contracts</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold">License Request - Market Research Q4</h3>
                  <p className="text-sm text-muted-foreground">Requested by 0xAssetManager</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary">Research</Badge>
                    <Badge variant="outline">$500 USDC</Badge>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />1 day ago
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline">Decline</Button>
                  <Button>Accept</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold">Premium Office Lease Comps</h3>
                  <p className="text-sm text-muted-foreground">Licensed to 0xOtherBroker</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="default">Active</Badge>
                    <Badge variant="outline">$200 USDC</Badge>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />Expires in 11 months
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline">View Contract</Button>
                  <Button>Renew</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
