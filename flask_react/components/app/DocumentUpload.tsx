"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, FileText, X, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@atlas/ui"
import { Progress } from "@atlas/ui"
import { Alert, AlertDescription } from "@atlas/ui"
import { cn } from "@/lib/utils"

interface UploadFile extends File {
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

interface DocumentUploadProps {
  onUploadComplete?: (files: File[]) => void
  maxFiles?: number
  maxSize?: number // in MB
  acceptedTypes?: string[]
  className?: string
}

export function DocumentUpload({
  onUploadComplete,
  maxFiles = 10,
  maxSize = 50,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
  className
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedTypes.includes(fileExtension)) {
      return `File type ${fileExtension} is not supported. Accepted types: ${acceptedTypes.join(', ')}`
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSize) {
      return `File size (${fileSizeMB.toFixed(1)}MB) exceeds maximum allowed size of ${maxSize}MB`
    }

    return null
  }

  const processFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadFile[] = []
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      const error = validateFile(file)
      
      const fileWithMetadata: UploadFile = Object.assign(file, {
        id: `${file.name}-${Date.now()}-${i}`,
        progress: 0,
        status: (error ? 'error' : 'pending') as 'pending' | 'uploading' | 'success' | 'error',
        error: error || undefined
      })
      
      newFiles.push(fileWithMetadata)
    }

    setFiles(prev => {
      const combined = [...prev, ...newFiles]
      if (combined.length > maxFiles) {
        return combined.slice(0, maxFiles)
      }
      return combined
    })

    // Start uploading valid files
    newFiles.forEach(file => {
      if (file.status === 'pending') {
        uploadFile(file)
      }
    })
  }, [maxFiles])

  const uploadFile = async (file: UploadFile) => {
    setFiles(prev => prev.map(f => 
      f.id === file.id ? { ...f, status: 'uploading' as const } : f
    ))

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, progress } : f
        ))
      }

      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'success' as const } : f
      ))

      // Call completion handler
      const successfulFiles = files.filter(f => f.status === 'success')
      if (successfulFiles.length > 0 && onUploadComplete) {
        onUploadComplete(successfulFiles)
      }
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { 
          ...f, 
          status: 'error' as const, 
          error: 'Upload failed. Please try again.' 
        } : f
      ))
    }
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files)
    }
  }, [processFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files)
    }
  }, [processFiles])

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const clearAll = () => {
    setFiles([])
  }

  const retryFile = (file: UploadFile) => {
    if (file.status === 'error') {
      uploadFile(file)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragOver 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Upload Documents</h3>
          <p className="text-muted-foreground mt-1">
            Drag and drop files here, or{" "}
            <button 
              type="button"
              onClick={openFileDialog}
              className="text-primary hover:underline font-medium"
            >
              browse files
            </button>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Supported formats: {acceptedTypes.join(', ')} • Max {maxSize}MB per file • Up to {maxFiles} files
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Files ({files.length})</h4>
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2">
                      {file.status === 'success' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {file.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-1">
                    <p className="text-xs text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(1)}MB
                    </p>
                    
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="mt-2" />
                    )}
                    
                    {file.status === 'error' && file.error && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {file.error}
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto ml-2"
                            onClick={() => retryFile(file)}
                          >
                            Retry
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}