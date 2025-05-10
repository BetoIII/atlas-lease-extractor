from llama_cloud_services import LlamaExtract
from typing import Literal, Optional, List
from pydantic import BaseModel, Field
import config
from llama_cloud.core.api_error import ApiError

class LeaseSummaryExtractor:
    def __init__(self):
        self.extractor = LlamaExtract(
            api_key=config.get_api_key()
        )
        self.agent = None

    def initialize_agent(self):
        """Initialize the extraction agent by name"""
        try:
            self.agent = self.extractor.get_agent(
                name="atlas-summary-extractor",
            )
            print(f"Successfully connected to lease extraction agent: {self.agent.id}")
                
        except Exception as e:
            print(f"Error connecting to agent: {str(e)}")
            raise
        return self.agent

    def process_document(self, file_path: str):
        """Process a single document and return extracted data"""
        if self.agent is None:
            self.initialize_agent()
        result = self.agent.extract(file_path)
        return result

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python lease_summary_extractor.py <path_to_pdf>")
        sys.exit(1)

    pdf_path = sys.argv[1]

    extractor = LeaseSummaryExtractor()
    try:
        result = extractor.process_document(pdf_path)
        print("Extraction Result:")
        print(result)
    except Exception as e:
        print(f"An error occurred during extraction: {e}")
    