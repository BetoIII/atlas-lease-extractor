"use client"

import { useEffect, useCallback } from "react"

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean  // Command key on Mac
  shiftKey?: boolean
  altKey?: boolean
  callback: () => void
  description: string
  disabled?: boolean
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Don't trigger shortcuts when user is typing in inputs
    const activeElement = document.activeElement
    if (
      activeElement?.tagName === 'INPUT' ||
      activeElement?.tagName === 'TEXTAREA' ||
      activeElement?.getAttribute('contenteditable') === 'true'
    ) {
      return
    }

    for (const shortcut of shortcuts) {
      if (shortcut.disabled) continue

      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey
      const metaMatches = !!shortcut.metaKey === event.metaKey
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey
      const altMatches = !!shortcut.altKey === event.altKey

      if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
        event.preventDefault()
        event.stopPropagation()
        shortcut.callback()
        break
      }
    }
  }, [shortcuts, enabled])

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enabled])

  return shortcuts
}

// Common document shortcuts
export const createDocumentShortcuts = ({
  onUpload,
  onSearch,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onExport,
  onRefresh,
  onToggleView
}: {
  onUpload?: () => void
  onSearch?: () => void
  onSelectAll?: () => void
  onDeselectAll?: () => void
  onDelete?: () => void
  onExport?: () => void
  onRefresh?: () => void
  onToggleView?: () => void
}): KeyboardShortcut[] => {
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  return [
    // Upload new document
    ...(onUpload ? [{
      key: 'n',
      ctrlKey: !isMac,
      metaKey: isMac,
      callback: onUpload,
      description: `${isMac ? '⌘' : 'Ctrl'}+N - Upload new document`
    }] : []),

    // Focus search
    ...(onSearch ? [{
      key: 'k',
      ctrlKey: !isMac,
      metaKey: isMac,
      callback: onSearch,
      description: `${isMac ? '⌘' : 'Ctrl'}+K - Focus search`
    }] : []),

    // Select all
    ...(onSelectAll ? [{
      key: 'a',
      ctrlKey: !isMac,
      metaKey: isMac,
      callback: onSelectAll,
      description: `${isMac ? '⌘' : 'Ctrl'}+A - Select all documents`
    }] : []),

    // Deselect all
    ...(onDeselectAll ? [{
      key: 'Escape',
      callback: onDeselectAll,
      description: 'Escape - Deselect all documents'
    }] : []),

    // Delete selected
    ...(onDelete ? [{
      key: 'Delete',
      callback: onDelete,
      description: 'Delete - Delete selected documents'
    }, {
      key: 'Backspace',
      callback: onDelete,
      description: 'Backspace - Delete selected documents'
    }] : []),

    // Export
    ...(onExport ? [{
      key: 'e',
      ctrlKey: !isMac,
      metaKey: isMac,
      callback: onExport,
      description: `${isMac ? '⌘' : 'Ctrl'}+E - Export selected documents`
    }] : []),

    // Refresh
    ...(onRefresh ? [{
      key: 'r',
      ctrlKey: !isMac,
      metaKey: isMac,
      callback: onRefresh,
      description: `${isMac ? '⌘' : 'Ctrl'}+R - Refresh document list`
    }] : []),

    // Toggle view
    ...(onToggleView ? [{
      key: 'v',
      ctrlKey: !isMac,
      metaKey: isMac,
      callback: onToggleView,
      description: `${isMac ? '⌘' : 'Ctrl'}+V - Toggle view mode`
    }] : [])
  ]
}

// Hook for displaying shortcuts help
export function useShortcutsHelp(shortcuts: KeyboardShortcut[]) {
  const showHelp = useCallback(() => {
    const helpContent = shortcuts
      .filter(s => !s.disabled)
      .map(s => s.description)
      .join('\n')
    
    alert(`Keyboard Shortcuts:\n\n${helpContent}`)
  }, [shortcuts])

  // Show help with ? key
  useKeyboardShortcuts({
    shortcuts: [{
      key: '?',
      callback: showHelp,
      description: '? - Show keyboard shortcuts'
    }]
  })

  return { showHelp }
}