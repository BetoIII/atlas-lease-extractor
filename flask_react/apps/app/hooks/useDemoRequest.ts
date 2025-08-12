"use client"

import { useState } from 'react'

interface DemoRequestData {
  name: string
  email: string
  company: string
}

export function useDemoRequest() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitDemoRequest = async (data: DemoRequestData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/demo-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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