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

// Add this helper for displaying fields
interface FieldDisplayProps {
  label: string;
  value: any;
  icon?: React.ReactNode;
  source?: string;
}
function FieldDisplay({ label, value, icon, source }: FieldDisplayProps) {
  return (
    <div className="flex items-start gap-3">
      {icon && <div className="mt-1">{icon}</div>}
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-gray-700">{value || <span className="italic text-gray-400">Not found</span>}</div>
        {source && <div className="text-xs text-gray-400">{source}</div>}
      </div>
    </div>
  )
}

export default function TryItNowPage() {
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<"upload" | "results" | "privacy">("upload")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isProcessed, setIsProcessed] = useState(false)
  const [extractedData, setExtractedData] = useState<any>(null)
  const [generalInfoData, setGeneralInfoData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file)
    setIsProcessing(true)
    setError(null)

    // Step 1: Upload the file to get a temp file path
    const formData = new FormData()
    formData.append('file', file)

    try {
      const uploadResponse = await fetch('http://localhost:5601/upload', {
        method: 'POST',
        body: formData,
      })
      if (!uploadResponse.ok) throw new Error(`Upload failed: ${uploadResponse.statusText}`)
      const uploadResult = await uploadResponse.json()
      const filePath = uploadResult.filepath
      setUploadedFilePath(filePath)

      // Step 2: Extract summary (show general info card as soon as possible)
      let summarySuccess = false
      try {
        const summaryResponse = await fetch('http://localhost:5601/extract-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: filePath,
        })
        if (!summaryResponse.ok) throw new Error(`Summary extraction failed: ${summaryResponse.statusText}`)
        const summaryResult = await summaryResponse.json()
        setGeneralInfoData(summaryResult.data)
        setExtractedData(summaryResult.data)
        console.log('Extracted Data:', summaryResult.data)
        setCurrentStep("results")
        summarySuccess = true
      } catch (summaryErr) {
        setError(summaryErr instanceof Error ? summaryErr.message : 'An error occurred during summary extraction.')
      }

      // Step 3: Index the file (after summary is displayed)
      // (Removed: do not call /index endpoint here)

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
        setGeneralInfoData(summaryResult.data)
        setExtractedData(summaryResult.data)
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
            <h1 className="text-2xl font-bold tracking-tight">Atlas MVP Preview</h1>
          </div>

          <div className="grid gap-8 md:grid-cols-[1fr_300px]">
            <div className="space-y-8">
              {currentStep === "upload" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Documents</CardTitle>
                    <CardDescription>Upload your lease documents to extract structured data</CardDescription>
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

              {currentStep === "results" && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Document Ready</CardTitle>
                      <CardDescription>Your document has been uploaded successfully</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handlePrivacyClick}>
                        <Lock className="mr-2 h-4 w-4" />
                        Privacy Settings
                      </Button>
                      {!isProcessed && (
                        <Button size="sm" onClick={handleExtraction} disabled={isProcessing}>
                          {isProcessing ? 'Processing...' : 'Extract Data'}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Card className="mb-6">
                      <CardHeader className="pb-2">
                        <CardTitle>General Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 gap-6 mb-6">
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FieldDisplay
                              label="Property Address"
                              value={generalInfoData?.property_address || "123 Main Street, Suite 400"}
                              icon={<MapPin className="h-5 w-5 text-blue-500" />}
                              source="Page 1"
                            />
                            <FieldDisplay
                              label="Leased Area"
                              value={generalInfoData?.leased_sqft || "42,680 SF"}
                              icon={<Building className="h-5 w-5 text-blue-500" />}
                              source="Section 1.1, Page 1"
                            />
                            <FieldDisplay
                              label="Commencement Date"
                              value={generalInfoData?.rental_commencement_date || "2022-03-15"}
                              icon={<Calendar className="h-5 w-5 text-blue-500" />}
                              source="Section 2.1, Page 3"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <FieldDisplay
                            label="Landlord"
                            value={generalInfoData?.landlord || "RIVERFRONT HOLDINGS, INC."}
                            source="Page 1"
                          />
                          <FieldDisplay
                            label="Tenant"
                            value={generalInfoData?.tenant || "NEXGEN SOLUTIONS GROUP"}
                            source="Page 1"
                          />
                          <FieldDisplay
                            label="Expiration Date"
                            value={generalInfoData?.lease_expiration_date || "2029-04-30"}
                            source="Section 2.1, Page 3"
                          />
                          {/* Add more fields as needed, using the same pattern */}
                        </div>
                      </CardContent>
                    </Card>
                    <ResultsViewer
                      fileName={uploadedFile?.name || "Sample Lease.pdf"}
                      extractedData={extractedData}
                      isSampleData={false}
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
                  <CardTitle className="text-base">MVP Preview</CardTitle>
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
                        <p className="font-medium">Upload Documents</p>
                        <p className="text-xs text-gray-500">Upload lease documents for processing</p>
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

              {/* Market Insights card is hidden for now */}
              {/* 
              {currentStep === "results" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Market Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MarketInsights />
                  </CardContent>
                </Card>
              )}
              */}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">About This Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    This is a preview of Atlas Data Co-op's MVP features. The full version offers enhanced accuracy,
                    more detailed market insights, and advanced privacy controls.
                  </p>
                  <Button className="mt-4 w-full" asChild>
                    <Link href="#demo">Request Full Demo</Link>
                  </Button>
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
