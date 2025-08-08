"use client"

import { useMemo, useState } from "react"
import { Search, DollarSign, Share2, CheckCircle, FileText, AlertTriangle, Clock, ExternalLink, Shield, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input } from "@/components/ui"

interface ActivityExtraData {
  recipients?: string[]
  monthly_fee?: number
  price_usdc?: number
  license_template?: string
  firm_id?: string
  member_count?: number
  [key: string]: unknown
}

export interface Activity {
  id: string
  action: string
  activity_type: string
  status: string
  actor: string
  actor_name?: string
  tx_hash?: string
  block_number?: number
  details: string
  revenue_impact: number
  timestamp: string
  extra_data?: ActivityExtraData
}

interface DocumentActivityHistoryProps {
  activities: Activity[]
  isRefreshing: boolean
  onRefresh: () => void
  onActivityHashClick: (activity: Activity) => void
}

export function DocumentActivityHistory({ activities, isRefreshing, onRefresh, onActivityHashClick }: DocumentActivityHistoryProps) {
  const [activityFilter, setActivityFilter] = useState("all")
  const [activitySearchQuery, setActivitySearchQuery] = useState("")

  const filteredActivities = useMemo(() => {
    return activities
      .filter((activity) => {
        const matchesFilter = activityFilter === 'all' || activity.activity_type === activityFilter
        const matchesSearch =
          activitySearchQuery === '' ||
          (activity.actor_name || activity.actor).toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
          activity.action.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
          activity.details.toLowerCase().includes(activitySearchQuery.toLowerCase())
        return matchesFilter && matchesSearch
      })
  }, [activities, activityFilter, activitySearchQuery])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'licensing':
        return <DollarSign className="h-4 w-4 text-green-600" />
      case 'sharing':
        return <Share2 className="h-4 w-4 text-blue-600" />
      case 'validation':
        return <CheckCircle className="h-4 w-4 text-purple-600" />
      case 'origination':
        return <FileText className="h-4 w-4 text-blue-600" />
      case 'infringement':
        return <Shield className="h-4 w-4 text-orange-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />
      case 'error':
        return <AlertTriangle className="h-3 w-3 text-red-500" />
      default:
        return <Clock className="h-3 w-3 text-gray-500" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            Activity History
            {isRefreshing && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 px-2"
          >
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          {isRefreshing 
            ? 'Updating activity timeline...'
            : 'Complete ledger event timeline'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="licensing">Licensing</SelectItem>
              <SelectItem value="sharing">Sharing</SelectItem>
              <SelectItem value="origination">Origination</SelectItem>
              <SelectItem value="validation">Validation</SelectItem>
              <SelectItem value="infringement">Infringement</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search activities..."
              value={activitySearchQuery}
              onChange={(e) => setActivitySearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredActivities.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-3">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">No Activities Found</p>
                  <p className="text-xs text-muted-foreground">Activities will appear as you interact with this document</p>
                </div>
              </div>
            </div>
          ) : filteredActivities.map((activity, index) => (
            <div
              key={activity.id}
              className={`relative flex gap-3 p-3 rounded-lg border ${
                activity.activity_type === 'licensing' && activity.revenue_impact > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              {index < filteredActivities.length - 1 && <div className="absolute left-6 top-12 w-px h-6 bg-gray-200" />}
              <div className="flex-shrink-0 mt-0.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-200">
                  {getActivityIcon(activity.activity_type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">{activity.action.replace(/_/g, ' ')}</p>
                      {getStatusIcon(activity.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{activity.details}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{activity.actor_name || activity.actor}</span>
                      <span>•</span>
                      <span>{new Date(activity.timestamp).toLocaleString()}</span>
                      {activity.tx_hash && (
                        <>
                          <span>•</span>
                          <button 
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                            onClick={() => onActivityHashClick(activity)}
                          >
                            <span>{activity.tx_hash}</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {activity.revenue_impact > 0 && (
                    <div className="text-right">
                      <p className="font-semibold text-green-600">${activity.revenue_impact} USDC</p>
                      <p className="text-xs text-gray-500">Revenue</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredActivities.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Total Activities</p>
                <p className="font-semibold">{filteredActivities.length}</p>
              </div>
              <div>
                <p className="text-gray-500">Revenue Generated</p>
                <p className="font-semibold">${filteredActivities.reduce((sum, a) => sum + (a.revenue_impact || 0), 0)} USDC</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DocumentActivityHistory


