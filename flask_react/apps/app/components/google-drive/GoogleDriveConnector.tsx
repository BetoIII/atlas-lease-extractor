'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@atlas/ui';
import { useToast } from '@atlas/ui';
import { Loader2, FolderPlus } from 'lucide-react';

interface GoogleDriveConnectorProps {
  userId: string;
  onSuccess?: () => void;
}

export function GoogleDriveConnector({ userId, onSuccess }: GoogleDriveConnectorProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { toast } = useToast();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [userId]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`http://localhost:5601/api/google-drive/auth/status?user_id=${userId}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setIsAuthenticated(data.authenticated);
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Get OAuth URL from backend
      const response = await fetch(`http://localhost:5601/api/google-drive/auth/url?user_id=${userId}`);
      const data = await response.json();
      
      if (data.status === 'success' && data.auth_url) {
        // Open OAuth flow in new window
        const authWindow = window.open(
          data.auth_url,
          'Google Drive Authorization',
          'width=600,height=700,left=100,top=100'
        );
        
        // Check for window close and auth success
        const checkInterval = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkInterval);
            setIsConnecting(false);
            
            // Check if auth was successful
            setTimeout(() => {
              checkAuthStatus();
            }, 1000);
          }
        }, 1000);
        
        // Listen for success message from OAuth callback
        window.addEventListener('message', function handleMessage(event) {
          if (event.data.type === 'google-drive-auth-success') {
            window.removeEventListener('message', handleMessage);
            authWindow?.close();
            setIsAuthenticated(true);
            setIsConnecting(false);
            
            toast({
              title: 'Connected to Google Drive',
              description: 'You can now import documents from your Google Drive.',
            });
            
            if (onSuccess) {
              onSuccess();
            }
          }
        });
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error) {
      console.error('Failed to connect to Google Drive:', error);
      toast({
        title: 'Connection failed',
        description: 'Failed to connect to Google Drive. Please try again.',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('http://localhost:5601/api/google-drive/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setIsAuthenticated(false);
        toast({
          title: 'Disconnected',
          description: 'Google Drive has been disconnected.',
        });
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect Google Drive.',
        variant: 'destructive',
      });
    }
  };

  if (checkingAuth) {
    return (
      <Button disabled variant="outline" size="sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking...
      </Button>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-green-600 border-green-600"
          disabled
        >
          <FolderPlus className="mr-2 h-4 w-4" />
          Google Drive Connected
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
          className="text-red-600 hover:text-red-700"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      variant="outline"
      size="sm"
    >
      {isConnecting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <FolderPlus className="mr-2 h-4 w-4" />
          Add Google Drive
        </>
      )}
    </Button>
  );
}
