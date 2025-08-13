"use client"

import { useState } from "react"
import { Label } from "@atlas/ui"
import { RadioGroup, RadioGroupItem } from "@atlas/ui"
import {
  Lock,
  Users,
  Building,
  Database,
  DollarSign,
  Shield,
} from "lucide-react"

import { FirmSection } from "./privacy-sections/FirmSection"
import { ExternalSection } from "./privacy-sections/ExternalSection"
import { LicenseSection } from "./privacy-sections/LicenseSection"
import { CoopSection } from "./privacy-sections/CoopSection"
import { FirmShareState } from "@/hooks/useFirmSharing"
import { useExternalSharing } from "@/hooks/useExternalSharing"

interface DocumentSharingState {
  firm_shared: boolean;
  firm_share_details: {
    shared_at: string;
    actor: string;
    details: string;
    extra_data: any;
  } | null;
  external_shares: Array<{
    shared_at: string;
    actor: string;
    details: string;
    extra_data: any;
    batch_id: string;
  }>;
  licenses: Array<{
    created_at: string;
    actor: string;
    details: string;
    extra_data: any;
    monthly_fee: number;
    licensed_emails: string[];
  }>;
  marketplace_status: {
    shared_at: string;
    actor: string;
    details: string;
    extra_data: any;
  } | null;
}

interface PrivacySettingsProps {
  onSharingLevelChange?: (level: "private" | "firm" | "external" | "license" | "coop") => void;
  documentRegistered?: boolean;
  onShareDocument?: (sharedEmails: string[], documentId?: string) => void;
  onCreateLicense?: (licensedEmails: string[], monthlyFee: number, documentId?: string) => void;
  onShareWithFirm?: (documentId?: string, adminEmail?: string, isUserAdmin?: boolean) => void;
  onShareWithCoop?: (priceUSDC: number, licenseTemplate: string, documentId?: string) => void;
  onDocumentRegistered?: (documentId: string) => void;
  performDocumentRegistration?: (sharingType: "private" | "firm" | "external" | "license" | "coop") => Promise<any>;
  firmShareState?: FirmShareState;
  onViewFirmAuditTrail?: () => void;
  onFirmSharingCompleted?: () => void;
  // Document details props (when used outside of try-it-now flow)
  documentId?: string;
  documentTitle?: string;
  // External sharing props
  externalShareState?: any;
  handleShareWithExternal?: (sharedEmails: string[], expirationDate?: Date, allowDownloads?: boolean, shareAllData?: boolean, sharedFields?: Record<string, boolean>) => void;
  resetExternalSharingState?: () => void;
  setShowExternalSharingDrawer?: (open: boolean) => void;
  showExternalSharingDrawer?: boolean;
  showExternalSharingDialog?: boolean;
  setShowExternalSharingDialog?: (open: boolean) => void;
  handleExternalSharingCopyToClipboard?: (text: string, type: string) => void;
  getExternalSharingJson?: () => string;
  externalShareCopySuccess?: string | null;
  // Document sharing state
  documentSharingState?: DocumentSharingState;
}

