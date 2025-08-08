import { Suspense } from "react"
import { SignUpClient } from "./signup-client"

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <SignUpClient />
    </Suspense>
  )
}

