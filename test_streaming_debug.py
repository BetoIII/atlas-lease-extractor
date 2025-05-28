#!/usr/bin/env python3
"""
Debug script to test the streaming lease flags extraction.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_basic_imports():
    """Test basic imports."""
    try:
        from lease_flags_output_parser import LeaseFlagsExtractor
        from lease_flags_schema import LeaseFlagsSchema
        print("✅ Basic imports successful")
        return True
    except Exception as e:
        print(f"❌ Import error: {e}")
        return False

def test_extractor_initialization():
    """Test extractor initialization."""
    try:
        from lease_flags_output_parser import LeaseFlagsExtractor
        extractor = LeaseFlagsExtractor()
        print("✅ Extractor initialization successful")
        print(f"   - LLM: {type(extractor.llm)}")
        print(f"   - Structured LLM: {type(extractor.structured_llm)}")
        print(f"   - Index: {type(extractor.index)}")
        return extractor
    except Exception as e:
        print(f"❌ Extractor initialization error: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_simple_structured_llm():
    """Test the structured LLM directly."""
    try:
        from llama_index.llms.openai import OpenAI
        from lease_flags_schema import LeaseFlagsSchema
        from pydantic import BaseModel, Field
        from typing import List
        
        # Test with a simpler schema first
        class SimpleLeaseFlag(BaseModel):
            title: str = Field(description="The title of the lease flag")
            description: str = Field(description="Description of the lease flag")
        
        class SimpleLeaseFlagsSchema(BaseModel):
            lease_flags: List[SimpleLeaseFlag] = Field(description="List of lease flags")
        
        llm = OpenAI(model="gpt-4o", temperature=0.1)
        
        print("🔄 Testing with simple schema...")
        simple_structured_llm = llm.as_structured_llm(output_cls=SimpleLeaseFlagsSchema)
        
        print("✅ Simple structured LLM creation successful")
        
        # Test a simple query
        from llama_index.core.llms import ChatMessage
        
        simple_query = """
        Extract lease flags from this sample text:
        "The tenant must pay all operating expenses without any cap. Early termination is allowed with 30 days notice."
        
        Return exactly 2 lease flags with titles and descriptions.
        """
        
        input_msg = ChatMessage.from_str(simple_query)
        
        print("🔄 Testing simple structured response...")
        response = simple_structured_llm.chat([input_msg])
        
        print(f"✅ Simple response successful: {type(response)}")
        if hasattr(response, 'raw'):
            print(f"   - Raw type: {type(response.raw)}")
            if hasattr(response.raw, 'model_dump'):
                print(f"   - Model dump: {response.raw.model_dump()}")
            elif hasattr(response.raw, 'dict'):
                print(f"   - Dict: {response.raw.dict()}")
            else:
                print(f"   - Raw value: {response.raw}")
        
        # Now test with the original schema
        print("\n🔄 Testing with original LeaseFlagsSchema...")
        structured_llm = llm.as_structured_llm(output_cls=LeaseFlagsSchema)
        
        # Use a more explicit prompt
        explicit_query = """
        You must return a JSON object with the following structure:
        {
            "lease_flags": [
                {
                    "category": "Financial Exposure & Cost Uncertainty",
                    "title": "Uncapped or Vague Operating Expenses", 
                    "description": "Clauses that lack clear definitions or caps on expenses like maintenance charges, property taxes, or insurance requirements."
                }
            ]
        }
        
        Extract lease flags from this text: "The tenant must pay all operating expenses without any cap. Early termination is allowed with 30 days notice."
        """
        
        input_msg2 = ChatMessage.from_str(explicit_query)
        response2 = structured_llm.chat([input_msg2])
        
        print(f"✅ Original schema response successful: {type(response2)}")
        if hasattr(response2, 'raw'):
            print(f"   - Raw type: {type(response2.raw)}")
            if hasattr(response2.raw, 'model_dump'):
                print(f"   - Model dump: {response2.raw.model_dump()}")
            elif hasattr(response2.raw, 'dict'):
                print(f"   - Dict: {response2.raw.dict()}")
            else:
                print(f"   - Raw value: {response2.raw}")
        
        return structured_llm
        
    except Exception as e:
        print(f"❌ Structured LLM test error: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_streaming():
    """Test streaming functionality."""
    try:
        structured_llm = test_simple_structured_llm()
        if not structured_llm:
            return False
            
        from llama_index.core.llms import ChatMessage
        
        simple_query = """
        Extract lease flags from this sample text:
        "The tenant must pay all operating expenses without any cap. Early termination is allowed with 30 days notice."
        """
        
        input_msg = ChatMessage.from_str(simple_query)
        
        print("🔄 Testing streaming response...")
        stream_response = structured_llm.stream_chat([input_msg])
        
        for i, partial_output in enumerate(stream_response):
            print(f"   Stream {i}: {type(partial_output)}")
            if hasattr(partial_output, 'raw'):
                print(f"     - Raw type: {type(partial_output.raw)}")
                print(f"     - Raw value: {partial_output.raw}")
            else:
                print(f"     - No raw attribute: {partial_output}")
            
            if i >= 2:  # Limit output
                break
                
        print("✅ Streaming test completed")
        return True
        
    except Exception as e:
        print(f"❌ Streaming test error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("🚀 Debug Testing Streaming Lease Flags Extraction")
    print("=" * 60)
    
    # Test 1: Basic imports
    if not test_basic_imports():
        return
    
    # Test 2: Extractor initialization
    extractor = test_extractor_initialization()
    if not extractor:
        return
    
    # Test 3: Simple structured LLM
    if not test_simple_structured_llm():
        return
    
    # Test 4: Streaming
    if not test_streaming():
        return
    
    print("\n✅ All tests passed!")

if __name__ == "__main__":
    main() 