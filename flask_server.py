import os
from dotenv import load_dotenv
load_dotenv()
os.environ["PHOENIX_CLIENT_HEADERS"] = os.getenv("PHOENIX_CLIENT_HEADERS", "api_key=YOUR_API_KEY")
os.environ["PHOENIX_COLLECTOR_ENDPOINT"] = os.getenv("PHOENIX_COLLECTOR_ENDPOINT", "https://app.phoenix.arize.com")
from openinference.instrumentation.llama_index import LlamaIndexInstrumentor
from phoenix.otel import register
tracer_provider = register()
LlamaIndexInstrumentor().instrument(tracer_provider=tracer_provider)
from multiprocessing.managers import BaseManager
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import sys
import time
from pathlib import Path
import logging
from logging.handlers import RotatingFileHandler
from llama_cloud_manager import LlamaCloudManager
from lease_summary_agent_schema import LeaseSummary
from lease_summary_extractor import LeaseSummaryExtractor
from risk_flags.risk_flags_extractor import RiskFlagsExtractor
from risk_flags.risk_flags_schema import RiskFlagsSchema
from risk_flags.risk_flags_query_pipeline import extract_risk_flags as extract_risk_flags_pipeline
import chromadb
from llama_index.core import load_index_from_storage
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core import StorageContext
from llama_index.llms.openai import OpenAI
import json
import threading
import queue
from asset_type_classification import classify_asset_type, AssetTypeClassification, AssetType
from risk_flags import risk_flags_query_pipeline

# Load environment variables
load_dotenv()

# Initialize LlamaCloud Manager
llama_manager = LlamaCloudManager()
index = llama_manager.get_index()

# Set up logging
log_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
log_file = 'app.log'
log_handler = RotatingFileHandler(log_file, maxBytes=1024*1024, backupCount=5)  # 1MB per file, keep 5 backup files
log_handler.setFormatter(log_formatter)

# Add handler to Flask logger
logger = logging.getLogger('flask.app')
logger.addHandler(log_handler)
logger.setLevel(logging.INFO)

app = Flask(__name__)

# Configure CORS to allow requests from React frontend
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

# Server configuration - must match index_server.py
SERVER_ADDRESS = ""  # Empty string means localhost
SERVER_PORT = 5602
SERVER_KEY = b"password"  # Convert string to bytes using b prefix

