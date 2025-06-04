from llama_cloud_services import LlamaExtract
from llama_cloud.types import ExtractMode
from typing import Optional
from .risk_flags_schema import RiskFlagsSchema

llama_extract = LlamaExtract()

class RiskFlagsExtractor:
    AGENT_ID = "694ad535-cd75-42f3-a519-afec99e33cd5"
    AGENT_NAME = "atlas-risk-flags"
    
    def __init__(self):
        self.agent = llama_extract.get_agent(self.AGENT_NAME)
    
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

    def extract_risk_flags_streaming(self):
        """Stream risk flags extraction results."""
        # Implementation here
        pass

def stream_risk_flags_extraction(filename: str = None):
    """Stream risk flags extraction results."""
    # Implementation here
    pass

def extract_risk_flags_from_document(filename: str = None):
    """Extract risk flags from a document."""
    # Implementation here
    pass

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