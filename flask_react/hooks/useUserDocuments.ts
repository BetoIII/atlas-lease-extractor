import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { API_BASE_URL } from '@/lib/config';

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

      // Fetch documents from Flask backend
      const response = await fetch(`${API_BASE_URL}/user-documents/${session.data.user.id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }
      
      const docs: Document[] = await response.json();
      setUserDocuments(docs);

      // Convert to dashboard formats
      const updates = docs.map(doc => convertToDocumentUpdate(doc));
      setDocumentUpdates(updates);

      const dashboardDocs = docs.map(doc => convertToDashboardDocument(doc));
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
  const convertToDocumentUpdate = (doc: Document) => ({
    id: doc.id,
    title: doc.title,
    time: formatTime(doc.updated_at),
    type: doc.sharing_type,
    asset_type: doc.asset_type,
    status: doc.status,
    ownership_type: doc.ownership_type,
    revenue: doc.revenue_generated
  });

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
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
  };

  // Load documents on mount and when auth state changes
  useEffect(() => {
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

  return {
    userDocuments,
    documentUpdates,
    dashboardDocuments,
    isLoading,
    refreshDocuments,
    getDocumentById,
    getDocumentActivities,
  };
};