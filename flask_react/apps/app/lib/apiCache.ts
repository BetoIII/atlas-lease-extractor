// API Response Cache with TTL and invalidation support
export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
}

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  key?: string // Custom cache key
}

export class APICache {
  private cache = new Map<string, CacheEntry>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutes default

  // Get cached data if valid
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  // Set cache entry
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.defaultTTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  // Invalidate cache entry
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  // Invalidate multiple entries by pattern
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'))
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear()
  }

  // Get cache stats
  getStats() {
    const now = Date.now()
    let valid = 0
    let expired = 0

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expired++
      } else {
        valid++
      }
    }

    return { total: this.cache.size, valid, expired }
  }
}

// Global cache instance
export const apiCache = new APICache()

// Cache key generators
export const CacheKeys = {
  documentActivities: (documentId: string) => `document-activities:${documentId}`,
  documentSharingState: (documentId: string) => `document-sharing-state:${documentId}`,
  userDocuments: (userId: string) => `user-documents:${userId}`,
  documentDetails: (documentId: string) => `document-details:${documentId}`,
  
  // Pattern for invalidating all document-related caches
  documentPattern: (documentId: string) => `*:${documentId}`,
  userPattern: (userId: string) => `user-*:${userId}`
}