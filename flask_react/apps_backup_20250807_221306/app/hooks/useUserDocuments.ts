import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { API_BASE_URL } from '@/lib/config';
import { documentStore } from '@/lib/documentStore';
import { apiCache, CacheKeys } from '@/lib/apiCache';
import { devLog } from '@/lib/dev-utils';
import type { DocumentUpdate } from '@/lib/types';

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

// BlockchainActivity: High-level document activity (share, license, register, etc.)
// Note: This is different from ledger events which are the individual blockchain transactions that make up each activity
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
        throw new Error(`User sync failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.user;
      
    } catch (error) {
      throw error;
    }
  };

  const registerPendingDocument = async (userId: string) => {
    try {
      const pendingData = documentStore.getPendingDocument();
      if (!pendingData) {
        return null;
      }

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
      } catch (syncError) {
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

      const response = await fetch(`${API_BASE_URL}/register-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Registration failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        // Clear the pending document data
        documentStore.clearPendingDocument();
        return result.document;
      }
      
      return null;
    } catch (error) {
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

      const userId = session.data.user.id;
      
      // Check cache first
      const cacheKey = CacheKeys.userDocuments(userId);
      const cachedDocs = apiCache.get<Document[]>(cacheKey);
      if (cachedDocs) {
        devLog.debug('Using cached user documents:', cachedDocs.length, 'documents');
        setUserDocuments(cachedDocs);
        
        // Convert cached documents to dashboard formats
        const updates = cachedDocs.map((doc: Document) => convertToDocumentUpdate(doc));
        setDocumentUpdates(updates);
        
        const dashboardDocs = cachedDocs.map((doc: Document) => convertToDashboardDocument(doc));
        setDashboardDocuments(dashboardDocs);
        
        setIsLoading(false);
        return;
      }

      // Sync user to Flask database first (ensure user exists)
      try {
        await syncUserToFlaskDB(
          session.data.user.id,
          session.data.user.email,
          session.data.user.name
        );
      } catch (syncError) {
        // Continue anyway - user might already exist or Flask server needs restart
      }

      // Check for and register any pending document (only once per session)
      if (!hasRegisteredPending) {
        documentStore.debugPendingDocument();
        
        if (documentStore.hasPendingDocument()) {
          const pendingDoc = await registerPendingDocument(session.data.user.id);
          if (pendingDoc) {
            setHasRegisteredPending(true);
          } else {
            setHasRegisteredPending(true); // Still mark as attempted
          }
        } else {
          setHasRegisteredPending(true);
        }
      }

      // Fetch documents from Flask backend
      devLog.debug('Fetching documents from:', `${API_BASE_URL}/user-documents/${session.data.user.id}`);
      const response = await fetch(`${API_BASE_URL}/user-documents/${session.data.user.id}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch documents:', response.status, response.statusText, errorText);
        throw new Error(`Failed to fetch documents: ${response.status} ${response.statusText}`);
      }
      
      const docs = await response.json();
      devLog.debug('Raw API response:', docs);
      devLog.debug('Response type:', typeof docs);
      devLog.debug('Is array:', Array.isArray(docs));
      
      // Extract documents array from the response
      const documentsArray = Array.isArray(docs) ? docs : docs.documents || [];
      devLog.debug('Extracted documentsArray:', documentsArray);
      devLog.debug('documentsArray length:', documentsArray.length);
      
      // Cache the documents for 3 minutes
      apiCache.set(cacheKey, documentsArray, { ttl: 3 * 60 * 1000 });
      
      devLog.debug('Setting userDocuments to:', documentsArray.length, 'documents');
      setUserDocuments(documentsArray);

      // Convert to dashboard formats
      const updates = documentsArray.map((doc: Document) => {
        devLog.debug('Processing document for conversion:', {
          id: doc.id,
          title: doc.title,
          activities_count: doc.activities?.length || 0,
          created_at: doc.created_at
        });
        const update = convertToDocumentUpdate(doc);
        devLog.debug('Converted to DocumentUpdate:', update);
        return update;
      });
      devLog.debug('Final documentUpdates array:', updates.length, 'items');
      devLog.debug('DocumentUpdates IDs:', updates.map((u: DocumentUpdate) => u.id));
      setDocumentUpdates(updates);

      const dashboardDocs = documentsArray.map((doc: Document) => convertToDashboardDocument(doc));
      devLog.debug('Final dashboardDocuments array:', dashboardDocs.length, 'items');
      devLog.debug('DashboardDocs IDs:', dashboardDocs.map((d: { id: string }) => d.id));
      setDashboardDocuments(dashboardDocs);

    } catch (error) {
      console.error('Error in loadUserDocuments:', error);
      setUserDocuments([]);
      setDocumentUpdates([]);
      setDashboardDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Conversion functions to match existing dashboard format
  const convertToDocumentUpdate = (doc: Document): DocumentUpdate => {
    devLog.debug('convertToDocumentUpdate input:', {
      id: doc.id,
      title: doc.title,
      activities: doc.activities,
      created_at: doc.created_at
    });
    
    // Get the most recent activity from the activities array
    const activities = doc.activities || [];
    
    // Sort activities by timestamp to ensure we get the truly latest one
    const sortedActivities = activities.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB.getTime() - dateA.getTime(); // Most recent first
    });
    
    const lastActivity = sortedActivities.length > 0 ? sortedActivities[0] : null;
    
    devLog.debug('Last activity (after sorting):', lastActivity);
    
    // Use the latest activity timestamp, or fallback to document creation timestamp
    let timestampToUse = doc.created_at;
    if (lastActivity?.timestamp) {
      timestampToUse = lastActivity.timestamp;
    }
    
    devLog.debug('Timestamp to use:', timestampToUse);
    const formattedTime = formatTime(timestampToUse);
    devLog.debug('Formatted time:', formattedTime);
    
    const result = {
      id: doc.id,
      title: doc.title,
      lastActivity: {
        action: lastActivity?.action || 'REGISTER_ASSET',
        timestamp: formattedTime,
        color: getActivityColor(lastActivity?.activity_type || 'origination'),
      },
      totalActivities: Math.max(activities.length, 1),
      hasMoreActivities: activities.length > 1,
    };
    
    devLog.debug('convertToDocumentUpdate result:', result);
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

  const formatTime = (timestamp: string | number) => {
    try {
      if (!timestamp) {
        return 'just now';
      }
      
      devLog.debug('formatTime input:', { timestamp, type: typeof timestamp });
      
      let date: Date;
      
      if (typeof timestamp === 'string') {
        date = new Date(timestamp);
        devLog.debug('Parsed string timestamp:', { original: timestamp, parsed: date });
      } else if (typeof timestamp === 'number') {
        // Handle Unix timestamps - detect if seconds or milliseconds
        const isSeconds = timestamp < 10000000000; // Less than 10 billion = seconds
        date = isSeconds ? new Date(timestamp * 1000) : new Date(timestamp);
        devLog.debug('Parsed number timestamp:', { original: timestamp, isSeconds, parsed: date });
      } else {
        return 'just now';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'just now';
      }
      
      // Use the exact same logic as DocumentDetailView component (line 254)
      // This produces timestamps like "8/4/2025, 10:38:40 PM"
      return date.toLocaleString();
      
    } catch (error) {
      console.error('Error in formatTime:', error, timestamp);
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
    loadUserDocuments();
  }, []);

  const refreshDocuments = async () => {
    // Invalidate cache and reload documents
    const session = await authClient.getSession();
    if (session?.data?.user?.id) {
      apiCache.invalidatePattern(CacheKeys.userPattern(session.data.user.id));
    }
    await loadUserDocuments();
  };

  const getDocumentById = (documentId: string): Document | null => {
    return userDocuments.find(doc => doc.id === documentId) || null;
  };

  const getDocumentActivities = async (documentId: string): Promise<BlockchainActivity[]> => {
    try {
      // Check cache first
      const cacheKey = CacheKeys.documentActivities(documentId);
      const cached = apiCache.get<{activities: BlockchainActivity[]}>(cacheKey);
      if (cached) {
        return cached.activities;
      }

      const response = await fetch(`${API_BASE_URL}/document-activities/${documentId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.statusText}`);
      }
      
      const data = await response.json();
      const activities = data.activities || [];
      
      // Cache for 2 minutes
      apiCache.set(cacheKey, { activities }, { ttl: 2 * 60 * 1000 });
      
      return activities;
    } catch (error) {
      return [];
    }
  };

  // Debug function to manually test pending document registration
  const testPendingRegistration = async () => {
    try {
      const session = await authClient.getSession();
      if (session?.data?.user?.id) {
        const result = await registerPendingDocument(session.data.user.id);
        if (result) {
          await refreshDocuments();
        }
      }
    } catch (error) {
      // Silent fail for debug function
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