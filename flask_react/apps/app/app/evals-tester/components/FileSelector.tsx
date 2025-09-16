"use client"

import { useState } from "react"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui"
import { Button } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Card, CardContent } from "@/components/ui"
import { 
  FileText, 
  Upload, 
  Folder, 
  RefreshCw,
  FileCheck,
  HardDrive
} from "lucide-react"

interface AvailableFile {
  path: string
  name: string
  size: number
  directory: string
}

interface FileSelectorProps {
  availableFiles: AvailableFile[]
  value: string
  onChange: (filePath: string) => void
  onRefresh?: () => void
}

export function FileSelector({ 
  availableFiles, 
  value, 
  onChange, 
  onRefresh 
}: FileSelectorProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getDirectoryBadgeColor = (directory: string) => {
    switch (directory) {
      case 'uploaded_documents':
        return 'bg-blue-100 text-blue-800'
      case 'sample_documents':
        return 'bg-green-100 text-green-800'
      case 'test_files':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const selectedFile = availableFiles.find(f => f.path === value)
  const groupedFiles = availableFiles.reduce((acc, file) => {
    if (!acc[file.directory]) {
      acc[file.directory] = []
    }
    acc[file.directory].push(file)
    return acc
  }, {} as Record<string, AvailableFile[]>)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a file for testing">
              {selectedFile ? (
                <div className="flex items-center gap-2 w-full">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="font-medium truncate max-w-full">
                      {selectedFile.name}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Badge className={getDirectoryBadgeColor(selectedFile.directory)}>
                        {selectedFile.directory}
                      </Badge>
                      <span>{formatFileSize(selectedFile.size)}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {Object.keys(groupedFiles).length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No files available</p>
                <p className="text-xs">Upload documents to get started</p>
              </div>
            ) : (
              Object.entries(groupedFiles).map(([directory, files]) => (
                <div key={directory}>
                  {/* Directory Header */}
                  <div className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 flex items-center gap-1">
                    <Folder className="h-3 w-3" />
                    {directory.replace('_', ' ')}
                  </div>
                  
                  {/* Files in Directory */}
                  {files.map((file) => (
                    <SelectItem key={file.path} value={file.path}>
                      <div className="flex items-center gap-2 w-full min-w-0">
                        <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <div className="flex flex-col items-start min-w-0 flex-1">
                          <span className="font-medium truncate max-w-full">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              ))
            )}
          </SelectContent>
        </Select>

        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>

      {/* File Info Card */}
      {selectedFile && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <FileCheck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-900">
                    {selectedFile.name}
                  </span>
                  <Badge className={getDirectoryBadgeColor(selectedFile.directory)}>
                    {selectedFile.directory.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-blue-700">
                  <div className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    <span>{formatFileSize(selectedFile.size)}</span>
                  </div>
                  <div className="truncate">
                    <span className="font-mono text-blue-600">
                      {selectedFile.path}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {availableFiles.length} file{availableFiles.length !== 1 ? 's' : ''} available
        </span>
        {availableFiles.length > 0 && (
          <span>
            Total: {formatFileSize(availableFiles.reduce((sum, f) => sum + f.size, 0))}
          </span>
        )}
      </div>

      {/* Upload hint */}
      {availableFiles.length === 0 && (
        <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-1">No test files available</p>
          <p className="text-xs text-gray-500">
            Upload documents using the main application to make them available for testing
          </p>
        </div>
      )}
    </div>
  )
}