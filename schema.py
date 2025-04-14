from typing import Optional, Dict, List
from pydantic import BaseModel, Field


class LeaseBasicInfo(BaseModel):
    """Basic information about the lease parties"""
    
    tenant: str = Field(description="Full legal name of the tenant/lessee who is renting the property")
    landlord: str = Field(description="Full legal name of the landlord/lessor who owns the property")
    property_manager: str = Field(description="Property manager responsible for managing the property and interacting with the tenant")


class PropertyDetails(BaseModel):
    """Physical property information and specifications"""
    
    property_address: str = Field(description="Complete street address of the leased property including street number, city, state and zip code")
    property_sqft: str = Field(description="Total square footage of the entire property/building")
    leased_sqft: str = Field(description="Actual square footage being leased by the tenant")


class LeaseDates(BaseModel):
    """Key dates associated with the lease agreement"""
    
    lease_date: str = Field(description="Date when the lease agreement was signed by all parties (format: YYYY-MM-DD)")
    rental_commencement_date: str = Field(description="Date when the tenant's obligation to pay rent begins (format: YYYY-MM-DD)")
    lease_expiration_date: str = Field(description="Date when the lease agreement terminates (format: YYYY-MM-DD)")


class FinancialTerms(BaseModel):
    """Financial terms and obligations of the lease"""
    
    base_rent: Dict[str, str] = Field(description="Base rent amount, including monthly and annual values")
    security_deposit: str = Field(description="Amount of security deposit required from tenant")
    rent_escalations: List[Dict[str, str]] = Field(description="Schedule of rent increases over the lease term, including dates and amounts")


class AdditionalTerms(BaseModel):
    """Optional additional terms and conditions"""
    
    lease_type: Optional[str] = Field(None, description="Type of lease e.g., 'Triple Net (NNN)', 'Full Service Gross', 'Modified Gross'")
    permitted_use: Optional[str] = Field(None, description="Specified allowed use of the property by tenant")
    renewal_options: Optional[List[Dict[str, str]]] = Field(None, description="Terms for lease renewal including number of options, duration, and rent terms")


class LeaseExtraction(BaseModel):
    """Schema for extracting key information from lease documents"""
    
    basic_info: LeaseBasicInfo = Field(description="Basic information about the lease parties")
    property_details: PropertyDetails = Field(description="Physical property information")
    lease_dates: LeaseDates = Field(description="Key dates of the lease agreement")
    financial_terms: FinancialTerms = Field(description="Financial terms and obligations")
    additional_terms: AdditionalTerms = Field(description="Optional additional terms and conditions")