def connect_to_index_server(max_retries=5, retry_delay=2):
    """Connect to the index server with retries"""
    manager = BaseManager((SERVER_ADDRESS, SERVER_PORT), SERVER_KEY)
    manager.register("query_index")
    manager.register("upload_file")
    
    for attempt in range(max_retries):
        try:
            print(f"Attempting to connect to index server (attempt {attempt + 1}/{max_retries})...")
            manager.connect()
            print("Successfully connected to index server!")
            return manager
        except ConnectionRefusedError:
            if attempt < max_retries - 1:
                print(f"Connection failed, retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                raise
    
    raise ConnectionError("Failed to connect to index server after maximum retries")

# Initialize manager connection
try:
    manager = connect_to_index_server()
except Exception as e:
    print(f"Failed to connect to index server: {str(e)}", file=sys.stderr)
    sys.exit(1)

ALLOWED_EXTENSIONS = {'txt', 'pdf', 'doc', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def run_asset_type_classification(file_path: str, result_queue: queue.Queue):
    """Run asset type classification in a separate thread and put result in queue"""
    try:
        classification = classify_asset_type(file_path)
        result_queue.put({
            "status": "success",
            "asset_type": classification.asset_type.value,  # Get the string value from enum
            "confidence": classification.confidence
        })
    except Exception as e:
        result_queue.put({
            "status": "error",
            "message": f"Error during asset type classification: {str(e)}"
        })

@app.route("/upload", methods=["POST"])
def upload_file():
    logger.info('Received file upload request')
    if "file" not in request.files:
        logger.error('No file part in request')
        return jsonify({"error": "No file part in request"}), 400

    uploaded_file = request.files["file"]
    if uploaded_file.filename == '':
        logger.error('No selected file')
        return jsonify({"error": "No selected file"}), 400

    # Save the file to a directory
    filename = secure_filename(uploaded_file.filename)
    upload_dir = "uploaded_documents"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    filepath = os.path.join(upload_dir, filename)
    uploaded_file.save(filepath)

    return jsonify({
        "status": "success",
        "filename": filename,
        "filepath": filepath
    }), 200

@app.route("/index", methods=["POST"])
def index_file():
    logger.info('Received indexing request')
    try:
        file_data = request.get_json()
        if not file_data or 'file_path' not in file_data:
            logger.error('No file path provided in request')
            return jsonify({"error": "No file path provided"}), 400

        filepath = file_data['file_path']
        if not os.path.exists(filepath):
            logger.error(f'File not found: {filepath}')
            return jsonify({"error": "File not found"}), 404

        # Index the file with Llama Cloud or your index server
        try:
            success = manager.upload_file(filepath)
            if not success:
                logger.error('Failed to index file with Llama Cloud')
                return jsonify({"error": "Failed to index file"}), 500
        except Exception as e:
            logger.error(f'Error indexing file: {str(e)}')
            return jsonify({"error": f"Error indexing file: {str(e)}"}), 500

        return jsonify({
            "status": "success",
            "filepath": filepath
        }), 200
    except Exception as e:
        logger.error(f'Error during indexing: {str(e)}')
        return jsonify({"error": f"Error during indexing: {str(e)}"}), 500

@app.route("/query", methods=["GET"])
def query_index():
    logger.info('Received query request')
    query_text = request.args.get("text", None)
    if query_text is None:
        return jsonify({
            "error": "No text found, please include a ?text=blah parameter in the URL"
        }), 400
    
    try:
        # Get both retrieval results and query response
        nodes = index.as_retriever().retrieve(query_text)
        response = index.as_query_engine().query(query_text)
        
        logger.info('Query processed successfully')
        return jsonify({
            "response": str(response),
            "retrieved_nodes": [str(node) for node in nodes]
        }), 200
    except Exception as e:
        logger.error(f'Error processing query: {str(e)}')
        return jsonify({"error": str(e)}), 500

@app.route("/update-extraction-agent", methods=["POST"])
def update_extraction_agent():
    logger.info('Received update extraction agent request')
    try:
        data = request.get_json() or {}
        schema_type = data.get("schema", "lease_summary")
        config = data.get("config")  # Optional config override
        
        logger.info(f'Schema type requested: {schema_type}')
        logger.info(f'Config provided: {config}')
        
        # Use the enhanced update_agent method that supports config updates
        if schema_type == "risk_flags":
            logger.info(f'Updating FLAGS agent: {llama_manager.FLAGS_AGENT_NAME}')
            result = llama_manager.update_agent(
                agent_name=llama_manager.FLAGS_AGENT_NAME,
                config=config
            )
            return jsonify({
                "status": "success",
                "message": f"Risk flags agent '{llama_manager.FLAGS_AGENT_NAME}' updated successfully with cite_sources enabled",
                "agent_name": llama_manager.FLAGS_AGENT_NAME,
                "agent_id": llama_manager.FLAGS_AGENT_ID,
                "result": result
            }), 200
        elif schema_type == "lease_summary":
            logger.info(f'Updating SUMMARY agent: {llama_manager.SUMMARY_AGENT_NAME}')
            result = llama_manager.update_agent(
                agent_name=llama_manager.SUMMARY_AGENT_NAME,
                config=config
            )
            return jsonify({
                "status": "success",
                "message": f"Lease summary agent '{llama_manager.SUMMARY_AGENT_NAME}' updated successfully",
                "agent_name": llama_manager.SUMMARY_AGENT_NAME,
                "agent_id": llama_manager.SUMMARY_AGENT_ID,
                "result": result
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": f"Unknown schema type: {schema_type}"
            }), 400
    except Exception as e:
        logger.error(f'Error updating extraction agent: {str(e)}')
        return jsonify({
            "status": "error",
            "message": f"Error updating extraction agent: {str(e)}"
        }), 500

@app.route("/test-update-risk-flags-agent", methods=["POST"])
def test_update_risk_flags_agent():
    """Test endpoint to explicitly update the risk flags agent with cite_sources enabled"""
    logger.info('Test: Updating risk flags agent with cite_sources enabled')
    try:
        # Explicitly update the FLAGS agent with cite_sources enabled
        config = {
            "extraction_target": "PER_DOC",
            "extraction_mode": "BALANCED",
            "system_prompt": None,
            "use_reasoning": True,
            "cite_sources": True
        }
        
        result = llama_manager.update_agent(
            agent_name=llama_manager.FLAGS_AGENT_NAME,
            config=config
        )
        
        return jsonify({
            "status": "success",
            "message": f"TEST: Risk flags agent '{llama_manager.FLAGS_AGENT_NAME}' (ID: {llama_manager.FLAGS_AGENT_ID}) updated with cite_sources=true",
            "agent_name": llama_manager.FLAGS_AGENT_NAME,
            "agent_id": llama_manager.FLAGS_AGENT_ID,
            "config_sent": config,
            "llama_cloud_response": result
        }), 200
    except Exception as e:
        logger.error(f'Test error: {str(e)}')
        return jsonify({
            "status": "error",
            "message": f"Test error: {str(e)}"
        }), 500

@app.route("/extract-summary", methods=["POST"])
def extract_summary():
    logger.info('Received lease summary extraction request')
    if "file" not in request.files:
        logger.error('No file part in request')
        return jsonify({"error": "No file part in request"}), 400

    uploaded_file = request.files["file"]
    if uploaded_file.filename == '':
        logger.error('No selected file')
        return jsonify({"error": "No selected file"}), 400

    filename = secure_filename(uploaded_file.filename)
    upload_dir = "uploaded_documents"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    filepath = os.path.join(upload_dir, filename)
    uploaded_file.save(filepath)

    try:
        # Run the summary extraction only
        extractor = LeaseSummaryExtractor()
        summary_result = extractor.process_document(filepath)
        data = getattr(summary_result, 'data', {})
        extraction_metadata = getattr(summary_result, 'extraction_metadata', {})

        return jsonify({
            "status": "success",
            "data": data,
            "sourceData": extraction_metadata,
            "message": "Lease summary extraction completed successfully"
        }), 200
    except Exception as e:
        logger.error(f'Error during lease summary extraction: {str(e)}')
        return jsonify({
            "status": "error",
            "message": f"Error during lease summary extraction: {str(e)}"
        }), 500

@app.route("/extract-risk-flags", methods=["POST"])
def extract_risk_flags():
    logger.info('Received risk flags extraction request')
    if "file" not in request.files:
        logger.error('No file part in request')
        return jsonify({"error": "No file part in request"}), 400

    uploaded_file = request.files["file"]
    if uploaded_file.filename == '':
        logger.error('No selected file')
        return jsonify({"error": "No selected file"}), 400

    filename = secure_filename(uploaded_file.filename)
    upload_dir = "uploaded_documents"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    filepath = os.path.join(upload_dir, filename)
    uploaded_file.save(filepath)

    try:
        extractor = RiskFlagsExtractor()
        flags_result = extractor.process_document(filepath)
        # Access attributes directly
        data = getattr(flags_result, 'data', {})
        extraction_metadata = getattr(flags_result, 'extraction_metadata', {})
        return jsonify({
            "status": "success",
            "data": data,
            "sourceData": extraction_metadata,
            "message": "Risk flags extraction completed successfully"
        }), 200
    except Exception as e:
        logger.error(f'Error during risk flags extraction: {str(e)}')
        return jsonify({
            "status": "error",
            "message": f"Error during risk flags extraction: {str(e)}"
        }), 500

@app.route("/extract-lease-all", methods=["POST"])
def extract_lease_all():
    logger.info('Received lease summary and flags extraction request')
    if "file" not in request.files:
        logger.error('No file part in request')
        return jsonify({"error": "No file part in request"}), 400

    uploaded_file = request.files["file"]
    if uploaded_file.filename == '':
        logger.error('No selected file')
        return jsonify({"error": "No selected file"}), 400

    filename = secure_filename(uploaded_file.filename)
    upload_dir = "uploaded_documents"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    filepath = os.path.join(upload_dir, filename)
    uploaded_file.save(filepath)

    try:
        summary_extractor = LeaseSummaryExtractor()
        flags_extractor = RiskFlagsExtractor()
        summary_result = summary_extractor.process_document(filepath)
        flags_result = flags_extractor.process_document(filepath)
        summary_data = getattr(summary_result, 'data', {})
        summary_metadata = getattr(summary_result, 'extraction_metadata', {})
        flags_data = getattr(flags_result, 'data', {})
        flags_metadata = getattr(flags_result, 'extraction_metadata', {})
        return jsonify({
            "status": "success",
            "summary": {
                "data": summary_data,
                "sourceData": summary_metadata
            },
            "flags": {
                "data": flags_data,
                "sourceData": flags_metadata
            },
            "message": "Lease summary and flags extraction completed successfully"
        }), 200
    except Exception as e:
        logger.error(f'Error during lease extraction: {str(e)}')
        return jsonify({
            "status": "error",
            "message": f"Error during lease extraction: {str(e)}"
        }), 500

@app.route("/rag-query", methods=["POST"])
def rag_query():
    """
    Query the persisted Chroma index using a POST request with JSON: {"query": "..."}
    """
    data = request.get_json()
    user_query = data.get("query", "")
    if not user_query:
        return jsonify({"error": "No query provided"}), 400

    try:
        db = chromadb.PersistentClient(path="./chroma_db")
        chroma_collection = db.get_or_create_collection("quickstart")
        vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
        storage_context = StorageContext.from_defaults(
            persist_dir="./persist_dir",
            vector_store=vector_store
        )
        index = load_index_from_storage(storage_context)
        response = index.as_query_engine().query(user_query)
        return jsonify({"answer": str(response)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/lease-flag-query", methods=["POST"])
def lease_flag_query():
    """
    Query a specific document in the Chroma index for lease flags using a POST request with JSON: 
    {
        "query": "...",
        "document_id": "..."
    }
    Returns structured output as defined in LeaseFlagsSchema.
    """
    data = request.get_json()
    user_query = data.get("query", "")
    document_id = data.get("document_id", "")
    
    if not user_query:
        return jsonify({"error": "No query provided"}), 400
    if not document_id:
        return jsonify({"error": "No document_id provided"}), 400

    try:
        # First verify the document exists
        db = chromadb.PersistentClient(path="./chroma_db")
        chroma_collection = db.get_or_create_collection("quickstart")
        
        # Get all document IDs to check if the requested one exists
        results = chroma_collection.get()
        doc_ids = results.get("ids", [])
        
        if document_id not in doc_ids:
            return jsonify({"error": f"Document ID {document_id} not found in index"}), 404

        # Create vector store with document filter
        vector_store = ChromaVectorStore(
            chroma_collection=chroma_collection
        )
        
        # Set up storage context with the filtered vector store
        storage_context = StorageContext.from_defaults(
            persist_dir="./persist_dir",
            vector_store=vector_store
        )
        
        # Load index and create query engine
        index = load_index_from_storage(storage_context)
        
        # Initialize the output parser
        output_parser = PydanticOutputParser(RiskFlagsSchema)
        
        # Format the prompt template for lease flags
        json_prompt_str = """
        Please analyze the lease document and identify any lease flags. Output with the following JSON format:
        {
            "lease_flags": [
                {
                    "category": "Financial Exposure & Cost Uncertainty",
                    "title": "Early Termination Clauses",
                    "description": "Details about the early termination clause..."
                },
                // ... additional flags
            ]
        }

        Focus on identifying flags in these categories:
        1. Financial Exposure & Cost Uncertainty
        2. Operational Constraints & Legal Risks
        3. Insurance & Liability
        4. Lease Term & Renewal
        5. Miscellaneous

        Specific query context: {user_query}
        """
        
        # Create the prompt template
        json_prompt_tmpl = PromptTemplate(json_prompt_str)
        
        # Create query engine with structured output
        query_engine = index.as_query_engine(
            output_parser=output_parser,
            prompt_template=json_prompt_tmpl,
            filters={"id": document_id}
        )
        
        # Execute query
        response = query_engine.query(user_query)
        
        # The response should already be in LeaseFlagsSchema format
        return jsonify(response.dict()), 200
            
    except Exception as e:
        logger.error(f'Error in lease flag query: {str(e)}')
        return jsonify({"error": str(e)}), 500

@app.route("/list-indexed-documents", methods=["GET"])
def list_indexed_documents():
    try:
        db = chromadb.PersistentClient(path="./chroma_db")
        chroma_collection = db.get_or_create_collection("quickstart")
        # Get all document IDs (or you can use .get() for more metadata)
        results = chroma_collection.get()
        # This returns a dict with keys: ids, embeddings, documents, metadatas
        doc_ids = results.get("ids", [])
        return jsonify({"document_ids": doc_ids}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/classify-asset-type", methods=["POST"])
def classify_asset_type_endpoint():
    """
    Classify the asset type of a lease document.
    Expects a JSON payload with file_path.
    Returns the classification result with asset_type and confidence.
    """
    logger.info('Received asset type classification request')
    try:
        data = request.get_json()
        if not data or 'file_path' not in data:
            logger.error('No file path provided in request')
            return jsonify({"error": "No file path provided"}), 400

        file_path = data['file_path']
        if not os.path.exists(file_path):
            logger.error(f'File not found: {file_path}')
            return jsonify({"error": "File not found"}), 404

        # Run classification in a separate thread
        result_queue = queue.Queue()
        classification_thread = threading.Thread(
            target=run_asset_type_classification,
            args=(file_path, result_queue)
        )
        classification_thread.start()
        classification_thread.join(timeout=30)  # 30 second timeout

        if result_queue.empty():
            return jsonify({
                "status": "error",
                "message": "Asset type classification timed out"
            }), 504

        result = result_queue.get()
        if result["status"] == "error":
            return jsonify(result), 500

        return jsonify(result), 200
    except Exception as e:
        logger.error(f'Error during asset type classification: {str(e)}')
        return jsonify({
            "status": "error",
            "message": f"Error during asset type classification: {str(e)}"
        }), 500

@app.route("/reclassify-asset-type", methods=["POST"])
def reclassify_asset_type_endpoint():
    """
    Manually reclassify the asset type of a lease document.
    Expects a JSON payload with file_path and new_asset_type.
    Returns the updated classification with 100% confidence.
    """
    logger.info('Received asset type reclassification request')
    try:
        data = request.get_json()
        if not data or 'file_path' not in data or 'new_asset_type' not in data:
            logger.error('Missing required fields in request')
            return jsonify({"error": "Missing required fields"}), 400

        file_path = data['file_path']
        new_asset_type = data['new_asset_type']

        if not os.path.exists(file_path):
            logger.error(f'File not found: {file_path}')
            return jsonify({"error": "File not found"}), 404

        # Create a new classification with 100% confidence for manual reclassification
        try:
            # Convert string to AssetType enum
            asset_type_enum = AssetType(new_asset_type)
            classification = AssetTypeClassification(
                asset_type=asset_type_enum,
                confidence=1.0
            )
        except ValueError:
            return jsonify({
                "status": "error",
                "message": f"Invalid asset type: {new_asset_type}. Must be one of: {[t.value for t in AssetType]}"
            }), 400
        
        return jsonify({
            "status": "success",
            "asset_type": classification.asset_type.value,  # Get the string value from enum
            "confidence": classification.confidence
        }), 200
    except Exception as e:
        logger.error(f'Error during asset type reclassification: {str(e)}')
        return jsonify({
            "status": "error",
            "message": f"Error during asset type reclassification: {str(e)}"
        }), 500

@app.route("/")
def home():
    return "Welcome to Atlas Data's API!"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5601)