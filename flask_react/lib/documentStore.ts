// Client-side document store for managing registered documents
// In a real application, this would be handled by a proper database and API

export interface StoredDocument {
  id: string;
  title: string;
  file_path: string;
  user_id: string;
  sharing_type: string;
  shared_emails: string[];
  license_fee: number;
  extracted_data: any;
  risk_flags: any[];
  asset_type: string;
  activities: ActivityRecord[];
  created_at: number;
  status: string;
  relationship: string;
}

export interface ActivityRecord {
  id: string;
  action: string;
  timestamp: number;
  actor: string;
  type: string;
  status: string;
  details: string;
}

// Document storage key for localStorage
const DOCUMENTS_STORAGE_KEY = 'atlas_user_documents';
const ACTIVITIES_STORAGE_KEY = 'atlas_document_activities';

class DocumentStore {
  // Save a document to localStorage
  saveDocument(document: StoredDocument): void {
    try {
      const existingDocs = this.getUserDocuments(document.user_id);
      const updatedDocs = [...existingDocs, document];
      
      // Save to localStorage grouped by user
      const allDocuments = this.getAllDocuments();
      allDocuments[document.user_id] = updatedDocs;
      
      localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(allDocuments));
    } catch (error) {
      console.error('Error saving document:', error);
    }
  }

  // Get all documents for a user
  getUserDocuments(userId: string): StoredDocument[] {
    try {
      const allDocuments = this.getAllDocuments();
      return allDocuments[userId] || [];
    } catch (error) {
      console.error('Error retrieving user documents:', error);
      return [];
    }
  }

  // Get all documents (for admin purposes)
  getAllDocuments(): Record<string, StoredDocument[]> {
    try {
      const stored = localStorage.getItem(DOCUMENTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error retrieving all documents:', error);
      return {};
    }
  }

  // Get a specific document by ID
  getDocument(documentId: string, userId: string): StoredDocument | null {
    try {
      const userDocs = this.getUserDocuments(userId);
      return userDocs.find(doc => doc.id === documentId) || null;
    } catch (error) {
      console.error('Error retrieving document:', error);
      return null;
    }
  }

  // Update document activities
  addActivity(documentId: string, userId: string, activity: ActivityRecord): void {
    try {
      const allDocuments = this.getAllDocuments();
      const userDocs = allDocuments[userId] || [];
      
      const docIndex = userDocs.findIndex(doc => doc.id === documentId);
      if (docIndex !== -1) {
        userDocs[docIndex].activities.push(activity);
        allDocuments[userId] = userDocs;
        localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(allDocuments));
      }
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  }

  // Get activities for a document
  getDocumentActivities(documentId: string, userId: string): ActivityRecord[] {
    try {
      const document = this.getDocument(documentId, userId);
      return document?.activities || [];
    } catch (error) {
      console.error('Error retrieving document activities:', error);
      return [];
    }
  }

  // Convert stored document to dashboard format
  toDocumentUpdate(document: StoredDocument): any {
    const lastActivity = document.activities[document.activities.length - 1];
    
    return {
      id: document.id,
      title: document.title,
      lastActivity: {
        action: lastActivity?.action || 'REGISTER_ASSET',
        timestamp: this.formatTimestamp(lastActivity?.timestamp || document.created_at),
        color: this.getActivityColor(lastActivity?.type || 'origination'),
      },
      totalEvents: document.activities.length,
      hasMoreEvents: document.activities.length > 1,
    };
  }

  // Convert stored document to dashboard document format
  toDashboardDocument(document: StoredDocument): any {
    return {
      id: parseInt(document.id.split('-')[0] || '1'), // Simple numeric ID for compatibility
      title: document.title,
      description: `${document.asset_type} lease document`,
      docType: 'Lease',
      region: 'Local',
      status: document.status,
      price: document.license_fee,
      duration: '1 year',
      scope: this.getScopeFromSharingType(document.sharing_type),
      trending: false,
      relationship: document.relationship,
      isLicensed: document.sharing_type === 'license',
      isShared: ['firm', 'external', 'coop'].includes(document.sharing_type),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      sharedWith: document.shared_emails.map(email => ({
        name: email,
        type: 'External Partner',
        since: this.formatTimestamp(document.created_at),
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })),
      licensedTo: [],
      owner: 'You',
      revenue: 0,
    };
  }

  // Helper methods
  private formatTimestamp(timestamp: number): string {
    const now = Date.now();
    const diff = now - (timestamp * 1000); // Convert to milliseconds
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  private getActivityColor(type: string): string {
    switch (type) {
      case 'licensing': return 'bg-green-500';
      case 'sharing': return 'bg-blue-500';
      case 'validation': return 'bg-purple-500';
      case 'origination': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  }

  private getScopeFromSharingType(sharingType: string): string {
    switch (sharingType) {
      case 'private': return 'Private use';
      case 'firm': return 'Firm-wide';
      case 'external': return 'Partner access';
      case 'license': return 'Licensed';
      case 'coop': return 'Marketplace';
      default: return 'Private use';
    }
  }

  // Clear all documents (for development/testing)
  clearAllDocuments(): void {
    localStorage.removeItem(DOCUMENTS_STORAGE_KEY);
  }
}

// Export singleton instance
export const documentStore = new DocumentStore();