export function PrivacySettings({ 
  onSharingLevelChange, 
  documentRegistered = false, 
  onShareDocument, 
  onCreateLicense, 
  onShareWithFirm, 
  onShareWithCoop, 
  onDocumentRegistered, 
  performDocumentRegistration,
  firmShareState,
  documentId,
  documentTitle,
  onViewFirmAuditTrail,
  onFirmSharingCompleted,
  // External sharing props
  externalShareState: propExternalShareState,
  handleShareWithExternal: propHandleShareWithExternal,
  resetExternalSharingState: propResetExternalSharingState,
  setShowExternalSharingDrawer: propSetShowExternalSharingDrawer,
  showExternalSharingDrawer: propShowExternalSharingDrawer,
  showExternalSharingDialog: propShowExternalSharingDialog,
  setShowExternalSharingDialog: propSetShowExternalSharingDialog,
  handleExternalSharingCopyToClipboard: propHandleExternalSharingCopyToClipboard,
  getExternalSharingJson: propGetExternalSharingJson,
  externalShareCopySuccess: propExternalShareCopySuccess,
  documentSharingState,
}: PrivacySettingsProps) {
  const [sharingLevel, setSharingLevel] = useState<"private" | "firm" | "external" | "license" | "coop">("private")

  // Use local external sharing hook as fallback if props are not provided
  const localExternalSharing = useExternalSharing({})
  
  // Use props if provided, otherwise fallback to local hook
  const externalShareState = propExternalShareState || localExternalSharing.externalShareState
  const handleShareWithExternal = propHandleShareWithExternal || localExternalSharing.handleShareWithExternal
  const resetExternalSharingState = propResetExternalSharingState || localExternalSharing.resetExternalSharingState
  const setShowExternalSharingDrawer = propSetShowExternalSharingDrawer || localExternalSharing.setShowExternalSharingDrawer
  const showExternalSharingDrawer = propShowExternalSharingDrawer !== undefined ? propShowExternalSharingDrawer : localExternalSharing.showExternalSharingDrawer
  const showExternalSharingDialog = propShowExternalSharingDialog !== undefined ? propShowExternalSharingDialog : localExternalSharing.showExternalSharingDialog
  const setShowExternalSharingDialog = propSetShowExternalSharingDialog || localExternalSharing.setShowExternalSharingDialog

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-500" />
            Data Visibility
          </h3>
        </div>
        <RadioGroup value={sharingLevel} onValueChange={(value) => {
          const newLevel = value as "private" | "firm" | "external" | "license" | "coop";
          setSharingLevel(newLevel);
          onSharingLevelChange?.(newLevel);
        }} className="space-y-3">
          <div className="flex items-center space-x-3 rounded-lg border p-3">
            <RadioGroupItem value="private" id="private" />
            <Label htmlFor="private" className="flex items-center cursor-pointer">
              <Lock className="h-4 w-4 mr-2 text-gray-500" />
              <div>
                <div className="font-medium">Only Me</div>
                <div className="text-xs text-gray-500">Only you can access this data</div>
              </div>
            </Label>
          </div>
          <div className="rounded-lg border">
            <div className="flex items-center space-x-3 p-3">
              <RadioGroupItem value="firm" id="firm" />
              <Label htmlFor="firm" className="flex items-center cursor-pointer">
                <Building className="h-4 w-4 mr-2 text-blue-500" />
                <div>
                  <div className="font-medium">My Firm</div>
                  <div className="text-xs text-gray-500">Everyone at your firm can access this data</div>
                </div>
              </Label>
            </div>
            
            {sharingLevel === "firm" && (
              <FirmSection 
                documentRegistered={documentRegistered}
                onShareWithFirm={onShareWithFirm}
                onDocumentRegistered={onDocumentRegistered}
                firmShareState={firmShareState}
                onViewFirmAuditTrail={onViewFirmAuditTrail}
                onFirmSharingCompleted={onFirmSharingCompleted}
                documentId={documentId}
                documentTitle={documentTitle}
                existingFirmShare={documentSharingState?.firm_share_details}
              />
            )}
          </div>
          <div className="rounded-lg border">
            <div className="flex items-center space-x-3 p-3">
              <RadioGroupItem value="external" id="external" />
              <Label htmlFor="external" className="flex items-center cursor-pointer">
                <Users className="h-4 w-4 mr-2 text-green-500" />
                <div>
                  <div className="font-medium">Share with External Party</div>
                  <div className="text-xs text-gray-500">Your trusted partners can access this data</div>
                </div>
              </Label>
            </div>
            
            {sharingLevel === "external" && (
              <ExternalSection 
                documentRegistered={documentRegistered}
                onShareDocument={onShareDocument}
                onDocumentRegistered={onDocumentRegistered}
                performDocumentRegistration={performDocumentRegistration}
                externalShareState={externalShareState}
                handleShareWithExternal={handleShareWithExternal}
                resetExternalSharingState={resetExternalSharingState}
                setShowExternalSharingDrawer={setShowExternalSharingDrawer}
                showExternalSharingDrawer={showExternalSharingDrawer}
                showExternalSharingDialog={showExternalSharingDialog}
                setShowExternalSharingDialog={setShowExternalSharingDialog}
                documentId={documentId}
                documentTitle={documentTitle}
                existingExternalShares={documentSharingState?.external_shares}
              />
            )}
          </div>
          <div className="rounded-lg border">
            <div className="flex items-center space-x-3 p-3">
              <RadioGroupItem value="license" id="license" />
              <Label htmlFor="license" className="flex items-center cursor-pointer">
                <DollarSign className="h-4 w-4 mr-2 text-emerald-500" />
                <div>
                  <div className="font-medium">License to External Party</div>
                  <div className="text-xs text-gray-500">License your data to partners with terms</div>
                </div>
              </Label>
            </div>
            
            {sharingLevel === "license" && (
              <LicenseSection 
                documentRegistered={documentRegistered}
                onCreateLicense={onCreateLicense}
                existingLicenses={documentSharingState?.licenses}
              />
            )}
          </div>
          <div className="rounded-lg border">
            <div className="flex items-center space-x-3 p-3">
              <RadioGroupItem value="coop" id="coop" />
              <Label htmlFor="coop" className="flex items-center cursor-pointer">
                <Database className="h-4 w-4 mr-2 text-purple-500" />
                <div>
                  <div className="font-medium">Share with Data Co-op</div>
                  <div className="text-xs text-gray-500">Contribute to marketplace and earn revenue</div>
                </div>
              </Label>
            </div>
            
            {sharingLevel === "coop" && (
              <CoopSection 
                documentRegistered={documentRegistered}
                onShareWithCoop={onShareWithCoop}
                existingMarketplaceStatus={documentSharingState?.marketplace_status}
              />
            )}
          </div>
        </RadioGroup>
      </div>
    </div>
  )
}
