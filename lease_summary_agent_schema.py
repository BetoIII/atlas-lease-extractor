from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import date
import config
import json

class PartyInfo(BaseModel):
    tenant: str = Field(..., description="Full legal name of the tenant/lessee who is renting the property", example="Acme Corp.")

class PropertyInfo(BaseModel):
    property_address: str = Field(..., description="Complete street address of the leased property including street number, city, state and zip code", example="123 Main St, Springfield, IL 62704")
    suite_number: str = Field(..., description="Suite or unit number of the property being leased within a larger building. Print 'N/A' if the lease appears to rent the entire building.", example="Suite 200")
    leased_sqft: Optional[float] = Field(None, description="Actual square footage being leased by the tenant", example=2000.0)

class LeaseDates(BaseModel):
    lease_commencement_date: date = Field(..., description="Date when the rental period commences (format: YYYY-MM-DD)", example="2024-01-01")
    lease_expiration_date: date = Field(..., description="Date when the lease agreement terminates (format: YYYY-MM-DD)", example="2029-12-31")
    # FE will calculate "Current Term" and "Remaining Term" by using the lease_commencement_date and lease_expiration_date
    lease_term: str = Field(..., description="The duration of the lease in years", example="5 years")

class FinancialTerms(BaseModel):
    base_rent: float = Field(..., description="The base rent amount (expressed in USD paid monthly) when the lease commences", example=3500.00)
    security_deposit: Optional[float] = Field(None, description="Amount of security deposit required from tenant", example=7000.00)
    rent_escalations: Optional[str] = Field(None, description="Details of any rent escalations or increases during the lease term. If no escalations are mentioned, print 'No escalations detected'")
    opex_type: str = Field(..., description="The category of lease that describes how operating expenses are being paid by the tenant. e.g., 'Triple Net (NNN)', 'Full Service Gross', 'Modified Gross'", example="Triple Net (NNN)")
    renewal_options: Optional[str] = Field(None, description="Summary of any renewal options available to the tenant", example="2 x 5-year options")

class LeaseSummary(BaseModel):
    party_info: PartyInfo
    property_info: PropertyInfo
    lease_dates: LeaseDates
    financial_terms: FinancialTerms

    class Config:
        orm_mode = True
        allow_population_by_field_name = True