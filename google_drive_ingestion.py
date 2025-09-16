"""
Google Drive file ingestion and synchronization
"""
import os
import io
import tempfile
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from googleapiclient.errors import HttpError
from google_drive_auth import GoogleDriveAuth

logger = logging.getLogger(__name__)

class GoogleDriveIngestion:
    """Handles downloading and processing files from Google Drive"""
    
    # Supported MIME types and their export formats
    GOOGLE_DOCS_EXPORT_FORMATS = {
        'application/vnd.google-apps.document': 'text/plain',
        'application/vnd.google-apps.spreadsheet': 'text/csv',
        'application/vnd.google-apps.presentation': 'application/pdf'
    }
    
    # File types we can process
    SUPPORTED_MIME_TYPES = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ] + list(GOOGLE_DOCS_EXPORT_FORMATS.keys())
    
    def __init__(self, auth_manager: GoogleDriveAuth):
        self.auth_manager = auth_manager
        self.temp_dir = os.path.join(tempfile.gettempdir(), 'atlas_gdrive_temp')
        os.makedirs(self.temp_dir, exist_ok=True)
    
    def list_files(self, user_id: str, folder_id: Optional[str] = None, 
                   page_size: int = 100, page_token: Optional[str] = None) -> Dict[str, Any]:
        """List files in user's Google Drive or specific folder"""
        credentials = self.auth_manager.get_credentials(user_id)
        if not credentials:
            raise ValueError("User not authenticated with Google Drive")
        
        try:
            service = build('drive', 'v3', credentials=credentials)
            
            # Build query
            query_parts = [
                "trashed = false",
                f"mimeType != 'application/vnd.google-apps.folder'"  # Exclude folders from file list
            ]
            
            if folder_id:
                query_parts.append(f"'{folder_id}' in parents")
            
            query = " and ".join(query_parts)
            
            # Request files
            results = service.files().list(
                q=query,
                pageSize=page_size,
                pageToken=page_token,
                fields="nextPageToken, files(id, name, mimeType, size, modifiedTime, parents, webViewLink)",
                orderBy="modifiedTime desc"
            ).execute()
            
            files = results.get('files', [])
            
            # Filter to only supported types
            supported_files = [
                f for f in files 
                if f.get('mimeType') in self.SUPPORTED_MIME_TYPES
            ]
            
            return {
                'files': supported_files,
                'nextPageToken': results.get('nextPageToken'),
                'totalFiles': len(supported_files)
            }
            
        except HttpError as error:
            logger.error(f"Error listing files: {error}")
            raise
    
    def list_folders(self, user_id: str, parent_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """List folders in user's Google Drive"""
        credentials = self.auth_manager.get_credentials(user_id)
        if not credentials:
            raise ValueError("User not authenticated with Google Drive")
        
        try:
            service = build('drive', 'v3', credentials=credentials)
            
            # Build query for folders only
            query_parts = [
                "mimeType = 'application/vnd.google-apps.folder'",
                "trashed = false"
            ]
            
            if parent_id:
                query_parts.append(f"'{parent_id}' in parents")
            else:
                query_parts.append("'root' in parents")
            
            query = " and ".join(query_parts)
            
            results = service.files().list(
                q=query,
                fields="files(id, name, parents)",
                orderBy="name"
            ).execute()
            
            return results.get('files', [])
            
        except HttpError as error:
            logger.error(f"Error listing folders: {error}")
            raise
    
    def get_folder_tree(self, user_id: str) -> Dict[str, Any]:
        """Get complete folder tree structure"""
        credentials = self.auth_manager.get_credentials(user_id)
        if not credentials:
            raise ValueError("User not authenticated with Google Drive")
        
        try:
            service = build('drive', 'v3', credentials=credentials)
            
            # Get all folders at once
            results = service.files().list(
                q="mimeType = 'application/vnd.google-apps.folder' and trashed = false",
                fields="files(id, name, parents)",
                pageSize=1000  # Get as many as possible
            ).execute()
            
            folders = results.get('files', [])
            
            # Build tree structure
            folder_map = {f['id']: f for f in folders}
            root_folders = []
            
            for folder in folders:
                folder['children'] = []
                
                if 'parents' not in folder or not folder['parents']:
                    root_folders.append(folder)
                else:
                    parent_id = folder['parents'][0]
                    if parent_id in folder_map:
                        # Ensure parent folder has children array initialized
                        if 'children' not in folder_map[parent_id]:
                            folder_map[parent_id]['children'] = []
                        folder_map[parent_id]['children'].append(folder)
                    else:
                        # Parent folder not accessible or doesn't exist in our list
                        # Treat as root-level folder
                        root_folders.append(folder)
            
            # Add root folder
            root = {
                'id': 'root',
                'name': 'My Drive',
                'children': root_folders
            }
            
            return root
            
        except HttpError as error:
            logger.error(f"HttpError getting folder tree: {error}")
            logger.error(f"HttpError details: {error.error_details if hasattr(error, 'error_details') else 'No details'}")
            raise
        except Exception as error:
            logger.error(f"Unexpected error getting folder tree: {error}")
            logger.error(f"Error type: {type(error)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
    
    def download_file(self, user_id: str, file_id: str, file_metadata: Dict[str, Any]) -> Tuple[str, str]:
        """Download a file from Google Drive and return local path and original filename"""
        credentials = self.auth_manager.get_credentials(user_id)
        if not credentials:
            raise ValueError("User not authenticated with Google Drive")
        
        try:
            service = build('drive', 'v3', credentials=credentials)
            
            mime_type = file_metadata.get('mimeType', '')
            file_name = file_metadata.get('name', f'file_{file_id}')
            
            # Determine if we need to export (Google Docs) or download
            if mime_type in self.GOOGLE_DOCS_EXPORT_FORMATS:
                # Export Google Docs/Sheets/Slides
                export_mime_type = self.GOOGLE_DOCS_EXPORT_FORMATS[mime_type]
                request = service.files().export_media(
                    fileId=file_id,
                    mimeType=export_mime_type
                )
                
                # Update file extension based on export type
                if export_mime_type == 'text/plain':
                    file_name = os.path.splitext(file_name)[0] + '.txt'
                elif export_mime_type == 'text/csv':
                    file_name = os.path.splitext(file_name)[0] + '.csv'
                elif export_mime_type == 'application/pdf':
                    file_name = os.path.splitext(file_name)[0] + '.pdf'
            else:
                # Download regular files
                request = service.files().get_media(fileId=file_id)
            
            # Download to temp file
            temp_path = os.path.join(self.temp_dir, f"{user_id}_{file_id}_{file_name}")
            
            fh = io.FileIO(temp_path, 'wb')
            downloader = MediaIoBaseDownload(fh, request)
            
            done = False
            while not done:
                status, done = downloader.next_chunk()
                if status:
                    logger.info(f"Download {int(status.progress() * 100)}% complete.")
            
            logger.info(f"Downloaded file: {file_name} to {temp_path}")
            return temp_path, file_name
            
        except HttpError as error:
            logger.error(f"Error downloading file {file_id}: {error}")
            raise
    
    def batch_download_files(self, user_id: str, file_ids: List[str]) -> List[Dict[str, Any]]:
        """Download multiple files and return their paths and metadata"""
        credentials = self.auth_manager.get_credentials(user_id)
        if not credentials:
            raise ValueError("User not authenticated with Google Drive")
        
        results = []
        service = build('drive', 'v3', credentials=credentials)
        
        for file_id in file_ids:
            try:
                # Get file metadata
                file_metadata = service.files().get(
                    fileId=file_id,
                    fields="id, name, mimeType, size, modifiedTime, webViewLink"
                ).execute()
                
                # Skip unsupported files
                if file_metadata.get('mimeType') not in self.SUPPORTED_MIME_TYPES:
                    logger.warning(f"Skipping unsupported file type: {file_metadata.get('mimeType')}")
                    continue
                
                # Download file
                local_path, original_name = self.download_file(user_id, file_id, file_metadata)
                
                results.append({
                    'file_id': file_id,
                    'original_name': original_name,
                    'local_path': local_path,
                    'mime_type': file_metadata.get('mimeType'),
                    'size': file_metadata.get('size'),
                    'modified_time': file_metadata.get('modifiedTime'),
                    'web_view_link': file_metadata.get('webViewLink'),
                    'status': 'success'
                })
                
            except Exception as e:
                logger.error(f"Failed to download file {file_id}: {str(e)}")
                results.append({
                    'file_id': file_id,
                    'status': 'error',
                    'error': str(e)
                })
        
        return results
    
    def get_files_in_folders(self, user_id: str, folder_ids: List[str]) -> List[Dict[str, Any]]:
        """Get all supported files in specified folders (recursive)"""
        credentials = self.auth_manager.get_credentials(user_id)
        if not credentials:
            raise ValueError("User not authenticated with Google Drive")
        
        service = build('drive', 'v3', credentials=credentials)
        all_files = []
        processed_folders = set()
        
        def process_folder(folder_id: str):
            if folder_id in processed_folders:
                return
            processed_folders.add(folder_id)
            
            try:
                # Get files in this folder
                page_token = None
                while True:
                    results = service.files().list(
                        q=f"'{folder_id}' in parents and trashed = false",
                        pageSize=100,
                        pageToken=page_token,
                        fields="nextPageToken, files(id, name, mimeType, size, modifiedTime, parents, webViewLink)"
                    ).execute()
                    
                    files = results.get('files', [])
                    
                    for file in files:
                        if file.get('mimeType') == 'application/vnd.google-apps.folder':
                            # Recursively process subfolders
                            process_folder(file['id'])
                        elif file.get('mimeType') in self.SUPPORTED_MIME_TYPES:
                            all_files.append(file)
                    
                    page_token = results.get('nextPageToken')
                    if not page_token:
                        break
                        
            except HttpError as error:
                logger.error(f"Error processing folder {folder_id}: {error}")
        
        # Process all requested folders
        for folder_id in folder_ids:
            process_folder(folder_id)
        
        return all_files
    
    def cleanup_temp_files(self, file_paths: List[str]):
        """Clean up temporary downloaded files"""
        for file_path in file_paths:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.info(f"Cleaned up temp file: {file_path}")
            except Exception as e:
                logger.error(f"Failed to clean up {file_path}: {str(e)}")
