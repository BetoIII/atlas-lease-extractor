"use client"

import { useState, FormEvent } from 'react'
import { Button } from "@atlas/ui"
import { useDemoRequest } from "../hooks/useDemoRequest"
import { useCSRF } from "../hooks/useCSRF"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export function DemoRequestForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
  })

  const { submitDemoRequest, isSubmitting, isSubmitted, error, resetForm } = useDemoRequest()
  const { csrfToken, isLoading: csrfLoading, error: csrfError } = useCSRF()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!csrfToken) {
      return // Don't submit without CSRF token
    }
    await submitDemoRequest({
      ...formData,
      csrfToken
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleReset = () => {
    setFormData({ name: '', email: '', company: '' })
    resetForm()
  }

  if (isSubmitted) {
    return (
      <div className="mx-auto w-full max-w-sm space-y-4 text-center">
        <div className="flex items-center justify-center">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-primary-foreground">Request Submitted!</h3>
          <p className="text-primary-foreground/80">
            We'll be in touch within 24 hours to schedule your demo.
          </p>
        </div>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={handleReset}
          className="mt-4"
        >
          Submit Another Request
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-2">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900"
            placeholder="Your name"
            type="text"
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="grid gap-2">
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900"
            placeholder="Your email"
            type="email"
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="grid gap-2">
          <input
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900"
            placeholder="Company name"
            type="text"
            disabled={isSubmitting}
          />
        </div>
        
        {(error || csrfError) && (
          <div className="flex items-center gap-2 text-red-300 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error || csrfError}</span>
          </div>
        )}
        
        {csrfLoading && (
          <div className="flex items-center gap-2 text-primary-foreground/70 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading security token...</span>
          </div>
        )}
        
        <Button 
          type="submit" 
          size="lg" 
          variant="secondary" 
          className="w-full"
          disabled={isSubmitting || csrfLoading || !csrfToken || !formData.name.trim() || !formData.email.trim()}
        >
          {isSubmitting ? 'Submitting...' : csrfLoading ? 'Loading...' : 'Request a Demo'}
        </Button>
      </form>
      <p className="text-xs text-primary-foreground/70">
        Or email <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@atlasdata.coop'}`} className="underline underline-offset-2">
          {process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@atlasdata.coop'}
        </a> to talk directly.
      </p>
    </div>
  )
}