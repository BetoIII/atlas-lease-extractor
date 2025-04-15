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

interface SourceData {
  page: number
  position: { x: number; y: number; width: number; height: number }
  sourceText: string
}

interface SourceDataSection {
  [key: string]: SourceData
}

interface SourceDataStructure {
  lease_summary: SourceDataSection
  property: SourceDataSection
  lease: SourceDataSection
  financial: SourceDataSection
}

interface ResultsViewerProps {
  fileName: string
}

export function ResultsViewer({ fileName }: ResultsViewerProps) {
  const [customSections, setCustomSections] = useState<{
    [key: string]: { [key: string]: string }
  }>({})
  const [newSectionName, setNewSectionName] = useState("")
  const [editingSectionName, setEditingSectionName] = useState("")
  const [newFieldName, setNewFieldName] = useState("")
  const [newFieldValue, setNewFieldValue] = useState("")
  const [newFieldDescription, setNewFieldDescription] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [showSourcePanel, setShowSourcePanel] = useState(false)
  const [activeSource, setActiveSource] = useState<{
    fieldName: string
    fieldValue: string
    page: number
    position: { x: number; y: number; width: number; height: number }
    sourceText: string
  } | null>(null)

  // Mock data for the extracted lease terms
  const leaseData = {
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

  // Mock source data - in a real app, this would come from the backend
  const sourceData = {
    lease_summary: {
      loan_number: {
        page: 1,
        position: { x: 150, y: 150, width: 120, height: 20 },
        sourceText: "Loan Number: LN-78542-B",
      },
      borrower: {
        page: 1,
        position: { x: 150, y: 180, width: 250, height: 20 },
        sourceText: "SUMMIT CAPITAL PARTNERS LLC, a Delaware limited liability company",
      },
      landlord: {
        page: 1,
        position: { x: 150, y: 210, width: 220, height: 20 },
        sourceText: "RIVERFRONT HOLDINGS, INC., a Colorado corporation",
      },
      tenant: {
        page: 1,
        position: { x: 150, y: 240, width: 200, height: 20 },
        sourceText: "NEXGEN SOLUTIONS GROUP, a Nevada corporation",
      },
      property_sqft: {
        page: 2,
        position: { x: 200, y: 120, width: 150, height: 20 },
        sourceText: "approximately 125,750 total rentable square feet",
      },
      leased_sqft: {
        page: 2,
        position: { x: 200, y: 150, width: 120, height: 20 },
        sourceText: "42,680 rentable square feet",
      },
      lease_date: {
        page: 1,
        position: { x: 300, y: 100, width: 100, height: 20 },
        sourceText: "March 15, 2022",
      },
      rental_commencement_date: {
        page: 2,
        position: { x: 250, y: 180, width: 100, height: 20 },
        sourceText: "May 1, 2022",
      },
      lease_expiration_date: {
        page: 2,
        position: { x: 250, y: 210, width: 100, height: 20 },
        sourceText: "April 30, 2029",
      },
    },
    property: {
      address: {
        page: 1,
        position: { x: 150, y: 200, width: 200, height: 20 },
        sourceText: "123 Main Street, Suite 400",
      },
      city: {
        page: 1,
        position: { x: 150, y: 220, width: 150, height: 20 },
        sourceText: "San Francisco",
      },
      state: {
        page: 1,
        position: { x: 320, y: 220, width: 30, height: 20 },
        sourceText: "CA",
      },
      zipCode: {
        page: 1,
        position: { x: 360, y: 220, width: 60, height: 20 },
        sourceText: "94105",
      },
      propertyType: {
        page: 2,
        position: { x: 200, y: 150, width: 80, height: 20 },
        sourceText: "Office",
      },
      buildingClass: {
        page: 2,
        position: { x: 300, y: 150, width: 30, height: 20 },
        sourceText: "Class A",
      },
      yearBuilt: {
        page: 3,
        position: { x: 250, y: 300, width: 50, height: 20 },
        sourceText: "Built in 2005",
      },
    },
    lease: {
      tenant: {
        page: 1,
        position: { x: 200, y: 250, width: 180, height: 20 },
        sourceText: "Acme Corporation, a Delaware corporation",
      },
      leaseType: {
        page: 3,
        position: { x: 150, y: 400, width: 150, height: 20 },
        sourceText: "Full Service Gross",
      },
      termStart: {
        page: 2,
        position: { x: 200, y: 350, width: 100, height: 20 },
        sourceText: "January 1, 2023",
      },
      termEnd: {
        page: 2,
        position: { x: 350, y: 350, width: 100, height: 20 },
        sourceText: "December 31, 2027",
      },
      termLength: {
        page: 2,
        position: { x: 200, y: 380, width: 100, height: 20 },
        sourceText: "60 months",
      },
      baseRent: {
        page: 4,
        position: { x: 250, y: 200, width: 200, height: 20 },
        sourceText: "$45.00 per rentable square foot annually",
      },
      rentEscalation: {
        page: 4,
        position: { x: 250, y: 230, width: 120, height: 20 },
        sourceText: "3% annually on the anniversary of the Commencement Date",
      },
      securityDeposit: {
        page: 5,
        position: { x: 250, y: 150, width: 100, height: 20 },
        sourceText: "Security Deposit: $22,500",
      },
      renewalOption: {
        page: 6,
        position: { x: 200, y: 300, width: 180, height: 20 },
        sourceText: "Two (2) options to extend for five (5) years each",
      },
      rightOfFirstRefusal: {
        page: 7,
        position: { x: 250, y: 400, width: 50, height: 20 },
        sourceText: "Tenant shall have a right of first refusal",
      },
      terminationOption: {
        page: 8,
        position: { x: 200, y: 250, width: 100, height: 20 },
        sourceText: "No early termination option",
      },
    },
    financial: {
      totalLeaseValue: {
        page: 4,
        position: { x: 300, y: 280, width: 150, height: 20 },
        sourceText: "Total Lease Value: $1,125,000",
      },
      effectiveRate: {
        page: 4,
        position: { x: 300, y: 310, width: 120, height: 20 },
        sourceText: "Effective Rate: $42.75 per SF",
      },
      tiBudget: {
        page: 5,
        position: { x: 250, y: 200, width: 150, height: 20 },
        sourceText: "Tenant Improvement Allowance: $55.00 per SF",
      },
      freeRent: {
        page: 5,
        position: { x: 250, y: 230, width: 100, height: 20 },
        sourceText: "Free Rent: 2 months",
      },
    },
  }

  const handleAddSection = () => {
    if (newSectionName.trim()) {
      setCustomSections({
        ...customSections,
        [newSectionName]: {},
      })
      setNewSectionName("")
    }
  }

  const handleAddField = () => {
    if (selectedSection && newFieldName.trim()) {
      setCustomSections({
        ...customSections,
        [selectedSection]: {
          ...customSections[selectedSection],
          [newFieldName]: newFieldValue || "Not found",
        },
      })
      setNewFieldName("")
      setNewFieldValue("")
      setNewFieldDescription("")
    }
  }

  const handleDeleteSection = (section: string) => {
    const updatedSections = { ...customSections }
    delete updatedSections[section]
    setCustomSections(updatedSections)
  }

  const handleDeleteField = (section: string, field: string) => {
    const updatedSections = { ...customSections }
    delete updatedSections[section][field]
    setCustomSections(updatedSections)
  }

  const handleEditSectionName = () => {
    if (editingSectionName && selectedSection && editingSectionName !== selectedSection) {
      const sectionData = customSections[selectedSection]
      const updatedSections = { ...customSections }
      delete updatedSections[selectedSection]
      updatedSections[editingSectionName] = sectionData
      setCustomSections(updatedSections)
      setSelectedSection(editingSectionName)
      setEditingSectionName("")
    }
  }

  const handleViewSource = (section: string, field: string, value: string) => {
    if (value === null) return
    
    const sectionData = (sourceData as SourceDataStructure)[section as keyof SourceDataStructure]
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

  const handleCloseSourcePanel = () => {
    setShowSourcePanel(false)
    setActiveSource(null)
  }

  const renderFieldValue = (value: string | null) => {
    if (value === null) {
      return (
        <div className="flex items-center text-muted-foreground">
          <AlertCircle className="mr-2 h-4 w-4 text-yellow-500" />
          <span className="text-sm italic">Data not found in document</span>
        </div>
      )
    }
    return value
  }

  return (
    <div className="space-y-4 relative">
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

      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-3">Lease Summary</h3>
          <Table>
            <TableBody>
              {Object.entries(leaseData.lease_summary).map(([key, value]) => (
                <TableRow key={key} className="hover:bg-gray-50 cursor-pointer">
                  <TableCell className="font-medium w-1/3 py-2">{formatKey(key)}</TableCell>
                  <TableCell className="py-2">{renderFieldValue(value as string | null)}</TableCell>
                  <TableCell className="w-10 py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleViewSource("lease_summary", key, value as string)}
                      disabled={value === null}
                    >
                      <Eye className="h-4 w-4 text-gray-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-3">Property Information</h3>
          <Table>
            <TableBody>
              {Object.entries(leaseData.property).map(([key, value]) => (
                <TableRow key={key} className="hover:bg-gray-50 cursor-pointer">
                  <TableCell className="font-medium w-1/3 py-2">{formatKey(key)}</TableCell>
                  <TableCell className="py-2">{renderFieldValue(value as string | null)}</TableCell>
                  <TableCell className="w-10 py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleViewSource("property", key, value as string)}
                      disabled={value === null}
                    >
                      <Eye className="h-4 w-4 text-gray-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-3">Lease Terms</h3>
          <Table>
            <TableBody>
              {Object.entries(leaseData.lease).map(([key, value]) => (
                <TableRow key={key} className="hover:bg-gray-50 cursor-pointer">
                  <TableCell className="font-medium w-1/3 py-2">{formatKey(key)}</TableCell>
                  <TableCell className="py-2">{renderFieldValue(value as string | null)}</TableCell>
                  <TableCell className="w-10 py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleViewSource("lease", key, value as string)}
                      disabled={value === null}
                    >
                      <Eye className="h-4 w-4 text-gray-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-3">Financial Details</h3>
          <Table>
            <TableBody>
              {Object.entries(leaseData.financial).map(([key, value]) => (
                <TableRow key={key} className="hover:bg-gray-50 cursor-pointer">
                  <TableCell className="font-medium w-1/3 py-2">{formatKey(key)}</TableCell>
                  <TableCell className="py-2">{renderFieldValue(value as string | null)}</TableCell>
                  <TableCell className="w-10 py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleViewSource("financial", key, value as string)}
                      disabled={value === null}
                    >
                      <Eye className="h-4 w-4 text-gray-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Custom sections */}
        {Object.entries(customSections).map(
          ([section, fields]) =>
            Object.keys(fields).length > 0 && (
              <div key={section} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">{section}</h3>
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    Custom
                  </Badge>
                </div>
                <Table>
                  <TableBody>
                    {Object.entries(fields).map(([key, value]) => (
                      <TableRow key={key} className="hover:bg-gray-50 cursor-pointer">
                        <TableCell className="font-medium w-1/3 py-2">{key}</TableCell>
                        <TableCell className="py-2">{renderFieldValue(value as string | null)}</TableCell>
                        <TableCell className="w-10 py-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDeleteField(section, key)}
                          >
                            <X className="h-4 w-4 text-gray-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ),
        )}

        {/* Add Customize button at the bottom right */}
        <div className="flex justify-end mt-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Customize
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Customize Extraction Fields</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-[1fr_2fr] gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="section-name">Add New Section</Label>
                      <div className="flex mt-1">
                        <Input
                          id="section-name"
                          value={newSectionName}
                          onChange={(e) => setNewSectionName(e.target.value)}
                          placeholder="Section name"
                          className="rounded-r-none"
                        />
                        <Button onClick={handleAddSection} className="rounded-l-none" disabled={!newSectionName.trim()}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Sections</Label>
                      <ScrollArea className="h-[200px] border rounded-md mt-1 p-2">
                        <div className="space-y-2">
                          {Object.keys(leaseData).map((section) => (
                            <div
                              key={section}
                              className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                                selectedSection === section ? "bg-primary/10" : "hover:bg-gray-100"
                              }`}
                              onClick={() => {
                                setSelectedSection(section)
                                setEditingSectionName(section)
                              }}
                            >
                              <span className="text-sm font-medium">{formatKey(section)}</span>
                            </div>
                          ))}
                          {Object.keys(customSections).map((section) => (
                            <div
                              key={section}
                              className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                                selectedSection === section ? "bg-primary/10" : "hover:bg-gray-100"
                              }`}
                              onClick={() => {
                                setSelectedSection(section)
                                setEditingSectionName(section)
                              }}
                            >
                              <span className="text-sm font-medium">{section}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteSection(section)
                                  if (selectedSection === section) {
                                    setSelectedSection("")
                                  }
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {selectedSection && (
                      <>
                        <div>
                          <Label htmlFor="edit-section">Section Name</Label>
                          <div className="flex mt-1">
                            <Input
                              id="edit-section"
                              value={editingSectionName}
                              onChange={(e) => setEditingSectionName(e.target.value)}
                              placeholder="Section name"
                              className="rounded-r-none"
                            />
                            <Button
                              onClick={handleEditSectionName}
                              className="rounded-l-none"
                              disabled={!editingSectionName.trim() || editingSectionName === selectedSection}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="field-name">Add New Field</Label>
                          <Input
                            id="field-name"
                            value={newFieldName}
                            onChange={(e) => setNewFieldName(e.target.value)}
                            placeholder="Field name"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="field-description">Field Description</Label>
                          <Textarea
                            id="field-description"
                            value={newFieldDescription}
                            onChange={(e) => setNewFieldDescription(e.target.value)}
                            placeholder="Describe what to look for (e.g., 'Look for parking ratio in Section 12')"
                            className="mt-1 h-20"
                          />
                        </div>
                        <div>
                          <Label htmlFor="field-value">Default Value (Optional)</Label>
                          <Input
                            id="field-value"
                            value={newFieldValue}
                            onChange={(e) => setNewFieldValue(e.target.value)}
                            placeholder="Default value if not found"
                            className="mt-1"
                          />
                        </div>
                        <Button
                          onClick={handleAddField}
                          className="w-full"
                          disabled={!newFieldName.trim() || !selectedSection}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Field to{" "}
                          {selectedSection
                            ? Object.keys(leaseData).includes(selectedSection)
                              ? formatKey(selectedSection)
                              : selectedSection
                            : "Section"}
                        </Button>
                      </>
                    )}
                    {!selectedSection && (
                      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                        Select or add a section to customize fields
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button>Done</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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

              {/* Source text notification */}
              <div className="bg-amber-50 border border-amber-200 rounded-md mx-4 mb-4 p-3 text-amber-800">
                <p className="text-sm">
                  <span className="font-medium">Highlighted text:</span> The source text that was used to extract the
                  value for "{activeSource.fieldName}".
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
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/Ti Budget/, "TI Budget")
}
