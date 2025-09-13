"""
Unit tests for Google Drive integration
"""
import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
from google_drive_auth import GoogleDriveAuth
from google_drive_ingestion import GoogleDriveIngestion
from database import GoogleDriveFile, GoogleDriveSync


class TestGoogleDriveAuth:
    """Test Google Drive authentication functionality"""
    
    @pytest.fixture
    def auth_manager(self):
        with patch.dict('os.environ', {
            'GOOGLE_CLIENT_ID': 'test_client_id',
            'GOOGLE_CLIENT_SECRET': 'test_client_secret',
            'GOOGLE_REDIRECT_URI': 'http://localhost:5601/callback'
        }):
            return GoogleDriveAuth()
    
    def test_init_without_credentials(self):
        """Test initialization fails without credentials"""
        with patch.dict('os.environ', {}, clear=True):
            with pytest.raises(ValueError, match="Google OAuth credentials not configured"):
                GoogleDriveAuth()
    
    def test_get_auth_url(self, auth_manager):
        """Test generation of OAuth authorization URL"""
        user_id = "test_user_123"
        auth_url = auth_manager.get_auth_url(user_id)
        
        assert isinstance(auth_url, str)
        assert "accounts.google.com/o/oauth2/auth" in auth_url
        assert "client_id=test_client_id" in auth_url
        assert "redirect_uri" in auth_url
        assert "scope" in auth_url
    
    @patch('google_drive_auth.Flow')
    def test_handle_callback_success(self, mock_flow_class, auth_manager):
        """Test successful OAuth callback handling"""
        # Mock Flow instance
        mock_flow = MagicMock()
        mock_flow_class.from_client_config.return_value = mock_flow
        
        # Mock credentials
        mock_credentials = MagicMock()
        mock_credentials.token = "test_token"
        mock_credentials.refresh_token = "test_refresh_token"
        mock_flow.credentials = mock_credentials
        
        # Mock Drive service
        with patch('google_drive_auth.build') as mock_build:
            mock_service = MagicMock()
            mock_about = MagicMock()
            mock_about.get.return_value.execute.return_value = {
                'user': {
                    'emailAddress': 'test@example.com',
                    'displayName': 'Test User'
                }
            }
            mock_service.about.return_value = mock_about
            mock_build.return_value = mock_service
            
            result = auth_manager.handle_callback("test_user", "auth_code_123")
            
            assert result['success'] is True
            assert result['user_email'] == 'test@example.com'
            assert result['display_name'] == 'Test User'
    
    def test_is_authenticated_no_credentials(self, auth_manager):
        """Test authentication check when no credentials exist"""
        assert auth_manager.is_authenticated("unknown_user") is False
    
    @patch('google_drive_auth.os.path.exists')
    @patch('builtins.open')
    def test_get_credentials_from_file(self, mock_open, mock_exists, auth_manager):
        """Test loading credentials from file storage"""
        mock_exists.return_value = True
        
        token_data = {
            'token': 'test_token',
            'refresh_token': 'test_refresh_token',
            'token_uri': 'https://oauth2.googleapis.com/token',
            'client_id': 'test_client_id',
            'client_secret': 'test_client_secret',
            'scopes': ['https://www.googleapis.com/auth/drive.readonly'],
            'expiry': datetime.utcnow().isoformat()
        }
        
        mock_open.return_value.__enter__.return_value.read.return_value = json.dumps(token_data)
        
        credentials = auth_manager.get_credentials("test_user")
        
        assert credentials is not None
        assert credentials.token == 'test_token'
        assert credentials.refresh_token == 'test_refresh_token'


