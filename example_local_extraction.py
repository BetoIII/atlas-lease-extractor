#!/usr/bin/env python3
"""
Example script demonstrating local RAG-based lease extraction
This shows how to extract lease data programmatically without using the web frontend
"""

import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import the local extractors
from key_terms_extractor import KeyTermsExtractor
from lease_summary_extractor import LeaseSummaryExtractor
from risk_flags.risk_flags_extractor import RiskFlagsExtractor

def extract_with_local_rag(pdf_path: str):
    """
    Method 1: Local RAG Extraction with KeyTermsExtractor

    This uses:
    - LlamaCloud for document indexing (caching)
    - Local RAG retrieval for context
    - OpenAI GPT-4o-mini for structured extraction
    - Streaming output for real-time progress
    """
    print("=" * 60)
    print("METHOD 1: Local RAG Extraction (KeyTermsExtractor)")
    print("=" * 60)

    # Initialize the extractor
    extractor = KeyTermsExtractor()

    # Process the document (with streaming output)
    result = extractor.process_document(pdf_path)

    # Check results
    if result.get("status") == "success":
        data = result.get("data", {})
        print("\n✅ Extraction successful!")
        print(f"\nExtracted Data:")
        print(json.dumps(data, indent=2))

        # Access specific fields
        property_info = data.get("property_info", {})
        tenant_info = data.get("tenant_info", {})
        lease_dates = data.get("lease_dates", {})
        financial_terms = data.get("financial_terms", {})

        print(f"\n📊 Quick Summary:")
        print(f"   Property: {property_info.get('property_address', 'N/A')}")
        print(f"   Landlord: {property_info.get('landlord_name', 'N/A')}")
        print(f"   Tenant: {tenant_info.get('tenant', 'N/A')}")
        print(f"   Suite: {tenant_info.get('suite_number', 'N/A')}")
        print(f"   Sq Ft: {tenant_info.get('leased_sqft', 'N/A')}")
        print(f"   Base Rent: ${financial_terms.get('base_rent', 'N/A')}/month")
        print(f"   Security Deposit: ${financial_terms.get('security_deposit', 'N/A')}")
        print(f"   Lease Start: {lease_dates.get('lease_commencement_date', 'N/A')}")
        print(f"   Lease End: {lease_dates.get('lease_expiration_date', 'N/A')}")
        print(f"   Lease Term: {lease_dates.get('lease_term', 'N/A')}")

        return result
    else:
        print(f"\n❌ Extraction failed: {result.get('message', 'Unknown error')}")
        return None

def extract_with_llama_extract(pdf_path: str):
    """
    Method 2: LlamaExtract Cloud Agent (LeaseSummaryExtractor)

    This uses:
    - LlamaCloud managed extraction agents
    - Pre-configured agents with schemas
    - Multimodal extraction mode
    """
    print("\n" + "=" * 60)
    print("METHOD 2: LlamaExtract Cloud Agent (LeaseSummaryExtractor)")
    print("=" * 60)

    # Initialize the extractor
    extractor = LeaseSummaryExtractor()

    # Process the document
    result = extractor.process_document(pdf_path)

    print("\n✅ Extraction complete!")
    print(f"\nExtracted Data:")
    print(result.model_dump_json(indent=2))

    return result

def extract_risk_flags(pdf_path: str):
    """
    Method 3: Risk Flags Extraction (RiskFlagsExtractor)

    This extracts risk flags and compliance issues from lease documents.
    """
    print("\n" + "=" * 60)
    print("METHOD 3: Risk Flags Extraction (RiskFlagsExtractor)")
    print("=" * 60)

    # Initialize the extractor
    extractor = RiskFlagsExtractor()

    # Process the document
    result = extractor.process_document(pdf_path)

    print("\n✅ Risk flags extracted!")
    print(f"\nRisk Flags Data:")
    print(result.model_dump_json(indent=2))

    # Show summary of risk flags
    if hasattr(result, 'data') and result.data:
        risk_flags = result.data.get('risk_flags', [])
        print(f"\n🚩 Found {len(risk_flags)} risk flags:")
        for i, flag in enumerate(risk_flags, 1):
            print(f"   {i}. {flag.get('title', 'Unknown')}")
            print(f"      Category: {flag.get('category', 'N/A')}")

    return result

def main():
    """
    Main function demonstrating all extraction methods
    """
    # Check for required environment variables
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ Error: OPENAI_API_KEY environment variable is required")
        print("   Set it in your .env file or export it in your shell")
        sys.exit(1)

    if not os.getenv("LLAMA_CLOUD_API_KEY"):
        print("❌ Error: LLAMA_CLOUD_API_KEY environment variable is required")
        print("   Set it in your .env file or export it in your shell")
        sys.exit(1)

    # Get PDF path from command line or use default
    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
    else:
        # Default test file
        pdf_path = "data/2019-2022-Lease-Agreement-TETCO-Signed-tiny.pdf"

    # Check if file exists
    if not os.path.exists(pdf_path):
        print(f"❌ Error: File not found: {pdf_path}")
        print(f"\nUsage: python {sys.argv[0]} <path_to_pdf>")
        sys.exit(1)

    print(f"📄 Processing: {pdf_path}\n")

    try:
        # Method 1: Local RAG Extraction (Recommended for streaming and control)
        local_result = extract_with_local_rag(pdf_path)

        # Optional: Save results to file
        if local_result:
            output_file = f"extraction_result_{Path(pdf_path).stem}.json"
            with open(output_file, 'w') as f:
                json.dump(local_result, f, indent=2)
            print(f"\n💾 Results saved to: {output_file}")

        # Method 2: LlamaExtract Cloud Agent (Alternative)
        # Uncomment to use:
        # llama_result = extract_with_llama_extract(pdf_path)

        # Method 3: Risk Flags Extraction
        # Uncomment to use:
        # risk_result = extract_risk_flags(pdf_path)

    except KeyboardInterrupt:
        print("\n\n⚠️  Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Fatal error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
