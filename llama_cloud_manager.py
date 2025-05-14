from llama_index.indices.managed.llama_cloud import LlamaCloudIndex
from llama_cloud_services import LlamaExtract
import os
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv()

class LlamaCloudManager:
    AGENT_ID = "3471b248-2281-4741-91c4-8e0f15328782"
    AGENT_NAME = "atlas-summary-extractor"

    def __init__(self):
        # Initialize LlamaCloud Index for document indexing
        self.index = LlamaCloudIndex(
            name="agreed-urial-2025-04-15",
            project_name="Default",
            organization_id=os.getenv('LLAMA_CLOUD_ORG_ID'),
            api_key=os.getenv('LLAMA_CLOUD_API_KEY')
        )
        
        # Initialize LlamaExtract for lease extraction
        self.extractor = LlamaExtract(
            api_key=os.getenv('LLAMA_CLOUD_API_KEY')
        )
        
        self.current_agent = None
    
    def get_index(self):
        """Get the LlamaCloud Index instance"""
        return self.index
    
    def get_extractor(self):
        """Get the LlamaExtract instance"""
        return self.extractor
    
    def get_agent(self, name):
        """Get an extraction agent by name"""
        try:
            if not self.current_agent:
                self.current_agent = self.extractor.get_agent(name=name)
            return self.current_agent
        except Exception as e:
            raise Exception(f"Error getting agent: {str(e)}")
    
    def extract_document(self, file_path: str, agent_name: str):
        """Extract data from a document using the specified agent"""
        try:
            agent = self.get_agent(agent_name)
            return agent.extract(file_path)
        except Exception as e:
            raise Exception(f"Error extracting document: {str(e)}")

    def update_agent(self):
        """
        Always update the extraction agent configuration for the atlas-summary-extractor agent
        with the config and schema defined in this file.
        """
        api_key = os.getenv('LLAMA_CLOUD_API_KEY')
        url = f"https://api.cloud.llamaindex.ai/api/v1/extraction/extraction-agents/{self.AGENT_ID}"
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }
        from update_lease_summary_agent import LeaseSummary
        data_schema = LeaseSummary.model_json_schema()
        config = {
            "cite_sources": True,
            "extraction_mode": "MULTIMODAL",
            "use_reasoning": True,
            "invalidate_cache": True
        }
        payload = {
            "data_schema": data_schema,
            "config": config
        }
        response = requests.put(url, headers=headers, json=payload)
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Failed to update agent: {response.status_code} {response.text}")
         