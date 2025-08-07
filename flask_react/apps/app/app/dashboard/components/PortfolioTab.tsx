"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Portfolio, Property } from "../types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Tabs, TabsList, TabsTrigger, TabsContent, Badge, Button } from "@/components/ui"
import { ChevronRight, MapPin, Building2, DollarSign, Calendar, Users, Eye, Filter } from "lucide-react"
import { portfolios, properties } from "@/app/dashboard/sample-data"

interface PortfolioTabProps {
  portfolios: Portfolio[]
}

export default function PortfolioTab({ portfolios: portfoliosProp }: PortfolioTabProps) {
  // Use imported portfolios and properties for full data access
  const portfolios = portfoliosProp
  const router = useRouter()
  const [portfolioFilters, setPortfolioFilters] = useState({
    owned: true,
    shared: true,
    licensed: true,
    marketplace: true
  })
  const [propertyFilters, setPropertyFilters] = useState({
    owned: true,
    shared: true,
    licensed: true,
    marketplace: true
  })

  const totalProperties = properties.length
  const totalValue = portfolios.reduce((sum, portfolio) => sum + portfolio.totalValue, 0)

  const handlePortfolioClick = (portfolio: Portfolio) => {
    // Navigate to portfolio details page
    router.push(`/portfolio/${portfolio.id}`)
  }

  const handlePropertyClick = (property: Property) => {
    // Navigate to standalone property details page
    router.push(`/property/${property.id}`)
  }

  // Helper function to get properties for a portfolio
  const getPortfolioProperties = (portfolio: Portfolio) => {
    return properties.filter(property => portfolio.propertyIds.includes(property.id))
  }

  // Filter portfolios based on property sources
  const filteredPortfolios = portfolios.filter(portfolio => {
    const portfolioProperties = getPortfolioProperties(portfolio)
    const hasValidProperties = portfolioProperties.some(property => {
      if (property.source === 'owned' && portfolioFilters.owned) return true
      if (property.source === 'shared' && portfolioFilters.shared) return true
      if (property.source === 'licensed' && portfolioFilters.licensed) return true
      if (property.source === 'marketplace' && portfolioFilters.marketplace) return true
      return false
    })
    return hasValidProperties
  })

  // Filter all properties
  const filteredProperties = properties.filter(property => {
    if (property.source === 'owned' && propertyFilters.owned) return true
    if (property.source === 'shared' && propertyFilters.shared) return true
    if (property.source === 'licensed' && propertyFilters.licensed) return true
    if (property.source === 'marketplace' && propertyFilters.marketplace) return true
    return false
  })

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
      case 'licensed': return 'outline'
      case 'marketplace': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolios</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolios.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="portfolios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="portfolios">My Portfolios ({filteredPortfolios.length})</TabsTrigger>
          <TabsTrigger value="properties">All Properties ({filteredProperties.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolios" className="space-y-4">
          {/* Portfolio Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2 mr-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by source:</span>
            </div>
            <Button 
              variant={portfolioFilters.owned ? "default" : "outline"} 
              size="sm" 
              onClick={() => setPortfolioFilters(prev => ({ ...prev, owned: !prev.owned }))}
            >
              Owned by Me
            </Button>
            <Button 
              variant={portfolioFilters.shared ? "default" : "outline"} 
              size="sm" 
              onClick={() => setPortfolioFilters(prev => ({ ...prev, shared: !prev.shared }))}
            >
              Shared with Me
            </Button>
            <Button 
              variant={portfolioFilters.licensed ? "default" : "outline"} 
              size="sm" 
              onClick={() => setPortfolioFilters(prev => ({ ...prev, licensed: !prev.licensed }))}
            >
              Licensed to Me
            </Button>
            <Button 
              variant={portfolioFilters.marketplace ? "default" : "outline"} 
              size="sm" 
              onClick={() => setPortfolioFilters(prev => ({ ...prev, marketplace: !prev.marketplace }))}
            >
              Licensed from Marketplace
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Overview</CardTitle>
              <CardDescription>Your property portfolios from uploaded documents and external sources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPortfolios.map((portfolio) => (
                  <div 
                    key={portfolio.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handlePortfolioClick(portfolio)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <Building2 className="h-8 w-8 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-lg font-medium">{portfolio.name}</p>
                          <Badge variant="outline">{getPortfolioProperties(portfolio).length} properties</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{portfolio.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            ${portfolio.totalValue.toLocaleString()}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {portfolio.lastUpdated}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          {/* Property Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2 mr-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by source:</span>
            </div>
            <Button 
              variant={propertyFilters.owned ? "default" : "outline"} 
              size="sm" 
              onClick={() => setPropertyFilters(prev => ({ ...prev, owned: !prev.owned }))}
            >
              Owned by Me
            </Button>
            <Button 
              variant={propertyFilters.shared ? "default" : "outline"} 
              size="sm" 
              onClick={() => setPropertyFilters(prev => ({ ...prev, shared: !prev.shared }))}
            >
              Shared with Me
            </Button>
            <Button 
              variant={propertyFilters.licensed ? "default" : "outline"} 
              size="sm" 
              onClick={() => setPropertyFilters(prev => ({ ...prev, licensed: !prev.licensed }))}
            >
              Licensed to Me
            </Button>
            <Button 
              variant={propertyFilters.marketplace ? "default" : "outline"} 
              size="sm" 
              onClick={() => setPropertyFilters(prev => ({ ...prev, marketplace: !prev.marketplace }))}
            >
              Licensed from Marketplace
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Properties</CardTitle>
              <CardDescription>Properties identified from your documents and external sources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredProperties.map(property => {
                  // Find which portfolios contain this property
                  const containingPortfolios = portfolios.filter(p => p.propertyIds.includes(property.id))
                  const portfolioNames = containingPortfolios.map(p => p.name).join(', ')
                  
                  return (
                    <div 
                      key={property.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handlePropertyClick(property)}
                    >
                      <div className="flex items-center space-x-3">
                        {(() => {
                          const IconComponent = getPropertyTypeIcon(property.type)
                          return <IconComponent className="h-5 w-5 text-muted-foreground" />
                        })()}
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">{property.address}</p>
                            <Badge variant={getSourceBadgeVariant(property.source)}>
                              {property.source}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>{property.type}</span>
                            <span>•</span>
                            <span>{property.size}</span>
                            {portfolioNames && (
                              <>
                                <span>•</span>
                                <span>In: {portfolioNames}</span>
                              </>
                            )}
                            {property.sharedBy && (
                              <>
                                <span>•</span>
                                <span>Shared by: {property.sharedBy}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${property.value?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{property.lastUpdated}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}