class TestGoogleDriveIngestion:
    """Test Google Drive file ingestion functionality"""
    
    @pytest.fixture
    def auth_manager(self):
        return MagicMock(spec=GoogleDriveAuth)
    
    @pytest.fixture
    def ingestion_manager(self, auth_manager):
        return GoogleDriveIngestion(auth_manager)
    
    def test_list_files_not_authenticated(self, ingestion_manager, auth_manager):
        """Test listing files fails when not authenticated"""
        auth_manager.get_credentials.return_value = None
        
        with pytest.raises(ValueError, match="User not authenticated"):
            ingestion_manager.list_files("test_user")
    
    @patch('google_drive_ingestion.build')
    def test_list_files_success(self, mock_build, ingestion_manager, auth_manager):
        """Test successful file listing"""
        # Mock credentials
        mock_credentials = MagicMock()
        auth_manager.get_credentials.return_value = mock_credentials
        
        # Mock Drive service
        mock_service = MagicMock()
        mock_files = MagicMock()
        mock_files.list.return_value.execute.return_value = {
            'files': [
                {
                    'id': 'file1',
                    'name': 'test.pdf',
                    'mimeType': 'application/pdf',
                    'size': '1024',
                    'modifiedTime': '2024-01-01T00:00:00Z'
                },
                {
                    'id': 'file2',
                    'name': 'document.docx',
                    'mimeType': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'size': '2048',
                    'modifiedTime': '2024-01-02T00:00:00Z'
                }
            ],
            'nextPageToken': None
        }
        mock_service.files.return_value = mock_files
        mock_build.return_value = mock_service
        
        result = ingestion_manager.list_files("test_user")
        
        assert result['totalFiles'] == 2
        assert len(result['files']) == 2
        assert result['files'][0]['name'] == 'test.pdf'
        assert result['files'][1]['name'] == 'document.docx'
    
    @patch('google_drive_ingestion.build')
    def test_get_folder_tree(self, mock_build, ingestion_manager, auth_manager):
        """Test getting folder tree structure"""
        # Mock credentials
        mock_credentials = MagicMock()
        auth_manager.get_credentials.return_value = mock_credentials
        
        # Mock Drive service
        mock_service = MagicMock()
        mock_files = MagicMock()
        mock_files.list.return_value.execute.return_value = {
            'files': [
                {
                    'id': 'folder1',
                    'name': 'Documents',
                    'parents': ['root']
                },
                {
                    'id': 'folder2',
                    'name': 'Leases',
                    'parents': ['folder1']
                }
            ]
        }
        mock_service.files.return_value = mock_files
        mock_build.return_value = mock_service
        
        result = ingestion_manager.get_folder_tree("test_user")
        
        assert result['id'] == 'root'
        assert result['name'] == 'My Drive'
        assert 'children' in result
    
    @patch('google_drive_ingestion.MediaIoBaseDownload')
    @patch('google_drive_ingestion.io.FileIO')
    @patch('google_drive_ingestion.build')
    def test_download_file_success(self, mock_build, mock_fileio, mock_downloader, ingestion_manager, auth_manager):
        """Test successful file download"""
        # Mock credentials
        mock_credentials = MagicMock()
        auth_manager.get_credentials.return_value = mock_credentials
        
        # Mock Drive service
        mock_service = MagicMock()
        mock_request = MagicMock()
        mock_service.files.return_value.get_media.return_value = mock_request
        mock_build.return_value = mock_service
        
        # Mock downloader
        mock_downloader_instance = MagicMock()
        mock_downloader_instance.next_chunk.return_value = (None, True)
        mock_downloader.return_value = mock_downloader_instance
        
        # Mock file IO
        mock_fh = MagicMock()
        mock_fileio.return_value = mock_fh
        
        file_metadata = {
            'id': 'file123',
            'name': 'test.pdf',
            'mimeType': 'application/pdf'
        }
        
        local_path, filename = ingestion_manager.download_file("test_user", "file123", file_metadata)
        
        assert filename == 'test.pdf'
        assert 'test_user_file123_test.pdf' in local_path


