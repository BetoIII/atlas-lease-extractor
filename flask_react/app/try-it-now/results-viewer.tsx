"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { FileText, Download, Eye, Plus, X, Check, ChevronRight, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { PdfViewer } from "./pdf-viewer"

interface ExtractedData {
  basic_info: {
    tenant: string;
    landlord: string;
    property_manager: string;
  };
  property_details: {
    property_address: string;
    property_sqft: string;
    leased_sqft: string;
  };
  lease_dates: {
    lease_date: string;
    rental_commencement_date: string;
    lease_expiration_date: string;
  };
  financial_terms: {
    base_rent: any;
    security_deposit: string;
    rent_escalations: any[];
  };
  additional_terms: {
    lease_type: string | null;
    permitted_use: string | null;
    renewal_options: string | null;
  };
  sourceData?: SourceData;
}

interface ResultsViewerProps {
  fileName: string;
  extractedData?: ExtractedData;
  isSampleData?: boolean;
  sourceData?: SourceData;
}

interface SampleDataSection {
  [key: string]: string | null;
}

interface SampleData {
  lease_summary: SampleDataSection;
  property: SampleDataSection;
  lease: SampleDataSection;
  financial: SampleDataSection;
}

interface SourceInfo {
  page: number;
  position: { x: number; y: number; width: number; height: number };
  sourceText: string;
}

interface SourceDataSection {
  [key: string]: SourceInfo;
}

interface SourceData {
  lease_summary: SourceDataSection;
  property: SourceDataSection;
  lease: SourceDataSection;
  financial: SourceDataSection;
  basic_info?: SourceDataSection;
  property_details?: SourceDataSection;
  lease_dates?: SourceDataSection;
  financial_terms?: SourceDataSection;
  additional_terms?: SourceDataSection;
  [key: string]: SourceDataSection | undefined;
}

// Section key mapping for type safety
const sectionKeyMap = {
  "Basic Information": "basic_info",
  "Property Details": "property_details",
  "Lease Dates": "lease_dates",
  "Financial Terms": "financial_terms",
  "Additional Terms": "additional_terms",
} as const;

type SectionDisplayName = keyof typeof sectionKeyMap;
type SectionKey = typeof sectionKeyMap[SectionDisplayName];

