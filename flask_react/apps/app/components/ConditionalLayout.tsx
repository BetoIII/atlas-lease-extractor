"use client"

import { ReactNode, useMemo } from "react"
import { usePathname } from "next/navigation"
import { AppLayout } from "./AppLayout"
import { isPublicRoute } from "../lib/routes"

interface ConditionalLayoutProps {
  children: ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname() || "/"

  const shouldUsePublicLayout = useMemo(() => {
    return isPublicRoute(pathname)
  }, [pathname])

  if (shouldUsePublicLayout) {
    return <>{children}</>
  }

  return <AppLayout>{children}</AppLayout>
}