class TestGoogleDriveFlaskEndpoints:
    """Test Flask endpoints for Google Drive integration"""
    
    @pytest.fixture
    def client(self, app):
        return app.test_client()
    
    @pytest.fixture
    def mock_auth(self):
        with patch('flask_server.google_auth') as mock:
            yield mock
    
    @pytest.fixture
    def mock_ingestion(self):
        with patch('flask_server.google_ingestion') as mock:
            yield mock
    
    def test_get_auth_url_no_user_id(self, client):
        """Test auth URL endpoint without user ID"""
        response = client.get('/api/google-drive/auth/url')
        assert response.status_code == 400
        assert response.json['error'] == 'User ID required'
    
    def test_get_auth_url_success(self, client, mock_auth):
        """Test successful auth URL generation"""
        mock_auth.get_auth_url.return_value = 'https://accounts.google.com/oauth/authorize?...'
        
        response = client.get('/api/google-drive/auth/url?user_id=test123')
        assert response.status_code == 200
        assert response.json['status'] == 'success'
        assert 'auth_url' in response.json
    
    def test_auth_callback_no_code(self, client):
        """Test auth callback without authorization code"""
        response = client.get('/api/google-drive/auth/callback')
        assert response.status_code == 400
        assert response.json['error'] == 'Authorization code not provided'
    
    def test_auth_callback_success(self, client, mock_auth):
        """Test successful auth callback"""
        mock_auth.handle_callback.return_value = {
            'success': True,
            'user_email': 'test@example.com',
            'display_name': 'Test User'
        }
        
        response = client.get('/api/google-drive/auth/callback?code=auth123&state=user123')
        assert response.status_code == 200
        assert response.json['status'] == 'success'
        assert response.json['user_email'] == 'test@example.com'
    
    def test_auth_status_authenticated(self, client, mock_auth):
        """Test auth status check for authenticated user"""
        mock_auth.is_authenticated.return_value = True
        
        response = client.get('/api/google-drive/auth/status?user_id=test123')
        assert response.status_code == 200
        assert response.json['authenticated'] is True
    
    def test_list_files_success(self, client, mock_ingestion):
        """Test successful file listing"""
        mock_ingestion.list_files.return_value = {
            'files': [{'id': '1', 'name': 'test.pdf'}],
            'totalFiles': 1,
            'nextPageToken': None
        }
        
        response = client.get('/api/google-drive/files?user_id=test123')
        assert response.status_code == 200
        assert response.json['status'] == 'success'
        assert len(response.json['files']) == 1
    
    def test_sync_no_selection(self, client):
        """Test sync endpoint with no files selected"""
        response = client.post('/api/google-drive/sync', 
                               json={'user_id': 'test123'})
        assert response.status_code == 400
        assert response.json['error'] == 'No files or folders selected'
    
    def test_disconnect_success(self, client, mock_auth):
        """Test successful disconnection"""
        mock_auth.revoke_access.return_value = True
        
        response = client.post('/api/google-drive/disconnect', 
                               json={'user_id': 'test123'})
        assert response.status_code == 200
        assert response.json['status'] == 'success'


class TestDatabaseModels:
    """Test Google Drive database models"""
    
    def test_google_drive_file_to_dict(self):
        """Test GoogleDriveFile to_dict method"""
        file = GoogleDriveFile(
            id=1,
            user_id='user123',
            drive_file_id='file123',
            drive_file_name='test.pdf',
            mime_type='application/pdf',
            file_size=1024,
            index_status='indexed'
        )
        
        result = file.to_dict()
        
        assert result['id'] == 1
        assert result['user_id'] == 'user123'
        assert result['drive_file_id'] == 'file123'
        assert result['drive_file_name'] == 'test.pdf'
        assert result['mime_type'] == 'application/pdf'
        assert result['file_size'] == 1024
        assert result['index_status'] == 'indexed'
    
    def test_google_drive_sync_to_dict(self):
        """Test GoogleDriveSync to_dict method"""
        sync = GoogleDriveSync(
            id=1,
            user_id='user123',
            sync_type='manual',
            status='completed',
            files_processed=10,
            files_failed=2
        )
        
        result = sync.to_dict()
        
        assert result['id'] == 1
        assert result['user_id'] == 'user123'
        assert result['sync_type'] == 'manual'
        assert result['status'] == 'completed'
        assert result['files_processed'] == 10
        assert result['files_failed'] == 2
