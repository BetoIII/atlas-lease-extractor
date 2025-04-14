from llama_cloud_services import LlamaExtract
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import os
from pathlib import Path
from schema import LeaseExtraction
import config
import csv
from datetime import datetime
import json

class LeaseExtractor:
    def __init__(self):
        self.extractor = LlamaExtract(
            api_key=config.get_api_key()
        )
        self.agent = None

    def initialize_agent(self):
        """Initialize the extraction agent by name"""
        try:
            self.agent = self.extractor.get_agent(name="lease-extractor")
            print(f"Successfully connected to lease extraction agent: {self.agent.id}")
        except Exception as e:
            print(f"Error connecting to agent: {str(e)}")
            raise
        return self.agent

    def process_document(self, file_path: str):
        """Process a single document and return extracted data"""
        if not self.agent:
            raise ValueError("Agent not initialized. Call initialize_agent first.")
        
        result = self.agent.extract(file_path)
        
        # Transform the flat data structure into our nested schema
        if isinstance(result.data, dict):
            # Extract data from general_metadata or use empty dict if not present
            metadata = result.data.get('general_metadata', {})
            
            # Construct the nested structure
            transformed_data = {
                'basic_info': {
                    'tenant': metadata.get('tenant', ''),
                    'landlord': metadata.get('landlord', ''),
                    'property_manager': metadata.get('property_manager', '')
                },
                'property_details': {
                    'property_address': metadata.get('property_address', ''),
                    'property_sqft': metadata.get('property_sqft', ''),
                    'leased_sqft': metadata.get('leased_sqft', '')
                },
                'lease_dates': {
                    'lease_date': metadata.get('lease_date', ''),
                    'rental_commencement_date': metadata.get('rental_commencement_date', ''),
                    'lease_expiration_date': metadata.get('lease_expiration_date', '')
                },
                'financial_terms': {
                    'base_rent': metadata.get('base_rent', {}),
                    'security_deposit': metadata.get('security_deposit', ''),
                    'rent_escalations': metadata.get('rent_escalations', [])
                },
                'additional_terms': {
                    'lease_type': metadata.get('lease_type', None),
                    'permitted_use': metadata.get('permitted_use', None),
                    'renewal_options': metadata.get('renewal_options', None)
                }
            }
            
            return LeaseExtraction(**transformed_data)
            
        return result.data

    def process_batch(self, file_paths: List[str]):
        """Process multiple documents asynchronously"""
        if not self.agent:
            raise ValueError("Agent not initialized. Call initialize_agent first.")
        
        jobs = self.agent.queue_extraction(file_paths)
        results = []
        
        for job in jobs:
            status = self.agent.get_extraction_job(job.id).status
            if status == "completed":
                result = self.agent.get_extraction_run_for_job(job.id)
                results.append(result)
        
        return results

def format_value(value) -> str:
    """Format a value for CSV output"""
    if value is None:
        return ''
    if isinstance(value, (dict, list)):
        return json.dumps(value)
    return str(value)

