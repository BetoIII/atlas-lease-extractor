import os
import json
import sys
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

# Import from absolute path
try:
    from risk_flags.risk_flags_schema import (
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
except ImportError:
    # Try relative import if running from within risk_flags directory
    try:
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
    except ImportError:
        print("Error: Unable to import risk_flags_schema. Make sure you're running from the correct directory.")
        sys.exit(1)

try:
    from llama_cloud_services import LlamaParse
    LLAMA_PARSE_AVAILABLE = True
except ImportError:
    print("Warning: LlamaParse not available. Will use SimpleDirectoryReader instead.")
    LLAMA_PARSE_AVAILABLE = False

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

# Check for required API keys
if not os.getenv("OPENAI_API_KEY"):
    print("Warning: OPENAI_API_KEY not set. This will cause errors during processing.")

# Configure settings with streaming enabled
try:
    Settings.llm = OpenAI(model="gpt-3.5-turbo", streaming=True)
    Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")
except Exception as e:
    print(f"Warning: Failed to configure OpenAI settings: {e}")

def extract_risk_flags(file_path: str) -> dict:
    """Extract risk flags from a document using LlamaIndex."""
    print(f"Loading document: {file_path}")
    
    # Try to use LlamaParse if available and API key is set
    if LLAMA_PARSE_AVAILABLE and os.getenv("LLAMA_CLOUD_API_KEY"):
        try:
            parser = LlamaParse(
                api_key=os.getenv("LLAMA_CLOUD_API_KEY"),
                verbose=True,
                language="en"
            )
            result = parser.parse(file_path)
            documents = result.get_text_documents(split_by_page=False)
            print(f"Loaded {len(documents)} document(s) via LlamaParse")
        except Exception as e:
            print(f"LlamaParse failed, falling back to SimpleDirectoryReader: {e}")
            documents = SimpleDirectoryReader(input_files=[file_path]).load_data()
            print(f"Loaded {len(documents)} document(s) via SimpleDirectoryReader")
    else:
        # Fallback to SimpleDirectoryReader
        documents = SimpleDirectoryReader(input_files=[file_path]).load_data()
        print(f"Loaded {len(documents)} document(s) via SimpleDirectoryReader")
    
    # Create or load vector index
    storage_dir = f"storage_{hash(file_path) % 10000}"  # Create unique storage per file
    if not os.path.exists(storage_dir):
        print("Creating new vector index...")
        try:
            index = VectorStoreIndex.from_documents(documents)
            index.set_index_id("vector_index")
            index.storage_context.persist(f"./{storage_dir}")
        except Exception as e:
            print(f"Error creating vector index: {e}")
            return {"risk_flags": []}
    else:
        print("Loading existing vector index...")
        try:
            storage_context = StorageContext.from_defaults(persist_dir=storage_dir)
            index = load_index_from_storage(storage_context, index_id="vector_index")
        except Exception as e:
            print(f"Error loading vector index: {e}")
            return {"risk_flags": []}
    
    # Create query engine with streaming enabled
    try:
        query_engine = index.as_query_engine(streaming=True)
    except Exception as e:
        print(f"Error creating query engine: {e}")
        return {"risk_flags": []}
    
    # Get all lease flag types for the prompt
    try:
        risk_categories = "\n".join([f"- {flag_type.value}" for flag_type in LeaseFlagType])
    except Exception as e:
        print(f"Error getting risk categories: {e}")
        risk_categories = "- Early Termination Clauses\n- Insurance Requirements\n- Maintenance Obligations"
    
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
    try:
        streaming_response = query_engine.query(prompt_str)
        
        # Collect the full response text while showing streaming progress
        full_response_text = ""
        print("Streaming response:")
        for text in streaming_response.response_gen:
            print(text, end="", flush=True)  # Show streaming text
            full_response_text += text
        print()  # New line after streaming
        
    except Exception as e:
        print(f"Error during query: {e}")
        return {"risk_flags": []}
    
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
        
        print(f"\nLEASE FLAGS EXTRACTED: Found {len(risk_flags)} risk flags")
        
        # Convert to JSON and return
        return RiskFlagsSchema(risk_flags=risk_flags).model_dump()
    except Exception as e:
        print(f"Error parsing response: {e}")
        # Fallback: return the raw response as a single flag
        try:
            fallback_flag = RiskFlag(
                category="General Analysis",
                title="Document Analysis",
                description=full_response_text[:500] + "..." if len(full_response_text) > 500 else full_response_text
            )
            return RiskFlagsSchema(risk_flags=[fallback_flag]).model_dump()
        except Exception as e2:
            print(f"Error creating fallback response: {e2}")
            return {"risk_flags": []}

def main():
    """Main function to run the risk flags extraction pipeline."""
    if len(sys.argv) != 2:
        print("Usage: python risk_flags_query_pipeline.py <path_to_document>")
        sys.exit(1)

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        sys.exit(1)

    # Check for required API keys
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY environment variable is required")
        sys.exit(1)

    try:
        print(f"Processing file: {file_path}")
        print("=" * 50)
        
        result = extract_risk_flags(file_path)
        
        # Save results to JSON file
        output_file = f"lease_flags_{os.path.basename(file_path)}.json"
        with open(output_file, "w") as f:
            json.dump(result, f, indent=2)
        print(f"\nResults saved to: {output_file}")
        
        # Print results
        if result.get("risk_flags") and len(result["risk_flags"]) > 0:
            print("\nExtracted Risk Flags:")
            print("=" * 50)
            for i, flag in enumerate(result["risk_flags"], 1):
                print(f"\n{i}. {flag.get('title', 'Unknown Title')}")
                print(f"   Category: {flag.get('category', 'Unknown Category')}")
                print(f"   Description: {flag.get('description', 'No description')}")
                print("-" * 50)
        else:
            print("\nNo risk flags found in the document.")
            
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()