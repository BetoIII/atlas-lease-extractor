from llama_index.core.workflow import (
    StartEvent,
    StopEvent,
    Workflow,
    step,
)
from lease_extractor import LeaseExtractor, save_to_json
import asyncio
from pathlib import Path

class ExtractLease(Workflow):
    @step
    async def extract_lease(self, ev: StartEvent) -> StopEvent:
        lease_extractor = LeaseExtractor()
        lease_extractor.initialize_agent()
        
        # Process documents from the data directory
        data_dir = Path("data")
        results_dir = Path("extraction_results")
        results_dir.mkdir(exist_ok=True)
        
        lease_files = list(data_dir.glob("*.pdf"))
        
        extraction_results = []
        for lease_file in lease_files:
            try:
                result = lease_extractor.process_document(str(lease_file))
                extraction_results.append({
                    'file_name': lease_file.name,
                    'data': result,
                    'status': 'success'
                })
            except Exception as e:
                extraction_results.append({
                    'file_name': lease_file.name,
                    'data': None,
                    'status': f'error: {str(e)}'
                })
        
        # Save results to JSON
        if extraction_results:
            output_file = save_to_json(extraction_results, results_dir)
            
        return StopEvent(result=extraction_results)

async def main():
    w = ExtractLease(timeout=10, verbose=False)
    result = await w.run()
    print(result)

if __name__ == "__main__":
    asyncio.run(main())