def save_to_csv(results, output_dir):
    """Save extraction results to a CSV file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = output_dir / f"lease_extraction_results_{timestamp}.csv"
    
    # Define CSV headers based on the nested schema structure
    headers = [
        'File Name',
        # Basic Information
        'Tenant',
        'Landlord',
        'Property Manager',
        # Property Details
        'Property Address',
        'Property SqFt',
        'Leased SqFt',
        # Key Dates
        'Lease Date',
        'Rental Commencement Date',
        'Lease Expiration Date',
        # Financial Terms
        'Base Rent',
        'Security Deposit',
        'Rent Escalations',
        # Additional Terms
        'Lease Type',
        'Permitted Use',
        'Renewal Options',
        # Status
        'Status'
    ]
    
    with open(output_file, 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=headers)
        writer.writeheader()
        
        for result in results:
            try:
                data = result['data']
                if data:
                    writer.writerow({
                        'File Name': result['file_name'],
                        # Basic Information
                        'Tenant': format_value(data.basic_info.tenant),
                        'Landlord': format_value(data.basic_info.landlord),
                        'Property Manager': format_value(data.basic_info.property_manager),
                        # Property Details
                        'Property Address': format_value(data.property_details.property_address),
                        'Property SqFt': format_value(data.property_details.property_sqft),
                        'Leased SqFt': format_value(data.property_details.leased_sqft),
                        # Key Dates
                        'Lease Date': format_value(data.lease_dates.lease_date),
                        'Rental Commencement Date': format_value(data.lease_dates.rental_commencement_date),
                        'Lease Expiration Date': format_value(data.lease_dates.lease_expiration_date),
                        # Financial Terms
                        'Base Rent': format_value(data.financial_terms.base_rent),
                        'Security Deposit': format_value(data.financial_terms.security_deposit),
                        'Rent Escalations': format_value(data.financial_terms.rent_escalations),
                        # Additional Terms
                        'Lease Type': format_value(data.additional_terms.lease_type),
                        'Permitted Use': format_value(data.additional_terms.permitted_use),
                        'Renewal Options': format_value(data.additional_terms.renewal_options),
                        'Status': result['status']
                    })
                else:
                    empty_row = {header: '' for header in headers}
                    empty_row.update({
                        'File Name': result['file_name'],
                        'Status': result['status']
                    })
                    writer.writerow(empty_row)
            except Exception as e:
                print(f"Error writing row for {result['file_name']}: {str(e)}")
    
    print(f"\nResults saved to: {output_file}")
    return output_file

def main():
    try:
        # Initialize the extractor
        extractor = LeaseExtractor()
        
        # Initialize agent with schema
        agent = extractor.initialize_agent()
        
        # Create extraction_results directory if it doesn't exist
        results_dir = Path("extraction_results")
        results_dir.mkdir(exist_ok=True)
        
        # Process documents from the data directory
        data_dir = Path("data")
        lease_files = list(data_dir.glob("*.pdf"))  # Adjust pattern based on your file types
        
        if not lease_files:
            print("No lease files found in the data directory.")
            return
        
        print(f"Found {len(lease_files)} lease files to process.")
        
        # Store results for CSV export
        extraction_results = []
        
        # Process each lease file
        for lease_file in lease_files:
            print(f"\nProcessing {lease_file.name}...")
            try:
                result = extractor.process_document(str(lease_file))
                print("Successfully extracted lease data:")
                print("\nBasic Information:")
                print(f"Tenant: {result.basic_info.tenant}")
                print(f"Landlord: {result.basic_info.landlord}")
                print(f"Property Manager: {result.basic_info.property_manager}")
                
                print("\nProperty Details:")
                print(f"Address: {result.property_details.property_address}")
                print(f"Property SqFt: {result.property_details.property_sqft}")
                print(f"Leased SqFt: {result.property_details.leased_sqft}")
                
                print("\nKey Dates:")
                print(f"Lease Date: {result.lease_dates.lease_date}")
                print(f"Commencement: {result.lease_dates.rental_commencement_date}")
                print(f"Expiration: {result.lease_dates.lease_expiration_date}")
                
                # Add to results for CSV export
                extraction_results.append({
                    'file_name': lease_file.name,
                    'data': result,
                    'status': 'success'
                })
            except Exception as e:
                print(f"Error processing {lease_file.name}: {str(e)}")
                extraction_results.append({
                    'file_name': lease_file.name,
                    'data': None,
                    'status': f'error: {str(e)}'
                })
        
        # Save results to CSV
        if extraction_results:
            output_file = save_to_csv(extraction_results, results_dir)
            
    except ValueError as e:
        print(f"Configuration error: {str(e)}")
        print("Please ensure you have set up your .env file with the required API key.")

if __name__ == "__main__":
    main() 