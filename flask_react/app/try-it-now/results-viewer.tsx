"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { FileText, Download, Eye, Plus, X, Check, ChevronRight, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PdfViewer } from "./pdf-viewer"

interface ExtractedData {
  party_info: {
    tenant: string;
  };
  property_info: {
    property_address: string;
    suite_number: string;
    leased_sqft?: number | null;
  };
  lease_dates: {
    lease_commencement_date: string; // ISO date string
    lease_expiration_date: string;   // ISO date string
    lease_term: string; // e.g., "5 years"
  };
  financial_terms: {
    base_rent: number;
    security_deposit?: number | null;
    rent_escalations?: string | null;
    opex_type: string;
    renewal_options?: string | null;
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
  "Party Information": "party_info",
  "Property Information": "property_info",
  "Lease Dates": "lease_dates",
  "Financial Terms": "financial_terms",
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

  function formatUSD(amount: number): string {
    return `$${Math.round(amount).toLocaleString("en-US")}`;
  }

  const renderFieldValue = (value: any, key?: string) => {
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
    // Format dollar fields
    if (key === 'base_rent' || key === 'security_deposit') {
      if (typeof value === 'number') {
        return formatUSD(value);
      }
      if (!isNaN(Number(value))) {
        return formatUSD(Number(value));
      }
    }
    if (key === 'rent_escalations' && typeof value === 'string') {
      // Replace all dollar amounts in the string with formatted USD
      return value.replace(/\$?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)/g, (match, p1) => {
        const num = Number(p1.replace(/,/g, ''));
        if (!isNaN(num)) {
          return formatUSD(num);
        }
        return match;
      });
    }
    return String(value);
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
          <h3 className="text-sm font-medium mb-3">Property</h3>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium w-1/3 py-2">Property address</TableCell>
                <TableCell className="flex items-center justify-between py-2">
                  {renderFieldValue(extractedData.property_info.property_address)}
                  {getSourceInfo(sectionKeyMap["Property Information"], "property_address") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 h-6 w-6"
                      onClick={() => handleViewSource(sectionKeyMap["Property Information"], "property_address", extractedData.property_info.property_address)}
                      title="View source in PDF"
                    >
                      <Eye className="h-4 w-4 text-gray-500 hover:text-primary" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium w-1/3 py-2">Suite number</TableCell>
                <TableCell className="flex items-center justify-between py-2">
                  {renderFieldValue(extractedData.property_info.suite_number)}
                  {getSourceInfo(sectionKeyMap["Property Information"], "suite_number") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 h-6 w-6"
                      onClick={() => handleViewSource(sectionKeyMap["Property Information"], "suite_number", extractedData.property_info.suite_number)}
                      title="View source in PDF"
                    >
                      <Eye className="h-4 w-4 text-gray-500 hover:text-primary" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium w-1/3 py-2">Leased sqft</TableCell>
                <TableCell className="flex items-center justify-between py-2">
                  {renderFieldValue(extractedData.property_info.leased_sqft)}
                  {getSourceInfo(sectionKeyMap["Property Information"], "leased_sqft") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 h-6 w-6"
                      onClick={() => handleViewSource(sectionKeyMap["Property Information"], "leased_sqft", String(extractedData.property_info.leased_sqft))}
                      title="View source in PDF"
                    >
                      <Eye className="h-4 w-4 text-gray-500 hover:text-primary" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-3">Parties</h3>
          <div className="flex flex-row items-center py-2">
            <div className="font-medium w-1/3">Tenant</div>
            <div className="flex items-center justify-between flex-1">
              {renderFieldValue(extractedData.party_info.tenant)}
              {getSourceInfo(sectionKeyMap["Party Information"], "tenant") && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 h-6 w-6"
                  onClick={() => handleViewSource(sectionKeyMap["Party Information"], "tenant", extractedData.party_info.tenant)}
                  title="View source in PDF"
                >
                  <Eye className="h-4 w-4 text-gray-500 hover:text-primary" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-3">Dates</h3>
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
          <h3 className="text-sm font-medium mb-3">Rent and Expenses</h3>
          <Table>
            <TableBody>
              {Object.entries(extractedData.financial_terms).map(([key, value]) => (
                <TableRow key={key} className="hover:bg-gray-50 cursor-pointer">
                  <TableCell className="font-medium w-1/3 py-2">{formatKey(key)}</TableCell>
                  <TableCell className="flex items-center justify-between py-2">
                    {renderFieldValue(value, key)}
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
