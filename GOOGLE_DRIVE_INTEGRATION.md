# Google Drive Integration for Atlas Lease Extractor

This document describes the Google Drive integration feature that allows users to import lease documents directly from their Google Drive into the Atlas RAG pipeline.

## Overview

The Google Drive integration provides a seamless way for users to:
- Connect their Google Drive account via OAuth 2.0
- Browse and select files/folders from their Drive
- Automatically sync documents to the Atlas RAG pipeline
- Track sync status and manage imported documents

## Architecture

### Backend Components

1. **google_drive_auth.py**
   - Handles OAuth 2.0 authentication flow
   - Manages access/refresh tokens
   - Token storage and refresh logic

2. **google_drive_ingestion.py**
   - Lists files and folders from Google Drive
   - Downloads files with proper format conversion
   - Handles Google Docs/Sheets export to processable formats
   - Batch file processing capabilities

3. **Database Models** (in database.py)
   - `GoogleDriveFile`: Tracks synced files
   - `GoogleDriveSync`: Audit trail of sync operations

4. **Flask Endpoints** (in flask_server.py)
   - `/api/google-drive/auth/url` - Get OAuth URL
   - `/api/google-drive/auth/callback` - Handle OAuth callback
   - `/api/google-drive/auth/status` - Check auth status
   - `/api/google-drive/files` - List Drive files
   - `/api/google-drive/folders` - Get folder tree
   - `/api/google-drive/sync` - Sync selected files
   - `/api/google-drive/synced-files` - Get synced files
   - `/api/google-drive/refresh/<id>` - Refresh single file
   - `/api/google-drive/disconnect` - Disconnect Drive

### Frontend Components

1. **GoogleDriveConnector.tsx**
   - "Add Google Drive" button component
   - Handles OAuth popup flow
   - Shows connection status

2. **GoogleDriveFilePicker.tsx**
   - Modal interface for browsing Drive
   - Folder tree navigation
   - Multi-select for files/folders
   - File type filtering

3. **Documents Page Enhancement**
   - Integrated Google Drive button
   - Shows Drive sync status icons
   - Automatic refresh after import

## Setup Instructions

### 1. Google Cloud Console Setup

1. Create a new project in Google Cloud Console
2. Enable Google Drive API
3. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:5601/api/google-drive/auth/callback`
4. Download credentials and note the Client ID and Secret

### 2. Environment Configuration

Add to your `.env` file:
```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5601/api/google-drive/auth/callback
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

The following packages are required:
- google-auth>=2.23.0
- google-auth-oauthlib>=1.1.0
- google-auth-httplib2>=0.1.1
- google-api-python-client>=2.100.0

### 4. Database Migration

The Google Drive tables will be created automatically when the Flask server starts. If you need to create them manually:

```python
from database import db_manager
db_manager.create_tables()
```

## User Workflow

1. **Connect Google Drive**
   - User clicks "Add Google Drive" button in My Documents
   - OAuth popup opens for Google authentication
   - User grants permissions to access Drive files

2. **Select Files**
   - File picker modal opens showing Drive folder structure
   - User can browse folders and select files/folders
   - Supported formats: PDF, Word, Excel, Google Docs/Sheets

3. **Import Process**
   - Selected files are downloaded to server
   - Google Docs exported as text, Sheets as CSV
   - Files are indexed in the RAG pipeline
   - Progress tracked in database

4. **View Imported Files**
   - Files appear in My Documents with cloud icon
   - Sync status shown (synced/syncing/failed)
   - Option to refresh individual files

## File Type Support

### Native Google Formats
- Google Docs → Exported as text/plain
- Google Sheets → Exported as CSV
- Google Slides → Exported as PDF

### Standard Formats
- PDF files
- Word documents (.doc, .docx)
- Excel files (.xls, .xlsx)
- Text files (.txt)
- CSV files

## Security Considerations

1. **Token Storage**
   - Tokens stored encrypted in production
   - Refresh tokens used to maintain access
   - Tokens expire after 6 months of inactivity

2. **Permissions**
   - Only read access requested
   - User can revoke access anytime
   - Per-user isolation of files

3. **Data Privacy**
   - Files stored in user-specific directories
   - No cross-user file access
   - Original Drive permissions not replicated

## Troubleshooting

### Common Issues

1. **Authentication Fails**
   - Check Google Cloud Console credentials
   - Verify redirect URI matches exactly
   - Ensure all required APIs are enabled

2. **Files Not Syncing**
   - Check file format is supported
   - Verify index server is running
   - Check error logs for specific issues

3. **Token Expired**
   - Tokens auto-refresh if refresh token valid
   - User may need to re-authenticate after 6 months

### Debug Mode

Enable debug logging:
```python
import logging
logging.getLogger('google_drive_auth').setLevel(logging.DEBUG)
logging.getLogger('google_drive_ingestion').setLevel(logging.DEBUG)
```

## Future Enhancements

1. **Automated Sync**
   - Webhook-based real-time updates
   - Scheduled sync options
   - Change detection

2. **Advanced Features**
   - Shared drive support
   - Team drives integration
   - Selective sync by file type

3. **Performance**
   - Parallel file downloads
   - Incremental sync
   - Compression for large files

## Testing

Run the test suite:
```bash
pytest tests/test_google_drive_integration.py -v
```

Key test areas:
- OAuth flow
- File listing and filtering
- Download and conversion
- Database operations
- API endpoints
