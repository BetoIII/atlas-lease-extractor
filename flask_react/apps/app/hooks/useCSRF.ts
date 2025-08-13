"use client"

import { useState, useEffect } from 'react'

export function useCSRF() {
  const [csrfToken, setCSRFToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCSRFToken = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'same-origin'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token')
      }
      
      const data = await response.json()
      setCSRFToken(data.csrfToken)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('CSRF token fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCSRFToken()
  }, [])

  const refreshToken = () => {
    fetchCSRFToken()
  }

  return {
    csrfToken,
    isLoading,
    error,
    refreshToken
  }
}