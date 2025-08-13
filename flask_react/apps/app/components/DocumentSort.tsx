"use client"

import { useState } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown, Calendar, FileText, Building2, AlertTriangle, CheckCircle } from "lucide-react"
import { Button } from "@atlas/ui"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@atlas/ui"
import { cn } from "@/lib/utils"

export type SortField = 'name' | 'date' | 'status' | 'assetType' | 'size' | 'riskLevel' | 'lastModified'
export type SortDirection = 'asc' | 'desc'

export interface SortOption {
  field: SortField
  direction: SortDirection
}

interface DocumentSortProps {
  onSortChange?: (sort: SortOption) => void
  currentSort?: SortOption
  className?: string
}

const SORT_OPTIONS = [
  {
    field: 'name' as SortField,
    label: 'Document Name',
    icon: FileText,
    group: 'Basic'
  },
  {
    field: 'date' as SortField,
    label: 'Upload Date',
    icon: Calendar,
    group: 'Basic'
  },
  {
    field: 'lastModified' as SortField,
    label: 'Last Modified',
    icon: Calendar,
    group: 'Basic'
  },
  {
    field: 'size' as SortField,
    label: 'File Size',
    icon: FileText,
    group: 'Basic'
  },
  {
    field: 'status' as SortField,
    label: 'Processing Status',
    icon: CheckCircle,
    group: 'Status'
  },
  {
    field: 'riskLevel' as SortField,
    label: 'Risk Level',
    icon: AlertTriangle,
    group: 'Analysis'
  },
  {
    field: 'assetType' as SortField,
    label: 'Asset Type',
    icon: Building2,
    group: 'Property'
  }
]

export function DocumentSort({ onSortChange, currentSort, className }: DocumentSortProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSortSelect = (field: SortField) => {
    let direction: SortDirection = 'desc'
    
    // If clicking the same field, toggle direction
    if (currentSort?.field === field) {
      direction = currentSort.direction === 'asc' ? 'desc' : 'asc'
    } else {
      // Default directions for different fields
      direction = field === 'name' || field === 'assetType' ? 'asc' : 'desc'
    }

    onSortChange?.({ field, direction })
    setIsOpen(false)
  }

  const getSortIcon = (field: SortField) => {
    if (currentSort?.field !== field) {
      return ArrowUpDown
    }
    return currentSort.direction === 'asc' ? ArrowUp : ArrowDown
  }

  const getCurrentSortLabel = () => {
    if (!currentSort) return "Sort by..."
    
    const option = SORT_OPTIONS.find(opt => opt.field === currentSort.field)
    const direction = currentSort.direction === 'asc' ? '↑' : '↓'
    
    return `${option?.label} ${direction}`
  }

  const groupedOptions = SORT_OPTIONS.reduce((groups, option) => {
    const group = option.group
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(option)
    return groups
  }, {} as Record<string, typeof SORT_OPTIONS>)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={cn("gap-2", className)}
        >
          <ArrowUpDown className="h-4 w-4" />
          {getCurrentSortLabel()}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        {Object.entries(groupedOptions).map(([groupName, options], groupIndex) => (
          <div key={groupName}>
            {groupIndex > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
              {groupName}
            </DropdownMenuLabel>
            
            {options.map((option) => {
              const IconComponent = option.icon
              const SortIconComponent = getSortIcon(option.field)
              const isActive = currentSort?.field === option.field
              
              return (
                <DropdownMenuItem
                  key={option.field}
                  onClick={() => handleSortSelect(option.field)}
                  className={cn(
                    "flex items-center justify-between cursor-pointer",
                    isActive && "bg-accent"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    <span>{option.label}</span>
                  </div>
                  
                  <SortIconComponent 
                    className={cn(
                      "h-4 w-4",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )} 
                  />
                </DropdownMenuItem>
              )
            })}
          </div>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => {
            onSortChange?.({ field: 'date', direction: 'desc' })
            setIsOpen(false)
          }}
          className="text-muted-foreground"
        >
          Reset to Default
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}