"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui"

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}

interface SidebarProps {
  open: boolean
  items: NavItem[]
  onClose?: () => void
}

export default function DashboardSidebar({ open, items, onClose }: SidebarProps) {
  const pathname = usePathname()
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Sidebar render - open:', open, 'translate class:', open ? "translate-x-0" : "-translate-x-full")
  }
  return (
    <>
      {/* Backdrop overlay with blur effect */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity duration-300 ease-in-out ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      
      <aside className={`${open ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 w-64 bg-background/95 backdrop-blur supports-[backdrop-filter]:border-r transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full pt-4">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {items.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Button key={item.id} variant="ghost" className="w-full justify-start p-0" asChild>
                  <Link 
                    href={item.href}
                    className={`flex items-center w-full px-3 py-2 rounded-md transition-colors ${
                      isActive 
                        ? "bg-secondary text-secondary-foreground" 
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                    onClick={onClose}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}
