"use client"

import { useState } from 'react'

interface DemoRequestData {
  name: string
  email: string
  company: string
  csrfToken?: string
}

export function useDemoRequest() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitDemoRequest = async (data: DemoRequestData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      // Add CSRF token to headers if available
      if (data.csrfToken) {
        headers['X-CSRF-Token'] = data.csrfToken
      }
      
      const response = await fetch('/api/demo-request', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'same-origin'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit demo request')
      }

      setIsSubmitted(true)
      return { success: true, data: result }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setIsSubmitted(false)
    setError(null)
  }

  return {
    submitDemoRequest,
    isSubmitting,
    isSubmitted,
    error,
    resetForm,
  }
}