from llama_cloud_services import LlamaExtract
from llama_cloud.types import ExtractMode
from typing import Optional
from lease_flags_schema import LeaseFlagsSchema

llama_extract = LlamaExtract()

class LeaseFlagsExtractor:
    AGENT_ID = "694ad535-cd75-42f3-a519-afec99e33cd5"
    AGENT_NAME = "atlas-lease-flags"
    
    def __init__(self):
        self.agent = llama_extract.get_agent(self.AGENT_NAME)
    
    def process_document(self, file_path: str, extraction_mode: Optional[str] = None):
        """Process a single document and return extracted lease flags, updating agent config/schema first."""
        # Update the agent's schema to LeaseFlagsSchema
        self.agent.data_schema = LeaseFlagsSchema.model_json_schema()
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
        print("Usage: python lease_flags_extractor.py <path_to_pdf>")
        sys.exit(1)

    pdf_path = sys.argv[1]

    extractor = LeaseFlagsExtractor()
    try:
        result = extractor.process_document(pdf_path)
        print("Extraction Result:")
        print(result)
    except Exception as e:
        print(f"An error occurred during extraction: {e}") 