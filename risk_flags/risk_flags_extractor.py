from llama_cloud_services import LlamaExtract
from llama_cloud.types import ExtractMode
from typing import Optional
from .risk_flags_schema import RiskFlagsSchema
import os
from dotenv import load_dotenv
from llama_cloud_manager import LlamaCloudManager

# Load environment variables
load_dotenv()

llama_extract = LlamaExtract(api_key=os.getenv('LLAMA_CLOUD_API_KEY'))

class RiskFlagsExtractor:
    def __init__(self):
        # Use centralized agent name to avoid duplication/drift
        self.agent = llama_extract.get_agent(LlamaCloudManager.FLAGS_AGENT_NAME)
    
    def process_document(self, file_path: str, extraction_mode: Optional[str] = None):
        """Process a single document and return extracted risk flags, updating agent config/schema first."""
        # Update the agent's schema to RiskFlagsSchema
        self.agent.data_schema = RiskFlagsSchema.model_json_schema()
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
        print("Usage: python risk_flags_extractor.py <path_to_pdf>")
        sys.exit(1)

    pdf_path = sys.argv[1]

    extractor = RiskFlagsExtractor()
    try:
        result = extractor.process_document(pdf_path)
        print("Extraction Result:")
        print(result.model_dump_json(indent=2))
    except Exception as e:
        print(f"An error occurred during extraction: {e}") 