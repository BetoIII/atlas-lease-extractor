from llama_cloud_services import LlamaExtract
from pydantic import BaseModel, Field
import config
from llama_cloud.core.api_error import ApiError
import requests
import json
from llama_cloud.types import ExtractConfig, ExtractMode

class BasicInfo(BaseModel):
    tenant: str = Field(description="Full legal name of the tenant/lessee who is renting the property")
    landlord: str = Field(description="Full legal name of the landlord/lessor who owns the property")
    property_manager: str = Field(description="Property manager responsible for managing the property and interacting with the tenant")

class PropertyDetails(BaseModel):
    property_address: str = Field(description="Complete street address of the leased property including street number, city, state and zip code")
    property_sqft: str = Field(description="Total square footage of the property")
    leased_sqft: str = Field(description="Actual square footage being leased by the tenant")

class LeaseDates(BaseModel):
    lease_date: str = Field(description="Date when the lease agreement was signed (format: YYYY-MM-DD)")
    rental_commencement_date: str = Field(description="Date when the rental period commences (format: YYYY-MM-DD)")
    lease_expiration_date: str = Field(description="Date when the lease agreement terminates (format: YYYY-MM-DD)")

class FinancialTerms(BaseModel):
    base_rent: str = Field(description="Base rent amount when the lease commences")
    security_deposit: str = Field(description="Amount of security deposit required from tenant")
    rent_escalations: str = Field(description="Details of any rent escalations or increases during the lease term")

class AdditionalTerms(BaseModel):
    lease_type: str = Field(description="Type of lease e.g., 'Triple Net (NNN)', 'Full Service Gross', 'Modified Gross'")
    renewal_options: str = Field(description="Summary of any renewal options available to the tenant")

class LeaseSummary(BaseModel):
    basic_info: BasicInfo
    property_details: PropertyDetails
    lease_dates: LeaseDates
    financial_terms: FinancialTerms
    additional_terms: AdditionalTerms