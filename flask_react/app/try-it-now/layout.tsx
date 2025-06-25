import { LeaseProviderWrapper } from "./lease-provider-wrapper"

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