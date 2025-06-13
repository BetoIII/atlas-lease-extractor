"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table } from "@/components/ui/table"
import { FileText, Eye, ChevronRight, AlertCircle, CheckCircle, Clock, Building, Users, DollarSign, Calendar, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PdfViewer } from "./pdf-viewer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SourceVerificationPanel, SourcePanelInfo } from "./SourceVerificationPanel"
import type { SourceCitation } from "./SourceVerificationPanel"

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

interface TenantInfo {
  tenant: string;
  suite_number: string;
  leased_sqft?: number | null;
}

export interface ExtractedData {
  tenant_info: TenantInfo;
  property_info: {
    property_address: string;
    landlord_name: string;
  };
  lease_dates: {
    lease_commencement_date: string;
    lease_expiration_date: string;
    lease_term: string;
  };
  financial_terms: {
    base_rent: number;
    security_deposit?: number | null;
    rent_escalations?: RentEscalationSchema | null;
    expense_recovery_type: "Net" | "Stop Amount" | "Gross";
    renewal_options?: string | null;
    free_rent_months?: number | null;
  };
  sourceData?: SourceData;
}

export interface ResultsViewerProps {
  fileName: string;
  extractedData?: ExtractedData;
  sourceData?: SourceData;
  pdfPath?: string;
  onViewSource?: (source: SourcePanelInfo) => void;
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

export interface SourceData {
  field_metadata: {
    tenant_info?: { [key: string]: any };
    property_info?: { [key: string]: any };
    lease_dates?: { [key: string]: any };
    financial_terms?: { [key: string]: any };
    // ...other sections
  };
  // ...other metadata fields
}

// Section key mapping for type safety
const sectionKeyMap = {
  "Tenant Information": "tenant_info",
  "Property Information": "property_info",
  "Lease Dates": "lease_dates",
  "Financial Terms": "financial_terms",
} as const;

type SectionDisplayName = keyof typeof sectionKeyMap;
type SectionKey = typeof sectionKeyMap[SectionDisplayName];

// Helper for expense recovery type descriptions
const expenseRecoveryTypeDescriptions: Record<string, string> = {
  Net: "All recoverable expenses are paid by the tenant based on their proportionate share of the building area.",
  "Stop Amount": "Tenants reimburse all recoverable expenses over the building stop amount entered based on their proportionate share of the building area.",
  Gross: "No recoveries will be calculated for this tenant.",
};

export function ResultsViewer({ fileName, extractedData, sourceData, pdfPath, onViewSource }: ResultsViewerProps) {
  const [activeTab, setActiveTab] = useState<string>("summary")

  // Helper to get source info for a field from extractedData or sourceData
  const getSourceInfo = (
    section: keyof SourceData["field_metadata"],
    key: string
  ): SourceInfo | null => {
    // Look up in field_metadata
    if (
      sourceData?.field_metadata &&
      sourceData.field_metadata[section] &&
      sourceData.field_metadata[section]![key] &&
      sourceData.field_metadata[section]![key].citation &&
      sourceData.field_metadata[section]![key].citation.length > 0
    ) {
      // Use the first citation for now
      const citation = sourceData.field_metadata[section]![key].citation[0];
      return {
        page: citation.page,
        position: citation.position || { x: 0, y: 0, width: 0, height: 0 },
        sourceText: citation.matching_text,
      };
    }
    return null;
  }

  const getSourceCitations = (
    section: keyof SourceData["field_metadata"],
    key: string
  ): SourceCitation[] => {
    if (
      sourceData?.field_metadata &&
      sourceData.field_metadata[section] &&
      sourceData.field_metadata[section]![key] &&
      sourceData.field_metadata[section]![key].citation
    ) {
      return sourceData.field_metadata[section]![key].citation;
    }
    return [];
  }

  const handleViewSource = (
    section: keyof SourceData["field_metadata"],
    field: string,
    value: string
  ) => {
    const citations = getSourceCitations(section, field);
    const reasoning = sourceData?.field_metadata?.[section]?.[field]?.reasoning;
    if (onViewSource) {
      onViewSource({
        section: Object.keys(sectionKeyMap).find(k => sectionKeyMap[k as SectionDisplayName] === section) || section,
        fieldName: formatKey(field),
        fieldValue: value,
        metadata: {
          citation: citations,
          reasoning: reasoning,
        },
      });
    }
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

  // Helper for missing fields
  const placeholder = <span className="italic text-muted-foreground">—</span>;

  // Lease term calculation
  const calculateLeaseTerm = () => {
    if (!extractedData?.lease_dates?.lease_commencement_date || !extractedData?.lease_dates?.lease_expiration_date) return placeholder;
    const startDate = new Date(extractedData.lease_dates.lease_commencement_date)
    const endDate = new Date(extractedData.lease_dates.lease_expiration_date)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return placeholder;
    const yearDiff = endDate.getFullYear() - startDate.getFullYear()
    const monthDiff = endDate.getMonth() - startDate.getMonth()
    const totalMonths = yearDiff * 12 + monthDiff
    const years = Math.floor(totalMonths / 12)
    const months = totalMonths % 12
    return `${years} years${months > 0 ? ", " + months + " months" : ""}`
  }

  // Date formatting
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return placeholder;
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return placeholder;
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  // --- Helper functions for rent schedule ---
  function getCurrentAndNextRent(rentSchedule: RentScheduleEntry[], today: Date = new Date()) {
    if (!rentSchedule || rentSchedule.length === 0) return { current: null, next: null };
    // Sort by start_date
    const sorted = [...rentSchedule].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    let current = null;
    let next = null;
    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      const start = new Date(entry.start_date);
      // Calculate end date
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + (entry.duration?.years || 0));
      end.setMonth(end.getMonth() + (entry.duration?.months || 0));
      end.setDate(end.getDate() + (entry.duration?.days || 0));
      if (today >= start && today < end) {
        current = entry;
        next = sorted[i + 1] || null;
        break;
      }
      if (today < start) {
        next = entry;
        break;
      }
    }
    // If today is after all entries, current is last
    if (!current) current = sorted[sorted.length - 1];
    return { current, next };
  }

