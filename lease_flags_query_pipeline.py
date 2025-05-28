import os
import json
import argparse
from typing import List
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.core import Settings
from llama_index.core import SimpleDirectoryReader
from llama_index.core import (
    StorageContext,
    VectorStoreIndex,
    load_index_from_storage,
)
from lease_flags_schema import (
    LeaseFlag,
    LeaseFlagsSchema,
    LeaseFlagType,
    EarlyTerminationClause,
    UncappedOperatingExpenses,
    AmbiguousMaintenanceObligations,
    ExcessiveServiceCharges,
    HiddenFees,
    RestrictiveUseClauses,
    DoNotCompeteClauses,
    AmbiguousLanguage,
    LandlordsRightToTerminate,
    TenantInsuranceRequirements,
    IndemnificationClauses,
    UnfavorableRenewalTerms,
    HoldoverPenalties,
    SubleaseRestrictions,
    AssignmentClauses
)

# Configure settings with streaming enabled
Settings.llm = OpenAI(model="gpt-3.5-turbo", streaming=True)
Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")

def extract_lease_flags(file_path: str) -> LeaseFlagsSchema:
    """Extract lease flags from a lease document according to the schema."""
    print(f"Loading document: {file_path}")
    
    # Load the document
    reader = SimpleDirectoryReader(input_files=[file_path])
    documents = reader.load_data()
    print(f"Loaded {len(documents)} document(s)")
    
    # Create or load vector index
    storage_dir = f"storage_{hash(file_path) % 10000}"  # Create unique storage per file
    if not os.path.exists(storage_dir):
        print("Creating new vector index...")
        index = VectorStoreIndex.from_documents(documents)
        index.set_index_id("vector_index")
        index.storage_context.persist(f"./{storage_dir}")
    else:
        print("Loading existing vector index...")
        storage_context = StorageContext.from_defaults(persist_dir=storage_dir)
        index = load_index_from_storage(storage_context, index_id="vector_index")
    
    # Create query engine with streaming enabled
    query_engine = index.as_query_engine(streaming=True)
    
    # Define the prompt for extracting lease flags according to schema
    prompt_str = """
    Analyze this lease document and identify specific lease flags that match these categories and types:

    **Financial Exposure & Cost Uncertainty:**
    - Early Termination Clauses
    - Uncapped or Vague Operating Expenses
    - Ambiguous Maintenance and Upgrade Obligations
    - Excessive Service Charges Without Transparency or Caps
    - Hidden Fees

    **Operational Constraints & Legal Risks:**
    - Restrictive Use Clauses
    - Do Not Compete Clauses
    - Ambiguous or Vague Language
    - Landlord's Right to Terminate

    **Insurance & Liability:**
    - Tenant Insurance Requirements
    - Indemnification Clauses

    **Lease Term & Renewal:**
    - Unfavorable Renewal Terms
    - Holdover Penalties

    **Miscellaneous:**
    - Sublease Restrictions
    - Assignment Clauses

    For each flag you identify, provide:
    1. The exact category it belongs to
    2. The specific title from the list above
    3. A detailed description of what you found in the document

    Only include flags that you can actually identify in the document with specific evidence.
    """
    
    print("Querying the document for lease flags...")
    print("Streaming response:")
    
    # Handle streaming response
    streaming_response = query_engine.query(prompt_str)
    
    # Collect the full response text while showing streaming progress
    full_response_text = ""
    for text in streaming_response.response_gen:
        print(text, end="", flush=True)
        full_response_text += text
    
    print("\n" + "-" * 60)
    
    # Parse the response and create structured output
    lease_flags = parse_response_to_flags(full_response_text)
    
    return LeaseFlagsSchema(lease_flags=lease_flags)

def parse_response_to_flags(response_text: str) -> List[LeaseFlag]:
    """Parse the LLM response into structured lease flags."""
    flags = []
    
    # Use a more direct approach - ask the LLM to structure its response better
    # For now, let's create some example flags based on common lease issues
    
    # Check if the response mentions specific lease flag types and create appropriate schema instances
    flag_mappings = {
        "early termination": EarlyTerminationClause,
        "operating expenses": UncappedOperatingExpenses,
        "maintenance": AmbiguousMaintenanceObligations,
        "service charges": ExcessiveServiceCharges,
        "hidden fees": HiddenFees,
        "use restrictions": RestrictiveUseClauses,
        "compete": DoNotCompeteClauses,
        "ambiguous": AmbiguousLanguage,
        "landlord terminate": LandlordsRightToTerminate,
        "insurance": TenantInsuranceRequirements,
        "indemnification": IndemnificationClauses,
        "renewal": UnfavorableRenewalTerms,
        "holdover": HoldoverPenalties,
        "sublease": SubleaseRestrictions,
        "assignment": AssignmentClauses
    }
    
    response_lower = response_text.lower()
    
    for keyword, flag_class in flag_mappings.items():
        if keyword in response_lower:
            # Extract relevant sentences containing the keyword
            sentences = response_text.split('.')
            relevant_sentences = [s.strip() for s in sentences if keyword.lower() in s.lower()]
            
            if relevant_sentences:
                # Create an instance of the specific flag class
                flag = flag_class()
                flags.append(flag)
    
    # Remove duplicates based on title
    seen_titles = set()
    unique_flags = []
    for flag in flags:
        if flag.title not in seen_titles:
            seen_titles.add(flag.title)
            unique_flags.append(flag)
    
    return unique_flags

def main():
    """Main function to extract lease flags from a document."""
    parser = argparse.ArgumentParser(description='Extract lease flags from a lease document')
    parser.add_argument('file_path', nargs='?', help='Path to the lease document')
    parser.add_argument('--interactive', '-i', action='store_true', 
                       help='Run in interactive mode (prompt for file path)')
    
    args = parser.parse_args()
    
    # Determine file path
    if args.interactive or not args.file_path:
        file_path = input("Enter the path to the lease document: ")
    else:
        file_path = args.file_path
    
    # Expand user path (handles ~ for home directory)
    file_path = os.path.expanduser(file_path)
    
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return
    
    if not os.path.isfile(file_path):
        print(f"Error: Path exists but is not a file: {file_path}")
        return
    
    try:
        result = extract_lease_flags(file_path)
        
        print("\n" + "="*60)
        print("LEASE FLAGS EXTRACTED:")
        print("="*60)
        
        if result.lease_flags:
            for i, flag in enumerate(result.lease_flags, 1):
                print(f"\n{i}. {flag.title}")
                print(f"   Category: {flag.category}")
                print(f"   Description: {flag.description}")
        else:
            print("No specific lease flags were identified in this document.")
            
        print("="*60)
        
        # Also save to JSON file
        output_file = f"lease_flags_{os.path.basename(file_path)}.json"
        with open(output_file, 'w') as f:
            json.dump(result.model_dump(), f, indent=2)
        print(f"\nResults saved to: {output_file}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()