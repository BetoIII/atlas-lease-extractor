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
from .risk_flags_schema import (
    RiskFlagsSchema,
    LeaseFlag,
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
    AssignmentClauses,
    RiskFlag
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

def extract_risk_flags(file_path: str) -> dict:
    """Extract risk flags from a document using LlamaIndex."""
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
    
    # Get all lease flag types for the prompt
    risk_categories = "\n".join([f"- {flag_type.value}" for flag_type in LeaseFlagType])
    
    # Define the prompt for extracting risk flags according to schema
    prompt_str = f"""
    You are a senior real estate analyst that is helpful to commercial real estate operators and investors. Analyze this lease document and identify specific risk flags that match these categories:

    {risk_categories}

    For each flag you identify, provide:
    1. The exact category it belongs to
    2. The specific title from the list above
    3. A detailed description of what you found in the document
    4. The confidence score of the risk flag

    Only include flags that you can actually identify in the document with specific evidence. Mark each flag you identify with a header with a brief description of the flag. 
    For example, if you identify an early termination clause, mark it with a header "Early Termination Clause" and a brief description of the clause.
    """
    
    print("Querying the document for risk flags...")

    # Handle streaming response
    streaming_response = query_engine.query(prompt_str)
    
    # Collect the full response text while showing streaming progress
    full_response_text = ""
    for text in streaming_response.response_gen:
        full_response_text += text
    
    # Parse the response into RiskFlagsSchema
    try:
        # Split the response into sections based on headers
        sections = full_response_text.split("\n\n")
        risk_flags = []
        
        for section in sections:
            if not section.strip():
                continue
                
            lines = section.strip().split("\n")
            if len(lines) >= 2:
                title = lines[0].strip()
                description = "\n".join(lines[1:]).strip()
                
                # Create a generic RiskFlag since we can't reliably map to specific LeaseFlag subclasses
                risk_flags.append(RiskFlag(
                    category=title.split(":")[0] if ":" in title else title,
                    title=title,
                    description=description
                ))
        
        # Convert to JSON and return
        return RiskFlagsSchema(risk_flags=risk_flags).model_dump()
    except Exception as e:
        print(f"Error parsing response: {e}")
        return {"risk_flags": []}

def main():
    """Main function to run the risk flags extraction pipeline."""
    if len(argparse.sys.argv) != 2:
        print("Usage: python risk_flags_query_pipeline.py <path_to_pdf>")
        argparse.sys.exit(1)

    file_path = argparse.sys.argv[1]
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        argparse.sys.exit(1)

    try:
        result = extract_risk_flags(file_path)
        
        # Save results to JSON file
        output_file = f"risk_flags_{os.path.basename(file_path)}.json"
        with open(output_file, "w") as f:
            json.dump(result, f, indent=2)
        print(f"\nResults saved to: {output_file}")
        
        # Print results
        if result["risk_flags"]:
            print("\nExtracted Risk Flags:")
            print("=" * 50)
            for i, flag in enumerate(result["risk_flags"], 1):
                print(f"\n{i}. {flag['title']}")
                print(f"   Category: {flag['category']}")
                print(f"   Description: {flag['description']}")
                print("-" * 50)
        else:
            print("\nNo risk flags found in the document.")
            
    except Exception as e:
        print(f"Error: {str(e)}")
        argparse.sys.exit(1)

if __name__ == "__main__":
    main()