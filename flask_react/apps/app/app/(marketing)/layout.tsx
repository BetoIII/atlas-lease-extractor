import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Atlas Data Co-op - AI Lease Abstraction for CRE Professionals",
  description:
    "Turn PDFs into clean, audit-ready lease data in minutes with AI built specifically for commercial real estate.",
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


