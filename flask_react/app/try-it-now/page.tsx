"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui"
import { Navbar } from "@/components/navbar"
import { FileUploader } from "./screens/file-uploader"
import { PrivacySettings } from "./privacy-settings"
import { ArrowLeft, Lock, FileText, FileSpreadsheet, Upload, ExternalLink, CheckCircle, Check, Copy, Clock, Info } from "lucide-react"
import { ResultsViewer } from "./screens/results-viewer"
import type { SourceData, ExtractedData } from "./screens/results-viewer"
import { SourceVerificationPanel, SourcePanelInfo } from "./screens/SourceVerificationPanel"
import * as XLSX from "xlsx"
import { AssetTypeClassification } from "./screens/asset-type-classification"
import { LeaseRiskFlags } from "./screens/lease-risk-flags"
import { useLeaseContext, type RiskFlag, type ApiRiskFlag } from "./screens/lease-context"
import { CoStarExportExample } from "./screens/costar-export-example"
import { Switch } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui"
import { Progress } from "@/components/ui"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui"
import { useToast } from "@/components/ui"
import { Toaster } from "@/components/ui"
import { Stepper } from "./screens/stepper"
import { DocumentTrackingCard, RegistrationState, RegistrationEvent } from "./screens/document-tracking-card"
import { RegistrationDrawer } from "./drawers/registration-drawer"
import { RegistrationSuccessDialog } from "./dialogs/registration-success-dialog"
import { SharingDrawer } from "./drawers/sharing-drawer"
import { SharingSuccessDialog } from "./dialogs/sharing-success-dialog"
import { LicensingDrawer } from "./drawers/licensing-drawer"
import { LicensingSuccessDialog } from "./dialogs/licensing-success-dialog"
import { FirmSharingDrawer } from "./drawers/firm-sharing-drawer"
import { FirmSharingSuccessDialog } from "./dialogs/firm-sharing-success-dialog"
import { CoopSharingDrawer } from "./drawers/coop-sharing-drawer"
import { CoopSharingSuccessDialog } from "./dialogs/coop-sharing-success-dialog"
import { useRegistration } from "@/hooks/useRegistration"
import { useSharing } from "@/hooks/useSharing"
import { useLicensing } from "@/hooks/useLicensing"
import { useFirmSharing } from "@/hooks/useFirmSharing"
import { useCoopSharing } from "@/hooks/useCoopSharing"
import {
  sampleLeaseData,
  sampleRentRollData,
  sampleAssetTypeClassification,
  sampleRentRollAssetType,
  sampleRiskFlags,
  sampleRentRollRiskFlags,
} from "./sample-data"

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

  // Registration hook
  const {
    registrationState,
    showRegistrationDrawer,
    showRegistrationDialog,
    copySuccess,
    handleRegisterDocument: handleRegisterDocumentBase,
    handleCopyToClipboard,
    getRegistrationJson,
    setShowRegistrationDrawer,
    setShowRegistrationDialog,
  } = useRegistration({ uploadedFile });

  // Sharing hook
  const {
    shareState,
    showSharingDrawer,
    showSharingDialog,
    copySuccess: shareCopySuccess,
    handleShareDocument: handleShareDocumentBase,
    handleCopyToClipboard: handleSharingCopyToClipboard,
    getSharingJson,
    setShowSharingDrawer,
    setShowSharingDialog,
    resetSharingState,
  } = useSharing({ uploadedFile });

  // Licensing hook
  const {
    licenseState,
    showLicensingDrawer,
    showLicensingDialog,
    copySuccess: licenseCopySuccess,
    handleCreateLicense: handleCreateLicenseBase,
    handleCopyToClipboard: handleLicensingCopyToClipboard,
    getLicensingJson,
    setShowLicensingDrawer,
    setShowLicensingDialog,
    resetLicensingState,
  } = useLicensing({ uploadedFile });

  // Firm sharing hook
  const {
    firmShareState,
    showFirmSharingDrawer,
    showFirmSharingDialog,
    copySuccess: firmCopySuccess,
    handleShareWithFirm: handleShareWithFirmBase,
    handleCopyToClipboard: handleFirmSharingCopyToClipboard,
    getFirmSharingJson,
    setShowFirmSharingDrawer,
    setShowFirmSharingDialog,
    resetFirmSharingState,
  } = useFirmSharing({ uploadedFile });

  // Co-op sharing hook
  const {
    coopShareState,
    showCoopSharingDrawer,
    showCoopSharingDialog,
    copySuccess: coopCopySuccess,
    handlePublishToCoop: handlePublishToCoopBase,
    handleCopyToClipboard: handleCoopSharingCopyToClipboard,
    getCoopSharingJson,
    setShowCoopSharingDrawer,
    setShowCoopSharingDialog,
    resetCoopSharingState,
  } = useCoopSharing({ uploadedFile });

  // Enhanced document registration states
  const [enableDocumentTracking, setEnableDocumentTracking] = useState(false);

  // Privacy settings state
  const [sharingLevel, setSharingLevel] = useState<"private" | "firm" | "external" | "license" | "coop">("private");

  // Toast functionality
  const { toast } = useToast();



  // Wrapper function for document registration
  const handleRegisterDocument = () => {
    handleRegisterDocumentBase(enableDocumentTracking);
  };

  // Wrapper function for document sharing
  const handleShareDocument = (sharedEmails: string[]) => {
    handleShareDocumentBase(sharedEmails);
  };

  // Wrapper function for document licensing
  const handleCreateLicense = (licensedEmails: string[], monthlyFee: number) => {
    handleCreateLicenseBase(licensedEmails, monthlyFee);
  };

  // Wrapper function for firm sharing
  const handleShareWithFirm = () => {
    handleShareWithFirmBase();
  };

  // Wrapper function for co-op sharing
  const handleShareWithCoop = (priceUSDC: number, licenseTemplate: string) => {
    handlePublishToCoopBase(priceUSDC, licenseTemplate);
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
            <h1 className="text-2xl font-bold tracking-tight">Abstract & Track Document</h1>
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
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Privacy Settings</CardTitle>
                        <CardDescription>Control who can access your data</CardDescription>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button>
                              <Info className="h-4 w-4 text-gray-400" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs" side="left" align="start">
                            <p>
                              Select data visibility to enable different collaboration and monetization opportunities.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PrivacySettings 
                      onSharingLevelChange={setSharingLevel} 
                      documentRegistered={registrationState.isComplete}
                      onShareDocument={handleShareDocument}
                      onCreateLicense={handleCreateLicense}
                      onShareWithFirm={handleShareWithFirm}
                      onShareWithCoop={handleShareWithCoop}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Abstract & Track Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <Stepper
                    currentStep={currentStep}
                    uploadedFile={uploadedFile}
                    extractedData={extractedData}
                    registrationComplete={registrationState.isComplete}
                    onPrivacyClick={handlePrivacyClick}
                    onBackToResults={handleBackToResults}
                    onGoToResults={handleGoToResults}
                    onGoToPrivacy={handleGoToPrivacy}
                  />
                </CardContent>
              </Card>

              {currentStep === "privacy" && (
                <DocumentTrackingCard
                  sharingLevel={sharingLevel}
                  enableDocumentTracking={enableDocumentTracking}
                  setEnableDocumentTracking={setEnableDocumentTracking}
                  registrationState={registrationState}
                  onRegister={handleRegisterDocument}
                  onViewAuditTrail={() => setShowRegistrationDrawer(true)}
                />
              )}
      <RegistrationDrawer
        open={showRegistrationDrawer}
        onOpenChange={setShowRegistrationDrawer}
        registrationState={registrationState}
      />
      <RegistrationSuccessDialog
        open={showRegistrationDialog}
        onOpenChange={setShowRegistrationDialog}
        registrationState={registrationState}
        getRegistrationJson={getRegistrationJson}
        handleCopyToClipboard={handleCopyToClipboard}
        copySuccess={copySuccess}
      />
      <SharingDrawer
        open={showSharingDrawer}
        onOpenChange={setShowSharingDrawer}
        shareState={shareState}
      />
      <SharingSuccessDialog
        open={showSharingDialog}
        onOpenChange={setShowSharingDialog}
        shareState={shareState}
        getSharingJson={getSharingJson}
        handleCopyToClipboard={handleSharingCopyToClipboard}
        copySuccess={shareCopySuccess}
      />
      <LicensingDrawer
        open={showLicensingDrawer}
        onOpenChange={setShowLicensingDrawer}
        licenseState={licenseState}
      />
      <LicensingSuccessDialog
        open={showLicensingDialog}
        onOpenChange={setShowLicensingDialog}
        licenseState={licenseState}
        getLicensingJson={getLicensingJson}
        handleCopyToClipboard={handleLicensingCopyToClipboard}
        copySuccess={licenseCopySuccess}
      />
      <FirmSharingDrawer
        open={showFirmSharingDrawer}
        onOpenChange={setShowFirmSharingDrawer}
        firmShareState={firmShareState}
      />
      <FirmSharingSuccessDialog
        open={showFirmSharingDialog}
        onOpenChange={setShowFirmSharingDialog}
        firmShareState={firmShareState}
        getFirmSharingJson={getFirmSharingJson}
        handleCopyToClipboard={handleFirmSharingCopyToClipboard}
        copySuccess={firmCopySuccess}
      />
      <CoopSharingDrawer
        open={showCoopSharingDrawer}
        onOpenChange={setShowCoopSharingDrawer}
        coopShareState={coopShareState}
      />
      <CoopSharingSuccessDialog
        open={showCoopSharingDialog}
        onOpenChange={setShowCoopSharingDialog}
        coopShareState={coopShareState}
        getCoopSharingJson={getCoopSharingJson}
        handleCopyToClipboard={handleCoopSharingCopyToClipboard}
        copySuccess={coopCopySuccess}
      />
            </div>
          </div>
        </div>
      </main>

      
      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}