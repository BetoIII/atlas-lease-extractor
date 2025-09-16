'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2,
  File,
  Folder,
  ChevronRight,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  FileIcon,
} from 'lucide-react';

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

interface FolderNode {
  id: string;
  name: string;
  children: FolderNode[];
  expanded?: boolean;
}

interface GoogleDriveFilePickerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onFilesSelected: (fileIds: string[], folderIds: string[]) => void;
}

export function GoogleDriveFilePicker({
  isOpen,
  onClose,
  userId,
  onFilesSelected,
}: GoogleDriveFilePickerProps) {
  const [folderTree, setFolderTree] = useState<FolderNode | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [filesInFolder, setFilesInFolder] = useState<Map<string, GoogleDriveFile[]>>(new Map());
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadFolderTree();
    }
  }, [isOpen, userId]);

  const loadFolderTree = async () => {
    try {
      const response = await fetch(`http://localhost:5601/api/google-drive/folders?user_id=${userId}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setFolderTree(data.folder_tree);
        // Load root folder files
        loadFilesForFolder('root');
      }
    } catch (error) {
      console.error('Failed to load folder tree:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Google Drive folders.',
        variant: 'destructive',
      });
    } finally {
      setLoadingFolders(false);
    }
  };

  const loadFilesForFolder = async (folderId: string) => {
    if (filesInFolder.has(folderId) || loadingFiles.has(folderId)) {
      return;
    }

    setLoadingFiles(prev => new Set(prev).add(folderId));

    try {
      const response = await fetch(
        `http://localhost:5601/api/google-drive/files?user_id=${userId}&folder_id=${folderId === 'root' ? '' : folderId}`
      );
      const data = await response.json();
      
      if (data.status === 'success') {
        setFilesInFolder(prev => new Map(prev).set(folderId, data.files));
      }
    } catch (error) {
      console.error(`Failed to load files for folder ${folderId}:`, error);
    } finally {
      setLoadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(folderId);
        return newSet;
      });
    }
  };

  const toggleFolder = (folder: FolderNode) => {
    folder.expanded = !folder.expanded;
    setFolderTree({ ...folderTree! });
    
    if (folder.expanded && !filesInFolder.has(folder.id)) {
      loadFilesForFolder(folder.id);
    }
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const toggleFolderSelection = (folderId: string) => {
    const newSelection = new Set(selectedFolders);
    if (newSelection.has(folderId)) {
      newSelection.delete(folderId);
    } else {
      newSelection.add(folderId);
    }
    setSelectedFolders(newSelection);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('document')) return <FileText className="h-4 w-4" />;
    if (mimeType.includes('spreadsheet')) return <FileSpreadsheet className="h-4 w-4" />;
    if (mimeType === 'application/pdf') return <FileIcon className="h-4 w-4 text-red-600" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '';
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSync = async () => {
    if (selectedFiles.size === 0 && selectedFolders.size === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select at least one file or folder to import.',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);

    try {
      const response = await fetch('http://localhost:5601/api/google-drive/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          file_ids: Array.from(selectedFiles),
          folder_ids: Array.from(selectedFolders),
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast({
          title: 'Import started',
          description: `Processing ${data.files_processed} files. ${data.files_failed > 0 ? `${data.files_failed} failed.` : ''}`,
        });
        
        onFilesSelected(Array.from(selectedFiles), Array.from(selectedFolders));
        onClose();
      } else {
        throw new Error(data.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: 'Import failed',
        description: 'Failed to import files from Google Drive.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const renderFolder = (folder: FolderNode, level: number = 0) => {
    const files = filesInFolder.get(folder.id) || [];
    const isLoading = loadingFiles.has(folder.id);

    return (
      <div key={folder.id} className="w-full">
        <div
          className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer ${
            level > 0 ? `ml-${level * 4}` : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          <button
            onClick={() => toggleFolder(folder)}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {folder.expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          <Folder className="h-4 w-4 text-blue-600" />
          <span className="flex-1 text-sm">{folder.name}</span>
          {folder.id !== 'root' && (
            <Checkbox
              checked={selectedFolders.has(folder.id)}
              onCheckedChange={() => toggleFolderSelection(folder.id)}
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>

        {folder.expanded && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <>
                {/* Files in this folder */}
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100"
                    style={{ paddingLeft: `${(level + 1) * 16 + 24}px` }}
                  >
                    {getFileIcon(file.mimeType)}
                    <span className="flex-1 text-sm truncate">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </span>
                    <Checkbox
                      checked={selectedFiles.has(file.id)}
                      onCheckedChange={() => toggleFileSelection(file.id)}
                    />
                  </div>
                ))}

                {/* Subfolders */}
                {folder.children.map((child) => renderFolder(child, level + 1))}
              </>
            )}
          </>
        )}
      </div>
    );
  };

  const totalSelected = selectedFiles.size + selectedFolders.size;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Import from Google Drive</DialogTitle>
          <DialogDescription>
            Select files and folders to import into Atlas. Supported formats: PDF, Word, Excel, Google Docs, Sheets.
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-lg">
          <ScrollArea className="h-[400px] w-full">
            {loadingFolders ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : folderTree ? (
              <div className="p-2">
                {renderFolder(folderTree)}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No folders found
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-gray-600">
              {totalSelected > 0 && `${totalSelected} item${totalSelected > 1 ? 's' : ''} selected`}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isSyncing}>
                Cancel
              </Button>
              <Button onClick={handleSync} disabled={isSyncing || totalSelected === 0}>
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${totalSelected > 0 ? `(${totalSelected})` : ''}`
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
