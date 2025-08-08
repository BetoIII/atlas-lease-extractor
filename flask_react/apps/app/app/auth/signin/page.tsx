import { Suspense } from "react"
import { SignInClient } from "./signin-client"

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <SignInClient />
    </Suspense>
  )
}