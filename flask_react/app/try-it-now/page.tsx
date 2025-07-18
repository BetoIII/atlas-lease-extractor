"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { FileUploader } from "./file-uploader"
import { PrivacySettings } from "./privacy-settings"
import { ArrowLeft, Lock, MapPin, Building, Calendar, FileText, Download, AlertCircle, FileSpreadsheet, Upload, Key, Info, ExternalLink, Shield, Loader2, CheckCircle, Check, Copy, Clock, Hash, Link as LinkIcon, Eye } from "lucide-react"
import { ResultsViewer } from "./results-viewer"
import type { SourceData, ExtractedData } from "./results-viewer"
import { SourceVerificationPanel, SourcePanelInfo } from "./SourceVerificationPanel"
import * as XLSX from "xlsx"
import { AssetTypeClassification } from "./asset-type-classification"
import { LeaseRiskFlags } from "./lease-risk-flags"
import { useLeaseContext, type RiskFlag, type ApiRiskFlag } from "./lease-context"
import { CoStarExportExample } from "./costar-export-example"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface TenantInfo {
  tenant: string;
  suite_number: string;
  leased_sqft?: number | null;
}

interface PropertyInfo {
  property_address: string;
  suite_number: string;
  unit_sqft?: number | null;
  leased_sqft?: number | null;
  landlord_name: string;
}

interface LeaseDates {
  lease_commencement_date: string;
  lease_expiration_date: string;
  lease_term: string;
}

interface Duration {
  years: number;
  months: number;
  days: number;
}

interface Uplift {
  min?: number | null;
  amount?: number | null;
  max?: number | null;
}

interface RentScheduleEntry {
  start_date: string; // ISO date string
  duration: Duration;
  rent_type: string;
  units: string;
  amount: number;
  review_type?: string | null;
  uplift?: Uplift | null;
  adjust_expense_stops?: boolean;
  stop_year?: number | null;
}

interface RentEscalationSchema {
  rent_schedule: RentScheduleEntry[];
}

interface FinancialTerms {
  base_rent: number;
  security_deposit?: number | null;
  rent_escalations?: RentEscalationSchema | null;
  expense_recovery_type: "Net" | "Stop Amount" | "Gross";
  renewal_options?: string | null;
  free_rent_months?: number | null;
}

interface LeaseSummary {
  tenant_info: TenantInfo;
  property_info: PropertyInfo;
  lease_dates: LeaseDates;
  financial_terms: FinancialTerms;
}

interface SourceInfo {
  page: number;
  position: { x: number; y: number; width: number; height: number };
  sourceText: string;
}

interface SourceDataSection {
  [key: string]: SourceInfo;
}

interface ResultsViewerProps {
  fileName: string;
  extractedData?: LeaseSummary | null;
  isSampleData?: boolean;
  sourceData?: SourceData;
  pdfPath?: string;
}



interface OperationResult {
  type: string;
  success: boolean;
  data?: any;
  error?: string;
}

// Registration event interfaces
interface RegistrationEvent {
  id: number;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  timestamp?: string;
  details?: {
    txHash?: string;
    explorerUrl?: string;
    tokenId?: string;
    manifestCID?: string;
    sha256?: string;
    simhash?: string;
    tlsh?: string;
    datasetId?: string;
    storageCID?: string;
    block?: string;
    message?: string;
  };
}

interface RegistrationState {
  isActive: boolean;
  currentStep: number;
  events: RegistrationEvent[];
  isComplete: boolean;
  recordId?: string;
  txHash?: string;
  explorerUrl?: string;
  tokenId?: string;
}

// Mock data for sample documents
const sampleLeaseData: ExtractedData = {
  tenant_info: {
    tenant: "TechStart Inc.",
    suite_number: "Suite 401",
    leased_sqft: 5500,
  },
  property_info: {
    property_address: "123 Business Plaza, Downtown District, NY 10001",
    landlord_name: "Metropolitan Property Group LLC",
  },
  lease_dates: {
    lease_commencement_date: "2024-01-01",
    lease_expiration_date: "2029-12-31",
    lease_term: "5 years",
  },
  financial_terms: {
    base_rent: 12500,
    security_deposit: 37500,
    expense_recovery_type: "Net",
    renewal_options: "Two 5-year options at market rate",
    free_rent_months: 3,
    rent_escalations: {
      rent_schedule: [
        {
          start_date: "2024-01-01",
          duration: { years: 1, months: 0, days: 0 },
          rent_type: "Base Rent",
          units: "$/month",
          amount: 12500,
          review_type: "Annual",
          uplift: { amount: 3 },
          adjust_expense_stops: false,
          stop_year: null,
        },
        {
          start_date: "2025-01-01",
          duration: { years: 1, months: 0, days: 0 },
          rent_type: "Base Rent",
          units: "$/month",
          amount: 12875,
          review_type: "Annual",
          uplift: { amount: 3 },
          adjust_expense_stops: false,
          stop_year: null,
        },
      ],
    },
  },
  sourceData: {
    field_metadata: {
      tenant_info: {},
      property_info: {},
      lease_dates: {},
      financial_terms: {},
    },
  },
};

