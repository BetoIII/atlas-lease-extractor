from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import date
import config
import json
from rent_escalation_schema import RentEscalationSchema
from enum import Enum

class PropertyInfo(BaseModel):
    property_address: str = Field(..., description="Complete street address of the leased property including street number, city, state and zip code", example="123 Main St, Springfield, IL 62704")
    landlord_name: str = Field(..., description="Full legal name of the landlord or building owner who is leasing the property. This party is usually separate from the property management company.", example="HoldCo, LLC")

class TenantInfo(BaseModel):
    tenant: str = Field(..., description="Full legal name of the tenant/lessee who is renting the property", example="Acme Corp.")
    suite_number: str = Field(..., description="Suite or unit number of the property being leased within a larger building. Print 'N/A' if the lease appears to rent the entire building.", example="Suite 200")
    leased_sqft: Optional[float] = Field(None, description="Actual square footage being leased by the tenant", example=2000.0)

class LeaseDates(BaseModel):
    lease_commencement_date: date = Field(..., description="Date when the rental period commences (format: YYYY-MM-DD)", example="2024-01-01")
    lease_expiration_date: date = Field(..., description="Date when the lease agreement terminates (format: YYYY-MM-DD)", example="2029-12-31")
    # FE will calculate "Current Term" and "Remaining Term" by using the lease_commencement_date and lease_expiration_date
    lease_term: str = Field(..., description="The duration of the lease in years", example="5 years")

class ExpenseRecoveryType(str, Enum):
    NET = "Net"  # All recoverable expenses are paid by the tenant based on their proportionate share of the building area.
    STOP_AMOUNT = "Stop Amount"  # Tenants reimburse all recoverable expenses over the building stop amount entered based on their proportionate share of the building area.
    GROSS = "Gross"  # No recoveries will be calculated for this tenant.

class FinancialTerms(BaseModel):
    base_rent: float = Field(..., description="The base rent amount (expressed in USD paid monthly) when the lease commences", example=3500.00)
    #FE will calculate "Current Rent" by using the dates in the rent_escalations
    security_deposit: Optional[float] = Field(None, description="Amount of security deposit required from tenant", example=7000.00)
    rent_escalations: Optional[RentEscalationSchema] = Field(None, description="Structured schedule of rent escalations or increases during the lease term. If no escalations are mentioned, set to None.")
    expense_recovery_type: ExpenseRecoveryType = Field(..., description="The method by which operating expenses are recovered from the tenant. Must be one of: 'Net', 'Stop Amount', or 'Gross'.")
    renewal_options: Optional[str] = Field(None, description="Summary of any renewal options available to the tenant", example="2 x 5-year options")
    free_rent_months: Optional[int] = Field(
        None,
        description="Number of months of free rent provided to the tenant at the beginning of the lease term, if any. If not specified in the lease, set to None.",
        example=3
    )

class LeaseSummary(BaseModel):
    property_info: PropertyInfo
    tenant_info: TenantInfo
    lease_dates: LeaseDates
    financial_terms: FinancialTerms

    class Config:
        orm_mode = True
        allow_population_by_field_name = True