import { useState, useEffect, useCallback, useRef } from 'react'
import { API_BASE_URL } from '../lib/config'
import { apiCache, CacheKeys } from '../lib/apiCache'
import { useToast } from '@atlas/ui'

interface Activity {
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
  extra_data?: Record<string, unknown>
}

interface DocumentSharingState {
  sharing_level?: 'private' | 'firm' | 'external' | 'license' | 'coop'
  external_emails?: string[]
  licensed_emails?: string[]
  monthly_fee?: number
  price_usdc?: number
  license_template?: string
  [key: string]: unknown
}

interface BatchedDocumentData {
  activities: Activity[]
  sharingState: DocumentSharingState | null
  lastUpdated: string
}

// Custom hook that batches and caches document-related API calls
export const useDocumentData = (documentId: string) => {
  const { toast } = useToast()
  const [activities, setActivities] = useState<Activity[]>([])
  const [sharingState, setSharingState] = useState<DocumentSharingState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)

  // Batched API call that fetches both activities and sharing state
  const fetchBatchedData = useCallback(async (): Promise<BatchedDocumentData | null> => {
    if (!documentId) return null

    // Check cache first
    const cacheKey = `batched-document-data:${documentId}`
    const cached = apiCache.get<BatchedDocumentData>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // Use Promise.allSettled to batch requests and handle partial failures
      const [activitiesResult, sharingStateResult] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/document-activities/${documentId}`, {
          credentials: 'include'
        }),
        fetch(`${API_BASE_URL}/document-sharing-state/${documentId}`, {
          method: 'GET',
          credentials: 'include'
        })
      ])

      let activities: Activity[] = []
      let sharingState: DocumentSharingState | null = null

      // Process activities result
      if (activitiesResult.status === 'fulfilled' && activitiesResult.value.ok) {
        const activitiesData = await activitiesResult.value.json()
        activities = activitiesData.activities || []
      }

      // Process sharing state result
      if (sharingStateResult.status === 'fulfilled' && sharingStateResult.value.ok) {
        const sharingData = await sharingStateResult.value.json()
        sharingState = sharingData.sharing_state || null
      }

      const batchedData: BatchedDocumentData = {
        activities,
        sharingState,
        lastUpdated: new Date().toISOString()
      }

      // Cache the batched result for 2 minutes
      apiCache.set(cacheKey, batchedData, { ttl: 2 * 60 * 1000 })

      return batchedData
    } catch (error) {
      console.error('Error fetching batched document data:', error)
      return null
    }
  }, [documentId])

  // Load initial data
  const loadData = useCallback(async () => {
    if (!documentId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    
    try {
      const data = await fetchBatchedData()
      if (data) {
        setActivities(data.activities)
        setSharingState(data.sharingState)
        setLastUpdated(data.lastUpdated)
      }
    } catch (error) {
      console.error('Error loading document data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [documentId, fetchBatchedData])

  // Refresh data with loading state
  const refreshData = useCallback(async (showToast = false) => {
    if (!documentId || isRefreshingRef.current) return
    
    isRefreshingRef.current = true
    setIsRefreshing(true)
    
    try {
      // Invalidate cache to force fresh data
      apiCache.invalidate(`batched-document-data:${documentId}`)
      
      const data = await fetchBatchedData()
      if (data) {
        const prevActivityCount = activities.length
        const newActivityCount = data.activities.length
        
        setActivities(data.activities)
        setSharingState(data.sharingState)
        setLastUpdated(data.lastUpdated)
        
        // Show toast if new activities were found and requested
        if (showToast && newActivityCount > prevActivityCount) {
          const diff = newActivityCount - prevActivityCount
          toast({
            title: "✓ Activity Updated",
            description: `Found ${diff} new activity${diff > 1 ? 'ies' : ''}`,
          })
        }
      }
    } catch (error) {
      console.error('Error refreshing document data:', error)
    } finally {
      isRefreshingRef.current = false
      setIsRefreshing(false)
    }
  }, [documentId, activities.length, fetchBatchedData, toast])

  // Debounced refresh function to prevent too many rapid calls
  const scheduleRefresh = useCallback((delay: number = 1000) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }
    
    const timeoutId = setTimeout(() => {
      refreshData(true)
      refreshTimeoutRef.current = null
    }, delay)
    
    refreshTimeoutRef.current = timeoutId
  }, [refreshData])

  // Invalidate cache when document changes
  const invalidateCache = useCallback(() => {
    if (documentId) {
      apiCache.invalidatePattern(CacheKeys.documentPattern(documentId))
    }
  }, [documentId])

  // Load data on mount and when documentId changes
  useEffect(() => {
    loadData()
  }, [loadData])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  return {
    activities,
    sharingState,
    isLoading,
    isRefreshing,
    lastUpdated,
    refreshData,
    scheduleRefresh,
    invalidateCache,
    // Expose individual state setters for external updates
    setActivities,
    setSharingState
  }
}