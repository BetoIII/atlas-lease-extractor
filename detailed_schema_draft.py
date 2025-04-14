from pydantic import BaseModel, Field
from typing import Optional, Dict

class GeneralMetadata(BaseModel):
    loan_number: str = Field(default="", description="Loan number associated with the lease")
    borrower: str = Field(default="", description="Name of the borrower")
    landlord: str = Field(default="", description="Name of the landlord")
    tenant: str = Field(default="", description="Name of the tenant")
    property_sqft: str = Field(default="", description="Total square footage of the property")
    leased_sqft: str = Field(default="", description="Square footage being leased")
    lease_date: str = Field(default="", description="Date the lease was signed")
    rental_commencement_date: str = Field(default="", description="Date the rental period begins")
    lease_expiration_date: str = Field(default="", description="Date the lease expires")

class TermData(BaseModel):
    number_of_months: str = Field(alias="# of Months", description="Duration of the term in months")
    remaining: str = Field(alias="Remaining", description="Remaining months in the term")

class BaseRentData(BaseModel):
    monthly: str = Field(alias="Monthly", description="Monthly base rent amount")
    annual: str = Field(alias="Annual", description="Annual base rent amount")
    psf: str = Field(alias="PSF", description="Price per square foot")

class LeaseTypeData(BaseModel):
    net: str = Field(alias="Net", description="Whether the lease is net")
    gross: str = Field(alias="Gross", description="Whether the lease is gross")
    mod_gross: str = Field(alias="Mod. Gross", description="Whether the lease is modified gross")

class RentalChangesData(BaseModel):
    description: str = Field(alias="Description", description="Description of rental increases/decreases")

class ConcessionsData(BaseModel):
    free_rent: str = Field(alias="Free Rent", description="Whether free rent is offered")
    tis: str = Field(alias="TI'S", description="Whether tenant improvements are included")
    reduced_rent: str = Field(alias="Reduced Rent", description="Whether reduced rent is offered")
    ti_description: str = Field(alias="TI Description", description="Description of tenant improvements")

class EffectiveRentData(BaseModel):
    monthly: str = Field(alias="Monthly", description="Monthly effective rent")
    annual: str = Field(alias="Annual", description="Annual effective rent")
    psf: str = Field(alias="PSF", description="Effective rent per square foot")

class RenewalOptionsData(BaseModel):
    available: str = Field(alias="Available", description="Whether renewal options are available")
    explanation: str = Field(alias="Explanation", description="Explanation of renewal terms")

class SubordinationData(BaseModel):
    automatically_subordinate: str = Field(alias="Automatically Subordinate", description="Whether lease is automatically subordinate")
    explanation: str = Field(alias="Explanation", description="Explanation of subordination terms")

class InsuranceCondemnationControls(BaseModel):
    insurance: str = Field(alias="Insurance", description="Whether landlord controls insurance proceeds")
    condemnation: str = Field(alias="Condemnation", description="Whether landlord controls condemnation proceeds")

class InsuranceCondemnationData(BaseModel):
    landlord_controls_proceeds: InsuranceCondemnationControls = Field(alias="Landlord Controls Proceeds")
    landlord_must_rebuild: str = Field(alias="Landlord Must Rebuild", description="Whether landlord must rebuild")
    tenant_termination_rights: str = Field(alias="Tenant Termination Rights", description="Whether tenant has termination rights")
    termination_conditions: str = Field(alias="Termination Conditions", description="Conditions for termination")

class EarlyTerminationData(BaseModel):
    tenant_termination_rights: str = Field(alias="Tenant Termination Rights", description="Whether tenant has early termination rights")

class PurchaseOptionsData(BaseModel):
    tenant_has_purchase_option: str = Field(alias="Tenant Has Purchase Option", description="Whether tenant has purchase option")
    explanation: str = Field(alias="Explanation", description="Explanation of purchase options")

class LeaseExecutionData(BaseModel):
    signed_by_all_parties: str = Field(alias="Signed by All Parties", description="Whether lease is signed by all parties")
    all_lease_documents_attached: str = Field(alias="All Lease Documents Attached", description="Whether all lease documents are attached")

class ExpenseData(BaseModel):
    tenant_stop_cap: Optional[str] = Field(alias="Tenant Stop/Cap", default=None, description="Whether there's a tenant stop or cap")
    tenant_responsible: Optional[str] = Field(alias="Tenant Responsible", default=None, description="Whether tenant is responsible")
    landlord_responsible_percent: str = Field(alias="Landlord Responsible %", description="Percentage landlord is responsible for")
    tenant_responsible_percent: str = Field(alias="Tenant Responsible %", description="Percentage tenant is responsible for")

class LeaseSection(BaseModel):
    source_lease_section: str = Field(description="Reference to the section in the lease document")
    data: Dict = Field(description="Section-specific data")

class LeaseSections(BaseModel):
    term_original: LeaseSection = Field(alias="Term: Original")
    term_renewal: LeaseSection = Field(alias="Term: Renewal")
    base_rent: LeaseSection = Field(alias="Base Rent")
    lease_type: LeaseSection = Field(alias="Lease Type")
    rental_changes: LeaseSection = Field(alias="Rental Increases/Decreases or % Rents")
    concessions: LeaseSection = Field(alias="Concessions")
    effective_rent: LeaseSection = Field(alias="Effective Rent")
    renewal_options: LeaseSection = Field(alias="Renewal Options")
    subordination: LeaseSection = Field(alias="Subordination")
    insurance_condemnation: LeaseSection = Field(alias="Insurance/Condemnation Proceeds")
    early_termination: LeaseSection = Field(alias="Early Termination")
    purchase_options: LeaseSection = Field(alias="Purchase Options")
    lease_execution: LeaseSection = Field(alias="Lease Execution")
    operating_expenses: LeaseSection = Field(alias="Operating Expenses")
    utilities: LeaseSection = Field(alias="Utilities")
    real_estate_taxes: LeaseSection = Field(alias="Real Estate Taxes")
    cam: LeaseSection = Field(alias="CAM")
    insurance_building: LeaseSection = Field(alias="Insurance (F&EC & Liability for Bldg.)")

class LeaseExtraction(BaseModel):
    general_metadata: GeneralMetadata = Field(description="General metadata about the lease")
    lease_sections: LeaseSections = Field(description="Detailed lease sections and their data") 