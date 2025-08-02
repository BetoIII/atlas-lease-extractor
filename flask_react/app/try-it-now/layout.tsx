"use client"

import { LeaseProviderWrapper } from "./screens/lease-provider-wrapper"

export default function TryItNowLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LeaseProviderWrapper>
      {children}
    </LeaseProviderWrapper>
  )
} 