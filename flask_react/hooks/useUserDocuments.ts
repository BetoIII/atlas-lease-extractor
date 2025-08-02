import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { API_BASE_URL } from '@/lib/config';
import { documentStore } from '@/lib/documentStore';
import type { DocumentUpdate } from '@/app/dashboard/types';

interface Document {
  id: string;
  title: string;
  file_path: string;
  user_id: string;
  sharing_type: string;
  asset_type: string;
  status: string;
  ownership_type: string;
  license_fee: number;
  revenue_generated: number;
  shared_emails: string[];
  extracted_data: any;
  risk_flags: string[];
  created_at: string;
  updated_at: string;
  activities: BlockchainActivity[];
}

interface BlockchainActivity {
  id: string;
  document_id: string;
  action: string;
  activity_type: string;
  status: string;
  actor: string;
  actor_name?: string;
  tx_hash?: string;
  block_number?: number;
  gas_used?: number;
  details: string;
  metadata: any;
  revenue_impact: number;
  timestamp: string;
}

export const useUserDocuments = () => {
  const [userDocuments, setUserDocuments] = useState<Document[]>([]);
  const [documentUpdates, setDocumentUpdates] = useState<any[]>([]);
  const [dashboardDocuments, setDashboardDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRegisteredPending, setHasRegisteredPending] = useState(false);

  const syncUserToFlaskDB = async (userId: string, email: string, name?: string) => {
    try {
      console.log('🔄 Syncing user to Flask database:', { userId, email, name });
      
      const response = await fetch(`${API_BASE_URL}/sync-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          email: email,
          name: name
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('User sync failed:', errorText);
        throw new Error(`User sync failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ User synced successfully:', result);
      return result.user;
      
    } catch (error) {
      console.error('❌ Error syncing user:', error);
      throw error;
    }
  };

  const registerPendingDocument = async (userId: string) => {
    try {
      const pendingData = documentStore.getPendingDocument();
      if (!pendingData) {
        console.log('No pending document found');
        return null;
      }

      console.log('Registering pending document for user:', userId);
      console.log('Pending document data:', pendingData);

      // Get current user session to extract user details for sync
      const session = await authClient.getSession();
      if (!session?.data?.user) {
        throw new Error('User session not found for sync');
      }

      // Sync user to Flask database first
      try {
        await syncUserToFlaskDB(
          session.data.user.id, 
          session.data.user.email,
          session.data.user.name
        );
        console.log('✅ User sync completed, proceeding with document registration');
      } catch (syncError) {
        console.error('❌ User sync failed, trying document registration anyway:', syncError);
        console.log('⚠️ The Flask server may need to be restarted to load the /sync-user endpoint');
        // Don't abort - try registration anyway in case user already exists
      }

      // Validate and prepare registration data
      const registrationData = {
        file_path: pendingData.file_path || '',
        title: pendingData.title || 'Untitled Document',
        sharing_type: pendingData.sharing_type || 'private',
        user_id: userId,
        user_email: session.data.user.email, // Add user email for fallback user creation
        user_name: session.data.user.name, // Add user name for fallback user creation
        shared_emails: pendingData.shared_emails || [],
        license_fee: pendingData.license_fee || 0,
        extracted_data: pendingData.extracted_data || {},
        risk_flags: pendingData.risk_flags || [],
        asset_type: pendingData.asset_type || 'office'
      };

      // Validate required fields
      if (!registrationData.file_path) {
        throw new Error('Missing file_path in pending document data');
      }
      if (!registrationData.title) {
        throw new Error('Missing title in pending document data');
      }
      if (!registrationData.user_id) {
        throw new Error('Missing user_id for registration');
      }

      console.log('Sending registration data:', registrationData);

      const response = await fetch(`${API_BASE_URL}/register-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
        credentials: 'include',
      });

      console.log('Registration response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Registration failed with response:', errorText);
        throw new Error(`Registration failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Registration result:', result);
      
      if (result.status === 'success') {
        // Clear the pending document data
        documentStore.clearPendingDocument();
        console.log('Pending document registered successfully:', result.document.id);
        return result.document;
      }
      
      return null;
    } catch (error) {
      console.error('Error registering pending document:', error);
      return null;
    }
  };

  const loadUserDocuments = async () => {
    try {
      setIsLoading(true);
      
      // Get current user session
      const session = await authClient.getSession();
      if (!session?.data?.user?.id) {
        setUserDocuments([]);
        setDocumentUpdates([]);
        setDashboardDocuments([]);
        return;
      }

      // Sync user to Flask database first (ensure user exists)
      try {
        await syncUserToFlaskDB(
          session.data.user.id,
          session.data.user.email,
          session.data.user.name
        );
        console.log('✅ User sync completed for dashboard load');
      } catch (syncError) {
        console.error('❌ User sync failed during dashboard load:', syncError);
        console.log('⚠️ Continuing without sync - user might already exist or server needs restart');
        // Continue anyway - user might already exist or Flask server needs restart
      }

      // Check for and register any pending document (only once per session)
      if (!hasRegisteredPending) {
        // Debug what's in pending storage
        console.log('🔍 Checking for pending documents...');
        documentStore.debugPendingDocument();
        
        if (documentStore.hasPendingDocument()) {
          console.log('📄 Found pending document, attempting to register...');
          const pendingDoc = await registerPendingDocument(session.data.user.id);
          if (pendingDoc) {
            console.log('✅ Successfully registered pending document after authentication');
            setHasRegisteredPending(true);
          } else {
            console.log('❌ Failed to register pending document');
            setHasRegisteredPending(true); // Still mark as attempted
          }
        } else {
          console.log('ℹ️ No pending document found');
          setHasRegisteredPending(true);
        }
      } else {
        console.log('⏭️ Pending document registration already attempted this session');
      }

      // Fetch documents from Flask backend
      console.log('📄 Fetching user documents from:', `${API_BASE_URL}/user-documents/${session.data.user.id}`);
      const response = await fetch(`${API_BASE_URL}/user-documents/${session.data.user.id}`);
      console.log('📄 User documents response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch documents:', errorText);
        throw new Error(`Failed to fetch documents: ${response.status} ${response.statusText}`);
      }
      
      const docs = await response.json();
      console.log('📄 Raw user documents response:', docs);
      
      // Extract documents array from the response
      const documentsArray = Array.isArray(docs) ? docs : docs.documents || [];
      console.log('📄 Documents array:', documentsArray);
      console.log('📄 Documents count:', documentsArray.length);
      
      setUserDocuments(documentsArray);

      // Convert to dashboard formats
      console.log('🔄 Converting documents to DocumentUpdate format...');
      const updates = documentsArray.map(doc => {
        const update = convertToDocumentUpdate(doc);
        console.log('🔄 Converted document:', doc.title, '→', update);
        return update;
      });
      console.log('🔄 Final DocumentUpdates:', updates);
      setDocumentUpdates(updates);

      console.log('🔄 Converting documents to Dashboard format...');
      const dashboardDocs = documentsArray.map(doc => convertToDashboardDocument(doc));
      setDashboardDocuments(dashboardDocs);

    } catch (error) {
      console.error('Error loading user documents:', error);
      setUserDocuments([]);
      setDocumentUpdates([]);
      setDashboardDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Conversion functions to match existing dashboard format
  const convertToDocumentUpdate = (doc: Document): DocumentUpdate => {
    console.log('🔄 Converting document to DocumentUpdate:', doc.title, doc);
    
    // Get the most recent activity from the activities array
    const activities = doc.activities || [];
    const lastActivity = activities.length > 0 ? activities[activities.length - 1] : null;
    
    console.log('🔄 Document activities:', activities.length, 'Last activity:', lastActivity);
    
    // Safe timestamp formatting
    let timestampToUse = doc.created_at;
    if (lastActivity?.timestamp) {
      timestampToUse = lastActivity.timestamp;
    }
    
    const formattedTime = formatTime(timestampToUse);
    console.log('🔄 Formatted time:', formattedTime, 'from timestamp:', timestampToUse);
    
    const result = {
      id: doc.id,
      title: doc.title,
      lastActivity: {
        action: lastActivity?.action || 'REGISTER_ASSET',
        timestamp: formattedTime,
        color: getActivityColor(lastActivity?.activity_type || 'origination'),
      },
      totalEvents: Math.max(activities.length, 1),
      hasMoreEvents: activities.length > 1,
    };
    
    console.log('🔄 Converted DocumentUpdate:', result);
    return result;
  };

  const convertToDashboardDocument = (doc: Document) => ({
    id: doc.id,
    title: doc.title,
    time: formatTime(doc.created_at),
    type: doc.sharing_type,
    asset_type: doc.asset_type,
    status: doc.status,
    ownership_type: doc.ownership_type,
    revenue: doc.revenue_generated,
    activities: doc.activities || []
  });

  const formatTime = (timestamp: string) => {
    try {
      console.log('🕐 Formatting timestamp:', timestamp);
      
      if (!timestamp) {
        console.log('🕐 No timestamp provided, using "just now"');
        return 'just now';
      }
      
      const date = new Date(timestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log('🕐 Invalid timestamp, using "just now":', timestamp);
        return 'just now';
      }
      
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInHours = diffInMs / (1000 * 60 * 60);
      
      console.log('🕐 Time difference in hours:', diffInHours);
      
      if (diffInHours < 0) {
        return 'just now'; // Future timestamp
      } else if (diffInHours < 1) {
        const minutes = Math.floor(diffInHours * 60);
        return minutes <= 0 ? 'just now' : `${minutes}m ago`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      } else {
        const days = Math.floor(diffInHours / 24);
        return `${days}d ago`;
      }
    } catch (error) {
      console.error('🕐 Error formatting timestamp:', error, 'timestamp:', timestamp);
      return 'just now';
    }
  };

  const getActivityColor = (activityType: string): string => {
    switch (activityType) {
      case 'licensing': return 'bg-green-500';
      case 'sharing': return 'bg-blue-500';
      case 'validation': return 'bg-purple-500';
      case 'origination': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  // Load documents on mount and when auth state changes
  useEffect(() => {
    console.log('🚀 useUserDocuments useEffect triggered');
    loadUserDocuments();
  }, []);

  const refreshDocuments = () => {
    loadUserDocuments();
  };

  const getDocumentById = (documentId: string): Document | null => {
    return userDocuments.find(doc => doc.id === documentId) || null;
  };

  const getDocumentActivities = async (documentId: string): Promise<BlockchainActivity[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/document-activities/${documentId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading document activities:', error);
      return [];
    }
  };

  // Debug function to manually test pending document registration
  const testPendingRegistration = async () => {
    try {
      const session = await authClient.getSession();
      if (session?.data?.user?.id) {
        console.log('🧪 Testing pending document registration...');
        const result = await registerPendingDocument(session.data.user.id);
        console.log('🧪 Test result:', result);
        if (result) {
          await refreshDocuments();
        }
      } else {
        console.log('🧪 User not authenticated for test');
      }
    } catch (error) {
      console.error('🧪 Test failed:', error);
    }
  };

  return {
    userDocuments,
    documentUpdates,
    dashboardDocuments,
    isLoading,
    refreshDocuments,
    getDocumentById,
    getDocumentActivities,
    testPendingRegistration, // For debugging
    syncUserToFlaskDB, // For external use if needed
  };
};