from pydantic import BaseModel, Field
from typing import Optional

class KeyTermsLlamaExtractSchema(BaseModel):
    """Schema for key terms extraction using LlamaExtract agent"""
    lease_summary: str = Field(description="Brief summary of the lease agreement")
    property_address: str = Field(description="Property address")
    landlord: str = Field(description="Landlord name")
    tenant: str = Field(description="Tenant name")
    lease_term: str = Field(description="Lease term dates")
    rent_amount: str = Field(description="Rent amount and schedule")
    security_deposit: str = Field(description="Security deposit amount")
    renewal_options: str = Field(description="Renewal options if any")

    class Config:
        from_attributes = True
        populate_by_name = True