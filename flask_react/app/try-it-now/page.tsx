"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { FileUploader } from "./file-uploader"
import { PrivacySettings } from "./privacy-settings"
import { ArrowLeft, Lock, MapPin, Building, Calendar, FileText, Download, AlertCircle, FileSpreadsheet } from "lucide-react"
import { ResultsViewer } from "./results-viewer"
import type { SourceData, ExtractedData } from "./results-viewer"
import { SourceVerificationPanel, SourcePanelInfo } from "./SourceVerificationPanel"
import * as XLSX from "xlsx"
import { AssetTypeClassification } from "./asset-type-classification"

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
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<"upload" | "results" | "privacy">("upload")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [sourceData, setSourceData] = useState<SourceData | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [showSourcePanel, setShowSourcePanel] = useState(false)
  const [activeSource, setActiveSource] = useState<SourcePanelInfo | null>(null)
  // Feature flag for export button
  const EXPORT_ENABLED = false;
  const [assetTypeClassification, setAssetTypeClassification] = useState<{
    asset_type: string
    confidence: number
  } | null>(null)
  const [isAssetTypeLoading, setIsAssetTypeLoading] = useState(false)
  const [isReclassifying, setIsReclassifying] = useState(false)

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file)
    setIsProcessing(true)
    setIsAssetTypeLoading(true)
    setError(null)

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

      // Step 2: Start asset type classification immediately
      const classifyResponse = await fetch('http://localhost:5601/classify-asset-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: filePath }),
      })
      if (classifyResponse.ok) {
        const classificationResult = await classifyResponse.json()
        setAssetTypeClassification(classificationResult)
        setIsAssetTypeLoading(false)
      } else {
        console.error('Asset type classification failed:', await classifyResponse.text())
        setIsAssetTypeLoading(false)
      }

      // Step 3: Extract summary (this will take longer)
      const extractFormData = new FormData()
      extractFormData.append('file', file)

      try {
        const summaryResponse = await fetch('http://localhost:5601/extract-summary', {
          method: 'POST',
          body: extractFormData,
        })
        if (!summaryResponse.ok) throw new Error(`Summary extraction failed: ${summaryResponse.statusText}`)
        const summaryResult = await summaryResponse.json()
        setExtractedData(mapToExtractedData(summaryResult.data))
        setSourceData(summaryResult.sourceData)
        console.log('Extracted Data:', summaryResult.data)
        setCurrentStep("results")
      } catch (summaryErr) {
        setError(summaryErr instanceof Error ? summaryErr.message : 'An error occurred during summary extraction.')
      }

      setIsProcessing(false)
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
    const summaryData = [
      { Key: "Tenant", Value: extractedData.tenant_info.tenant },
      { Key: "Suite Number", Value: extractedData.tenant_info.suite_number },
      { Key: "Leased Sqft", Value: extractedData.tenant_info.leased_sqft },
      { Key: "Property Address", Value: extractedData.property_info.property_address },
      { Key: "Landlord Name", Value: extractedData.property_info.landlord_name },
      { Key: "Lease Commencement Date", Value: extractedData.lease_dates.lease_commencement_date },
      { Key: "Lease Expiration Date", Value: extractedData.lease_dates.lease_expiration_date },
      { Key: "Lease Term", Value: extractedData.lease_dates.lease_term },
      { Key: "Base Rent", Value: extractedData.financial_terms.base_rent },
      { Key: "Expense Recovery Type", Value: extractedData.financial_terms.expense_recovery_type },
      { Key: "Security Deposit", Value: extractedData.financial_terms.security_deposit },
      { Key: "Renewal Options", Value: extractedData.financial_terms.renewal_options },
      { Key: "Free Rent Months", Value: extractedData.financial_terms.free_rent_months },
    ];

    // Detailed tab
    const detailedData = [
      { Section: "Tenant Information", Field: "Tenant", Value: extractedData.tenant_info.tenant },
      { Section: "Tenant Information", Field: "Suite Number", Value: extractedData.tenant_info.suite_number },
      { Section: "Tenant Information", Field: "Leased Sqft", Value: extractedData.tenant_info.leased_sqft },
      { Section: "Property Information", Field: "Property Address", Value: extractedData.property_info.property_address },
      { Section: "Property Information", Field: "Landlord Name", Value: extractedData.property_info.landlord_name },
      { Section: "Lease Dates", Field: "Lease Commencement Date", Value: extractedData.lease_dates.lease_commencement_date },
      { Section: "Lease Dates", Field: "Lease Expiration Date", Value: extractedData.lease_dates.lease_expiration_date },
      { Section: "Lease Dates", Field: "Lease Term", Value: extractedData.lease_dates.lease_term },
      { Section: "Financial Terms", Field: "Base Rent", Value: extractedData.financial_terms.base_rent },
      { Section: "Financial Terms", Field: "Security Deposit", Value: extractedData.financial_terms.security_deposit },
      { Section: "Financial Terms", Field: "Expense Recovery Type", Value: extractedData.financial_terms.expense_recovery_type },
      { Section: "Financial Terms", Field: "Renewal Options", Value: extractedData.financial_terms.renewal_options },
      { Section: "Financial Terms", Field: "Free Rent Months", Value: extractedData.financial_terms.free_rent_months },
    ];

    // Rent Escalation Table (if available)
    const rentSchedule = extractedData.financial_terms.rent_escalations?.rent_schedule;
    let escalationSheet;
    if (rentSchedule && rentSchedule.length > 0) {
      const escalationData = rentSchedule.map((entry) => ({
        "Start Date": entry.start_date,
        "Duration": `${entry.duration.years || 0}y ${entry.duration.months || 0}m ${entry.duration.days || 0}d`,
        "Type": entry.rent_type,
        "Amount": entry.amount,
        "Units": entry.units,
        "Review Type": entry.review_type ?? "",
        "Uplift": entry.uplift
          ? [
              entry.uplift.amount != null ? `Amount: ${entry.uplift.amount}` : null,
              entry.uplift.min != null ? `Min: ${entry.uplift.min}` : null,
              entry.uplift.max != null ? `Max: ${entry.uplift.max}` : null,
            ]
              .filter(Boolean)
              .join(", ")
          : "",
        "Adjust Expense Stops": entry.adjust_expense_stops ? "Yes" : "",
        "Stop Year": entry.stop_year ?? "",
      }));
      escalationSheet = XLSX.utils.json_to_sheet(escalationData);
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

    // Determine file name
    let baseName = "Lease";
    if (uploadedFile && uploadedFile.name) {
      baseName = uploadedFile.name.replace(/\.[^/.]+$/, "");
    }
    const fileName = `Lease Abstract - ${baseName}.xlsx`;

    XLSX.writeFile(wb, fileName);
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
            <h1 className="text-2xl font-bold tracking-tight">Lease Abstraction Preview</h1>
          </div>

          <div className="grid gap-8 md:grid-cols-[1fr_300px]">
            <div className="space-y-8">
              {currentStep === "upload" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Lease Document</CardTitle>
                    <CardDescription>Upload your lease to abstract structured data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUploader onFileUpload={handleFileUpload} isProcessing={isProcessing} />
                    {error && (
                      <div className="mt-4 text-sm text-red-500">
                        Error: {error}
                      </div>
                    )}
                  </CardContent>
                </Card>
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

              {currentStep === "results" && extractedData && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-primary mr-2" />
                      <span className="font-medium">{uploadedFile?.name}</span>
                    </div>                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handlePrivacyClick}>
                        <Lock className="mr-2 h-4 w-4" />
                        Privacy Settings
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportToExcel}
                        disabled={!extractedData}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export to Excel
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResultsViewer
                      fileName={uploadedFile?.name || "Lease.pdf"}
                      extractedData={extractedData}
                      sourceData={sourceData}
                      pdfPath={uploadedFilePath || undefined}
                      onViewSource={handleViewSource}
                    />
                  </CardContent>
                </Card>
              )}

              {currentStep === "privacy" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                    <CardDescription>Control who can access your data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PrivacySettings />
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" onClick={handleBackToResults}>
                      Back to Results
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lease Abstraction Preview</CardTitle>
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
                        <p className="text-xs text-gray-500">Upload lease document for processing</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${currentStep === "results" ? "bg-primary text-white" : "bg-gray-200 text-gray-500"} mr-2`}
                      >
                        2
                      </div>
                      <div>
                        <p className="font-medium">View Results</p>
                        <p className="text-xs text-gray-500">Review extracted structured data</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${currentStep === "privacy" ? "bg-primary text-white" : "bg-gray-200 text-gray-500"} mr-2`}
                      >
                        3
                      </div>
                      <div>
                        <p className="font-medium">Manage Visibility</p>
                        <p className="text-xs text-gray-500">Control data sharing and privacy</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>


              <Card>
                <CardHeader>
                  <CardTitle className="text-base">About This Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    This is a preview of Atlas Data Co-op's Lease Abstraction tool. The full version offers saved data, portfolio insights, and data export into excel, ARGUS, or other internal systems.
                  </p>
                  {currentStep === "results" && extractedData && (
                    <Button className="mt-4 w-full" asChild>
                      <Link href="#save-abstraction">Save Results</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <footer className="w-full border-t bg-background py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} Atlas Data Co-op. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="#" className="underline underline-offset-4">
              Terms
            </Link>
            <Link href="#" className="underline underline-offset-4">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
      <SourceVerificationPanel
        show={showSourcePanel}
        source={activeSource}
        onClose={handleCloseSourcePanel}
        fileName={uploadedFile?.name || "Lease.pdf"}
        pdfPath={uploadedFilePath || undefined}
      />
    </div>
  )
}