const sampleRentRollData: ExtractedData = {
  tenant_info: {
    tenant: "Global Retail Chain",
    suite_number: "Units 100-102",
    leased_sqft: 8750,
  },
  property_info: {
    property_address: "456 Shopping Center Blvd, Retail District, CA 90210",
    landlord_name: "Westside Commercial Properties",
  },
  lease_dates: {
    lease_commencement_date: "2023-03-01",
    lease_expiration_date: "2033-02-28",
    lease_term: "10 years",
  },
  financial_terms: {
    base_rent: 22000,
    security_deposit: 66000,
    expense_recovery_type: "Stop Amount",
    renewal_options: "One 10-year option at 95% of market rate",
    free_rent_months: 6,
    rent_escalations: {
      rent_schedule: [
        {
          start_date: "2023-03-01",
          duration: { years: 2, months: 0, days: 0 },
          rent_type: "Base Rent",
          units: "$/month",
          amount: 22000,
          review_type: "Biennial",
          uplift: { amount: 2.5 },
          adjust_expense_stops: true,
          stop_year: 2023,
        },
        {
          start_date: "2025-03-01",
          duration: { years: 2, months: 0, days: 0 },
          rent_type: "Base Rent",
          units: "$/month",
          amount: 22550,
          review_type: "Biennial",
          uplift: { amount: 2.5 },
          adjust_expense_stops: true,
          stop_year: 2023,
        },
      ],
    },
  },
  sourceData: {
    field_metadata: {
      tenant_info: {},
      property_info: {},
      lease_dates: {},
      financial_terms: {},
    },
  },
};

const sampleAssetTypeClassification = {
  asset_type: "Office",
  confidence: 0.95,
  reasoning: "Document contains typical office lease terms including shared common areas, business hours provisions, and professional use clauses.",
};

const sampleRentRollAssetType = {
  asset_type: "Retail",
  confidence: 0.92,
  reasoning: "Document shows retail space characteristics with high square footage, percentage rent provisions, and shopping center location.",
};

const sampleRiskFlags: RiskFlag[] = [
  {
    title: "Personal Guarantee Required",
    severity: "high",
    page: 12,
    clause: "Section 8.2 - Guaranty Provisions",
    reason: "Lease requires personal guarantee from tenant principals for the full lease term",
    recommendation: "Consider negotiating limited guarantee or burnoff provisions",
  },
  {
    title: "No Early Termination Rights",
    severity: "medium",
    page: 8,
    clause: "Section 4.1 - Term and Renewal",
    reason: "Tenant has no right to terminate lease early under any circumstances",
    recommendation: "Negotiate early termination rights for specific events",
  },
  {
    title: "Broad Assignment Restrictions",
    severity: "medium",
    page: 15,
    clause: "Section 11.3 - Assignment and Subletting",
    reason: "Very restrictive assignment and subletting provisions that require landlord consent",
    recommendation: "Seek more flexible assignment rights for affiliates and qualified assignees",
  },
];

const sampleRentRollRiskFlags: RiskFlag[] = [
  {
    title: "Percentage Rent Obligation",
    severity: "high",
    page: 3,
    clause: "Rent Roll Summary - Additional Charges",
    reason: "Tenant owes percentage rent based on gross sales exceeding breakpoint",
    recommendation: "Monitor sales reporting requirements and breakpoint calculations",
  },
  {
    title: "CAM Reconciliation Discrepancy",
    severity: "medium",
    page: 5,
    clause: "Operating Expense Details",
    reason: "CAM charges show significant variance from budgeted amounts",
    recommendation: "Request detailed CAM reconciliation and audit rights",
  },
];

function mapToExtractedData(raw: any): ExtractedData {
  return {
    tenant_info: {
      tenant: raw.party_info?.tenant ?? raw.tenant_info?.tenant ?? "",
      suite_number: raw.property_info?.suite_number ?? raw.tenant_info?.suite_number ?? "",
      leased_sqft: raw.property_info?.leased_sqft ?? raw.tenant_info?.leased_sqft ?? null,
    },
    property_info: {
      property_address: raw.property_info?.property_address ?? "",
      landlord_name: raw.property_info?.landlord_name ?? "",
    },
    lease_dates: raw.lease_dates ?? {
      lease_commencement_date: "",
      lease_expiration_date: "",
      lease_term: "",
    },
    financial_terms: raw.financial_terms ?? {
      base_rent: 0,
      expense_recovery_type: "Net",
    },
    sourceData: raw.sourceData,
  };
}

