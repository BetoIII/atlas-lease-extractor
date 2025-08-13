"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { TrendingUp, Search, FileText, UsersIcon, Briefcase, Settings, ArrowLeft, MapPin, Building2, DollarSign, Calendar, ExternalLink, Users, Eye, FileCheck } from "lucide-react"
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from "@atlas/ui"
import { Navbar } from "@/components/navbar"
import DashboardSidebar from "@/components/home/DashboardSidebar"
import { properties, allDocuments, portfolios } from "@/lib/sample-data"
import type { Property, Document, Portfolio } from "@/lib/types"

export default function PropertyDetailPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string

  const property = properties.find(p => p.id === propertyId)

  // Find related documents
  const relatedDocuments = property?.documentIds 
    ? allDocuments.filter(doc => property.documentIds.includes(doc.id.toString()))
    : []

  // Find portfolios that contain this property
  const containingPortfolios = portfolios.filter(portfolio => 
    portfolio.propertyIds.includes(propertyId)
  )

  const navigationItems = [
    { id: "home", label: "Home", icon: TrendingUp, href: "/" },
    { id: "marketplace", label: "Marketplace", icon: Search, href: "/marketplace" },
    { id: "documents", label: "My Documents", icon: FileText, href: "/documents" },
    { id: "contracts", label: "Contracts", icon: UsersIcon, href: "/contracts" },
    { id: "portfolio", label: "Portfolio", icon: Briefcase, href: "/portfolio" },
    { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
  ]

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex">
          <DashboardSidebar 
            open={sidebarOpen} 
            items={navigationItems} 
            onClose={() => setSidebarOpen(false)}
          />
          <main className="flex-1 lg:ml-0">
            <div className="container mx-auto px-4 py-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
                <Button onClick={() => router.push('/portfolio')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Portfolios
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const getPropertyTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'office':
      case 'commercial':
        return Building2
      case 'residential':
      case 'apartment':
        return Users
      case 'industrial':
      case 'warehouse':
        return Building2
      default:
        return Building2
    }
  }

  const getSourceBadgeVariant = (source: string) => {
    switch (source) {
      case 'owned': return 'default'
      case 'shared': return 'secondary'
      case 'firm': return 'outline'
      default: return 'outline'
    }
  }

  const handleDocumentClick = (document: Document) => {
    router.push(`/documents/${document.id}`)
  }

  const handlePortfolioClick = (portfolio: Portfolio) => {
    router.push(`/portfolio/${portfolio.id}`)
  }

  const PropertyIcon = getPropertyTypeIcon(property.type)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <DashboardSidebar 
          open={sidebarOpen} 
          items={navigationItems} 
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 lg:ml-0">
          <div className="container mx-auto px-4 py-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" onClick={() => router.push('/portfolio')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Portfolios
                  </Button>
                  <div className="flex items-center space-x-3">
                    <PropertyIcon className="h-8 w-8 text-primary" />
                    <div>
                      <h1 className="text-3xl font-bold">{property.address}</h1>
                      <p className="text-muted-foreground mt-1">
                        {property.type} • {property.size}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                  <Button>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Export Data
                  </Button>
                </div>
              </div>

              {/* Property Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Property Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${property.value?.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Property Type</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{property.type}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Size</CardTitle>
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{property.size}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Portfolios</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{containingPortfolios.length}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Property Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Property Information</CardTitle>
                    <CardDescription>Details about this property</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Address</span>
                      <span className="text-sm text-muted-foreground">{property.address}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Property Type</span>
                      <span className="text-sm text-muted-foreground">{property.type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Size</span>
                      <span className="text-sm text-muted-foreground">{property.size}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Source</span>
                      <Badge variant={getSourceBadgeVariant(property.source)}>
                        {property.source}
                      </Badge>
                    </div>
                    {property.sharedBy && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Shared by</span>
                        <span className="text-sm text-muted-foreground">{property.sharedBy}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Last Updated</span>
                      <span className="text-sm text-muted-foreground">{property.lastUpdated}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Containing Portfolios */}
                <Card>
                  <CardHeader>
                    <CardTitle>Used in Portfolios</CardTitle>
                    <CardDescription>Portfolios that contain this property</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {containingPortfolios.length > 0 ? (
                        containingPortfolios.map((portfolio) => (
                          <div 
                            key={portfolio.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => handlePortfolioClick(portfolio)}
                          >
                            <div className="flex items-center space-x-3">
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{portfolio.name}</p>
                                <p className="text-xs text-muted-foreground">{portfolio.description}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Not in any portfolios</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs for additional information */}
              <Tabs defaultValue="documents" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="documents">Source Documents ({relatedDocuments.length})</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="documents" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Source Documents</CardTitle>
                      <CardDescription>Documents that contain information about this property</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {relatedDocuments.length > 0 ? (
                          relatedDocuments.map((document) => (
                            <div 
                              key={document.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => handleDocumentClick(document)}
                            >
                              <div className="flex items-center space-x-4">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">{document.title}</p>
                                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                    <span>{document.docType}</span>
                                    <span>•</span>
                                    <span>{document.region}</span>
                                    <span>•</span>
                                    <span>{document.scope}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No source documents found</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Property Analytics</CardTitle>
                      <CardDescription>Performance metrics and market insights</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Property analytics coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Property History</CardTitle>
                      <CardDescription>Timeline of changes and updates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Property history coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}