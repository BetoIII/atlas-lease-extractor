"use client"

import { useState, forwardRef } from "react"
import { Search, Filter, Calendar, Building2, FileText, X } from "lucide-react"
import { Input } from "@/components/ui/form/input"
import { Button } from "@/components/ui/form/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/form/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/overlay/popover"
import { Badge } from "@/components/ui/data-display/badge"
import { Separator } from "@/components/ui/data-display/separator"
import { cn } from "@/lib/utils"

interface DocumentSearchProps {
  onSearch?: (query: string, filters: SearchFilters) => void
  className?: string
}

export interface SearchFilters {
  query: string
  assetType: string
  dateRange: string
  status: string
  tags: string[]
}

const ASSET_TYPES = [
  { value: "all", label: "All Asset Types" },
  { value: "office", label: "Office" },
  { value: "retail", label: "Retail" },
  { value: "industrial", label: "Industrial" },
  { value: "multifamily", label: "Multifamily" },
  { value: "mixed-use", label: "Mixed Use" }
]

const DATE_RANGES = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" }
]

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "processed", label: "Processed" },
  { value: "processing", label: "Processing" },
  { value: "failed", label: "Failed" },
  { value: "pending", label: "Pending Review" }
]

const COMMON_TAGS = [
  "High Risk", "Low Risk", "Requires Review", "Flagged", "Compliant", 
  "Non-Compliant", "Urgent", "Complete", "Draft"
]

export const DocumentSearch = forwardRef<HTMLInputElement, DocumentSearchProps>(({ onSearch, className }, ref) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    assetType: "all",
    dateRange: "all", 
    status: "all",
    tags: []
  })

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [tagInput, setTagInput] = useState("")

  const handleQueryChange = (query: string) => {
    const newFilters = { ...filters, query }
    setFilters(newFilters)
    onSearch?.(query, newFilters)
  }

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onSearch?.(newFilters.query, newFilters)
  }

  const addTag = (tag: string) => {
    if (tag && !filters.tags.includes(tag)) {
      handleFilterChange("tags", [...filters.tags, tag])
    }
    setTagInput("")
  }

  const removeTag = (tag: string) => {
    handleFilterChange("tags", filters.tags.filter(t => t !== tag))
  }

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      query: "",
      assetType: "all",
      dateRange: "all",
      status: "all", 
      tags: []
    }
    setFilters(clearedFilters)
    onSearch?.("", clearedFilters)
  }

  const hasActiveFilters = filters.assetType !== "all" || 
                          filters.dateRange !== "all" || 
                          filters.status !== "all" || 
                          filters.tags.length > 0

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={ref}
            placeholder="Search documents by name, content, or property..."
            value={filters.query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant={hasActiveFilters ? "default" : "outline"} size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                  {[
                    filters.assetType !== "all" ? 1 : 0,
                    filters.dateRange !== "all" ? 1 : 0,
                    filters.status !== "all" ? 1 : 0,
                    filters.tags.length
                  ].reduce((a, b) => a + b)}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                )}
              </div>

              <Separator />

              {/* Asset Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Asset Type
                </label>
                <Select 
                  value={filters.assetType} 
                  onValueChange={(value) => handleFilterChange("assetType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Range
                </label>
                <Select 
                  value={filters.dateRange} 
                  onValueChange={(value) => handleFilterChange("dateRange", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_RANGES.map(range => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Status
                </label>
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                
                {/* Tag Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addTag(tagInput.trim())
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    size="sm" 
                    onClick={() => addTag(tagInput.trim())}
                    disabled={!tagInput.trim()}
                  >
                    Add
                  </Button>
                </div>

                {/* Common Tags */}
                <div className="flex flex-wrap gap-1">
                  {COMMON_TAGS.filter(tag => !filters.tags.includes(tag)).slice(0, 6).map(tag => (
                    <Button
                      key={tag}
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => addTag(tag)}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>

                {/* Selected Tags */}
                {filters.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {filters.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => removeTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {filters.assetType !== "all" && (
            <Badge variant="outline" className="gap-1">
              {ASSET_TYPES.find(t => t.value === filters.assetType)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => handleFilterChange("assetType", "all")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.dateRange !== "all" && (
            <Badge variant="outline" className="gap-1">
              {DATE_RANGES.find(d => d.value === filters.dateRange)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => handleFilterChange("dateRange", "all")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.status !== "all" && (
            <Badge variant="outline" className="gap-1">
              {STATUS_OPTIONS.find(s => s.value === filters.status)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => handleFilterChange("status", "all")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.tags.map(tag => (
            <Badge key={tag} variant="outline" className="gap-1">
              {tag}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => removeTag(tag)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
})

DocumentSearch.displayName = "DocumentSearch"