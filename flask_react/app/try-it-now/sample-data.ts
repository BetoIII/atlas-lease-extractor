import type { ExtractedData } from "./results-viewer";
import type { RiskFlag } from "./lease-context";

export const sampleLeaseData: ExtractedData = {
  tenant_info: {
    tenant: "TechStart Inc.",
    suite_number: "Suite 401",
    leased_sqft: 5500,
  },
  property_info: {
    property_address: "123 Business Plaza, Downtown District, NY 10001",
    landlord_name: "Metropolitan Property Group LLC",
  },
  lease_dates: {
    lease_commencement_date: "2024-01-01",
    lease_expiration_date: "2029-12-31",
    lease_term: "5 years",
  },
  financial_terms: {
    base_rent: 12500,
    security_deposit: 37500,
    expense_recovery_type: "Net",
    renewal_options: "Two 5-year options at market rate",
    free_rent_months: 3,
    rent_escalations: {
      rent_schedule: [
        {
          start_date: "2024-01-01",
          duration: { years: 1, months: 0, days: 0 },
          rent_type: "Base Rent",
          units: "$/month",
          amount: 12500,
          review_type: "Annual",
          uplift: { amount: 3 },
          adjust_expense_stops: false,
          stop_year: null,
        },
        {
          start_date: "2025-01-01",
          duration: { years: 1, months: 0, days: 0 },
          rent_type: "Base Rent",
          units: "$/month",
          amount: 12875,
          review_type: "Annual",
          uplift: { amount: 3 },
          adjust_expense_stops: false,
          stop_year: null,
        },
      ],
    },
  },
  sourceData: {
    field_metadata: {
      tenant_info: {},
      property_info: {},
      lease_dates: {},
      financial_terms: {},
    },
  },
};

export const sampleRentRollData: ExtractedData = {
  tenant_info: {
    tenant: "Global Retail Chain",
    suite_number: "Units 100-102",
    leased_sqft: 8750,
  },
  property_info: {
    property_address: "456 Shopping Center Blvd, Retail District, CA 90210",
    landlord_name: "Westside Commercial Properties",
  },
  lease_dates: {
    lease_commencement_date: "2023-03-01",
    lease_expiration_date: "2033-02-28",
    lease_term: "10 years",
  },
  financial_terms: {
    base_rent: 22000,
    security_deposit: 66000,
    expense_recovery_type: "Stop Amount",
    renewal_options: "One 10-year option at 95% of market rate",
    free_rent_months: 6,
    rent_escalations: {
      rent_schedule: [
        {
          start_date: "2023-03-01",
          duration: { years: 2, months: 0, days: 0 },
          rent_type: "Base Rent",
          units: "$/month",
          amount: 22000,
          review_type: "Biennial",
          uplift: { amount: 2.5 },
          adjust_expense_stops: true,
          stop_year: 2023,
        },
        {
          start_date: "2025-03-01",
          duration: { years: 2, months: 0, days: 0 },
          rent_type: "Base Rent",
          units: "$/month",
          amount: 22550,
          review_type: "Biennial",
          uplift: { amount: 2.5 },
          adjust_expense_stops: true,
          stop_year: 2023,
        },
      ],
    },
  },
  sourceData: {
    field_metadata: {
      tenant_info: {},
      property_info: {},
      lease_dates: {},
      financial_terms: {},
    },
  },
};

export const sampleAssetTypeClassification = {
  asset_type: "Office",
  confidence: 0.95,
  reasoning:
    "Document contains typical office lease terms including shared common areas, business hours provisions, and professional use clauses.",
};

export const sampleRentRollAssetType = {
  asset_type: "Retail",
  confidence: 0.92,
  reasoning:
    "Document shows retail space characteristics with high square footage, percentage rent provisions, and shopping center location.",
};

export const sampleRiskFlags: RiskFlag[] = [
  {
    title: "Personal Guarantee Required",
    severity: "high",
    page: 12,
    clause: "Section 8.2 - Guaranty Provisions",
    reason:
      "Lease requires personal guarantee from tenant principals for the full lease term",
    recommendation: "Consider negotiating limited guarantee or burnoff provisions",
  },
  {
    title: "No Early Termination Rights",
    severity: "medium",
    page: 8,
    clause: "Section 4.1 - Term and Renewal",
    reason: "Tenant has no right to terminate lease early under any circumstances",
    recommendation: "Negotiate early termination rights for specific events",
  },
  {
    title: "Broad Assignment Restrictions",
    severity: "medium",
    page: 15,
    clause: "Section 11.3 - Assignment and Subletting",
    reason:
      "Very restrictive assignment and subletting provisions that require landlord consent",
    recommendation: "Seek more flexible assignment rights for affiliates and qualified assignees",
  },
];

export const sampleRentRollRiskFlags: RiskFlag[] = [
  {
    title: "Percentage Rent Obligation",
    severity: "high",
    page: 3,
    clause: "Rent Roll Summary - Additional Charges",
    reason: "Tenant owes percentage rent based on gross sales exceeding breakpoint",
    recommendation:
      "Monitor sales reporting requirements and breakpoint calculations",
  },
  {
    title: "CAM Reconciliation Discrepancy",
    severity: "medium",
    page: 5,
    clause: "Operating Expense Details",
    reason: "CAM charges show significant variance from budgeted amounts",
    recommendation: "Request detailed CAM reconciliation and audit rights",
  },
];

