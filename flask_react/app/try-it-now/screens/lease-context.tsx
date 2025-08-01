"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"
import type { SourceData, ExtractedData } from "./results-viewer"

interface ApiRiskFlag {
  title: string;
  category: string;
  description: string;
}

interface RiskFlag {
  title: string;
  clause: string;
  page: number;
  severity: "high" | "medium" | "low";
  reason: string;
  recommendation?: string;
}

interface AssetTypeClassification {
  asset_type: string;
  confidence: number;
}

interface LeaseContextData {
  // File data
  uploadedFile: File | null;
  uploadedFilePath: string | null;
  
  // Extracted data
  extractedData: ExtractedData | null;
  sourceData: SourceData | undefined;
  assetTypeClassification: AssetTypeClassification | null;
  riskFlags: RiskFlag[];
  
  // Document registration
  documentId: string | null;
  isDocumentTrackingEnabled: boolean;
  
  // Loading states
  isSummaryLoading: boolean;
  isAssetTypeLoading: boolean;
  isRiskFlagsLoading: boolean;
  isReclassifying: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  setUploadedFile: (file: File | null) => void;
  setUploadedFilePath: (path: string | null) => void;
  setExtractedData: (data: ExtractedData | null) => void;
  setSourceData: (data: SourceData | undefined) => void;
  setAssetTypeClassification: (classification: AssetTypeClassification | null) => void;
  setRiskFlags: (flags: RiskFlag[]) => void;
  setDocumentId: (id: string | null) => void;
  setIsDocumentTrackingEnabled: (enabled: boolean) => void;
  setIsSummaryLoading: (loading: boolean) => void;
  setIsAssetTypeLoading: (loading: boolean) => void;
  setIsRiskFlagsLoading: (loading: boolean) => void;
  setIsReclassifying: (reclassifying: boolean) => void;
  setError: (error: string | null) => void;
  
  // Utility functions
  transformRiskFlags: (apiFlags: ApiRiskFlag[]) => RiskFlag[];
  resetAllData: () => void;
  resetProcessingData: () => void;
  hasCompleteData: () => boolean;
}

const LeaseContext = createContext<LeaseContextData | undefined>(undefined);

interface LeaseProviderProps {
  children: ReactNode;
}

export function LeaseProvider({ children }: LeaseProviderProps) {
  // File data
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  
  // Extracted data
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [sourceData, setSourceData] = useState<SourceData | undefined>(undefined);
  const [assetTypeClassification, setAssetTypeClassification] = useState<AssetTypeClassification | null>(null);
  const [riskFlags, setRiskFlags] = useState<RiskFlag[]>([]);
  
  // Document registration
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [isDocumentTrackingEnabled, setIsDocumentTrackingEnabled] = useState(false);
  
  // Loading states
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isAssetTypeLoading, setIsAssetTypeLoading] = useState(false);
  const [isRiskFlagsLoading, setIsRiskFlagsLoading] = useState(false);
  const [isReclassifying, setIsReclassifying] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Transform API risk flags to component format
  const transformRiskFlags = (apiFlags: ApiRiskFlag[]): RiskFlag[] => {
    return apiFlags.map(flag => ({
      title: flag.title,
      clause: flag.description,
      page: 1, // Default since API doesn't provide page
      severity: "medium" as const, // Default since API doesn't provide severity
      reason: flag.description,
      recommendation: `Review the ${flag.category.toLowerCase()} clause carefully.`
    }))
  };

  // Reset all data
  const resetAllData = () => {
    setUploadedFile(null);
    setUploadedFilePath(null);
    setExtractedData(null);
    setSourceData(undefined);
    setAssetTypeClassification(null);
    setRiskFlags([]);
    setDocumentId(null);
    setIsDocumentTrackingEnabled(false);
    setError(null);
    setIsSummaryLoading(false);
    setIsAssetTypeLoading(false);
    setIsRiskFlagsLoading(false);
    setIsReclassifying(false);
  };

  // Reset only processing data (keep file info)
  const resetProcessingData = () => {
    setExtractedData(null);
    setSourceData(undefined);
    setAssetTypeClassification(null);
    setRiskFlags([]);
    setDocumentId(null);
    setIsDocumentTrackingEnabled(false);
    setError(null);
    setIsSummaryLoading(false);
    setIsAssetTypeLoading(false);
    setIsRiskFlagsLoading(false);
    setIsReclassifying(false);
  };

  // Check if we have complete data for export
  const hasCompleteData = (): boolean => {
    return !!(
      uploadedFile &&
      extractedData &&
      assetTypeClassification &&
      !isSummaryLoading &&
      !isAssetTypeLoading &&
      !isRiskFlagsLoading
    );
  };

  const contextValue: LeaseContextData = {
    // File data
    uploadedFile,
    uploadedFilePath,
    
    // Extracted data
    extractedData,
    sourceData,
    assetTypeClassification,
    riskFlags,
    
    // Document registration
    documentId,
    isDocumentTrackingEnabled,
    
    // Loading states
    isSummaryLoading,
    isAssetTypeLoading,
    isRiskFlagsLoading,
    isReclassifying,
    
    // Error state
    error,
    
    // Actions
    setUploadedFile,
    setUploadedFilePath,
    setExtractedData,
    setSourceData,
    setAssetTypeClassification,
    setRiskFlags,
    setDocumentId,
    setIsDocumentTrackingEnabled,
    setIsSummaryLoading,
    setIsAssetTypeLoading,
    setIsRiskFlagsLoading,
    setIsReclassifying,
    setError,
    
    // Utility functions
    transformRiskFlags,
    resetAllData,
    resetProcessingData,
    hasCompleteData,
  };

  return (
    <LeaseContext.Provider value={contextValue}>
      {children}
    </LeaseContext.Provider>
  );
}

// Custom hook to use the lease context
export function useLeaseContext() {
  const context = useContext(LeaseContext);
  if (context === undefined) {
    throw new Error('useLeaseContext must be used within a LeaseProvider');
  }
  return context;
}

// Export types for use in other components
export type { LeaseContextData, RiskFlag, AssetTypeClassification, ApiRiskFlag }; 