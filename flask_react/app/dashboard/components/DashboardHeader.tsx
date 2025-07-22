"use client"

import { Bell, Search, Wallet, Menu, X } from "lucide-react"
import { Button, Input, Badge, Avatar, AvatarFallback, AvatarImage } from "@/components/ui"

interface DashboardHeaderProps {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export default function DashboardHeader({ sidebarOpen, toggleSidebar }: DashboardHeaderProps) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-16 items-center px-4 lg:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="flex items-center space-x-2 lg:space-x-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-xl">Atlas DAO</span>
          </div>
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
            <AvatarFallback>BR</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
