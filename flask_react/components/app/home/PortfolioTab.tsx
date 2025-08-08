"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Portfolio } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button } from "@atlas/ui"
import { ChevronRight, Building2, DollarSign, Calendar, Eye, Filter } from "lucide-react"
import { properties } from "@/lib/sample-data"

interface PortfolioTabProps {
  portfolios: Portfolio[]
}

export default function PortfolioTab({ portfolios: portfoliosProp }: PortfolioTabProps) {
  const portfolios = portfoliosProp
  const router = useRouter()
  const [portfolioFilters, setPortfolioFilters] = useState({
    owned: true,
    shared: true,
    firm: true
  })

  const totalValue = portfolios.reduce((sum, portfolio) => sum + portfolio.totalValue, 0)

  const handlePortfolioClick = (portfolio: Portfolio) => {
    // Navigate to portfolio details page
    router.push(`/portfolio/${portfolio.id}`)
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
      if (property.source === 'firm' && portfolioFilters.firm) return true
      return false
    })
    return hasValidProperties
  })

  return (
    <div className="space-y-6">
      {/* Portfolio Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolios</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPortfolios.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Filters */}
      <div className="flex flex-wrap gap-2">
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
          variant={portfolioFilters.firm ? "default" : "outline"} 
          size="sm" 
          onClick={() => setPortfolioFilters(prev => ({ ...prev, firm: !prev.firm }))}
        >
          Shared with Firm
        </Button>
      </div>
      
      {/* Portfolios List */}
      <Card>
        <CardHeader>
          <CardTitle>My Portfolios</CardTitle>
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
    </div>
  )
}