  function formatDuration(duration: Duration): string {
    const parts = [];
    if (duration.years) parts.push(`${duration.years} yr${duration.years > 1 ? 's' : ''}`);
    if (duration.months) parts.push(`${duration.months} mo${duration.months > 1 ? 's' : ''}`);
    if (duration.days) parts.push(`${duration.days} day${duration.days > 1 ? 's' : ''}`);
    return parts.join(", ") || "—";
  }

  function formatUplift(uplift?: Uplift | null): string {
    if (!uplift) return "—";
    const parts = [];
    if (uplift.amount != null) parts.push(`Amount: ${uplift.amount}`);
    if (uplift.min != null) parts.push(`Min: ${uplift.min}`);
    if (uplift.max != null) parts.push(`Max: ${uplift.max}`);
    return parts.join(", ") || "—";
  }

  // --- Rent Escalation Table ---
  function RentEscalationTable({ rentSchedule }: { rentSchedule: RentScheduleEntry[] }) {
    return (
      <div className="overflow-x-auto">
        <Table className="min-w-full text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1 text-left">Start Date</th>
              <th className="px-2 py-1 text-left">Duration</th>
              <th className="px-2 py-1 text-left">Type</th>
              <th className="px-2 py-1 text-left">Amount</th>
              <th className="px-2 py-1 text-left">Units</th>
              <th className="px-2 py-1 text-left">Review Type</th>
              <th className="px-2 py-1 text-left">Uplift</th>
            </tr>
          </thead>
          <tbody>
            {rentSchedule.map((entry, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="px-2 py-1">{formatDate(entry.start_date)}</td>
                <td className="px-2 py-1">{formatDuration(entry.duration)}</td>
                <td className="px-2 py-1">{entry.rent_type}</td>
                <td className="px-2 py-1">{formatUSD(entry.amount)}</td>
                <td className="px-2 py-1">{entry.units}</td>
                <td className="px-2 py-1">{entry.review_type || "—"}</td>
                <td className="px-2 py-1">{formatUplift(entry.uplift)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  }

  // --- Summary View ---
  const renderSummaryView = () => {
    const rentEscalations = extractedData?.financial_terms?.rent_escalations;
    const rentSchedule = rentEscalations?.rent_schedule || [];
    const { current } = getCurrentAndNextRent(rentSchedule);
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Tenant Info Section */}
              <div>
                <h3 className="text-sm font-medium flex items-center mb-3">
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  Tenant & Unit
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-[120px_1fr_auto] gap-2 items-center">
                    <span className="text-sm text-gray-500">Tenant:</span>
                    <span className="text-sm">{extractedData?.tenant_info?.tenant || placeholder}</span>
                    {getSourceInfo(sectionKeyMap["Tenant Information"], "tenant") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleViewSource(sectionKeyMap["Tenant Information"], "tenant", extractedData?.tenant_info?.tenant || "")}
                      >
                        <Eye className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-[120px_1fr_auto] gap-2 items-center">
                    <span className="text-sm text-gray-500">Suite:</span>
                    <span className="text-sm">{extractedData?.tenant_info?.suite_number || placeholder}</span>
                    {getSourceInfo(sectionKeyMap["Tenant Information"], "suite_number") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleViewSource(sectionKeyMap["Tenant Information"], "suite_number", extractedData?.tenant_info?.suite_number || "")}
                      >
                        <Eye className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-[120px_1fr_auto] gap-2 items-center">
                    <span className="text-sm text-gray-500">Leased Area:</span>
                    <span className="text-sm">{extractedData?.tenant_info?.leased_sqft || placeholder}</span>
                    {getSourceInfo(sectionKeyMap["Tenant Information"], "leased_sqft") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleViewSource(sectionKeyMap["Tenant Information"], "leased_sqft", String(extractedData?.tenant_info?.leased_sqft || ""))}
                      >
                        <Eye className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              {/* Property Info Section */}
              <div>
                <h3 className="text-sm font-medium flex items-center mb-3">
                  <Building className="h-4 w-4 mr-2 text-primary" />
                  Property
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-[120px_1fr_auto] gap-2 items-center">
                    <span className="text-sm text-gray-500">Address:</span>
                    <span className="text-sm">{extractedData?.property_info?.property_address || placeholder}</span>
                    {getSourceInfo(sectionKeyMap["Property Information"], "property_address") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleViewSource(sectionKeyMap["Property Information"], "property_address", extractedData?.property_info?.property_address || "")}
                      >
                        <Eye className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-[120px_1fr_auto] gap-2 items-center">
                    <span className="text-sm text-gray-500">Landlord:</span>
                    <span className="text-sm">{extractedData?.property_info?.landlord_name || placeholder}</span>
                    {getSourceInfo(sectionKeyMap["Property Information"], "landlord_name") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleViewSource(sectionKeyMap["Property Information"], "landlord_name", extractedData?.property_info?.landlord_name || "")}
                      >
                        <Eye className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Right Column */}
            <div className="space-y-6">
              {/* Dates Section */}
              <div>
                <h3 className="text-sm font-medium flex items-center mb-3">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  Lease Term
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-[120px_1fr_auto] gap-2 items-center">
                    <span className="text-sm text-gray-500">Term:</span>
                    <span className="text-sm">{calculateLeaseTerm()}</span>
                    <div className="w-6"></div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr_auto] gap-2 items-center">
                    <span className="text-sm text-gray-500">Start Date:</span>
                    <span className="text-sm">{formatDate(extractedData?.lease_dates?.lease_commencement_date ?? "")}</span>
                    {getSourceInfo(sectionKeyMap["Lease Dates"], "lease_commencement_date") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleViewSource(sectionKeyMap["Lease Dates"], "lease_commencement_date", extractedData?.lease_dates?.lease_commencement_date ?? "")}
                      >
                        <Eye className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-[120px_1fr_auto] gap-2 items-center">
                    <span className="text-sm text-gray-500">End Date:</span>
                    <span className="text-sm">{formatDate(extractedData?.lease_dates?.lease_expiration_date ?? "")}</span>
                    {getSourceInfo(sectionKeyMap["Lease Dates"], "lease_expiration_date") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleViewSource(sectionKeyMap["Lease Dates"], "lease_expiration_date", extractedData?.lease_dates?.lease_expiration_date ?? "")}
                      >
                        <Eye className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              {/* Financial Section */}
              <div>
                <h3 className="text-sm font-medium flex items-center mb-3">
                  <DollarSign className="h-4 w-4 mr-2 text-primary" />
                  Financial Terms
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                    <span className="text-sm text-gray-500">Base Rent:</span>
                    <span className="text-sm">{renderFieldValue(extractedData?.financial_terms?.base_rent, "base_rent") || placeholder}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                    <span className="text-sm text-gray-500">Current Rent:</span>
                    <span className="text-sm">{current ? formatUSD(current.amount) : placeholder}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                    <span className="text-sm text-gray-500">Expense Recovery Type:</span>
                    <span className="text-sm" title={expenseRecoveryTypeDescriptions[extractedData?.financial_terms?.expense_recovery_type || ""] || ""}>
                      {extractedData?.financial_terms?.expense_recovery_type || placeholder}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Detailed View ---
  const renderDetailedView = () => {
    const rentEscalations = extractedData?.financial_terms?.rent_escalations;
    const rentSchedule = rentEscalations?.rent_schedule || [];
    const { current } = getCurrentAndNextRent(rentSchedule);
    return (
      <div className="space-y-6">
        {/* Tenant Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Users className="h-4 w-4 mr-2 text-primary" />
              Tenant & Unit
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="grid grid-cols-[180px_1fr_auto] gap-2 items-center py-2 border-b last:border-0">
                <span className="text-sm font-medium">Tenant:</span>
                <span className="text-sm">{extractedData?.tenant_info?.tenant || placeholder}</span>
                {getSourceInfo(sectionKeyMap["Tenant Information"], "tenant") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleViewSource(sectionKeyMap["Tenant Information"], "tenant", extractedData?.tenant_info?.tenant || "")}
                  >
                    <Eye className="h-4 w-4 text-gray-500" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-[180px_1fr_auto] gap-2 items-center py-2 border-b last:border-0">
                <span className="text-sm font-medium">Suite:</span>
                <span className="text-sm">{extractedData?.tenant_info?.suite_number || placeholder}</span>
                {getSourceInfo(sectionKeyMap["Tenant Information"], "suite_number") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleViewSource(sectionKeyMap["Tenant Information"], "suite_number", extractedData?.tenant_info?.suite_number || "")}
                  >
                    <Eye className="h-4 w-4 text-gray-500" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-[180px_1fr_auto] gap-2 items-center py-2 border-b last:border-0">
                <span className="text-sm font-medium">Leased sqft:</span>
                <span className="text-sm">{extractedData?.tenant_info?.leased_sqft || placeholder}</span>
                {getSourceInfo(sectionKeyMap["Tenant Information"], "leased_sqft") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleViewSource(sectionKeyMap["Tenant Information"], "leased_sqft", String(extractedData?.tenant_info?.leased_sqft || ""))}
                  >
                    <Eye className="h-4 w-4 text-gray-500" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Property Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Building className="h-4 w-4 mr-2 text-primary" />
              Property
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="grid grid-cols-[180px_1fr_auto] gap-2 items-center py-2 border-b last:border-0">
                <span className="text-sm font-medium">Property address:</span>
                <span className="text-sm">{extractedData?.property_info?.property_address || placeholder}</span>
                {getSourceInfo(sectionKeyMap["Property Information"], "property_address") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleViewSource(sectionKeyMap["Property Information"], "property_address", extractedData?.property_info?.property_address || "")}
                  >
                    <Eye className="h-4 w-4 text-gray-500" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-[180px_1fr_auto] gap-2 items-center py-2 border-b last:border-0">
                <span className="text-sm font-medium">Landlord:</span>
                <span className="text-sm">{extractedData?.property_info?.landlord_name || placeholder}</span>
                {getSourceInfo(sectionKeyMap["Property Information"], "landlord_name") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleViewSource(sectionKeyMap["Property Information"], "landlord_name", extractedData?.property_info?.landlord_name || "")}
                  >
                    <Eye className="h-4 w-4 text-gray-500" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Lease Dates */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              Lease Term
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="grid grid-cols-[180px_1fr_auto] gap-2 items-center py-2 border-b">
                <span className="text-sm font-medium">Lease Term:</span>
                <span className="text-sm">{calculateLeaseTerm()}</span>
                <div className="w-6"></div>
              </div>
              <div className="grid grid-cols-[180px_1fr_auto] gap-2 items-center py-2 border-b last:border-0">
                <span className="text-sm font-medium">Lease Commencement Date:</span>
                <span className="text-sm">{formatDate(extractedData?.lease_dates?.lease_commencement_date ?? "")}</span>
                {getSourceInfo(sectionKeyMap["Lease Dates"], "lease_commencement_date") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleViewSource(sectionKeyMap["Lease Dates"], "lease_commencement_date", extractedData?.lease_dates?.lease_commencement_date ?? "")}
                  >
                    <Eye className="h-4 w-4 text-gray-500" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-[180px_1fr_auto] gap-2 items-center py-2 border-b last:border-0">
                <span className="text-sm font-medium">Lease Expiration Date:</span>
                <span className="text-sm">{formatDate(extractedData?.lease_dates?.lease_expiration_date ?? "")}</span>
                {getSourceInfo(sectionKeyMap["Lease Dates"], "lease_expiration_date") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleViewSource(sectionKeyMap["Lease Dates"], "lease_expiration_date", extractedData?.lease_dates?.lease_expiration_date ?? "")}
                  >
                    <Eye className="h-4 w-4 text-gray-500" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Financial Terms */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-primary" />
              Financial
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="grid grid-cols-[180px_1fr] gap-2 items-center py-2 border-b last:border-0">
                <span className="text-sm font-medium">Base Rent:</span>
                <span className="text-sm">{renderFieldValue(extractedData?.financial_terms?.base_rent, "base_rent") || placeholder}</span>
              </div>
              <div className="grid grid-cols-[180px_1fr] gap-2 items-center py-2 border-b last:border-0">
                <span className="text-sm font-medium">Current Rent:</span>
                <span className="text-sm">{current ? formatUSD(current.amount) : placeholder}</span>
              </div>
              <div className="grid grid-cols-[180px_1fr] gap-2 items-center py-2 border-b last:border-0">
                <span className="text-sm font-medium">Expense Recovery Type:</span>
                <span className="text-sm" title={expenseRecoveryTypeDescriptions[extractedData?.financial_terms?.expense_recovery_type || ""] || ""}>
                  {extractedData?.financial_terms?.expense_recovery_type || placeholder}
                </span>
              </div>
              {rentSchedule.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold mb-2">Rent Escalation Schedule</h4>
                  <RentEscalationTable rentSchedule={rentSchedule} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="space-y-6 relative">
      {/* Tabs for Summary/Detailed View */}
      <Tabs defaultValue="summary" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="summary">Summary View</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="space-y-6">
          {renderSummaryView()}
        </TabsContent>
        <TabsContent value="detailed" className="space-y-6">
          {renderDetailedView()}
        </TabsContent>
      </Tabs>
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
