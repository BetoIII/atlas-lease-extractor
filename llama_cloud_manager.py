from llama_index.indices.managed.llama_cloud import LlamaCloudIndex
from llama_cloud_services import LlamaExtract
import os
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv()

class LlamaCloudManager:
    SUMMARY_AGENT_ID = "3471b248-2281-4741-91c4-8e0f15328782"
    SUMMARY_AGENT_NAME = "atlas-summary-extractor"
    FLAGS_AGENT_ID = "694ad535-cd75-42f3-a519-afec99e33cd5"
    FLAGS_AGENT_NAME = "atlas-lease-flags"

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
        
        self.current_agents = {}
    
    def get_index(self):
        """Get the LlamaCloud Index instance"""
        return self.index
    
    def get_extractor(self):
        """Get the LlamaExtract instance"""
        return self.extractor
    
    def get_agent(self, name):
        """Get an extraction agent by name"""
        try:
            if name not in self.current_agents:
                self.current_agents[name] = self.extractor.get_agent(name=name)
            return self.current_agents[name]
        except Exception as e:
            raise Exception(f"Error getting agent: {str(e)}")
    
    def extract_document(self, file_path: str, agent_name: str):
        """Extract data from a document using the specified agent"""
        try:
            agent = self.get_agent(agent_name)
            return agent.extract(file_path)
        except Exception as e:
            raise Exception(f"Error extracting document: {str(e)}")

    def update_agent(self, agent_name=None, data_schema=None):
        """
        Update the extraction agent configuration for the specified agent name
        with the provided data_schema. If not provided, defaults to summary agent and schema.
        """
        api_key = os.getenv('LLAMA_CLOUD_API_KEY')
        if agent_name == self.FLAGS_AGENT_NAME:
            agent_id = self.FLAGS_AGENT_ID
            if data_schema is None:
                from lease_flags_schema import LeaseFlagsSchema
                data_schema = LeaseFlagsSchema.model_json_schema()
        else:
            agent_id = self.SUMMARY_AGENT_ID
            if data_schema is None:
                from lease_summary_agent_schema import LeaseSummary
                data_schema = LeaseSummary.model_json_schema()
        url = f"https://api.cloud.llamaindex.ai/api/v1/extraction/extraction-agents/{agent_id}"
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }
        payload = {
            "data_schema": data_schema,
        }
        response = requests.put(url, headers=headers, json=payload)
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Failed to update agent: {response.status_code} {response.text}")
         