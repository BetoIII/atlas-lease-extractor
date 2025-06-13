from llama_index.core.workflow import (
    StartEvent,
    StopEvent,
    Workflow,
    step,
    Context,
    Event
)
from lease_summary_extractor import LeaseSummaryExtractor
from risk_flags.risk_flags_extractor import RiskFlagsExtractor
import asyncio
from pathlib import Path
import json

class ExtractorEvent(Event):
    """Event for carrying extraction state"""
    summary_extractor: object = None
    flags_extractor: object = None

class ResultEvent(Event):
    """Event for carrying extraction results"""
    results: dict = None

def save_to_json(results, results_dir, filename="extraction_results.json"):
    output_file = results_dir / filename
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2)
    return output_file

class ExtractLease(Workflow):
    @step
    async def start(self, ctx: Context, ev: StartEvent) -> ExtractorEvent:
        """Initialize the workflow"""
        summary_extractor = LeaseSummaryExtractor()
        flags_extractor = RiskFlagsExtractor()
        return ExtractorEvent(
            summary_extractor=summary_extractor,
            flags_extractor=flags_extractor
        )

    @step
    async def extract_lease(self, ctx: Context, ev: ExtractorEvent) -> ResultEvent:
        """Extract information from lease documents"""
        summary_extractor = ev.summary_extractor
        flags_extractor = ev.flags_extractor
        
        # Process documents from the data directory
        data_dir = Path("data")
        results_dir = Path("extraction_results")
        results_dir.mkdir(exist_ok=True)
        
        lease_files = list(data_dir.glob("*.pdf"))
        
        extraction_results = []
        for lease_file in lease_files:
            try:
                # Extract both summary and flags
                summary_result = summary_extractor.process_document(str(lease_file))
                flags_result = flags_extractor.process_document(str(lease_file))
                
                extraction_results.append({
                    'file_name': lease_file.name,
                    'summary_data': getattr(summary_result, 'data', {}),
                    'flags_data': getattr(flags_result, 'data', {}),
                    'summary_metadata': getattr(summary_result, 'extraction_metadata', {}),
                    'flags_metadata': getattr(flags_result, 'extraction_metadata', {}),
                    'status': 'success'
                })
            except Exception as e:
                extraction_results.append({
                    'file_name': lease_file.name,
                    'summary_data': None,
                    'flags_data': None,
                    'summary_metadata': None,
                    'flags_metadata': None,
                    'status': f'error: {str(e)}'
                })
        
        # Save results to JSON
        if extraction_results:
            output_file = save_to_json({'extractions': extraction_results}, results_dir)
            print(f"\nResults saved to: {output_file}")
            
        # Store results in context for future steps
        await ctx.set('extraction_results', extraction_results)
        
        # Wrap results in a dictionary to match ResultEvent type
        return ResultEvent(results={'extractions': extraction_results})

    @step
    async def end(self, ctx: Context, ev: ResultEvent) -> StopEvent:
        """End the workflow and return results"""
        return StopEvent(result=ev.results)

async def main():
    w = ExtractLease(timeout=300, verbose=True)
    workflow_result = await w.run()
    # The workflow result is already a dictionary containing our data
    return workflow_result

if __name__ == "__main__":
    result = asyncio.run(main())
    print("\nWorkflow completed successfully!")
    print(f"Number of documents processed: {len(result['extractions'])}")