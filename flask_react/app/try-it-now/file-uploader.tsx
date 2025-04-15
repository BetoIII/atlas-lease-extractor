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

export function FileUploader({ onFileUpload, isProcessing }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
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

    // Simulate upload progress
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setUploadProgress(progress)

      if (progress >= 100) {
        clearInterval(interval)
        onFileUpload(selectedFile)
      }
    }, 200)
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {!file ? (
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
            <input type="file" ref={fileInputRef} onChange={handleFileInput} accept=".pdf" className="hidden" />
            <p className="text-xs text-gray-500">Supported formats: PDF</p>
          </div>
        </div>
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

          {uploadProgress < 100 && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="h-2" />
              <p className="mt-1 text-xs text-gray-500">Uploading: {uploadProgress}%</p>
            </div>
          )}

          {uploadProgress === 100 && isProcessing && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing document...
              </p>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border p-4 bg-gray-50">
        <h3 className="text-sm font-medium mb-2">Sample Documents</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <FileText className="h-4 w-4 text-gray-500" />
            <button
              className="text-sm text-primary hover:underline"
              onClick={() => {
                const mockFile = new File([""], "Sample Office Lease.pdf", { type: "application/pdf" })
                handleFile(mockFile)
              }}
            >
              Sample Office Lease.pdf
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <FileText className="h-4 w-4 text-gray-500" />
            <button
              className="text-sm text-primary hover:underline"
              onClick={() => {
                const mockFile = new File([""], "Sample Retail Lease.pdf", { type: "application/pdf" })
                handleFile(mockFile)
              }}
            >
              Sample Retail Lease.pdf
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
