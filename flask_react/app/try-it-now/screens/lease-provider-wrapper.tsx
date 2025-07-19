"use client"

import { LeaseProvider } from "./lease-context"

interface LeaseProviderWrapperProps {
  children: React.ReactNode
}

export function LeaseProviderWrapper({ children }: LeaseProviderWrapperProps) {
  return (
    <LeaseProvider>
      {children}
    </LeaseProvider>
  )
} 