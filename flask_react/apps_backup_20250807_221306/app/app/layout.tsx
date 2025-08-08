import type { Metadata } from 'next'
import './globals.css'
import { AppLayout } from '../components/AppLayout'

export const metadata: Metadata = {
  title: 'Atlas Data Co-op | App',
  description: 'Commercial real estate document analysis and portfolio management platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  )
}
