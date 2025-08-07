import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@atlas/ui"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Atlas Data Co-op - AI Lease Abstraction for CRE Professionals",
  description: "Turn PDFs into clean, audit-ready lease data in minutes with AI built specifically for commercial real estate.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}