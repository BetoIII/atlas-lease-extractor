from llama_cloud_services import LlamaExtract
from pydantic import BaseModel, Field
import config
from llama_cloud.core.api_error import ApiError
import requests
import json

class LeaseSummary(BaseModel):
    property_address: str = Field(description="Complete street address of the leased property including street number, city, state and zip code")
    leased_sqft: str = Field(description="Actual square footage being leased by the tenant")
    lease_type: str = Field(description="Type of lease e.g., 'Triple Net (NNN)', 'Full Service Gross', 'Modified Gross'")
    lease_expiration_date: str = Field(description="Date when the lease agreement terminates (format: YYYY-MM-DD)")
    base_rent: str = Field(description="Base rent amount, including monthly and annual values")
    security_deposit: str = Field(description="Amount of security deposit required from tenant")
    landlord: str = Field(description="Full legal name of the landlord/lessor who owns the property")
    tenant: str = Field(description="Full legal name of the tenant/lessee who is renting the property")
    property_manager: str = Field(description="Property manager responsible for managing the property and interacting with the tenant")

def get_extraction_config():
    return {
        "data_schema": LeaseSummary.model_json_schema(),
        "config": {
            "extraction_target": "PER_DOC",
            "extraction_mode": "FAST",
            "system_prompt": "You are a senior Commercial Real Estate Analyst and you help commercial real estate professionals abstract (i.e., extract) critical data from pdf documents into structured data that will be used for critical analaysis, deal-making, and financial reporting for financial reporting and compliance."
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