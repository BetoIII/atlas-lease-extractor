"""
Evaluation Manager for AI Agent Testing
Handles dynamic model selection and evaluation testing for extractors
"""
import os
import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from pathlib import Path
import asyncio
import logging

from model_config import ModelConfig, EvalTestConfig, ModelProvider, ModelType
from lease_summary_extractor import LeaseSummaryExtractor
from risk_flags.risk_flags_extractor import RiskFlagsExtractor
from key_terms_extractor import KeyTermsExtractor
from asset_type_classification import classify_asset_type

# Phoenix tracing setup
phoenix_api_key = os.getenv("PHOENIX_API_KEY")
if phoenix_api_key and phoenix_api_key != "YOUR_PHOENIX_API_KEY":
    try:
        import llama_index.core
        os.environ["OTEL_EXPORTER_OTLP_HEADERS"] = f"api_key={phoenix_api_key}"
        llama_index.core.set_global_handler(
            "arize_phoenix", 
            endpoint="https://llamatrace.com/v1/traces"
        )
        print("✅ Phoenix tracing initialized for eval manager")
    except Exception as e:
        print(f"⚠️  Phoenix setup failed: {e}")

logger = logging.getLogger(__name__)


class EvalTestResult:
    """Container for evaluation test results"""
    
    def __init__(self, test_config: EvalTestConfig):
        self.test_id = test_config.test_id
        self.test_name = test_config.test_name
        self.test_type = test_config.test_type
        self.model_config = test_config.model_config
        self.file_path = test_config.file_path
        self.user_id = test_config.user_id
        self.metadata = test_config.metadata or {}
        
        self.status = "pending"  # pending, running, completed, failed
        self.start_time: Optional[datetime] = None
        self.end_time: Optional[datetime] = None
        self.duration_seconds: Optional[float] = None
        self.extraction_result: Optional[Dict[str, Any]] = None
        self.error_message: Optional[str] = None
        self.phoenix_trace_url: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert result to dictionary for JSON serialization"""
        return {
            "test_id": self.test_id,
            "test_name": self.test_name,
            "test_type": self.test_type,
            "model_config": {
                "provider": self.model_config.provider.value,
                "model": self.model_config.model.value,
                "temperature": self.model_config.temperature,
                "streaming": self.model_config.streaming
            },
            "file_path": self.file_path,
            "user_id": self.user_id,
            "metadata": self.metadata,
            "status": self.status,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "duration_seconds": self.duration_seconds,
            "extraction_result": self.extraction_result,
            "error_message": self.error_message,
            "phoenix_trace_url": self.phoenix_trace_url
        }


class EvalManager:
    """Manager for running evaluation tests with different models"""
    
    def __init__(self):
        self.test_results: Dict[str, EvalTestResult] = {}
    
    def create_test_config(
        self,
        test_type: str,
        file_path: str,
        model_config: ModelConfig,
        test_name: Optional[str] = None,
        user_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> EvalTestConfig:
        """Create a new evaluation test configuration"""
        test_id = str(uuid.uuid4())
        
        if test_name is None:
            test_name = f"{test_type}_{model_config.model.value}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        return EvalTestConfig(
            test_id=test_id,
            test_name=test_name,
            test_type=test_type,
            file_path=file_path,
            model_config=model_config,
            user_id=user_id,
            metadata=metadata
        )
    
    def _setup_model_for_extraction(self, model_config: ModelConfig):
        """Configure the LLM settings based on model config"""
        from llama_index.core import Settings
        
        if model_config.provider == ModelProvider.OPENAI:
            from llama_index.llms.openai import OpenAI
            Settings.llm = OpenAI(
                model=model_config.model.value,
                temperature=model_config.temperature,
                max_tokens=model_config.max_tokens,
                streaming=model_config.streaming
            )
        elif model_config.provider == ModelProvider.ANTHROPIC:
            from llama_index.llms.anthropic import Anthropic
            Settings.llm = Anthropic(
                model=model_config.model.value,
                temperature=model_config.temperature,
                max_tokens=model_config.max_tokens or 4096
            )
        elif model_config.provider == ModelProvider.LLAMA:
            # For Llama models, use local Ollama
            from llama_index.llms.ollama import Ollama
            import requests
            
            # Map our model names to Ollama model strings
            model_mapping = {
                "llama-3.1-8b": "llama3.1:8b",
                "llama-3.1-70b": "llama3.1:70b"
            }
            ollama_model = model_mapping.get(model_config.model.value, "llama3.1:8b")
            
            # Check if model is available in Ollama before trying to use it
            try:
                response = requests.get("http://localhost:11434/api/tags", timeout=10)
                if response.status_code == 200:
                    available_models = [model['name'] for model in response.json().get('models', [])]
                    if ollama_model not in available_models:
                        logger.warning(f"Model {ollama_model} not found in Ollama. Available models: {available_models}")
                        raise ValueError(f"Model '{ollama_model}' not found in Ollama. Please run 'ollama pull {ollama_model}' to download it first.")
                else:
                    logger.warning(f"Could not check available models in Ollama (status: {response.status_code})")
            except requests.exceptions.RequestException as e:
                logger.warning(f"Could not connect to Ollama API: {e}")
                raise ValueError("Could not connect to Ollama. Please ensure Ollama is running on localhost:11434")
            
            Settings.llm = Ollama(
                model=ollama_model,
                temperature=model_config.temperature,
                request_timeout=180.0,  # 3 minutes for local models
                base_url="http://localhost:11434",
                additional_kwargs={
                    "num_predict": model_config.max_tokens or 2048,
                }
            )
        else:
            logger.warning(f"Provider {model_config.provider} not fully implemented, using OpenAI as fallback")
            from llama_index.llms.openai import OpenAI
            Settings.llm = OpenAI(
                model="gpt-4o-mini",
                temperature=model_config.temperature,
                streaming=model_config.streaming
            )
    
    def _get_extractor(self, test_type: str):
        """Get the appropriate extractor for the test type"""
        if test_type == "lease_summary":
            return LeaseSummaryExtractor()
        elif test_type == "risk_flags":
            return RiskFlagsExtractor()
        elif test_type == "key_terms":
            return KeyTermsExtractor()
        elif test_type == "asset_type_classification":
            return None  # This is a function, not a class
        else:
            raise ValueError(f"Unknown test type: {test_type}")
    
    def run_test(self, test_config: EvalTestConfig) -> EvalTestResult:
        """Run a single evaluation test"""
        result = EvalTestResult(test_config)
        self.test_results[test_config.test_id] = result
        
        try:
            result.status = "running"
            result.start_time = datetime.now()
            
            # Setup model configuration
            self._setup_model_for_extraction(test_config.model_config)
            
            # Get appropriate extractor
            extractor = self._get_extractor(test_config.test_type)
            
            # Add Phoenix tracing metadata
            if phoenix_api_key:
                import llama_index.core
                # Add custom tags for this evaluation
                llama_index.core.set_global_handler(
                    "arize_phoenix",
                    endpoint="https://llamatrace.com/v1/traces",
                    tags={
                        "eval_test_id": test_config.test_id,
                        "eval_test_type": test_config.test_type,
                        "eval_model": test_config.model_config.model.value,
                        "eval_provider": test_config.model_config.provider.value,
                        "eval_user_id": test_config.user_id or "anonymous"
                    }
                )
            
            # Run extraction
            if test_config.test_type == "asset_type_classification":
                # Asset type classification is a function, not a class
                extraction_result = classify_asset_type(test_config.file_path)
                # Convert to dict for consistency and handle complex objects
                if hasattr(extraction_result, 'dict'):
                    extraction_result = extraction_result.dict()
                elif hasattr(extraction_result, 'model_dump'):
                    extraction_result = extraction_result.model_dump()
                elif hasattr(extraction_result, '__dict__'):
                    # For complex objects, try to extract just the basic attributes
                    try:
                        import json
                        extraction_result = json.loads(json.dumps(extraction_result.__dict__, default=str))
                    except:
                        # Fallback to just the basic dict representation
                        extraction_result = {
                            "type": str(type(extraction_result)),
                            "str_representation": str(extraction_result)
                        }
            elif test_config.test_type == "key_terms":
                # KeyTermsExtractor returns dict directly
                extraction_result = extractor.process_document(test_config.file_path)
                # Ensure it's JSON serializable - more robust handling
                try:
                    # Test JSON serialization
                    import json
                    json.dumps(extraction_result)
                    # If this works, it's already serializable
                except (TypeError, ValueError) as e:
                    logger.warning(f"Key terms result not JSON serializable: {e}")
                    # Try common serialization methods
                    if hasattr(extraction_result, 'model_dump'):
                        extraction_result = extraction_result.model_dump()
                    elif hasattr(extraction_result, 'dict'):
                        extraction_result = extraction_result.dict()
                    elif hasattr(extraction_result, '__dict__'):
                        # For complex objects like ExtractRun, extract just the data
                        if hasattr(extraction_result, 'data'):
                            extraction_result = extraction_result.data
                        else:
                            extraction_result = extraction_result.__dict__
                    else:
                        # Final fallback
                        extraction_result = {
                            "error": "Could not serialize extraction result",
                            "type": str(type(extraction_result)),
                            "str_representation": str(extraction_result)
                        }
            else:
                # LeaseSummaryExtractor and RiskFlagsExtractor
                extraction_result = extractor.process_document(test_config.file_path)
            
            result.extraction_result = extraction_result
            result.status = "completed"
            
            # Generate Phoenix trace URL (simplified - actual URL would come from tracing)
            if phoenix_api_key:
                result.phoenix_trace_url = f"https://llamatrace.com/traces/{test_config.test_id}"
            
        except Exception as e:
            result.status = "failed"
            result.error_message = str(e)
            logger.error(f"Test {test_config.test_id} failed: {e}")
        
        finally:
            result.end_time = datetime.now()
            if result.start_time:
                result.duration_seconds = (result.end_time - result.start_time).total_seconds()
        
        return result
    
    def run_batch_tests(self, test_configs: List[EvalTestConfig]) -> List[EvalTestResult]:
        """Run multiple evaluation tests"""
        results = []
        
        for config in test_configs:
            logger.info(f"Running test: {config.test_name}")
            result = self.run_test(config)
            results.append(result)
        
        return results
    
    def get_test_result(self, test_id: str) -> Optional[EvalTestResult]:
        """Get result for a specific test"""
        return self.test_results.get(test_id)
    
    def get_all_results(self) -> List[EvalTestResult]:
        """Get all test results"""
        return list(self.test_results.values())
    
    def get_results_by_type(self, test_type: str) -> List[EvalTestResult]:
        """Get results filtered by test type"""
        return [result for result in self.test_results.values() if result.test_type == test_type]
    
    def get_results_by_model(self, model: ModelType) -> List[EvalTestResult]:
        """Get results filtered by model"""
        return [result for result in self.test_results.values() if result.model_config.model == model]
    
    
    def compare_results(self, test_ids: List[str]) -> Dict[str, Any]:
        """Compare results from multiple tests"""
        results = [self.test_results[test_id] for test_id in test_ids if test_id in self.test_results]
        
        if not results:
            return {"error": "No valid results found for comparison"}
        
        comparison = {
            "test_count": len(results),
            "models_compared": list(set(r.model_config.model.value for r in results)),
            "test_types": list(set(r.test_type for r in results)),
            "performance_summary": {
                "avg_duration": sum(r.duration_seconds or 0 for r in results) / len(results),
                "success_rate": len([r for r in results if r.status == "completed"]) / len(results),
                "failed_count": len([r for r in results if r.status == "failed"])
            },
            "results": [r.to_dict() for r in results]
        }
        
        return comparison


# Global instance
eval_manager = EvalManager()