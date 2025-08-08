"use client"

import { useEffect, useRef, useState } from "react"
import { ZoomIn, ZoomOut, Download } from "lucide-react"
import { Button } from "@/components/ui"
import { Viewer } from '@react-pdf-viewer/core'
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'
import { highlightPlugin, Trigger } from '@react-pdf-viewer/highlight'
import dynamic from 'next/dynamic'

// Import the styles
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'
import '@react-pdf-viewer/highlight/lib/styles/index.css'

// Dynamically import the Worker component
const Worker = dynamic(
  () => import('@react-pdf-viewer/core').then((mod) => mod.Worker),
  { ssr: false }
)

interface PdfViewerProps {
  fileName: string
  page: number
  highlight: {
    x: number
    y: number
    width: number
    height: number
  }
}

export function PdfViewer({ fileName, page, highlight }: PdfViewerProps) {
  const [zoom, setZoom] = useState(100)
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)

  // Create the default layout plugin instance
  const defaultLayoutPluginInstance = defaultLayoutPlugin()

  // Create the highlight plugin instance
  const highlightPluginInstance = highlightPlugin({
    trigger: Trigger.None, // Disable manual highlighting
  })

  // Effect to handle highlighting and page navigation
  useEffect(() => {
    if (viewerRef.current) {
      // Jump to the specified page
      viewerRef.current.setPageNumber(page)

      // Add highlight
      if (highlight) {
        const highlightArea = {
          pageIndex: page - 1, // PDF pages are 0-indexed
          left: highlight.x,
          top: highlight.y,
          width: highlight.width,
          height: highlight.height,
        }
        highlightPluginInstance.jumpToHighlightArea(highlightArea)
      }
    }
  }, [page, highlight])

  // Handle zoom changes
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50))
  }

  // Get just the filename from the path if it's a full path
  const getFileName = (path: string) => {
    return path.split('/').pop() || path
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b p-2">
        <div className="text-sm font-medium">
          {getFileName(fileName)} - Page {page}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 50}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm">{zoom}%</span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 200}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-100">
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <div style={{ height: '100%' }}>
            <Viewer
              fileUrl={`/api/pdf/${encodeURIComponent(getFileName(fileName))}`}
              defaultScale={zoom / 100}
              plugins={[defaultLayoutPluginInstance, highlightPluginInstance]}
              ref={viewerRef}
            />
          </div>
        </Worker>
      </div>
    </div>
  )
}
