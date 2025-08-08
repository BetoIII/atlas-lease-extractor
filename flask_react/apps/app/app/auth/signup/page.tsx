import { Suspense } from "react"
import { SignUpClient } from "./signup-client"
import { AuthErrorBoundary } from "@/components/auth/AuthErrorBoundary"

export default function SignUpPage() {
  return (
    <AuthErrorBoundary>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
        <SignUpClient />
      </Suspense>
    </AuthErrorBoundary>
  )
}

