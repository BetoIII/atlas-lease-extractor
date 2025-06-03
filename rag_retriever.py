import os
from llama_index.indices.managed.llama_cloud import LlamaCloudIndex
from llama_index.core.response.pprint_utils import pprint_response, pprint_source_node

os.environ['OPENAI_API_KEY'] = os.environ.get("OPENAI_API_KEY")

index = LlamaCloudIndex(
    name="agreed-urial-2025-04-15",
    project_name="Default",
    organization_id="226d42fe-57bd-4b61-a14e-0776cd6b5b8a",
    api_key=os.environ.get("LLAMA_CLOUD_API_KEY")
)

query_engine = index.as_query_engine()

response = query_engine.query("What city is this property located in?")

pprint_response(response)

print(response.source_nodes[0].get_content())

for node in response.source_nodes:
    pprint_source_node(node)
    print("\n----\n")