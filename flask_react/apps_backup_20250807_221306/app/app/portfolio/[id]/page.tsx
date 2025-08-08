"use client"

import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, MapPin, Building2, DollarSign, Calendar, Eye, Users, ExternalLink, FileText } from "lucide-react"
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui"
import { portfolios, allDocuments, properties } from "@/lib/sample-data"
import type { Portfolio, Property } from "@/lib/types"

export default function PortfolioDetailPage() {
  const router = useRouter()
  const params = useParams()
  const portfolioId = params.id as string

  const portfolio = portfolios.find(p => p.id === portfolioId)

  if (!portfolio) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Portfolio Not Found</h1>
          <Button onClick={() => router.push('/portfolio')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Portfolios
          </Button>
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

  const handlePropertyClick = (property: Property) => {
    router.push(`/property/${property.id}`)
  }

  // Helper function to get properties for this portfolio
  const getPortfolioProperties = () => {
    return properties.filter(property => portfolio.propertyIds.includes(property.id))
  }

  // Precompute properties and derived stats to avoid repeated calls and handle edge cases
  const portfolioProperties = getPortfolioProperties()
  const propertyCount = portfolioProperties.length
  const averageValue = propertyCount > 0 ? Math.round(portfolio.totalValue / propertyCount) : 0

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" onClick={() => router.push('/portfolio')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Portfolios
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold">{portfolio.name}</h1>
                    <p className="text-muted-foreground mt-2">{portfolio.description}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    Share Portfolio
                  </Button>
                  <Button>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Export Data
                  </Button>
                </div>
              </div>

              {/* Portfolio Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{propertyCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${portfolio.totalValue.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${averageValue.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{portfolio.lastUpdated}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Properties List */}
              <Tabs defaultValue="properties" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="properties">Properties</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="documents">Related Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="properties" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Portfolio Properties</CardTitle>
                      <CardDescription>
                        All properties in the {portfolio.name} portfolio
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {portfolioProperties.map((property) => (
                          <div 
                            key={property.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => handlePropertyClick(property)}
                          >
                            <div className="flex items-center space-x-4">
                              {(() => {
                                const IconComponent = getPropertyTypeIcon(property.type)
                                return <IconComponent className="h-8 w-8 text-primary" />
                              })()}
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <p className="text-lg font-medium">{property.address}</p>
                                  <Badge variant={getSourceBadgeVariant(property.source)}>
                                    {property.source}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span className="flex items-center">
                                    <Building2 className="h-3 w-3 mr-1" />
                                    {property.type}
                                  </span>
                                  <span className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {property.size}
                                  </span>
                                  {property.sharedBy && (
                                    <span className="flex items-center">
                                      <Users className="h-3 w-3 mr-1" />
                                      {property.sharedBy}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-medium">${property.value?.toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">{property.lastUpdated}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Portfolio Analytics</CardTitle>
                      <CardDescription>Performance metrics and insights</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Analytics coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Related Documents</CardTitle>
                      <CardDescription>Documents that contain properties from this portfolio</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(() => {
                          // Get unique document IDs from portfolio properties
                          const portfolioProperties = getPortfolioProperties()
                          const documentIds = [...new Set(portfolioProperties.flatMap(p => p.documentIds))]
                          const relatedDocuments = allDocuments.filter(doc => 
                            documentIds.includes(doc.id.toString())
                          )
                          
                          if (relatedDocuments.length === 0) {
                            return (
                              <div className="text-center py-8">
                                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No related documents found</p>
                              </div>
                            )
                          }

                          return relatedDocuments.map((document) => (
                            <div 
                              key={document.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => router.push(`/documents/${document.id}`)}
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
                                    <span>
                                      {portfolioProperties.filter(p => p.documentIds.includes(document.id.toString())).length} properties
                                    </span>
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
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}