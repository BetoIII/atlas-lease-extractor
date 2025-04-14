import os
from pathlib import Path
from dotenv import load_dotenv

# Get the root directory of the project
ROOT_DIR = Path(__file__).parent

# Load environment variables from .env file
load_dotenv(ROOT_DIR / '.env')

def get_api_key() -> str:
    """Get the LlamaCloud API key from environment variables."""
    api_key = os.getenv('LLAMA_CLOUD_API_KEY')
    if not api_key:
        raise ValueError(
            "LLAMA_CLOUD_API_KEY not found in environment variables. "
            "Please create a .env file based on .env.example and add your API key."
        )
    return api_key

def get_base_url() -> str:
    """Get the LlamaCloud base URL from environment variables."""
    return os.getenv('LLAMA_CLOUD_BASE_URL', 'https://api.cloud.llamaindex.ai') 