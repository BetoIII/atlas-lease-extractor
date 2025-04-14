from llama_index.utils.workflow import draw_all_possible_flows
from workflow import ExtractLease

draw_all_possible_flows(ExtractLease, filename="basic_workflow.html")