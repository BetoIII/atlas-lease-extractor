from pydantic import BaseModel, Field
from typing import List, Literal
from enum import Enum

class LeaseFlagType(str, Enum):
    EARLY_TERMINATION = "Early Termination Clauses"
    UNCAPPED_OPERATING_EXPENSES = "Uncapped or Vague Operating Expenses"
    AMBIGUOUS_MAINTENANCE = "Ambiguous Maintenance and Upgrade Obligations"
    EXCESSIVE_SERVICE_CHARGES = "Excessive Service Charges Without Transparency or Caps"
    HIDDEN_FEES = "Hidden Fees"
    RESTRICTIVE_USE = "Restrictive Use Clauses"
    DO_NOT_COMPETE = "Do Not Compete Clauses"
    AMBIGUOUS_LANGUAGE = "Ambiguous or Vague Language"
    LANDLORD_TERMINATE = "Landlord's Right to Terminate"
    TENANT_INSURANCE = "Tenant Insurance Requirements"
    INDEMNIFICATION = "Indemnification Clauses"
    UNFAVORABLE_RENEWAL = "Unfavorable Renewal Terms"
    HOLDOVER_PENALTIES = "Holdover Penalties"
    SUBLEASE_RESTRICTIONS = "Sublease Restrictions"
    ASSIGNMENT_CLAUSES = "Assignment Clauses"

class LeaseFlag(BaseModel):
    """A flag representing a specific risk or clause found in a lease agreement."""
    category: Literal["Financial Exposure & Cost Uncertainty"] = Field(description="The category of the lease flag, e.g., Financial Exposure & Cost Uncertainty")
    title: str = Field(description="The title or name of the lease flag")
    description: str = Field(description="A detailed description of the lease flag and its implications")

class EarlyTerminationClause(LeaseFlag):
    category: Literal["Financial Exposure & Cost Uncertainty"] = "Financial Exposure & Cost Uncertainty"
    title: Literal["Early Termination Clauses"] = "Early Termination Clauses"
    description: Literal["Provisions allowing tenants or landlords to terminate leases early, potentially leading to significant financial implications."] = "Provisions allowing tenants or landlords to terminate leases early, potentially leading to significant financial implications."

class UncappedOperatingExpenses(LeaseFlag):
    category: Literal["Financial Exposure & Cost Uncertainty"] = "Financial Exposure & Cost Uncertainty"
    title: Literal["Uncapped or Vague Operating Expenses"] = "Uncapped or Vague Operating Expenses"
    description: Literal["Clauses that lack clear definitions or caps on expenses like maintenance charges, property taxes, or insurance requirements."] = "Clauses that lack clear definitions or caps on expenses like maintenance charges, property taxes, or insurance requirements."

class AmbiguousMaintenanceObligations(LeaseFlag):
    category: Literal["Financial Exposure & Cost Uncertainty"] = "Financial Exposure & Cost Uncertainty"
    title: Literal["Ambiguous Maintenance and Upgrade Obligations"] = "Ambiguous Maintenance and Upgrade Obligations"
    description: Literal["Requirements for tenants to undertake unspecified upgrades or maintenance, such as 'must upgrade to new technology' or 'must update paint and floors,' which can lead to unpredictable costs."] = "Requirements for tenants to undertake unspecified upgrades or maintenance, such as 'must upgrade to new technology' or 'must update paint and floors,' which can lead to unpredictable costs."

class ExcessiveServiceCharges(LeaseFlag):
    category: Literal["Financial Exposure & Cost Uncertainty"] = "Financial Exposure & Cost Uncertainty"
    title: Literal["Excessive Service Charges Without Transparency or Caps"] = "Excessive Service Charges Without Transparency or Caps"
    description: Literal["Leases allowing landlords to impose service charges without clear justification or limits."] = "Leases allowing landlords to impose service charges without clear justification or limits."

class HiddenFees(LeaseFlag):
    category: Literal["Financial Exposure & Cost Uncertainty"] = "Financial Exposure & Cost Uncertainty"
    title: Literal["Hidden Fees"] = "Hidden Fees"
    description: Literal["Unspecified costs embedded within the lease, including unexpected insurance requirements or maintenance charges."] = "Unspecified costs embedded within the lease, including unexpected insurance requirements or maintenance charges."

