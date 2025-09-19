from llama_cloud_services import LlamaCloudIndex

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
        # Initialize LlamaCloud Index for document indexing - using existing index
        print(f"🔗 Connecting to LlamaCloud index: agreed-urial-2025-04-15")
        print(f"🏢 Organization ID: {os.getenv('LLAMA_CLOUD_ORG_ID')}")
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

    def update_agent(self, agent_name=None, data_schema=None, config=None):
        """
        Update the extraction agent configuration for the specified agent name
        with the provided data_schema and config. If not provided, defaults to summary agent and schema.
        """
        api_key = os.getenv('LLAMA_CLOUD_API_KEY')
        if agent_name == self.FLAGS_AGENT_NAME:
            agent_id = self.FLAGS_AGENT_ID
            if data_schema is None:
                from risk_flags.risk_flags_schema import RiskFlagsSchema
                data_schema = RiskFlagsSchema.model_json_schema()
            if config is None:
                # Default config for risk flags agent with cite_sources enabled
                config = {
                    "extraction_target": "PER_DOC",
                    "extraction_mode": "BALANCED",
                    "system_prompt": None,
                    "use_reasoning": True,
                    "cite_sources": True
                }
        else:
            agent_id = self.SUMMARY_AGENT_ID
            if data_schema is None:
                from lease_summary_agent_schema import LeaseSummary
                data_schema = LeaseSummary.model_json_schema()
            if config is None:
                # Default config for summary agent
                config = {
                    "extraction_target": "PER_DOC",
                    "extraction_mode": "BALANCED",
                    "system_prompt": None,
                    "use_reasoning": True,
                    "cite_sources": True
                }
        url = f"https://api.cloud.llamaindex.ai/api/v1/extraction/extraction-agents/{agent_id}"
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': f'Bearer {api_key}'
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

    def update_agent_config_only(self, agent_name, config):
        """
        Update only the configuration settings of an agent without changing the schema.
        """
        api_key = os.getenv('LLAMA_CLOUD_API_KEY')
        if agent_name == self.FLAGS_AGENT_NAME:
            agent_id = self.FLAGS_AGENT_ID
        else:
            agent_id = self.SUMMARY_AGENT_ID
            
        url = f"https://api.cloud.llamaindex.ai/api/v1/extraction/extraction-agents/{agent_id}"
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }
        payload = {
            "config": config
        }
        response = requests.put(url, headers=headers, json=payload)
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Failed to update agent config: {response.status_code} {response.text}")
         