"use client"
import { CheckCircle, ArrowLeft, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ExtractedData } from "./results-viewer"

export interface StepperProps {
  currentStep: "upload" | "results" | "privacy"
  uploadedFile: File | null
  extractedData: ExtractedData | null
  registrationComplete: boolean
  onPrivacyClick: () => void
  onBackToResults: () => void
  onGoToResults: () => void
  onGoToPrivacy: () => void
}

export function Stepper({
  currentStep,
  uploadedFile,
  extractedData,
  registrationComplete,
  onPrivacyClick,
  onBackToResults,
  onGoToResults,
  onGoToPrivacy,
}: StepperProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-gray-200"></div>
        {/* Step 1: Upload */}
        <div className="group relative flex items-center mb-4">
          <div
            className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
              currentStep === "upload"
                ? "bg-primary border-primary text-white"
                : uploadedFile
                ? "bg-green-100 border-green-500 text-green-600"
                : "bg-white border-gray-300 text-gray-400"
            }`}
          >
            {uploadedFile && currentStep !== "upload" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <span className="text-xs font-medium">1</span>
            )}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <div
              className={`text-sm font-medium transition-colors ${
                currentStep === "upload" ? "text-primary" : "text-gray-700"
              }`}
            >
              Upload
            </div>
          </div>
        </div>
        {/* Step 2: Results */}
        <div
          className={`group relative flex items-center mb-4 transition-all ${
            extractedData && currentStep === "privacy" ? "cursor-pointer hover:bg-gray-50 rounded-lg p-1 -m-1" : ""
          }`}
          onClick={onGoToResults}
        >
          <div
            className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
              currentStep === "results"
                ? "bg-primary border-primary text-white"
                : extractedData
                ? "bg-green-100 border-green-500 text-green-600"
                : "bg-white border-gray-300 text-gray-400"
            }`}
          >
            {extractedData && currentStep === "privacy" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <span className="text-xs font-medium">2</span>
            )}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <div
              className={`text-sm font-medium transition-colors ${
                currentStep === "results"
                  ? "text-primary"
                  : extractedData && currentStep === "privacy"
                  ? "text-primary hover:text-primary/80"
                  : "text-gray-700"
              }`}
            >
              Results
            </div>
          </div>
        </div>
        {/* Step 3: Privacy */}
        <div
          className={`group relative flex items-center ${
            extractedData && (currentStep === "results" || currentStep === "upload")
              ? "cursor-pointer hover:bg-gray-50 rounded-lg p-1 -m-1"
              : ""
          }`}
          onClick={onGoToPrivacy}
        >
          <div
            className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
              currentStep === "privacy"
                ? "bg-primary border-primary text-white"
                : registrationComplete
                ? "bg-green-100 border-green-500 text-green-600"
                : "bg-white border-gray-300 text-gray-400"
            }`}
          >
            {registrationComplete ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <span className="text-xs font-medium">3</span>
            )}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <div
              className={`text-sm font-medium transition-colors ${
                currentStep === "privacy"
                  ? "text-primary"
                  : extractedData && (currentStep === "results" || currentStep === "upload")
                  ? "text-primary hover:text-primary/80"
                  : "text-gray-700"
              }`}
            >
              Privacy
            </div>
          </div>
        </div>
      </div>
      {currentStep === "results" && (
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={onPrivacyClick} className="w-full">
            <Lock className="mr-2 h-4 w-4" />
            Privacy Settings
          </Button>
        </div>
      )}
      {currentStep === "privacy" && (
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={onBackToResults} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Results
          </Button>
        </div>
      )}
    </div>
  )
}
