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
from llama_cloud_services import LlamaParse

# Embedding config
embedding_config = {
    'type': 'OPENAI_EMBEDDING',
    'component': {
        'api_key': os.getenv("OPENAI_API_KEY"), # editable
        'model_name': 'text-embedding-3-small' # editable
    }
}

# Transformation auto config
transform_config = {
    'mode': 'auto',
    'config': {
        'chunk_size': 1024, # editable
        'chunk_overlap': 20 # editable
    }
}

# Configure settings with streaming enabled
Settings.llm = OpenAI(model="gpt-3.5-turbo", streaming=True)
Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")

def extract_lease_flags(file_path: str) -> dict:
    """Analyze this lease document and identify specific lease flags that that may appear in a lease agreement."""
    print(f"Loading document: {file_path}")
    
    # Use LlamaParse to parse the document
    parser = LlamaParse(
        api_key=os.getenv("LLAMA_CLOUD_API_KEY"),  # or set your API key directly
        verbose=True,
        language="en"
    )
    result = parser.parse(file_path)
    # Get the parsed text documents (you can also use get_markdown_documents)
    documents = result.get_text_documents(split_by_page=False)
    print(f"Loaded {len(documents)} document(s) via LlamaParse")
    
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
    You are a senior real estate analyst that is helpful to commercial real estate operators and investors. Analyze this lease document and identify specific lease flags that match these categories:

    {lease_flag_types}

    For each flag you identify, provide:
    1. The exact category it belongs to
    2. The specific title from the list above
    3. A detailed description of what you found in the document
    4. The confidence score of the lease flag

    Only include flags that you can actually identify in the document with specific evidence. Mark each flag you identify with a header with a brief description of the flag. 
    For example, if you identify an early termination clause, mark it with a header "Early Termination Clause" and a brief description of the clause.
    """
    
    print("Querying the document for lease flags...")

    # Handle streaming response
    streaming_response = query_engine.query(prompt_str)
    
    # Collect the full response text while showing streaming progress
    full_response_text = ""
    for text in streaming_response.response_gen:
        full_response_text += text
    
    # Parse the response into LeaseFlagsSchema
    try:
        # Split the response into sections based on headers
        sections = full_response_text.split("\n\n")
        lease_flags = []
        
        for section in sections:
            if not section.strip():
                continue
                
            lines = section.strip().split("\n")
            if len(lines) >= 2:
                title = lines[0].strip()
                description = "\n".join(lines[1:]).strip()
                
                # Create appropriate flag type based on title
                flag_type = None
                for flag_class in [
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
                ]:
                    if flag_class.__name__.lower() in title.lower():
                        flag_type = flag_class
                        break
                
                if flag_type:
                    lease_flags.append(flag_type(
                        title=title,
                        description=description
                    ))
        
        # Convert to JSON and return
        return LeaseFlagsSchema(lease_flags=lease_flags).model_dump()
    except Exception as e:
        print(f"Error parsing response: {e}")
        return {"lease_flags": []}

def main():
    """Main function to extract lease flags from a document."""
    parser = argparse.ArgumentParser(description='Extract lease flags from a lease document')
    parser.add_argument('file_path', nargs='?', help='Path to the lease document')
    
    args = parser.parse_args()
    
    # Determine file path
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
        
        if result["lease_flags"]:
            for i, flag in enumerate(result["lease_flags"], 1):
                print(f"\n{i}. {flag['title']}")
                print(f"   Category: {flag['type']}")
                print(f"   Description: {flag['description']}")
                print(f"   Confidence: {flag['confidence']}")
        else:
            print("No specific lease flags were identified in this document.")
            
        print("="*60)
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()