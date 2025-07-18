"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FileText, Upload, CheckCircle, Loader2 } from "lucide-react"

interface FileUploaderProps {
  onFileUpload: (file: File) => void
  isProcessing: boolean
}

// Custom PDF and Excel icons using SVG
const PdfIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#ef4444" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2v6h6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="12" y="16" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">PDF</text>
  </svg>
)

const ExcelIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#22c55e" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2v6h6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="12" y="16" textAnchor="middle" fontSize="5" fill="white" fontWeight="bold">XLS</text>
  </svg>
)

export function FileUploader({ onFileUpload, isProcessing }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [indexProgress, setIndexProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    // Check if this is a sample file being dragged
    const sampleFileData = e.dataTransfer.getData("text/plain")
    if (sampleFileData === "sample-lease") {
      handleSampleFile("Sample Office Lease.pdf", "application/pdf")
      return
    } else if (sampleFileData === "sample-rentroll") {
      handleSampleFile("Sample Rent Roll.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      return
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      handleFile(droppedFile)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      handleFile(selectedFile)
    }
  }

  const handleFile = (selectedFile: File) => {
    setFile(selectedFile)

    // Simulate index progress
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setIndexProgress(progress)

      if (progress >= 100) {
        clearInterval(interval)
        onFileUpload(selectedFile)
      }
    }, 200)
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleSampleFile = (fileName: string, fileType: string) => {
    // Create a mock file with a special marker to identify it as a sample
    const mockFile = new File(["sample"], fileName, { type: fileType })
    // Add a property to mark this as a sample file
    Object.defineProperty(mockFile, 'isSample', { value: true })
    handleFile(mockFile)
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? "border-primary bg-primary/5" : "border-gray-300"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-base font-medium">Drag and drop your file here</p>
                <p className="text-sm text-gray-500">or click to browse files</p>
              </div>
              <Button variant="outline" onClick={handleButtonClick}>
                Select File
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileInput} accept=".pdf,.xlsx,.xls" className="hidden" />
              <p className="text-xs text-gray-500">Supported formats: PDF, Excel</p>
            </div>
          </div>

          <div className="rounded-lg border p-4 bg-gray-50">
            <h3 className="text-sm font-medium mb-2">Sample Documents</h3>
            <p className="text-xs text-gray-500 mb-3">Click to use or drag into the upload area above</p>
            <div className="space-y-2">
                             <div 
                 className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-colors"
                 draggable
                 onDragStart={(e) => {
                   e.dataTransfer.setData("text/plain", "sample-lease")
                   e.dataTransfer.effectAllowed = "copy"
                 }}
               >
                 <PdfIcon />
                 <button
                   className="text-sm text-primary hover:underline"
                   onClick={() => handleSampleFile("Sample Office Lease.pdf", "application/pdf")}
                 >
                   Sample Office Lease.pdf
                 </button>
               </div>
               <div 
                 className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-colors"
                 draggable
                 onDragStart={(e) => {
                   e.dataTransfer.setData("text/plain", "sample-rentroll")
                   e.dataTransfer.effectAllowed = "copy"
                 }}
               >
                 <ExcelIcon />
                 <button
                   className="text-sm text-primary hover:underline"
                   onClick={() => handleSampleFile("Sample Rent Roll.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
                 >
                   Sample Rent Roll.xlsx
                 </button>
               </div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border p-4">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-primary/10 p-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>

          {indexProgress < 100 && (
            <div className="mt-4">
              <Progress value={indexProgress} className="h-2" />
              <p className="mt-1 text-xs text-gray-500">Indexing: {indexProgress}%</p>
            </div>
          )}

          {indexProgress === 100 && isProcessing && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing document...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
