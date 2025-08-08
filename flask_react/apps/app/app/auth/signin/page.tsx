import { Suspense } from "react"
import { SignInClient } from "./signin-client"
import { AuthErrorBoundary } from "@/components/auth/AuthErrorBoundary"

export default function SignInPage() {
  return (
    <AuthErrorBoundary>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
        <SignInClient />
      </Suspense>
    </AuthErrorBoundary>
  )
}