export function ResultsViewer({ fileName, extractedData, isSampleData = false, sourceData }: ResultsViewerProps) {
  const [showSourcePanel, setShowSourcePanel] = useState(false)
  const [activeSource, setActiveSource] = useState<{
    fieldName: string
    fieldValue: string
    page: number
    position: { x: number; y: number; width: number; height: number }
    sourceText: string
  } | null>(null)

  // Helper to get source info for a field from extractedData or sourceData
  const getSourceInfo = (
    section: keyof SourceData,
    key: string
  ): SourceInfo | null => {
    // Prefer extractedData.sourceData if available
    if (extractedData?.sourceData && extractedData.sourceData[section] && extractedData.sourceData[section]![key]) {
      return extractedData.sourceData[section]![key] as SourceInfo
    }
    // Fallback to sourceData prop
    if (sourceData && sourceData[section] && sourceData[section]![key]) {
      return sourceData[section]![key] as SourceInfo
    }
    return null
  }

  const handleViewSource = (
    section: keyof SourceData,
    field: string,
    value: string
  ) => {
    const sourceInfo = getSourceInfo(section, field)
    if (sourceInfo) {
      setActiveSource({
        fieldName: formatKey(field),
        fieldValue: value,
        page: sourceInfo.page,
        position: sourceInfo.position,
        sourceText: sourceInfo.sourceText,
      })
      setShowSourcePanel(true)
    }
  }

  const handleCloseSourcePanel = () => {
    setShowSourcePanel(false)
    setActiveSource(null)
  }

  const renderFieldValue = (value: any) => {
    if (value === null || value === "") {
      return (
        <div className="flex items-center text-muted-foreground">
          <AlertCircle className="mr-2 h-4 w-4 text-yellow-500" />
          <span className="text-sm italic">Data not found in document</span>
        </div>
      )
    }
    if (typeof value === 'object' && Object.keys(value).length === 0) {
      return (
        <div className="flex items-center text-muted-foreground">
          <AlertCircle className="mr-2 h-4 w-4 text-yellow-500" />
          <span className="text-sm italic">No structured data available</span>
        </div>
      )
    }
    return String(value)
  }

  const renderExtractionResults = () => {
    if (!extractedData) {
      return (
        <div className="text-sm text-gray-500">No extraction data available</div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-3">Basic Information</h3>
          <Table>
            <TableBody>
              {Object.entries(extractedData.basic_info).map(([key, value]) => (
                <TableRow key={key} className="hover:bg-gray-50 cursor-pointer">
                  <TableCell className="font-medium w-1/3 py-2">{formatKey(key)}</TableCell>
                  <TableCell className="flex items-center justify-between py-2">
                    {renderFieldValue(value)}
                    {getSourceInfo(sectionKeyMap["Basic Information"], key) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2 h-6 w-6"
                        onClick={() => handleViewSource(sectionKeyMap["Basic Information"], key, value ? value.toString() : "")}
                        title="View source in PDF"
                      >
                        <Eye className="h-4 w-4 text-gray-500 hover:text-primary" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-3">Property Details</h3>
          <Table>
            <TableBody>
              {Object.entries(extractedData.property_details).map(([key, value]) => (
                <TableRow key={key} className="hover:bg-gray-50 cursor-pointer">
                  <TableCell className="font-medium w-1/3 py-2">{formatKey(key)}</TableCell>
                  <TableCell className="flex items-center justify-between py-2">
                    {renderFieldValue(value)}
                    {getSourceInfo(sectionKeyMap["Property Details"], key) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2 h-6 w-6"
                        onClick={() => handleViewSource(sectionKeyMap["Property Details"], key, value ? value.toString() : "")}
                        title="View source in PDF"
                      >
                        <Eye className="h-4 w-4 text-gray-500 hover:text-primary" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-3">Lease Dates</h3>
          <Table>
            <TableBody>
              {Object.entries(extractedData.lease_dates).map(([key, value]) => (
                <TableRow key={key} className="hover:bg-gray-50 cursor-pointer">
                  <TableCell className="font-medium w-1/3 py-2">{formatKey(key)}</TableCell>
                  <TableCell className="flex items-center justify-between py-2">
                    {renderFieldValue(value)}
                    {getSourceInfo(sectionKeyMap["Lease Dates"], key) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2 h-6 w-6"
                        onClick={() => handleViewSource(sectionKeyMap["Lease Dates"], key, value ? value.toString() : "")}
                        title="View source in PDF"
                      >
                        <Eye className="h-4 w-4 text-gray-500 hover:text-primary" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-3">Financial Terms</h3>
          <Table>
            <TableBody>
              {Object.entries(extractedData.financial_terms).map(([key, value]) => (
                <TableRow key={key} className="hover:bg-gray-50 cursor-pointer">
                  <TableCell className="font-medium w-1/3 py-2">{formatKey(key)}</TableCell>
                  <TableCell className="flex items-center justify-between py-2">
                    {renderFieldValue(value)}
                    {getSourceInfo(sectionKeyMap["Financial Terms"], key) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2 h-6 w-6"
                        onClick={() => handleViewSource(sectionKeyMap["Financial Terms"], key, value ? value.toString() : "")}
                        title="View source in PDF"
                      >
                        <Eye className="h-4 w-4 text-gray-500 hover:text-primary" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-3">Additional Terms</h3>
          <Table>
            <TableBody>
              {Object.entries(extractedData.additional_terms).map(([key, value]) => (
                <TableRow key={key} className="hover:bg-gray-50 cursor-pointer">
                  <TableCell className="font-medium w-1/3 py-2">{formatKey(key)}</TableCell>
                  <TableCell className="flex items-center justify-between py-2">
                    {renderFieldValue(value)}
                    {getSourceInfo(sectionKeyMap["Additional Terms"], key) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2 h-6 w-6"
                        onClick={() => handleViewSource(sectionKeyMap["Additional Terms"], key, value ? value.toString() : "")}
                        title="View source in PDF"
                      >
                        <Eye className="h-4 w-4 text-gray-500 hover:text-primary" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      {renderExtractionResults()}

      {/* Source Panel (slides in from the right) */}
      <div
        className={`fixed top-0 right-0 h-full w-[500px] bg-white border-l shadow-lg transform transition-transform duration-300 z-50 ${
          showSourcePanel ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ maxWidth: "50vw" }}
      >
        {activeSource && (
          <div className="flex flex-col h-full">
            <div className="flex flex-col border-b">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" onClick={handleCloseSourcePanel} className="mr-2">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <div>
                    <h3 className="font-medium">Source Verification</h3>
                    <p className="text-sm text-gray-500">
                      {activeSource.fieldName}: {activeSource.fieldValue}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  Page {activeSource.page}
                </Badge>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-md mx-4 mb-4 p-3 text-amber-800">
                <p className="text-sm">
                  <span className="font-medium">Highlighted text:</span> {activeSource.sourceText}
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <PdfViewer fileName={fileName} page={activeSource.page} highlight={activeSource.position} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/Ti Budget/, "TI Budget")
}
