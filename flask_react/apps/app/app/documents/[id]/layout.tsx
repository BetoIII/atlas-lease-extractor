"use client"

import { ReactNode } from "react"

interface DocumentDetailLayoutProps {
  children: ReactNode
}

export default function Layout({ children }: DocumentDetailLayoutProps) {
  return <>{children}</>
}