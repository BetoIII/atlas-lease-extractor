from flask import Flask, jsonify
from lease_extractor import LeaseExtractor
from pathlib import Path

app = Flask(__name__)
extractor = LeaseExtractor()

@app.route("/extract", methods=['GET'])
def extract_lease():
    try:
        # Initialize the extractor agent
        extractor.initialize_agent()
        
        # Process documents from the data directory
        data_dir = Path("data")
        lease_files = list(data_dir.glob("*.pdf"))
        
        if not lease_files:
            return jsonify({"error": "No lease files found in the data directory"}), 404
            
        # Process first lease file for now
        lease_file = lease_files[0]
        result = extractor.process_document(str(lease_file))
        
        # Convert Pydantic model to dict for JSON serialization
        response_data = {
            'file_name': lease_file.name,
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
            }
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5601)