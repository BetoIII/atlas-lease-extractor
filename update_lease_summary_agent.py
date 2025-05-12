from llama_cloud_services import LlamaExtract
from pydantic import BaseModel, Field
import config
from llama_cloud.core.api_error import ApiError
import requests
import json

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


def get_extraction_config():
    return {
        "data_schema": LeaseSummary.model_json_schema(),
        "config": {
            "extraction_target": "PER_DOC",
            "extraction_mode": "MULTIMODAL",
            "system_prompt": "You are a senior Commercial Real Estate Analyst and you help commercial real estate professionals abstract (i.e., extract) critical data from pdf documents into structured data that will be used for critical analaysis, deal-making, and financial reporting for financial reporting and compliance.",
            "cite_sources": True,
            "invalidate_cache": True
        }
    }

# Configuration constants
AGENT_ID = "3471b248-2281-4741-91c4-8e0f15328782"
AGENT_NAME = "atlas-summary-extractor"

def update_extraction_agent():
    url = f"https://api.cloud.llamaindex.ai/api/v1/extraction/extraction-agents/{AGENT_ID}"
    payload = json.dumps(get_extraction_config())
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer llx-73anpTwSKmeXVyIUWfu8YiL9fR8Q30RJ69IZogjFJWgXTsaF'
    }
    response = requests.put(url, headers=headers, data=payload)
    print(response.status_code)
    print(response.text)

if __name__ == "__main__":
    update_extraction_agent()