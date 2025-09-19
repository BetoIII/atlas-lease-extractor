from llama_cloud_services import LlamaExtract
from llama_cloud.types import ExtractMode
from typing import Optional
from key_terms_llamaextract_schema import KeyTermsLlamaExtractSchema
from llama_cloud_manager import LlamaCloudManager
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Note: Phoenix tracing is initialized in flask_server.py when running as API
# This ensures all LlamaIndex operations are automatically traced without duplicate setup

llama_extract = LlamaExtract(api_key=os.getenv('LLAMA_CLOUD_API_KEY'))

class KeyTermsExtractorLlamaExtract:
    def __init__(self):
        # Use centralized agent name to avoid duplication/drift
        self.agent = llama_extract.get_agent(LlamaCloudManager.KEY_TERMS_AGENT_NAME)

    def process_document(self, file_path: str, extraction_mode: Optional[str] = None):
        """Process a single document and return extracted data, updating agent config/schema first."""
        # Update the agent's schema to KeyTermsLlamaExtractSchema
        self.agent.data_schema = KeyTermsLlamaExtractSchema.model_json_schema()
        # Set extraction mode and other config overrides
        self.agent.extraction_mode = extraction_mode or ExtractMode.MULTIMODAL
        self.agent.use_reasoning = True
        self.agent.cite_sources = True
        # Save the agent config before extraction
        self.agent.save()
        # Run extraction
        result = self.agent.extract(file_path)
        return result

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python key_terms_extractor_llamaextract.py <path_to_pdf>")
        sys.exit(1)

    pdf_path = sys.argv[1]

    extractor = KeyTermsExtractorLlamaExtract()
    try:
        result = extractor.process_document(pdf_path)
        print("Extraction Result:")
        print(result)
    except Exception as e:
        print(f"An error occurred during extraction: {e}")