class RestrictiveUseClauses(LeaseFlag):
    category: Literal["Operational Constraints & Legal Risks"] = "Operational Constraints & Legal Risks"
    title: Literal["Restrictive Use Clauses"] = "Restrictive Use Clauses"
    description: Literal["Limitations on how the property can be used, potentially hindering business operations or growth."] = "Limitations on how the property can be used, potentially hindering business operations or growth."

class DoNotCompeteClauses(LeaseFlag):
    category: Literal["Operational Constraints & Legal Risks"] = "Operational Constraints & Legal Risks"
    title: Literal["Do Not Compete Clauses"] = "Do Not Compete Clauses"
    description: Literal["Provisions preventing tenants from engaging in certain business activities, common in medical or retail leases."] = "Provisions preventing tenants from engaging in certain business activities, common in medical or retail leases."

class AmbiguousLanguage(LeaseFlag):
    category: Literal["Operational Constraints & Legal Risks"] = "Operational Constraints & Legal Risks"
    title: Literal["Ambiguous or Vague Language"] = "Ambiguous or Vague Language"
    description: Literal["Clauses lacking clarity, leading to potential misunderstandings regarding responsibilities and obligations."] = "Clauses lacking clarity, leading to potential misunderstandings regarding responsibilities and obligations."

class LandlordsRightToTerminate(LeaseFlag):
    category: Literal["Operational Constraints & Legal Risks"] = "Operational Constraints & Legal Risks"
    title: Literal["Landlord's Right to Terminate"] = "Landlord's Right to Terminate"
    description: Literal["Provisions allowing landlords to cancel the lease under broad or undefined circumstances."] = "Provisions allowing landlords to cancel the lease under broad or undefined circumstances."

class TenantInsuranceRequirements(LeaseFlag):
    category: Literal["Insurance & Liability"] = "Insurance & Liability"
    title: Literal["Tenant Insurance Requirements"] = "Tenant Insurance Requirements"
    description: Literal["Clauses mandating tenants to carry specific insurance policies without clear specifications, potentially leading to increased costs."] = "Clauses mandating tenants to carry specific insurance policies without clear specifications, potentially leading to increased costs."

class IndemnificationClauses(LeaseFlag):
    category: Literal["Insurance & Liability"] = "Insurance & Liability"
    title: Literal["Indemnification Clauses"] = "Indemnification Clauses"
    description: Literal["Provisions requiring tenants to indemnify landlords, which can expose tenants to significant liabilities."] = "Provisions requiring tenants to indemnify landlords, which can expose tenants to significant liabilities."

class UnfavorableRenewalTerms(LeaseFlag):
    category: Literal["Lease Term & Renewal"] = "Lease Term & Renewal"
    title: Literal["Unfavorable Renewal Terms"] = "Unfavorable Renewal Terms"
    description: Literal["Clauses that allow landlords to increase rent significantly upon renewal or impose strict renewal notification periods."] = "Clauses that allow landlords to increase rent significantly upon renewal or impose strict renewal notification periods."

class HoldoverPenalties(LeaseFlag):
    category: Literal["Lease Term & Renewal"] = "Lease Term & Renewal"
    title: Literal["Holdover Penalties"] = "Holdover Penalties"
    description: Literal["Excessive fees or penalties for tenants who remain in the property after lease expiration without a new agreement."] = "Excessive fees or penalties for tenants who remain in the property after lease expiration without a new agreement."

class SubleaseRestrictions(LeaseFlag):
    category: Literal["Miscellaneous"] = "Miscellaneous"
    title: Literal["Sublease Restrictions"] = "Sublease Restrictions"
    description: Literal["Limitations or prohibitions on the tenant's ability to sublease the property, affecting flexibility."] = "Limitations or prohibitions on the tenant's ability to sublease the property, affecting flexibility."

class AssignmentClauses(LeaseFlag):
    category: Literal["Miscellaneous"] = "Miscellaneous"
    title: Literal["Assignment Clauses"] = "Assignment Clauses"
    description: Literal["Restrictions on transferring lease obligations to another party, which can impact business transitions."] = "Restrictions on transferring lease obligations to another party, which can impact business transitions."

class LeaseFlagsSchema(BaseModel):
    """A schema representing a collection of lease flags extracted from a lease document."""
    lease_flags: List[LeaseFlag] = Field(description="A list of lease flags identified in the lease")