export default function TryItNowPage() {
  // Use the lease context for all data management
  const {
    uploadedFile,
    uploadedFilePath,
    extractedData,
    sourceData,
    assetTypeClassification,
    riskFlags,
    isSummaryLoading,
    isAssetTypeLoading,
    isRiskFlagsLoading,
    isReclassifying,
    error,
    setUploadedFile,
    setUploadedFilePath,
    setExtractedData,
    setSourceData,
    setAssetTypeClassification,
    setRiskFlags,
    setIsSummaryLoading,
    setIsAssetTypeLoading,
    setIsRiskFlagsLoading,
    setIsReclassifying,
    setError,
    transformRiskFlags,
    resetAllData,
    resetProcessingData,
    hasCompleteData,
  } = useLeaseContext();

  // Local UI state
  const [currentStep, setCurrentStep] = useState<"upload" | "results" | "privacy">("upload")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSourcePanel, setShowSourcePanel] = useState(false)
  const [activeSource, setActiveSource] = useState<SourcePanelInfo | null>(null)
  // Feature flag for export button
  const EXPORT_ENABLED = false;

  // Enhanced document registration states
  const [enableDocumentTracking, setEnableDocumentTracking] = useState(false);
  const [registrationState, setRegistrationState] = useState<RegistrationState>({
    isActive: false,
    currentStep: 0,
    events: [],
    isComplete: false,
  });
  const [showRegistrationDrawer, setShowRegistrationDrawer] = useState(false);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Privacy settings state
  const [sharingLevel, setSharingLevel] = useState<"private" | "firm" | "external" | "license" | "coop">("private");

  // Toast functionality
  const { toast } = useToast();

  // Handle copy to clipboard
  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(type);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  // Generate registration JSON for display
  const getRegistrationJson = () => {
    if (!registrationState.recordId) return "";

    return JSON.stringify(
      {
        document_type: "Lease Agreement",
        record_id: registrationState.recordId,
        issued_timestamp: registrationState.events.find(e => e.name === 'RegistrationCompleted')?.timestamp || new Date().toISOString(),
        source_hash: registrationState.events.find(e => e.name === 'RegistrationCompleted')?.details?.sha256 || "N/A",
        qa_verified: false,
        authors: [
          {
            name: "Current User",
            role: "Abstractor",
          },
        ],
        owning_firm: {
          name: "Atlas Data Co-op User",
          firm_id: "FIRM-0193",
        },
        data_fields: {
          term_start: "2023-07-01",
          base_rent: "$48.00/SF",
          tenant: "Acme Corporation",
        },
        permissioning: {
          visibility: "private",
          allowed_viewers: ["internal"],
          revocable: true,
        },
        ...(registrationState.txHash
          ? {
              blockchain_anchor: {
                chain: "Ethereum",
                tx_hash: registrationState.txHash,
                explorer_url: registrationState.explorerUrl,
              },
            }
          : {}),
      },
      null,
      2,
    );
  };

  // Handle document registration with simulated backend events
  const handleRegisterDocument = async () => {
    if (!enableDocumentTracking) return;
    
    // Initialize registration state
    setRegistrationState({
      isActive: true,
      currentStep: 0,
      events: [],
      isComplete: false,
    });
    setShowRegistrationDrawer(true);

    // Generate mock data
    const datasetId = `ds-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const recordId = `rec-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const sha256 = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    const simhash = `0x${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    const tlsh = `T1${Array.from({ length: 70 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    const explorerUrl = `https://polygonscan.com/tx/${txHash}`;
    const tokenId = Math.floor(Math.random() * 1000) + 1;
    const manifestCID = `Qm${Array.from({ length: 44 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join("")}`;
    const storageCID = `Qm${Array.from({ length: 44 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join("")}`;
    const blockNumber = Math.floor(Math.random() * 1000000) + 50000000;

    // Define the 6 registration events
    const events: RegistrationEvent[] = [
      {
        id: 1,
        name: 'RegistrationInitiated',
        status: 'pending',
        details: {
          datasetId,
          message: `Broker triggers registration for ${uploadedFile?.name || 'document'}`
        }
      },
      {
        id: 2,
        name: 'DocumentFingerprinted',
        status: 'pending',
        details: {
          sha256,
          simhash,
          tlsh,
          message: 'Atlas emits canonical SHA-256 + fuzzy SimHash/TLSH digests'
        }
      },
      {
        id: 3,
        name: 'ProvenanceStampCreated',
        status: 'pending',
        details: {
          manifestCID,
          message: 'C2PA manifest generated and pinned to IPFS'
        }
      },
      {
        id: 4,
        name: 'DataNFTMinted',
        status: 'pending',
        details: {
          tokenId: tokenId.toString(),
          datasetId,
          storageCID,
          txHash,
          explorerUrl,
          message: 'ERC-721 NFT minted with encrypted storage pointer'
        }
      },
      {
        id: 5,
        name: 'OwnerTokenGranted',
        status: 'pending',
        details: {
          message: 'ERC-1155 datatoken #0 (full rights) delegated to owner'
        }
      },
      {
        id: 6,
        name: 'RegistrationCompleted',
        status: 'pending',
        details: {
          datasetId,
          block: blockNumber.toString(),
          txHash,
          sha256,
          message: 'Registration complete - document is now tamper-proof'
        }
      }
    ];

    // Initialize with all events pending
    setRegistrationState(prev => ({
      ...prev,
      events: events,
      recordId,
      txHash,
      explorerUrl,
      tokenId: tokenId.toString()
    }));

    // Simulate processing each event with delays
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      
      // Update event to processing
      setRegistrationState(prev => ({
        ...prev,
        currentStep: i + 1,
        events: prev.events.map(e => 
          e.id === event.id 
            ? { ...e, status: 'processing' as const, timestamp: new Date().toISOString() }
            : e
        )
      }));

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));

      // Update event to completed
      setRegistrationState(prev => ({
        ...prev,
        events: prev.events.map(e => 
          e.id === event.id 
            ? { ...e, status: 'completed' as const, timestamp: new Date().toISOString() }
            : e
        )
      }));

      // Show toast notifications for key events
      if (event.name === 'RegistrationInitiated') {
        toast({
          title: "Registration Started",
          description: "Document registration has been initiated",
        });
      } else if (event.name === 'DataNFTMinted') {
        toast({
          title: `✓ Data NFT minted (#${tokenId})`,
          description: (
            <div className="flex items-center">
              <span>View on PolygonScan</span>
              <ExternalLink className="h-3 w-3 ml-1" />
            </div>
          ),
        });
      } else if (event.name === 'RegistrationCompleted') {
        toast({
          title: `✓ Registration tx confirmed (${txHash.substring(0, 8)}...)`,
          description: "Document is now cryptographically verifiable",
        });
      }
    }

    // Mark registration as complete
    setRegistrationState(prev => ({
      ...prev,
      isActive: false,
      isComplete: true,
      currentStep: events.length
    }));

    // Show success dialog after a brief delay
    setTimeout(() => {
      setShowRegistrationDialog(true);
    }, 500);
  };

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file)
    setIsProcessing(true)
    setError(null)
    // Reset only processing data (keep file info), then set loading states
    resetProcessingData()

    // Check if this is a sample file
    const isSampleFile = (file as any).isSample === true
    
    if (isSampleFile) {
      // Handle sample files with mock data
      setCurrentStep("results")
      setIsProcessing(false)
      
      // Set mock data based on file name
      if (file.name.includes("Lease")) {
        setExtractedData(sampleLeaseData)
        setAssetTypeClassification(sampleAssetTypeClassification)
        setRiskFlags(sampleRiskFlags)
      } else if (file.name.includes("Rent Roll")) {
        setExtractedData(sampleRentRollData)
        setAssetTypeClassification(sampleRentRollAssetType)
        setRiskFlags(sampleRentRollRiskFlags)
      }
      
      // Set mock file path
      setUploadedFilePath(`/mock/${file.name}`)
      return
    }

    // Set loading states for real files
    setIsAssetTypeLoading(true)
    setIsSummaryLoading(true)
    setIsRiskFlagsLoading(true)

    // Step 1: Upload the file to get a temp file path
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)

    try {
      const uploadResponse = await fetch('http://localhost:5601/upload', {
        method: 'POST',
        body: uploadFormData,
      })
      if (!uploadResponse.ok) throw new Error(`Upload failed: ${uploadResponse.statusText}`)
      const uploadResult = await uploadResponse.json()
      const filePath = uploadResult.filepath
      setUploadedFilePath(filePath)

      // Immediately transition to results view to show loading states
      setCurrentStep("results")
      setIsProcessing(false)

      // Helper function to add timeout to fetch requests
      const fetchWithTimeout = (url: string, options: RequestInit, timeoutMs = 120000) => {
        return Promise.race([
          fetch(url, options),
          new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
          )
        ])
      }

      // Step 2: Start all three operations independently (no waiting)
      
      // Asset type classification - fastest operation
      fetchWithTimeout('http://localhost:5601/classify-asset-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: filePath }),
      }, 60000).then(async (response) => {
        if (response.ok) {
          const result = await response.json()
          setAssetTypeClassification(result)
        } else {
          console.error('Asset type classification failed:', await response.text())
        }
      }).catch(err => {
        console.error('Asset type classification error:', err)
      }).finally(() => {
        setIsAssetTypeLoading(false)
      })

      // Risk flags extraction - medium speed operation
      const riskFlagsFormData = new FormData()
      riskFlagsFormData.append('file', file)
      fetchWithTimeout('http://localhost:5601/extract-risk-flags', {
        method: 'POST',
        body: riskFlagsFormData,
      }, 120000).then(async (response) => {
        if (response.ok) {
          const result = await response.json()
          const apiRiskFlags = result.data?.risk_flags || []
          setRiskFlags(transformRiskFlags(apiRiskFlags))
        } else {
          console.error('Risk flags extraction failed:', await response.text())
          setRiskFlags([])
        }
      }).catch(err => {
        console.error('Risk flags extraction error:', err)
        setRiskFlags([])
      }).finally(() => {
        setIsRiskFlagsLoading(false)
      })

      // Summary extraction - slowest operation
      const summaryFormData = new FormData()
      summaryFormData.append('file', file)
      fetchWithTimeout('http://localhost:5601/extract-summary', {
        method: 'POST',
        body: summaryFormData,
      }, 120000).then(async (response) => {
        if (response.ok) {
          const result = await response.json()
          setExtractedData(mapToExtractedData(result.data))
          setSourceData(result.sourceData)
        } else {
          const errorText = await response.text()
          console.error('Summary extraction failed:', errorText)
          setError(`Summary extraction failed: ${errorText}`)
        }
      }).catch(err => {
        console.error('Summary extraction error:', err)
        setError(`Summary extraction failed: ${err.message}`)
      }).finally(() => {
        setIsSummaryLoading(false)
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during file upload.')
      setIsProcessing(false)
      setIsAssetTypeLoading(false)
    }
  }

  const handleAssetTypeReclassify = async (newAssetType: string) => {
    setIsReclassifying(true)

    try {
      const response = await fetch('http://localhost:5601/reclassify-asset-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_path: uploadedFilePath,
          new_asset_type: newAssetType,
        }),
      })

      if (!response.ok) throw new Error(`Reclassification failed: ${response.statusText}`)
      const result = await response.json()
      setAssetTypeClassification(result)
    } catch (err) {
      console.error('Asset type reclassification failed:', err)
    } finally {
      setIsReclassifying(false)
    }
  }

  const handlePrivacyClick = () => {
    setCurrentStep("privacy")
  }

  const handleBackToResults = () => {
    setCurrentStep("results")
  }

  const handleGoToResults = () => {
    if (extractedData && currentStep !== "results") {
      setCurrentStep("results")
    }
  }

  const handleGoToPrivacy = () => {
    if (extractedData && currentStep !== "privacy") {
      setCurrentStep("privacy")
    }
  }

  const handleSave = () => {
    // TODO: Save data to database
    console.log('Saving data...')
  }

  // Handler to show the source verification panel
  const handleViewSource = (source: SourcePanelInfo) => {
    setActiveSource(source);
    setShowSourcePanel(true);
  };

  const handleCloseSourcePanel = () => {
    setShowSourcePanel(false);
    setActiveSource(null);
  };

  const handleExportToExcel = () => {
    if (!extractedData) return;

    // Summary tab (existing)
    const formatNumber = (value: number | null | undefined): string | number => {
      if (value === null || value === undefined) return "";
      return value.toLocaleString("en-US");
    };

    const summaryData = [
      { Key: "Tenant", Value: extractedData.tenant_info.tenant },
      { Key: "Suite Number", Value: extractedData.tenant_info.suite_number },
      { Key: "Leased Sqft", Value: extractedData.tenant_info.leased_sqft ? formatNumber(extractedData.tenant_info.leased_sqft) : "" },
      { Key: "Property Address", Value: extractedData.property_info.property_address },
      { Key: "Landlord Name", Value: extractedData.property_info.landlord_name },
      { Key: "Lease Commencement Date", Value: extractedData.lease_dates.lease_commencement_date },
      { Key: "Lease Expiration Date", Value: extractedData.lease_dates.lease_expiration_date },
      { Key: "Lease Term", Value: extractedData.lease_dates.lease_term },
      { Key: "Base Rent", Value: extractedData.financial_terms.base_rent ? formatNumber(extractedData.financial_terms.base_rent) : "" },
      { Key: "Expense Recovery Type", Value: extractedData.financial_terms.expense_recovery_type },
      { Key: "Security Deposit", Value: extractedData.financial_terms.security_deposit ? formatNumber(extractedData.financial_terms.security_deposit) : "" },
      { Key: "Renewal Options", Value: extractedData.financial_terms.renewal_options },
      { Key: "Free Rent Months", Value: extractedData.financial_terms.free_rent_months ? formatNumber(extractedData.financial_terms.free_rent_months) : "" },
    ];

    // Detailed tab
    const detailedData = [
      { Section: "Tenant Information", Field: "Tenant", Value: extractedData.tenant_info.tenant },
      { Section: "Tenant Information", Field: "Suite Number", Value: extractedData.tenant_info.suite_number },
      { Section: "Tenant Information", Field: "Leased Sqft", Value: extractedData.tenant_info.leased_sqft ? formatNumber(extractedData.tenant_info.leased_sqft) : "" },
      { Section: "Property Information", Field: "Property Address", Value: extractedData.property_info.property_address },
      { Section: "Property Information", Field: "Landlord Name", Value: extractedData.property_info.landlord_name },
      { Section: "Lease Dates", Field: "Lease Commencement Date", Value: extractedData.lease_dates.lease_commencement_date },
      { Section: "Lease Dates", Field: "Lease Expiration Date", Value: extractedData.lease_dates.lease_expiration_date },
      { Section: "Lease Dates", Field: "Lease Term", Value: extractedData.lease_dates.lease_term },
      { Section: "Financial Terms", Field: "Base Rent", Value: extractedData.financial_terms.base_rent ? formatNumber(extractedData.financial_terms.base_rent) : "" },
      { Section: "Financial Terms", Field: "Security Deposit", Value: extractedData.financial_terms.security_deposit ? formatNumber(extractedData.financial_terms.security_deposit) : "" },
      { Section: "Financial Terms", Field: "Expense Recovery Type", Value: extractedData.financial_terms.expense_recovery_type },
      { Section: "Financial Terms", Field: "Renewal Options", Value: extractedData.financial_terms.renewal_options },
      { Section: "Financial Terms", Field: "Free Rent Months", Value: extractedData.financial_terms.free_rent_months ? formatNumber(extractedData.financial_terms.free_rent_months) : "" },
    ];

    // Rent Escalation Table (if available)
    const rentSchedule = extractedData.financial_terms.rent_escalations?.rent_schedule;
    let escalationSheet;
    if (rentSchedule && rentSchedule.length > 0) {
      const escalationData = rentSchedule.map((entry) => ({
        "Start Date": entry.start_date,
        "Duration": `${entry.duration.years || 0}y ${entry.duration.months || 0}m ${entry.duration.days || 0}d`,
        "Type": entry.rent_type,
        "Amount": formatNumber(entry.amount),
        "Units": entry.units,
        "Review Type": entry.review_type ?? "",
        "Uplift": entry.uplift
          ? [
              entry.uplift.amount != null ? `Amount: ${formatNumber(entry.uplift.amount)}` : null,
              entry.uplift.min != null ? `Min: ${formatNumber(entry.uplift.min)}` : null,
              entry.uplift.max != null ? `Max: ${formatNumber(entry.uplift.max)}` : null,
            ]
              .filter(Boolean)
              .join(", ")
          : "",
        "Adjust Expense Stops": entry.adjust_expense_stops ? "Yes" : "",
        "Stop Year": entry.stop_year ? formatNumber(entry.stop_year) : "",
      }));
      escalationSheet = XLSX.utils.json_to_sheet(escalationData);
    }

    // Risk Flags Tab
    let riskFlagsSheet;
    if (riskFlags && riskFlags.length > 0) {
      const riskFlagsData = riskFlags.map((flag, index) => ({
        "Risk #": index + 1,
        "Title": flag.title,
        "Severity": flag.severity.charAt(0).toUpperCase() + flag.severity.slice(1),
        "Page": flag.page,
        "Clause": flag.clause,
        "Reason": flag.reason,
        "Recommendation": flag.recommendation || ""
      }));
      riskFlagsSheet = XLSX.utils.json_to_sheet(riskFlagsData);
    }

    // Create workbook and sheets
    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    const wsDetailed = XLSX.utils.json_to_sheet(detailedData);

    XLSX.utils.book_append_sheet(wb, wsSummary, "Lease Summary");
    XLSX.utils.book_append_sheet(wb, wsDetailed, "Detailed View");
    if (escalationSheet) {
      XLSX.utils.book_append_sheet(wb, escalationSheet, "Rent Escalations");
    }
    if (riskFlagsSheet) {
      XLSX.utils.book_append_sheet(wb, riskFlagsSheet, "Risk Flags");
    }

    // Determine file name
    let baseName = "Lease";
    if (uploadedFile && uploadedFile.name) {
      baseName = uploadedFile.name.replace(/\.[^/.]+$/, "");
    }
    const fileName = `Lease Abstract - ${baseName}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  const handleExportToCoStar = () => {
    const exportData = {
      fileName: uploadedFile?.name,
      tenant: extractedData?.tenant_info?.tenant,
      propertyAddress: extractedData?.property_info?.property_address,
      leasedArea: extractedData?.tenant_info?.leased_sqft,
      commencementDate: extractedData?.lease_dates?.lease_commencement_date,
      expirationDate: extractedData?.lease_dates?.lease_expiration_date,
      baseRent: extractedData?.financial_terms?.base_rent,
      rentSchedule: extractedData?.financial_terms?.rent_escalations?.rent_schedule,
      riskFlags: riskFlags,
      // Add any other relevant data fields...
    };

    console.log("Exporting to CoStar:", exportData);
    
    // Example of what you might do:
    // - Call CoStar API
    // - Transform data to CoStar format
    // - Handle authentication
    // - Show success/error messages
    
    alert("Export to CoStar feature - data is ready! Check console for complete data structure.");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="mb-8 flex items-center">
            <Link href="/" className="flex items-center text-sm text-gray-500 hover:text-primary mr-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Document Extraction & Tracking</h1>
          </div>

          <div className="grid gap-8 md:grid-cols-[1fr_300px]">
            <div className="">
              {(currentStep === "upload" || currentStep === "results") && (
                <Card>
                  {currentStep === "upload" && (
                    <>
                      <CardHeader>
                        <CardTitle>Upload Document</CardTitle>
                        <CardDescription>Upload your document to abstract structured data</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <FileUploader onFileUpload={handleFileUpload} isProcessing={isProcessing} />
                        {error && (
                          <div className="mt-4 text-sm text-red-500">
                            Error: {error}
                          </div>
                        )}
                      </CardContent>
                    </>
                  )}

                  {currentStep === "results" && (
                    <>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-primary mr-2" />
                          <span className="font-medium">{uploadedFile?.name}</span>
                        </div>                    
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportToExcel}
                            disabled={!extractedData}
                          >
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Export to Excel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleExportToCoStar}
                            disabled={!hasCompleteData()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Export to CoStar
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Results Viewer - shows loading state or data (TOP PRIORITY) */}
                        {(isSummaryLoading || extractedData) && (
                          <ResultsViewer
                            fileName={uploadedFile?.name || "Lease.pdf"}
                            extractedData={extractedData || undefined}
                            sourceData={sourceData}
                            pdfPath={uploadedFilePath || undefined}
                            onViewSource={handleViewSource}
                            isLoading={isSummaryLoading}
                          />
                        )}

                        {/* Asset Type Classification - shows during processing and after */}
                        {(isAssetTypeLoading || assetTypeClassification) && (
                          <AssetTypeClassification
                            classification={assetTypeClassification}
                            isLoading={isAssetTypeLoading}
                            onReclassify={handleAssetTypeReclassify}
                            isReclassifying={isReclassifying}
                          />
                        )}

                        {/* Risk Flags - shows loading state or data */}
                        {(isRiskFlagsLoading || riskFlags.length > 0) && (
                          <LeaseRiskFlags 
                            fileName={uploadedFile?.name || "Lease.pdf"} 
                            riskFlags={riskFlags}
                            isLoading={isRiskFlagsLoading}
                          />
                        )}
                      </CardContent>
                    </>
                  )}
                </Card>
              )}

              {currentStep === "privacy" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                    <CardDescription>Control who can access your data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PrivacySettings 
                      onSharingLevelChange={setSharingLevel} 
                      documentRegistered={registrationState.isComplete}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Document Extraction Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-start">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${currentStep === "upload" ? "bg-primary text-white" : "bg-gray-200 text-gray-500"} mr-2`}
                      >
                        1
                      </div>
                      <div>
                        <p className="font-medium">Upload Document</p>
                        <p className="text-xs text-gray-500">Upload document for processing</p>
                      </div>
                    </div>
                    <div 
                      className={`flex items-start ${extractedData && currentStep !== "results" ? "cursor-pointer hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors" : ""}`}
                      onClick={handleGoToResults}
                    >
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${currentStep === "results" ? "bg-primary text-white" : "bg-gray-200 text-gray-500"} mr-2`}
                      >
                        2
                      </div>
                      <div>
                        <p className={`font-medium ${extractedData && currentStep !== "results" ? "text-primary hover:text-primary/80" : ""}`}>View Results</p>
                        <p className="text-xs text-gray-500">Review extracted structured data</p>
                      </div>
                    </div>
                    <div 
                      className={`flex items-start ${extractedData && currentStep !== "privacy" ? "cursor-pointer hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors" : ""}`}
                      onClick={handleGoToPrivacy}
                    >
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${currentStep === "privacy" ? "bg-primary text-white" : "bg-gray-200 text-gray-500"} mr-2`}
                      >
                        3
                      </div>
                      <div>
                        <p className={`font-medium ${extractedData && currentStep !== "privacy" ? "text-primary hover:text-primary/80" : ""}`}>Privacy Settings</p>
                        <p className="text-xs text-gray-500">Control who can access your data</p>
                      </div>
                    </div>
                  </div>
                  {currentStep === "results" && (
                    <div className="mt-6 pt-4">
                      <Button variant="outline" size="sm" onClick={handlePrivacyClick} className="w-full">
                        <Lock className="mr-2 h-4 w-4" />
                        Privacy Settings
                      </Button>
                    </div>
                  )}
                  {currentStep === "privacy" && (
                    <div className="mt-6 pt-4">
                      <Button variant="outline" size="sm" onClick={handleBackToResults} className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Results
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Document Tracking Card - Only show when on Privacy Settings step */}
              {currentStep === "privacy" && (
                <Card className="">
                  <CardHeader>
                      <CardTitle className="flex items-center text-base">
                        Enable Document Tracking
                      </CardTitle>
                    <CardDescription className="text-xs ">
                      Generate a unique record that maintains an immutable audit trail with Atlas DAO.
                      <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button>
                                  <Info className="h-4 w-4 text-gray-400 ml-2" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="mb-2">
                                  Atlas DAO is a non-profit third-party that maintains a unique hash record of your document and its activity - providing a tamper-proof and verifiable audit trail of your data.
                                </p>
                                <div className="flex justify-end">
                                  <a href="https://atlasdao.com" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-900 font-bold flex items-center gap-1">                          
                                    Learn more
                                    <ExternalLink className="h-3 w-3 text-gray-400" />
                                  </a>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="flex items-right justify-end pb-2">
                      <Badge 
                        variant="outline" 
                        className={`w-fit ${
                          registrationState.isComplete
                            ? "bg-green-100 text-green-800 border-green-200"
                            : sharingLevel === "external" || sharingLevel === "coop" || sharingLevel === "license"
                            ? "bg-red-100 text-red-800 border-red-200" 
                            : "bg-green-100 text-green-800 border-green-200"
                        }`}
                      >
                        {registrationState.isComplete 
                          ? "Verified" 
                          : sharingLevel === "external" || sharingLevel === "coop" || sharingLevel === "license" 
                          ? "Required" 
                          : "Recommended"}
                      </Badge>
                    </div>       
                    <div className={`rounded-lg border p-3 space-y-3 ${
                      registrationState.isComplete
                        ? "border-green-200 bg-green-50"
                        : sharingLevel === "external" || sharingLevel === "coop" || sharingLevel === "license"
                        ? "border-red-200 bg-red-50" 
                        : "border-blue-200 bg-blue-50"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Key className={`h-4 w-4 mr-2 ${registrationState.isComplete ? "text-green-600" : "text-gray-500"}`} />
                          <div className={`text-sm font-medium ${registrationState.isComplete ? "text-green-800" : ""}`}>
                            {registrationState.isComplete ? "Document Registered" : "Register Document"}
                          </div>
                        </div>
                        <Switch 
                          checked={registrationState.isComplete || enableDocumentTracking} 
                          onCheckedChange={registrationState.isComplete ? undefined : setEnableDocumentTracking}
                          disabled={registrationState.isComplete}
                          className={registrationState.isComplete ? "data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 disabled:opacity-100" : ""}
                        />
                      </div>
                    </div>
                    {registrationState.isActive && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{registrationState.currentStep === 0 ? "Initializing..." : registrationState.currentStep === 1 ? "Preparing registration..." : "Registration Complete"}</span>
                          <span className="text-gray-500">{registrationState.currentStep === 1 ? "0%" : registrationState.currentStep === 2 ? "50%" : "100%"}</span>
                        </div>
                        <Progress value={registrationState.currentStep === 1 ? 50 : 100} className="h-1" />
                      </div>
                    )}
                    <div className="flex justify-center items-center pt-4">
                      {registrationState.isActive ? (
                        <Button variant="default" size="sm" disabled>
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          Registering...
                        </Button>
                      ) : registrationState.isComplete ? (
                        <Button variant="outline" size="sm" onClick={() => setShowRegistrationDrawer(true)}>
                          <Eye className="h-3 w-3 mr-2" />
                          View Audit Trail
                        </Button>
                      ) : (
                        <Button variant="default" size="sm" disabled={!enableDocumentTracking} onClick={handleRegisterDocument}>
                          <Key className="h-3 w-3 mr-2" />
                          Register Document
                        </Button>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex justify-center pt-4">
                      <span className="flex items-center">
                        <Shield className="h-3 w-3 mr-1 text-green-600" />
                        {registrationState.isComplete ? "Powered by Ethereum" : "Powered by Ethereum"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Registration Progress Drawer */}
      <Sheet open={showRegistrationDrawer} onOpenChange={setShowRegistrationDrawer}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center">
              <Hash className="h-5 w-5 mr-2" />
              Document Registration Progress
            </SheetTitle>
            <SheetDescription>
              Live status of blockchain registration events
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {registrationState.events.map((event, index) => (
              <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                <div className="flex-shrink-0 mt-1">
                  {event.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : event.status === 'processing' ? (
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  ) : event.status === 'error' ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                      {index + 1}. {event.name.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    {event.status === 'completed' && event.timestamp && (
                      <span className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {event.details?.message || 'Processing...'}
                  </p>
                  {event.status === 'completed' && event.details && (
                    <div className="mt-2 space-y-1">
                      {event.details.txHash && (
                        <div className="flex items-center text-xs">
                          <LinkIcon className="h-3 w-3 mr-1 text-gray-400" />
                          <a 
                            href={event.details.explorerUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-mono"
                          >
                            {event.details.txHash.substring(0, 10)}...
                          </a>
                        </div>
                      )}
                      {event.details.tokenId && (
                        <div className="flex items-center text-xs">
                          <span className="text-gray-500">Token ID: </span>
                          <span className="font-mono ml-1">#{event.details.tokenId}</span>
                        </div>
                      )}
                      {event.details.block && (
                        <div className="flex items-center text-xs">
                          <span className="text-gray-500">Block: </span>
                          <span className="font-mono ml-1">{event.details.block}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {registrationState.isComplete && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-green-800">Registration Complete</h4>
                    <p className="text-xs text-green-700 mt-1">
                      Your document is now cryptographically verifiable and tamper-proof.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Document Registration Success Dialog */}
      <Dialog open={showRegistrationDialog} onOpenChange={setShowRegistrationDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              Document Successfully Registered
            </DialogTitle>
            <DialogDescription>
              Your document has been registered and is now cryptographically verifiable.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            {/* Registration Details */}
            <div className="space-y-3">
              <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                <span className="text-sm font-medium text-gray-500 pt-1">Record ID:</span>
                <div className="flex items-center min-w-0">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all">{registrationState.recordId}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 ml-1"
                    onClick={() => registrationState.recordId && handleCopyToClipboard(registrationState.recordId, "recordId")}
                  >
                    {copySuccess === "recordId" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                <span className="text-sm font-medium text-gray-500 pt-1">Created:</span>
                <div className="flex items-center">
                  <span className="text-sm flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-gray-400" />
                    {registrationState.events.find(e => e.name === 'RegistrationCompleted')?.timestamp ? new Date(registrationState.events.find(e => e.name === 'RegistrationCompleted')?.timestamp || new Date().toISOString()).toLocaleString() : "N/A"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                <span className="text-sm font-medium text-gray-500 pt-1">Document Hash:</span>
                <div className="flex items-center min-w-0">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all max-w-[500px]">
                    {registrationState.events.find(e => e.name === 'RegistrationCompleted')?.details?.sha256 || "N/A"}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 ml-1"
                    onClick={() => {
                      const hash = registrationState.events.find(e => e.name === 'RegistrationCompleted')?.details?.sha256;
                      if (hash) handleCopyToClipboard(hash, "hash");
                    }}
                  >
                    {copySuccess === "hash" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>
              {registrationState.txHash && (
                <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                  <span className="text-sm font-medium text-gray-500 pt-1">Blockchain:</span>
                  <div className="flex items-center">
                    <Badge className="mr-2 bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Ethereum</Badge>
                    <a
                      href={registrationState.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center"
                    >
                      View Transaction
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </div>
              )}
            </div>
            {/* Registration Data */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Registration Data</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => handleCopyToClipboard(getRegistrationJson(), "json")}
                >
                  {copySuccess === "json" ? (
                    <Check className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}
                  Copy JSON
                </Button>
              </div>
              <div className="bg-gray-900 text-gray-100 p-3 text-xs font-mono overflow-auto rounded-md min-h-[200px] max-h-[400px] whitespace-pre-wrap">
                {getRegistrationJson()}
              </div>
            </div>
            {/* Verification Status */}
            <div className="rounded-lg border border-green-100 bg-green-50 p-3">
              <div className="flex items-start">
                <Shield className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">Verification Status</h4>
                  <p className="text-xs text-green-700 mt-1">
                    This document has been cryptographically signed and is now immutable.
                    It can be used immediately for all purposes.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button onClick={() => setShowRegistrationDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}
