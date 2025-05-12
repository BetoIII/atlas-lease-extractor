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
}

export function ResultsViewer({ fileName, extractedData, isSampleData = false, sourceData }: ResultsViewerProps) {
  // Keep the sample data for demo purposes
  const sampleData: SampleData = {
    lease_summary: {
      loan_number: "LN-78542-B",
      borrower: "SUMMIT CAPITAL PARTNERS LLC",
      landlord: "RIVERFRONT HOLDINGS, INC.",
      tenant: "NEXGEN SOLUTIONS GROUP",
      property_sqft: null,
      leased_sqft: "42,680 SF",
      lease_date: "2022-03-15",
      rental_commencement_date: null,
      lease_expiration_date: "2029-04-30",
    },
    property: {
      address: "123 Main Street, Suite 400",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      propertyType: "Office",
      buildingClass: null,
      yearBuilt: "2005",
    },
    lease: {
      tenant: "Acme Corporation",
      leaseType: "Full Service Gross",
      termStart: "01/01/2023",
      termEnd: "12/31/2027",
      termLength: "60 months",
      baseRent: "$45.00 per SF annually",
      rentEscalation: null,
      securityDeposit: "$22,500",
      renewalOption: "Two 5-year options",
      rightOfFirstRefusal: "Yes",
      terminationOption: "None",
    },
    financial: {
      totalLeaseValue: "$1,125,000",
      effectiveRate: "$42.75 per SF",
      tiBudget: "$55.00 per SF",
      freeRent: "2 months",
    },
  }

  // Sample source data for demo purposes
  const sourceDataSample: SourceData = {
    lease_summary: {
      loan_number: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Loan Number: LN-78542-B",
      },
      borrower: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Borrower: SUMMIT CAPITAL PARTNERS LLC",
      },
      landlord: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Landlord: RIVERFRONT HOLDINGS, INC.",
      },
      tenant: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Tenant: NEXGEN SOLUTIONS GROUP",
      },
      property_sqft: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Property Sqft: 42,680 SF",
      },
      leased_sqft: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Leased Sqft: 42,680 SF",
      },
      lease_date: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Lease Date: 2022-03-15",
      },
      rental_commencement_date: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Rental Commencement Date: null",
      },
      lease_expiration_date: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Lease Expiration Date: 2029-04-30",
      },
    },
    property: {
      address: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Address: 123 Main Street, Suite 400",
      },
      city: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "City: San Francisco",
      },
      state: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "State: CA",
      },
      zipCode: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Zip Code: 94105",
      },
      propertyType: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Property Type: Office",
      },
      buildingClass: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Building Class: null",
      },
      yearBuilt: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Year Built: 2005",
      },
    },
    lease: {
      tenant: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Tenant: Acme Corporation",
      },
      leaseType: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Lease Type: Full Service Gross",
      },
      termStart: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Term Start: 01/01/2023",
      },
      termEnd: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Term End: 12/31/2027",
      },
      termLength: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Term Length: 60 months",
      },
      baseRent: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Base Rent: $45.00 per SF annually",
      },
      rentEscalation: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Rent Escalation: null",
      },
      securityDeposit: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Security Deposit: $22,500",
      },
      renewalOption: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Renewal Option: Two 5-year options",
      },
      rightOfFirstRefusal: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Right of First Refusal: Yes",
      },
      terminationOption: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Termination Option: None",
      },
    },
    financial: {
      totalLeaseValue: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Total Lease Value: $1,125,000",
      },
      effectiveRate: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Effective Rate: $42.75 per SF",
      },
      tiBudget: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "TI Budget: $55.00 per SF",
      },
      freeRent: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Free Rent: 2 months",
      },
    },
  }

  const [showSourcePanel, setShowSourcePanel] = useState(false)
  const [activeSource, setActiveSource] = useState<{
    fieldName: string;
    fieldValue: string;
    page: number;
    position: { x: number; y: number; width: number; height: number };
    sourceText: string;
  } | null>(null)

  const handleViewSource = (section: string, field: string, value: string) => {
    if (value === null) return
    
    // Only show source panel for sample data that has source information
    if (isSampleData) {
      const sectionData = sourceDataSample[section as keyof SourceData]
      const sourceInfo = sectionData?.[field]
      
      if (sourceInfo) {
        setActiveSource({
          fieldName: field,
          fieldValue: value,
          page: sourceInfo.page,
          position: sourceInfo.position,
          sourceText: sourceInfo.sourceText,
        })
        setShowSourcePanel(true)
      }
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

  const getSourceInfo = (section: string, key: string) => {
    if (extractedData?.sourceData && extractedData.sourceData[section]?.[key]) {
      return extractedData.sourceData[section][key];
    }
    if (sourceData && sourceData[section]?.[key]) {
      return sourceData[section][key];
    }
    if (isSampleData && sourceData && sourceData[section]?.[key]) {
      return sourceData[section][key];
    }
    return null;
  };

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
                <TableRow key={key}>
                  <TableCell className="font-medium w-1/3">{formatKey(key)}</TableCell>
                  <TableCell className="flex items-center justify-between">
                    {renderFieldValue(value)}
                    {getSourceInfo("basic_info", key) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2"
                        onClick={() => handleViewSource("basic_info", key, value)}
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
                <TableRow key={key}>
                  <TableCell className="font-medium w-1/3">{formatKey(key)}</TableCell>
                  <TableCell className="flex items-center justify-between">
                    {renderFieldValue(value)}
                    {getSourceInfo("property_details", key) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2"
                        onClick={() => handleViewSource("property_details", key, value)}
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
                <TableRow key={key}>
                  <TableCell className="font-medium w-1/3">{formatKey(key)}</TableCell>
                  <TableCell className="flex items-center justify-between">
                    {renderFieldValue(value)}
                    {getSourceInfo("lease_dates", key) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2"
                        onClick={() => handleViewSource("lease_dates", key, value)}
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
                <TableRow key={key}>
                  <TableCell className="font-medium w-1/3">{formatKey(key)}</TableCell>
                  <TableCell className="flex items-center justify-between">
                    {renderFieldValue(value)}
                    {getSourceInfo("financial_terms", key) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2"
                        onClick={() => handleViewSource("financial_terms", key, value)}
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
                <TableRow key={key}>
                  <TableCell className="font-medium w-1/3">{formatKey(key)}</TableCell>
                  <TableCell className="flex items-center justify-between">
                    {renderFieldValue(value)}
                    {getSourceInfo("additional_terms", key) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2"
                        onClick={() => handleViewSource("additional_terms", key, value)}
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-primary mr-2" />
          <span className="font-medium">{fileName}</span>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {renderExtractionResults()}

      {/* Source Panel for sample data */}
      {showSourcePanel && activeSource && (
        <div
          className="fixed top-0 right-0 h-full w-[500px] bg-white border-l shadow-lg transform transition-transform duration-300 z-50"
          style={{ maxWidth: "50vw" }}
        >
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
        </div>
      )}
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
