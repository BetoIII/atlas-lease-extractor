"use client"

import { useEffect, useRef, useState } from "react"
import { ZoomIn, ZoomOut, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  const highlightRef = useRef<HTMLDivElement>(null)

  // In a real app, we would use a PDF rendering library like pdf.js
  // For this demo, we'll simulate with a placeholder

  useEffect(() => {
    // Scroll to highlight after a short delay to ensure rendering
    const timer = setTimeout(() => {
      if (highlightRef.current && containerRef.current) {
        // Adjust for zoom level
        const zoomFactor = zoom / 100

        // Calculate position to center the highlight in the viewport
        const highlightTop = highlight.y * zoomFactor
        const containerHeight = containerRef.current.clientHeight
        const scrollPosition = highlightTop - containerHeight / 2 + (highlight.height * zoomFactor) / 2

        containerRef.current.scrollTop = Math.max(0, scrollPosition)

        // Animate the highlight
        highlightRef.current.classList.add("animate-pulse")
        setTimeout(() => {
          if (highlightRef.current) {
            highlightRef.current.classList.remove("animate-pulse")
          }
        }, 2000)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [highlight, page, zoom])

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b p-2">
        <div className="text-sm font-medium">
          {fileName} - Page {page}
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
      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-100 p-4">
        <div
          className="relative bg-white mx-auto shadow-lg"
          style={{
            width: `${8.5 * zoom}px`,
            height: `${11 * zoom}px`,
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
          }}
        >
          {/* Simulated PDF content */}
          <div className="absolute inset-0 p-8">
            <div className="w-full text-center mb-8 font-bold text-lg">COMMERCIAL LEASE AGREEMENT</div>

            {/* Mock content sections */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="font-bold">1. PREMISES</div>
                <div className="text-sm">
                  Landlord hereby leases to Tenant and Tenant hereby leases from Landlord those certain premises (the
                  "Premises") consisting of approximately 5,000 rentable square feet located at 123 Main Street, Suite
                  400, San Francisco, CA 94105.
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold">2. TERM</div>
                <div className="text-sm">
                  The term of this Lease shall commence on January 1, 2023 and shall expire on December 31, 2027, for a
                  total term of 60 months, unless sooner terminated pursuant to the provisions hereof.
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold">3. RENT</div>
                <div className="text-sm">
                  Tenant shall pay to Landlord as base rent for the Premises the sum of $45.00 per rentable square foot
                  annually, payable in equal monthly installments. Rent shall escalate at a rate of 3% annually on the
                  anniversary of the Commencement Date.
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold">4. SECURITY DEPOSIT</div>
                <div className="text-sm">
                  Upon execution of this Lease, Tenant shall deposit with Landlord the sum of $22,500 as security for
                  the faithful performance by Tenant of all the terms, covenants, and conditions of this Lease.
                </div>
              </div>
            </div>
          </div>

          {/* Highlight overlay */}
          <div
            ref={highlightRef}
            className="absolute bg-yellow-200 opacity-50 pointer-events-none transition-opacity duration-300"
            style={{
              left: `${highlight.x}px`,
              top: `${highlight.y}px`,
              width: `${highlight.width}px`,
              height: `${highlight.height}px`,
              transform: `scale(${100 / zoom})`,
              transformOrigin: "top left",
            }}
          />
        </div>
      </div>
    </div>
  )
}
