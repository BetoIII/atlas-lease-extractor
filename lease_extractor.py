from llama_cloud_services import LlamaExtract
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import os
from pathlib import Path
from schema import LeaseExtraction
import config
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
            self.agent = self.extractor.get_agent(
                name="lease-extractor",
            )
            print(f"Successfully connected to lease extraction agent: {self.agent.id}")
            print("Using FAST extraction mode for optimized performance")
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
    """Format a value for output"""
    if value is None:
        return ''
    if isinstance(value, (dict, list)):
        return json.dumps(value)
    return str(value)

def save_to_json(results, output_dir):
    """Save extraction results to a JSON file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = output_dir / f"lease_extraction_results_{timestamp}.json"
    
    # Convert results to serializable format
    serializable_results = []
    for result in results:
        try:
            data = result['data']
            if data:
                serializable_results.append({
                    'file_name': result['file_name'],
                    'data': {
                        'basic_info': {
                            'tenant': data.basic_info.tenant,
                            'landlord': data.basic_info.landlord,
                            'property_manager': data.basic_info.property_manager
                        },
                        'property_details': {
                            'property_address': data.property_details.property_address,
                            'property_sqft': data.property_details.property_sqft,
                            'leased_sqft': data.property_details.leased_sqft
                        },
                        'lease_dates': {
                            'lease_date': data.lease_dates.lease_date,
                            'rental_commencement_date': data.lease_dates.rental_commencement_date,
                            'lease_expiration_date': data.lease_dates.lease_expiration_date
                        },
                        'financial_terms': {
                            'base_rent': data.financial_terms.base_rent,
                            'security_deposit': data.financial_terms.security_deposit,
                            'rent_escalations': data.financial_terms.rent_escalations
                        },
                        'additional_terms': {
                            'lease_type': data.additional_terms.lease_type,
                            'permitted_use': data.additional_terms.permitted_use,
                            'renewal_options': data.additional_terms.renewal_options
                        }
                    },
                    'status': result['status']
                })
            else:
                serializable_results.append({
                    'file_name': result['file_name'],
                    'data': None,
                    'status': result['status']
                })
        except Exception as e:
            print(f"Error processing result for {result['file_name']}: {str(e)}")
            
    # Write to JSON file
    with open(output_file, 'w') as jsonfile:
        json.dump(serializable_results, jsonfile, indent=2)
    
    print(f"\nResults saved to: {output_file}")
    return output_file

def main(file_path: str = None):
    """
    Process a single lease document and return the extraction results.
    Args:
        file_path: Path to the lease document to process
    Returns:
        dict: Extraction results including file name, extracted data, and status
    """
    try:
        if not file_path:
            raise ValueError("No file path provided")
            
        # Initialize the extractor
        extractor = LeaseExtractor()
        
        # Initialize agent with schema
        agent = extractor.initialize_agent()
        
        # Create extraction_results directory if it doesn't exist
        results_dir = Path("extraction_results")
        results_dir.mkdir(exist_ok=True)
        
        print(f"\nProcessing {Path(file_path).name}...")
        try:
            result = extractor.process_document(file_path)
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
            
            # Convert Pydantic model to dictionary for JSON serialization
            extraction_result = {
                'file_name': Path(file_path).name,
                'data': {
                    'basic_info': {
                        'tenant': result.basic_info.tenant,
                        'landlord': result.basic_info.landlord,
                        'property_manager': result.basic_info.property_manager
                    },
                    'property_details': {
                        'property_address': result.property_details.property_address,
                        'property_sqft': result.property_details.property_sqft,
                        'leased_sqft': result.property_details.leased_sqft
                    },
                    'lease_dates': {
                        'lease_date': result.lease_dates.lease_date,
                        'rental_commencement_date': result.lease_dates.rental_commencement_date,
                        'lease_expiration_date': result.lease_dates.lease_expiration_date
                    },
                    'financial_terms': {
                        'base_rent': result.financial_terms.base_rent,
                        'security_deposit': result.financial_terms.security_deposit,
                        'rent_escalations': result.financial_terms.rent_escalations
                    },
                    'additional_terms': {
                        'lease_type': result.additional_terms.lease_type,
                        'permitted_use': result.additional_terms.permitted_use,
                        'renewal_options': result.additional_terms.renewal_options
                    }
                },
                'status': 'success'
            }
        except Exception as e:
            print(f"Error processing {Path(file_path).name}: {str(e)}")
            extraction_result = {
                'file_name': Path(file_path).name,
                'data': None,
                'status': f'error: {str(e)}'
            }
        
        # Save result to JSON
        output_file = save_to_json([extraction_result], results_dir)
        return extraction_result
            
    except ValueError as e:
        print(f"Configuration error: {str(e)}")
        print("Please ensure you have set up your .env file with the required API key.")
        return {
            'file_name': Path(file_path).name if file_path else None,
            'data': None,
            'status': f'error: {str(e)}'
        }

if __name__ == "__main__":
    # Example usage:
    # python lease_extractor.py /path/to/your/lease.pdf
    import sys
    file_path = sys.argv[1] if len(sys.argv) > 1 else None
    main(file_path) 