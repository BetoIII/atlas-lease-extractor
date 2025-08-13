"use client"

import Link from "next/link"
import { ReactNode } from "react"
import { getSafeExternalLinkProps } from "../lib/url-utils"

interface SafeExternalLinkProps {
  href: string
  children: ReactNode
  className?: string
  fallback?: ReactNode
}

/**
 * A safe external link component that validates URLs before rendering
 */
export function SafeExternalLink({ 
  href, 
  children, 
  className,
  fallback = null 
}: SafeExternalLinkProps) {
  const linkProps = getSafeExternalLinkProps(href)
  
  if (!linkProps) {
    // Return fallback or nothing if URL is invalid
    return <>{fallback}</>
  }
  
  return (
    <Link {...linkProps} className={className}>
      {children}
    </Link>
  )
}