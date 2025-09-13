"""
Google Drive OAuth authentication handler
"""
import os
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)

class GoogleDriveAuth:
    """Handles Google Drive OAuth authentication and token management"""
    
    # OAuth2 scopes required for Google Drive access
    SCOPES = [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
    ]
    
    def __init__(self):
        self.client_id = os.environ.get('GOOGLE_CLIENT_ID')
        self.client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
        self.redirect_uri = os.environ.get('GOOGLE_REDIRECT_URI', 'http://localhost:5601/api/google-drive/auth/callback')
        
        if not self.client_id or not self.client_secret:
            raise ValueError("Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.")
        
        # In production, this should be stored in a database per user
        self.token_storage = {}
    
    def get_auth_url(self, user_id: str, state: Optional[str] = None) -> str:
        """Generate OAuth authorization URL"""
        flow = Flow.from_client_config(
            client_config={
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "redirect_uris": [self.redirect_uri]
                }
            },
            scopes=self.SCOPES
        )
        
        flow.redirect_uri = self.redirect_uri
        
        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=state or user_id,
            prompt='consent'  # Force consent to ensure we get refresh token
        )
        
        return authorization_url
    
    def handle_callback(self, user_id: str, authorization_code: str) -> Dict[str, Any]:
        """Handle OAuth callback and exchange code for tokens"""
        try:
            flow = Flow.from_client_config(
                client_config={
                    "web": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                        "redirect_uris": [self.redirect_uri]
                    }
                },
                scopes=self.SCOPES
            )
            
            flow.redirect_uri = self.redirect_uri
            flow.fetch_token(code=authorization_code)
            
            credentials = flow.credentials
            
            # Store tokens
            self.store_tokens(user_id, credentials)
            
            # Get user info
            service = build('drive', 'v3', credentials=credentials)
            about = service.about().get(fields="user").execute()
            user_info = about.get('user', {})
            
            return {
                'success': True,
                'user_email': user_info.get('emailAddress'),
                'display_name': user_info.get('displayName')
            }
            
        except Exception as e:
            logger.error(f"OAuth callback error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def store_tokens(self, user_id: str, credentials: Credentials):
        """Store OAuth tokens for a user"""
        token_data = {
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes,
            'expiry': credentials.expiry.isoformat() if credentials.expiry else None
        }
        
        # In production, encrypt and store in database
        self.token_storage[user_id] = token_data
        
        # Also save to file for persistence during development
        os.makedirs('token_storage', exist_ok=True)
        with open(f'token_storage/google_drive_tokens_{user_id}.json', 'w') as f:
            json.dump(token_data, f)
    
    def get_credentials(self, user_id: str) -> Optional[Credentials]:
        """Get valid credentials for a user, refreshing if necessary"""
        # Try to load from memory first
        token_data = self.token_storage.get(user_id)
        
        # If not in memory, try to load from file
        if not token_data:
            token_file = f'token_storage/google_drive_tokens_{user_id}.json'
            if os.path.exists(token_file):
                with open(token_file, 'r') as f:
                    token_data = json.load(f)
                    self.token_storage[user_id] = token_data
        
        if not token_data:
            return None
        
        # Create credentials object
        credentials = Credentials(
            token=token_data.get('token'),
            refresh_token=token_data.get('refresh_token'),
            token_uri=token_data.get('token_uri'),
            client_id=token_data.get('client_id'),
            client_secret=token_data.get('client_secret'),
            scopes=token_data.get('scopes')
        )
        
        # Set expiry if available
        if token_data.get('expiry'):
            credentials.expiry = datetime.fromisoformat(token_data['expiry'])
        
        # Refresh if expired
        if credentials.expired and credentials.refresh_token:
            try:
                credentials.refresh(Request())
                self.store_tokens(user_id, credentials)
            except Exception as e:
                logger.error(f"Token refresh failed: {str(e)}")
                return None
        
        return credentials
    
    def revoke_access(self, user_id: str) -> bool:
        """Revoke Google Drive access for a user"""
        credentials = self.get_credentials(user_id)
        if not credentials:
            return False
        
        try:
            credentials.revoke(Request())
            
            # Remove stored tokens
            if user_id in self.token_storage:
                del self.token_storage[user_id]
            
            token_file = f'token_storage/google_drive_tokens_{user_id}.json'
            if os.path.exists(token_file):
                os.remove(token_file)
            
            return True
        except Exception as e:
            logger.error(f"Failed to revoke access: {str(e)}")
            return False
    
    def is_authenticated(self, user_id: str) -> bool:
        """Check if user has valid Google Drive authentication"""
        credentials = self.get_credentials(user_id)
        return credentials is not None and credentials.valid
