"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button, Input, Badge, Avatar, AvatarFallback, AvatarImage, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@atlas/ui"
import { Bell, Search, Wallet, User, Settings, LogOut } from "lucide-react"
import { authClient } from "@atlas/auth"
import { useState, useEffect } from "react"

interface AppNavbarProps {}

export function AppNavbar() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to get the current session
        const session = await authClient.getSession()
        if (session && 'data' in session && session.data?.user) {
          setUser(session.data.user)
        }
        // Note: Don't redirect here - let middleware handle auth redirects
      } catch (error) {
        console.error("Auth check error:", error)
        // Note: Don't redirect here - let middleware handle auth redirects
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
      setUser(null)
      // Navigate to marketing site after successful sign out
      window.location.href = process.env.NEXT_PUBLIC_MARKETING_URL || 'http://localhost:3000'
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

  // Only show this navbar if user is authenticated
  if (!user) {
    return null
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-16 items-center px-4 lg:px-6">
        <div className="flex items-center space-x-2 lg:space-x-4">
          <Link href="/home" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Image src="/logo.svg" alt="Atlas Data Co-op Logo" width={32} height={32} className="h-8 w-8" />
            <span className="font-bold inline-block">Atlas Data Co-op</span>
          </Link>
        </div>
        
        {/* Global Search */}
        <div className="flex-1 flex items-center justify-center px-4 lg:px-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search documents, contracts, properties..." className="pl-10 w-full" />
          </div>
        </div>
        
        {/* Right Side Actions */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs" />
          </Button>
          
          {/* Wallet/Credits Display */}
          <div className="flex items-center space-x-2 bg-muted/50 rounded-lg px-3 py-2">
            <Wallet className="h-4 w-4" />
            <span className="text-sm font-medium">$2,450.00</span>
            <Badge variant="secondary" className="text-xs">
              USDC
            </Badge>
          </div>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-user.jpg" alt={user.name || "User"} />
                  <AvatarFallback>
                    {user.name ? user.name.substring(0, 2).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user.name && <p className="font-medium">{user.name}</p>}
                  {user.email && (
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={handleSignOut}
                disabled={isLoading}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isLoading ? "Signing out..." : "Log out"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
