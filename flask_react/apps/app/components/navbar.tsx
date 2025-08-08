"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button, Input, Badge, Avatar, AvatarFallback, AvatarImage } from "@/components/ui"
import { Bell, Search, Wallet } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { useState, useEffect } from "react"

interface NavbarProps {}

export function Navbar() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to get the current session
        const session = await authClient.getSession()
        if (session && 'data' in session && session.data?.user) {
          setIsAuthenticated(true)
          setUser(session.data.user)
        }
      } catch (error) {
        console.error("Auth check error:", error)
        setIsAuthenticated(false)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [])

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await authClient.signOut()
      setIsAuthenticated(false)
      setUser(null)
      // Navigate to home page after successful sign out
      router.push('/')
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex h-16 items-center px-4 lg:px-6">
          <div className="flex items-center space-x-2">
            <Image src="/logo.svg" alt="Atlas Data Co-op Logo" width={32} height={32} className="h-8 w-8" />
            <span className="font-bold inline-block">Atlas Data Co-op</span>
          </div>
        </div>
      </header>
    )
  }

  // Show dashboard header for authenticated users
  if (isAuthenticated && user) {
    return (
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex h-16 items-center px-4 lg:px-6">
          <div className="flex items-center space-x-2 lg:space-x-4">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <Image src="/logo.svg" alt="Atlas Data Co-op Logo" width={32} height={32} className="h-8 w-8" />
              <span className="font-bold inline-block">Atlas Data Co-op</span>
            </Link>
          </div>
          <div className="flex-1 flex items-center justify-center px-4 lg:px-8">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search assets, contracts, or transactions..." className="pl-10 w-full" />
            </div>
          </div>
          <div className="flex items-center space-x-2 lg:space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs" />
            </Button>
            <div className="flex items-center space-x-2 bg-muted/50 rounded-lg px-3 py-2">
              <Wallet className="h-4 w-4" />
              <span className="text-sm font-medium">$2,450.00</span>
              <Badge variant="secondary" className="text-xs">
                USDC
              </Badge>
            </div>
            <Avatar>
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>
                {user.name ? user.name.substring(0, 2).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              disabled={isLoading}
            >
              {isLoading ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </div>
      </header>
    )
  }

  // Show original navbar for non-authenticated users
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo.svg" alt="Atlas Data Co-op Logo" width={32} height={32} className="h-8 w-8" />
            <span className="inline-block font-bold">Atlas Data Co-op</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-4">
            <Link
              href="/why-atlas"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Why Atlas
            </Link>
            <Link
              href="https://x.com/betoiii"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Twitter
            </Link>
            <Button asChild variant="default">
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}
