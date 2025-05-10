from llama_index.indices.managed.llama_cloud import LlamaCloudIndex
from llama_cloud_services import LlamaExtract
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class LlamaCloudManager:
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