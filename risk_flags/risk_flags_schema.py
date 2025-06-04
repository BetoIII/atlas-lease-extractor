from pydantic import BaseModel, Field
from typing import List, Literal, Optional
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

class RiskFlag(BaseModel):
    """Schema for a single risk flag identified in a lease document."""
    category: str = Field(description="The category of the risk flag")
    title: str = Field(description="The title or name of the risk flag")
    description: str = Field(description="Detailed description of the risk flag")

class LeaseFlag(BaseModel):
    """A flag representing a specific risk found in a lease agreement."""
    type: LeaseFlagType = Field(description="The type of lease flag")
    title: str = Field(description="The title or name of the lease flag")
    description: str = Field(description="A detailed description of the lease flag and why it is a risk for the property owner or manager")
    confidence: float = Field(ge=0, le=1, description="The confidence score of the lease flag")

class EarlyTerminationClause(LeaseFlag):
    type: LeaseFlagType = Field(default=LeaseFlagType.EARLY_TERMINATION)
    title: str = "Early Termination Clauses"
    description: str = "Provisions allowing tenants or landlords to terminate leases early, potentially leading to significant financial implications."

class UncappedOperatingExpenses(LeaseFlag):
    type: LeaseFlagType = Field(default=LeaseFlagType.UNCAPPED_OPERATING_EXPENSES)
    title: str = "Uncapped or Vague Operating Expenses"
    description: str = "Clauses that lack clear definitions or caps on expenses like maintenance charges, property taxes, or insurance requirements."

class AmbiguousMaintenanceObligations(LeaseFlag):
    type: LeaseFlagType = Field(default=LeaseFlagType.AMBIGUOUS_MAINTENANCE)
    title: str = "Ambiguous Maintenance and Upgrade Obligations"
    description: str = "Requirements for tenants to undertake unspecified upgrades or maintenance, such as 'must upgrade to new technology' or 'must update paint and floors,' which can lead to unpredictable costs."

class ExcessiveServiceCharges(LeaseFlag):
    type: LeaseFlagType = Field(default=LeaseFlagType.EXCESSIVE_SERVICE_CHARGES)
    title: str = "Excessive Service Charges Without Transparency or Caps"
    description: str = "Leases allowing landlords to impose service charges without clear justification or limits."

class HiddenFees(LeaseFlag):
    type: LeaseFlagType = Field(default=LeaseFlagType.HIDDEN_FEES)
    title: str = "Hidden Fees"
    description: str = "Unspecified costs embedded within the lease, including unexpected insurance requirements or maintenance charges."

class RestrictiveUseClauses(LeaseFlag):
    type: LeaseFlagType = Field(default=LeaseFlagType.RESTRICTIVE_USE)
    title: str = "Restrictive Use Clauses"
    description: str = "Limitations on how the property can be used, potentially hindering business operations or growth."

class DoNotCompeteClauses(LeaseFlag):
    type: LeaseFlagType = Field(default=LeaseFlagType.DO_NOT_COMPETE)
    title: str = "Do Not Compete Clauses"
    description: str = "Provisions preventing tenants from engaging in certain business activities, common in medical or retail leases."

class AmbiguousLanguage(LeaseFlag):
    type: LeaseFlagType = Field(default=LeaseFlagType.AMBIGUOUS_LANGUAGE)
    title: str = "Ambiguous or Vague Language"
    description: str = "Clauses lacking clarity, leading to potential misunderstandings regarding responsibilities and obligations."

class LandlordsRightToTerminate(LeaseFlag):
    type: LeaseFlagType = Field(default=LeaseFlagType.LANDLORD_TERMINATE)
    title: str = "Landlord's Right to Terminate"
    description: str = "Provisions allowing landlords to cancel the lease under broad or undefined circumstances."

class TenantInsuranceRequirements(LeaseFlag):
    type: LeaseFlagType = Field(default=LeaseFlagType.TENANT_INSURANCE)
    title: str = "Tenant Insurance Requirements"
    description: str = "Clauses mandating tenants to carry specific insurance policies without clear specifications, potentially leading to increased costs."

class IndemnificationClauses(LeaseFlag):
    type: LeaseFlagType = Field(default=LeaseFlagType.INDEMNIFICATION)
    title: str = "Indemnification Clauses"
    description: str = "Provisions requiring tenants to indemnify landlords, which can expose tenants to significant liabilities."

class UnfavorableRenewalTerms(LeaseFlag):
    type: LeaseFlagType = Field(default=LeaseFlagType.UNFAVORABLE_RENEWAL)
    title: str = "Unfavorable Renewal Terms"
    description: str = "Clauses that allow landlords to increase rent significantly upon renewal or impose strict renewal notification periods."

class HoldoverPenalties(LeaseFlag):
    type: LeaseFlagType = Field(default=LeaseFlagType.HOLDOVER_PENALTIES)
    title: str = "Holdover Penalties"
    description: str = "Excessive fees or penalties for tenants who remain in the property after lease expiration without a new agreement."

class SubleaseRestrictions(LeaseFlag):
    type: LeaseFlagType = Field(default=LeaseFlagType.SUBLEASE_RESTRICTIONS)
    title: str = "Sublease Restrictions"
    description: str = "Limitations or prohibitions on the tenant's ability to sublease the property, affecting flexibility."

class AssignmentClauses(LeaseFlag):
    type: LeaseFlagType = Field(default=LeaseFlagType.ASSIGNMENT_CLAUSES)
    title: str = "Assignment Clauses"
    description: str = "Restrictions on transferring lease obligations to another party, which can impact business transitions."

class RiskFlagsSchema(BaseModel):
    """Schema for the complete risk flags extraction result."""
    risk_flags: List[RiskFlag] = Field(description="A list of risk flags identified in the lease")
