"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { FileUploader } from "./file-uploader"
import { PrivacySettings } from "./privacy-settings"
import { ArrowLeft, Lock, MapPin, Building, Calendar, FileText, Download, AlertCircle } from "lucide-react"
import { ResultsViewer } from "./results-viewer"
import type { SourceData } from "./results-viewer"

interface PartyInfo {
  tenant: string;
}

interface PropertyInfo {
  property_address: string;
  suite_number: string;
  unit_sqft?: number | null;
  leased_sqft?: number | null;
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
  party_info: PartyInfo;
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

export default function TryItNowPage() {
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<"upload" | "results" | "privacy">("upload")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isProcessed, setIsProcessed] = useState(false)
  const [extractedData, setExtractedData] = useState<LeaseSummary | null>(null)
  const [sourceData, setSourceData] = useState<SourceData | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  // Feature flag for export button
  const EXPORT_ENABLED = false;

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file)
    setIsProcessing(true)
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

      // Step 2: Extract summary (send the file again)
      const extractFormData = new FormData()
      extractFormData.append('file', file)

      try {
        const summaryResponse = await fetch('http://localhost:5601/extract-summary', {
          method: 'POST',
          body: extractFormData,
        })
        if (!summaryResponse.ok) throw new Error(`Summary extraction failed: ${summaryResponse.statusText}`)
        const summaryResult = await summaryResponse.json()
        setExtractedData(summaryResult.data)
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
    }
  }

  const handleExtraction = async () => {
    if (!uploadedFilePath) {
      setError('No file uploaded')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const summaryResponse = await fetch('http://localhost:5601/extract-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: uploadedFilePath,
      })

      if (!summaryResponse.ok) {
        throw new Error(`Summary extraction failed: ${summaryResponse.statusText}`)
      }

      const summaryResult = await summaryResponse.json()
      if (summaryResult.status === 'success' && summaryResult.data) {
        setExtractedData(summaryResult.data)
        setSourceData(summaryResult.sourceData)
        console.log('Extracted Data:', summaryResult.data)
        setIsProcessed(true)
      } else {
        throw new Error(summaryResult.message || 'Summary extraction failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during summary extraction')
      setIsProcessed(false)
    } finally {
      setIsProcessing(false)
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
                      {EXPORT_ENABLED && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResultsViewer
                      fileName={uploadedFile?.name || "Sample Lease.pdf"}
                      extractedData={extractedData}
                      isSampleData={false}
                      sourceData={sourceData}
                      pdfPath={uploadedFilePath || undefined}
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
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${currentStep === "upload" ? "bg-primary text-white" : isProcessed ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"} mr-2`}
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
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${currentStep === "results" ? "bg-primary text-white" : isProcessed ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"} mr-2`}
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
    </div>
  )
}
