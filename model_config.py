"""
Model Configuration for Dynamic Model Selection in Evaluation Testing
"""
from dataclasses import dataclass
from typing import Optional, Dict, Any, List
from enum import Enum


class ModelProvider(str, Enum):
    """Supported model providers"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    LLAMA = "llama"


class ModelType(str, Enum):
    """Available models categorized by provider"""
    # OpenAI models
    GPT_4O = "gpt-4o"
    GPT_4O_MINI = "gpt-4o-mini"
    GPT_4_TURBO = "gpt-4-turbo"
    GPT_3_5_TURBO = "gpt-3.5-turbo"
    
    # Anthropic models
    CLAUDE_3_5_SONNET = "claude-3-5-sonnet-20241022"
    CLAUDE_3_OPUS = "claude-3-opus-20240229"
    CLAUDE_3_HAIKU = "claude-3-haiku-20240307"
    
    # Llama models (via various providers)
    LLAMA_3_1_8B = "llama-3.1-8b"
    LLAMA_3_1_70B = "llama-3.1-70b"


@dataclass
class ModelConfig:
    """Configuration for a specific model"""
    provider: ModelProvider
    model: ModelType
    temperature: float = 0.1
    max_tokens: Optional[int] = None
    streaming: bool = True
    api_key_env_var: Optional[str] = None
    
    def __post_init__(self):
        """Set default API key environment variable based on provider"""
        if self.api_key_env_var is None:
            provider_env_mapping = {
                ModelProvider.OPENAI: "OPENAI_API_KEY",
                ModelProvider.ANTHROPIC: "ANTHROPIC_API_KEY",
                ModelProvider.LLAMA: "LLAMA_API_KEY"
            }
            self.api_key_env_var = provider_env_mapping.get(self.provider)


@dataclass
class EvalTestConfig:
    """Configuration for an evaluation test"""
    test_id: str
    test_name: str
    test_type: str  # "lease_summary", "risk_flags", "key_terms"
    file_path: str
    model_config: ModelConfig
    user_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ModelConfigManager:
    """Manager for model configurations and presets"""
    
    # Predefined model configurations
    PRESETS = {
        "fast_cheap": ModelConfig(
            provider=ModelProvider.OPENAI,
            model=ModelType.GPT_4O_MINI,
            temperature=0.1,
            streaming=True
        ),
        "balanced": ModelConfig(
            provider=ModelProvider.OPENAI,
            model=ModelType.GPT_4O,
            temperature=0.1,
            streaming=True
        ),
        "high_quality": ModelConfig(
            provider=ModelProvider.ANTHROPIC,
            model=ModelType.CLAUDE_3_5_SONNET,
            temperature=0.1,
            streaming=True
        ),
        "creative": ModelConfig(
            provider=ModelProvider.ANTHROPIC,
            model=ModelType.CLAUDE_3_OPUS,
            temperature=0.3,
            streaming=True
        )
    }
    
    @classmethod
    def get_available_models(cls) -> Dict[ModelProvider, List[ModelType]]:
        """Get all available models grouped by provider"""
        provider_models = {
            ModelProvider.OPENAI: [
                ModelType.GPT_4O,
                ModelType.GPT_4O_MINI,
                ModelType.GPT_4_TURBO,
                ModelType.GPT_3_5_TURBO
            ],
            ModelProvider.ANTHROPIC: [
                ModelType.CLAUDE_3_5_SONNET,
                ModelType.CLAUDE_3_OPUS,
                ModelType.CLAUDE_3_HAIKU
            ],
            ModelProvider.LLAMA: [
                ModelType.LLAMA_3_1_8B,
                ModelType.LLAMA_3_1_70B
            ]
        }
        return provider_models
    
    @classmethod
    def get_preset(cls, preset_name: str) -> Optional[ModelConfig]:
        """Get a predefined model configuration preset"""
        return cls.PRESETS.get(preset_name)
    
    @classmethod
    def get_all_presets(cls) -> Dict[str, ModelConfig]:
        """Get all available presets"""
        return cls.PRESETS.copy()
    
    @classmethod
    def validate_config(cls, config: ModelConfig) -> bool:
        """Validate a model configuration"""
        # Check if provider and model are compatible
        available_models = cls.get_available_models()
        provider_models = available_models.get(config.provider, [])
        
        if config.model not in provider_models:
            return False
        
        # Validate temperature range
        if not 0 <= config.temperature <= 2:
            return False
        
        # Validate max_tokens if specified
        if config.max_tokens is not None and config.max_tokens <= 0:
            return False
        
        return True
    
    @classmethod
    def create_config_from_dict(cls, config_dict: Dict[str, Any]) -> ModelConfig:
        """Create ModelConfig from dictionary"""
        return ModelConfig(
            provider=ModelProvider(config_dict["provider"]),
            model=ModelType(config_dict["model"]),
            temperature=config_dict.get("temperature", 0.1),
            max_tokens=config_dict.get("max_tokens"),
            streaming=config_dict.get("streaming", True),
            api_key_env_var=config_dict.get("api_key_env_var")
        )


def get_model_display_info() -> Dict[str, Dict[str, Any]]:
    """Get display information for models (for UI)"""
    return {
        "openai": {
            "name": "OpenAI",
            "models": {
                "gpt-4o": {"name": "GPT-4o", "description": "Most capable, best for complex reasoning"},
                "gpt-4o-mini": {"name": "GPT-4o Mini", "description": "Fast and cost-effective"},
                "gpt-4-turbo": {"name": "GPT-4 Turbo", "description": "High performance, optimized"},
                "gpt-3.5-turbo": {"name": "GPT-3.5 Turbo", "description": "Reliable, good balance"}
            }
        },
        "anthropic": {
            "name": "Anthropic",
            "models": {
                "claude-3-5-sonnet-20241022": {"name": "Claude 3.5 Sonnet", "description": "Excellent reasoning and analysis"},
                "claude-3-opus-20240229": {"name": "Claude 3 Opus", "description": "Most capable, best for complex tasks"},
                "claude-3-haiku-20240307": {"name": "Claude 3 Haiku", "description": "Fast and efficient"}
            }
        },
        "llama": {
            "name": "Llama",
            "models": {
                "llama-3.1-8b": {"name": "Llama 3.1 8B", "description": "Efficient open-source model"},
                "llama-3.1-70b": {"name": "Llama 3.1 70B", "description": "Powerful open-source model"}
            }
        }
    }