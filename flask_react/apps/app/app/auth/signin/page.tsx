"use client"

import type React from "react"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@atlas/ui"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@atlas/ui"
import { Input } from "@atlas/ui"
import { Label } from "@atlas/ui"
import { Alert, AlertDescription } from "@atlas/ui"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { authClient } from "@/lib/auth-client"

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address")
      return false
    }
    if (!formData.password) {
      setError("Password is required")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      console.log("Attempting sign in with:", { 
        email: formData.email,
        emailLength: formData.email.length,
        emailTrimmed: formData.email.trim(),
        emailLowercase: formData.email.toLowerCase()
      })
      
      // Use the better-auth client for signin
      const { data, error } = await authClient.signIn.email({
        email: formData.email.trim().toLowerCase(), // Just trim and lowercase, no normalization
        password: formData.password,
        callbackURL: "/home"
      })

      console.log("Sign in response:", { data, error })

      if (error) {
        console.error("Sign in error:", error)
        
        // Handle specific error cases
        if (error.message) {
          if (error.message.includes("Invalid") || error.message.includes("invalid")) {
            throw new Error("Invalid email or password. Please check your credentials and try again.")
          }
          if (error.message.includes("401") || error.message.includes("Unauthorized")) {
            throw new Error("Invalid email or password. Please check your credentials and try again.")
          }
          if (error.message.includes("User not found")) {
            throw new Error("No account found with this email address. Please sign up first.")
          }
          throw new Error(error.message)
        }
        throw new Error("Sign in failed. Please try again.")
      }

      // Check if we have user data
      if (data?.user) {
        console.log("Sign in successful:", data.user)
        
        // Set the user hint cookie after successful sign in
        try {
          await fetch('/api/auth/set-user-hint', {
            method: 'POST',
            credentials: 'include',
          })
        } catch (hintError) {
          // Don't fail the sign in if hint setting fails
          console.warn("Failed to set user hint cookie:", hintError)
        }
        
        // Check for return URL in query parameters
        const returnUrl = searchParams.get('returnUrl')
        
        // Redirect to return URL or home
        router.push(returnUrl || "/home")
      } else {
        throw new Error("Sign in failed. Please try again.")
      }
    } catch (err) {
      console.error("Sign in exception:", err)
      setError(err instanceof Error ? err.message : "An error occurred during sign in")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Image src="/logo.svg" alt="Atlas Data Co-op Logo" width={40} height={40} className="h-10 w-10" />
            <span className="font-bold text-2xl">Atlas Data Co-op</span>
          </div>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        {/* Sign In Form */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access your Atlas Data Co-op dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("email", e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("password", e.target.value)}
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link 
                href={`/auth/signup${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`} 
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignInForm />
    </Suspense>
  )
} 