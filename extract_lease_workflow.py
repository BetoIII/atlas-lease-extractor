from llama_index.core.workflow import (
    StartEvent,
    StopEvent,
    Workflow,
    step,
    Context,
    Event
)
from lease_extractor import LeaseExtractor, save_to_json
import asyncio
from pathlib import Path

class ExtractorEvent(Event):
    """Event for carrying extraction state"""
    extractor: object = None

class ResultEvent(Event):
    """Event for carrying extraction results"""
    results: list = None

class ExtractLease(Workflow):
    @step
    async def start(self, ctx: Context, ev: StartEvent) -> ExtractorEvent:
        """Initialize the workflow"""
        lease_extractor = LeaseExtractor()
        lease_extractor.initialize_agent()
        return ExtractorEvent(extractor=lease_extractor)

    @step
    async def extract_lease(self, ctx: Context, ev: ExtractorEvent) -> ResultEvent:
        """Extract information from lease documents"""
        lease_extractor = ev.extractor
        
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
            
        # Store results in context for future steps
        await ctx.set('extraction_results', extraction_results)
        return ResultEvent(results=extraction_results)

    @step
    async def end(self, ctx: Context, ev: ResultEvent) -> StopEvent:
        """End the workflow and return results"""
        return StopEvent(result=ev.results)

async def main():
    w = ExtractLease(timeout=300, verbose=True)
    result = await w.run()
    return result.result

if __name__ == "__main__":
    asyncio.run(main())