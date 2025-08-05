"use client"

import { useState } from "react"
import { PanelLeft } from "lucide-react"

interface SidebarToggleProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function SidebarToggle({ isCollapsed, onToggle }: SidebarToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        <PanelLeft className={`w-5 h-5 transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full left-0 mt-2 z-50">
          <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            <div className="flex items-center gap-3">
              <span>{isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}</span>
              <div className="flex items-center gap-1 text-xs bg-gray-700 px-2 py-1 rounded">
                <span>⌘</span>
                <span>B</span>
              </div>
            </div>
            {/* Tooltip arrow */}
            <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  )
}