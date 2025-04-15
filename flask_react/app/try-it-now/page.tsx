"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { FileUploader } from "./file-uploader"
import { ResultsViewer } from "./results-viewer"
import { PrivacySettings } from "./privacy-settings"
import { ArrowLeft, Lock } from "lucide-react"

export default function TryItNowPage() {
  const [currentStep, setCurrentStep] = useState<"upload" | "results" | "privacy">("upload")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isProcessed, setIsProcessed] = useState(false)

  const handleFileUpload = (file: File) => {
    setUploadedFile(file)
    setIsProcessing(true)

    // Simulate processing time
    setTimeout(() => {
      setIsProcessing(false)
      setIsProcessed(true)
      setCurrentStep("results")
    }, 3000)
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
                  </CardContent>
                </Card>
              )}

              {currentStep === "results" && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Extracted Data</CardTitle>
                      <CardDescription>Structured data extracted from your document</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handlePrivacyClick}>
                      <Lock className="mr-2 h-4 w-4" />
                      Privacy Settings
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ResultsViewer fileName={uploadedFile?.name || "Sample Lease.pdf"} />
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
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${currentStep === "upload" ? "bg-primary text-white" : "bg-gray-200 text-gray-500"} mr-2`}
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
