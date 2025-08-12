"use client"

import { ReactNode, useMemo } from "react"
import { usePathname } from "next/navigation"
import { AppLayout } from "./AppLayout"

interface ConditionalLayoutProps {
  children: ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname() || "/"

  const isPublicRoute = useMemo(() => {
    if (pathname === "/") return true
    return (
      pathname.startsWith("/why-atlas") ||
      pathname.startsWith("/why-tokenize") ||
      pathname.startsWith("/auth/")
    )
  }, [pathname])

  if (isPublicRoute) {
    return <>{children}</>
  }

  return <AppLayout>{children}</AppLayout>
}


