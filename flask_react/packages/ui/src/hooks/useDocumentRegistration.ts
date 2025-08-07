import { useState } from 'react';
import { API_BASE_URL } from '@/lib/config';
import { documentStore } from '@/lib/documentStore';

export interface DocumentRegistrationData {
  file_path: string;
  title: string;
  sharing_type: 'private' | 'firm' | 'external' | 'license' | 'coop';
  user_id: string;
  shared_emails?: string[];
  license_fee?: number;
  extracted_data?: any;
  risk_flags?: any[];
  asset_type?: string;
}

export interface RegisteredDocument {
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
  activities: any[];
  created_at: number;
  status: string;
  relationship: string;
}

export interface DocumentRegistrationResponse {
  status: string;
  document: RegisteredDocument;
  activity_count: number;
}

export const useDocumentRegistration = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registeredDocument, setRegisteredDocument] = useState<RegisteredDocument | null>(null);

  const registerDocument = async (data: DocumentRegistrationData): Promise<RegisteredDocument | null> => {
    setIsRegistering(true);
    setRegistrationError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/register-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.statusText}`);
      }

      const result: DocumentRegistrationResponse = await response.json();
      
      if (result.status === 'success') {
        // Save document to local store for dashboard integration
        documentStore.saveDocument(result.document);
        
        setRegisteredDocument(result.document);
        return result.document;
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setRegistrationError(errorMessage);
      console.error('Document registration error:', error);
      return null;
    } finally {
      setIsRegistering(false);
    }
  };

  const clearRegistration = () => {
    setRegisteredDocument(null);
    setRegistrationError(null);
  };

  return {
    registerDocument,
    isRegistering,
    registrationError,
    registeredDocument,
    clearRegistration,
  };
};