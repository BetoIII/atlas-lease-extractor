"use client"

import { Button } from "@/components/ui"

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface SidebarProps {
  open: boolean
  items: NavItem[]
  active: string
  onSelect: (id: string) => void
  onClose?: () => void
}

export default function DashboardSidebar({ open, items, active, onSelect, onClose }: SidebarProps) {
  console.log('Sidebar render - open:', open, 'translate class:', open ? "translate-x-0" : "-translate-x-full")
  return (
    <>
      {/* Backdrop overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300 ease-in-out ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      
      <aside className={`${open ? "translate-x-0" : "-translate-x-full"} fixed lg:static inset-y-0 left-0 z-40 w-64 bg-background border-r transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full pt-16 lg:pt-0">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {items.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={active === item.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => onSelect(item.id)}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Button>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}
