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
from flask import Flask, request, jsonify, Response, stream_template
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import sys
import time
import asyncio
from asgiref.sync import async_to_sync
from pathlib import Path
import logging
from logging.handlers import RotatingFileHandler
from llama_cloud_manager import LlamaCloudManager
import requests
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
import subprocess
import threading
import queue
from asset_type_classification import classify_asset_type, AssetTypeClassification, AssetType
from risk_flags import risk_flags_query_pipeline
from database import db_manager, Document, BlockchainActivity, BLOCKCHAIN_EVENTS

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

@app.route("/stream-risk-flags", methods=["POST", "GET"])
def stream_risk_flags():
    """
    Stream risk flags extraction using the risk_flags pipeline.
    """
    logger.info('Received streaming risk flags extraction request')
    
    filename = None
    
    # Check if it's a file upload or filename-based request
    if "file" in request.files:
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
    else:
        # Check for filename in JSON data
        data = request.get_json() or {}
        if 'filename' in data:
            filename = data['filename']

    def generate():
        """Generator function for streaming responses"""
        try:
            if not filename:
                yield f"data: {json.dumps({'status': 'error', 'error': 'No filename provided', 'is_complete': True})}\n\n"
                return
                
            file_path = os.path.join("uploaded_documents", filename)
            if not os.path.exists(file_path):
                yield f"data: {json.dumps({'status': 'error', 'error': f'File not found: {filename}', 'is_complete': True})}\n\n"
                return
                
            result = extract_risk_flags_pipeline(file_path)
            yield f"data: {json.dumps({'status': 'complete', 'data': result, 'is_complete': True})}\n\n"
                    
        except Exception as e:
            error_response = {
                "status": "error",
                "error": f"Streaming error: {str(e)}",
                "is_complete": True
            }
            yield f"data: {json.dumps(error_response)}\n\n"

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': 'http://localhost:3000',
            'Access-Control-Allow-Credentials': 'true'
        }
    )

@app.route("/stream-lease-flags", methods=["POST"])
def stream_lease_flags():
    """
    Stream lease flags extraction from uploaded file or indexed documents.
    Supports both file upload and filename-based extraction.
    """
    logger.info('Received streaming lease flags extraction request')
    
    filename = None
    
    # Check if it's a file upload or filename-based request
    if "file" in request.files:
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
        
        # Index the file first
        try:
            success = manager.upload_file(filepath)
            if not success:
                logger.error('Failed to index uploaded file')
                return jsonify({"error": "Failed to index uploaded file"}), 500
        except Exception as e:
            logger.error(f'Error indexing uploaded file: {str(e)}')
            return jsonify({"error": f"Error indexing uploaded file: {str(e)}"}), 500
    else:
        # Check for filename in JSON data
        data = request.get_json()
        if data and 'filename' in data:
            filename = data['filename']

    def generate():
        """Generator function for streaming responses"""
        try:
            # Since stream_lease_flags_extraction doesn't exist, use pipeline approach
            if not filename:
                yield f"data: {json.dumps({'status': 'error', 'error': 'No filename provided', 'is_complete': True})}\n\n"
                return
                
            file_path = os.path.join("uploaded_documents", filename)
            if not os.path.exists(file_path):
                yield f"data: {json.dumps({'status': 'error', 'error': f'File not found: {filename}', 'is_complete': True})}\n\n"
                return
                
            result = extract_risk_flags_pipeline(file_path)
            yield f"data: {json.dumps({'status': 'complete', 'data': result, 'is_complete': True})}\n\n"
                    
        except Exception as e:
            error_response = {
                "status": "error",
                "error": f"Streaming error: {str(e)}",
                "is_complete": True
            }
            yield f"data: {json.dumps(error_response)}\n\n"

    return Response(
        generate(),
        mimetype='text/plain',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': 'http://localhost:3000',
            'Access-Control-Allow-Credentials': 'true'
        }
    )

@app.route("/stream-lease-flags-sse", methods=["POST", "GET"])
def stream_lease_flags_sse():
    """
    Stream risk flags extraction using the updated pipeline with real LlamaIndex streaming.
    Uses the risk_flags/risk_flags_query_pipeline.py with streaming enabled.
    Stream lease flags extraction using Server-Sent Events (SSE).
    Better for React frontend integration.
    Supports both POST (for file uploads) and GET (for EventSource connections).
    """
    logger.info('Received SSE streaming lease flags extraction request')
    
    filename = None
    
    if request.method == "POST":
        # Handle POST request (file upload or JSON data)
        if "file" in request.files:
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
            
            # Index the file first
            try:
                success = manager.upload_file(filepath)
                if not success:
                    logger.error('Failed to index uploaded file')
                    return jsonify({"error": "Failed to index uploaded file"}), 500
            except Exception as e:
                logger.error(f'Error indexing uploaded file: {str(e)}')
                return jsonify({"error": f"Error indexing uploaded file: {str(e)}"}), 500
        else:
            # Check for filename in JSON data
            data = request.get_json()
            if data and 'filename' in data:
                filename = data['filename']
    
    elif request.method == "GET":
        # Handle GET request (EventSource connection)
        # Get filename from query parameters if provided
        filename = request.args.get('filename', None)

    def generate():
        """Generator function for SSE streaming responses"""
        try:
            # Send initial connection event
            yield f"event: connected\ndata: {json.dumps({'status': 'connected', 'message': 'Starting extraction...'})}\n\n"
            
            # Use the actual pipeline function instead of non-existent stream function
            
            if not filename:
                yield f"event: error\ndata: {json.dumps({'status': 'error', 'error': 'No filename provided', 'is_complete': True})}\n\n"
                return
                
            file_path = os.path.join("uploaded_documents", filename)
            if not os.path.exists(file_path):
                yield f"event: error\ndata: {json.dumps({'status': 'error', 'error': f'File not found: {filename}', 'is_complete': True})}\n\n"
                return
                
            result = extract_risk_flags_pipeline(file_path)
            yield f"event: complete\ndata: {json.dumps({'status': 'complete', 'data': result, 'is_complete': True})}\n\n"
                    
        except Exception as e:
            error_response = {
                "status": "error",
                "error": f"Streaming error: {str(e)}",
                "is_complete": True
            }
            yield f"event: error\ndata: {json.dumps(error_response)}\n\n"

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': 'http://localhost:3000',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    )

@app.route("/stream-lease-flags-pipeline", methods=["POST", "GET"])
def stream_lease_flags_pipeline():
    """
    Stream lease flags extraction using our updated pipeline with real LlamaIndex streaming.
    Now runs in-process instead of subprocess for better tracing integration.
    """
    logger.info('Received streaming risk flags extraction request')
    
    file_path = None
    
    if request.method == "POST":
        # Handle POST request (file upload or JSON data)
        if "file" in request.files:
            uploaded_file = request.files["file"]
            if uploaded_file.filename == '':
                logger.error('No selected file')
                return jsonify({"error": "No selected file"}), 400

            filename = secure_filename(uploaded_file.filename)
            upload_dir = "uploaded_documents"
            if not os.path.exists(upload_dir):
                os.makedirs(upload_dir)
            file_path = os.path.join(upload_dir, filename)
            uploaded_file.save(file_path)
            
        else:
            # Check for filename in JSON data
            data = request.get_json()
            if data and 'filename' in data:
                filename = data['filename']
                # Find the file in uploaded_documents
                file_path = os.path.join("uploaded_documents", filename)
                if not os.path.exists(file_path):
                    logger.error(f'File not found: {file_path}')
                    return jsonify({"error": f"File not found: {filename}"}), 404
    
    elif request.method == "GET":
        # Handle GET request (EventSource connection)
        filename = request.args.get('filename', None)
        if filename:
            file_path = os.path.join("uploaded_documents", filename)
            if not os.path.exists(file_path):
                logger.error(f'File not found: {file_path}')
                return jsonify({"error": f"File not found: {filename}"}), 404

    def generate():
        """Generator function for real streaming responses from the pipeline"""
        try:
            # Send initial connection event
            yield f"event: connected\ndata: {json.dumps({'status': 'connected', 'message': 'Starting streaming extraction...'})}\n\n"
            
            if not file_path:
                error_response = {
                    "status": "error",
                    "error": "No file specified for extraction",
                    "is_complete": True
                }
                yield f"event: error\ndata: {json.dumps(error_response)}\n\n"
                return
            
            # Run the streaming pipeline as a subprocess to capture real-time output
            import subprocess
            import sys
            
            # Fixed path to the pipeline script in risk_flags directory
            process = subprocess.Popen(
                [sys.executable, 'risk_flags/risk_flags_query_pipeline.py', file_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            # Read output line by line for real-time streaming
            while True:
                output = process.stdout.readline()
                if output == '' and process.poll() is not None:
                    break
                
                if output:
                    line = output.strip()
                    logger.info(f"Pipeline output: {line}")
                    
                    # Parse streaming output and convert to structured data
                    if "Loading document:" in line:
                        yield f"event: progress\ndata: {json.dumps({'status': 'streaming', 'message': line, 'stage': 'loading'})}\n\n"
                    elif "Loaded" in line and "document(s)" in line:
                        yield f"event: progress\ndata: {json.dumps({'status': 'streaming', 'message': line, 'stage': 'loaded'})}\n\n"
                    elif "Creating new vector index" in line:
                        yield f"event: progress\ndata: {json.dumps({'status': 'streaming', 'message': line, 'stage': 'indexing'})}\n\n"
                    elif "Loading existing vector index" in line:
                        yield f"event: progress\ndata: {json.dumps({'status': 'streaming', 'message': line, 'stage': 'loading_index'})}\n\n"
                    elif "Querying the document for lease flags" in line:
                        yield f"event: progress\ndata: {json.dumps({'status': 'streaming', 'message': line, 'stage': 'querying'})}\n\n"
                    elif "Streaming response:" in line:
                        yield f"event: progress\ndata: {json.dumps({'status': 'streaming', 'message': 'Starting to receive streaming response from LLM...', 'stage': 'streaming_llm'})}\n\n"
                    elif line.startswith("LEASE FLAGS EXTRACTED:"):
                        yield f"event: progress\ndata: {json.dumps({'status': 'streaming', 'message': 'Extraction completed, processing results...', 'stage': 'processing'})}\n\n"
                    elif line and not line.startswith("=") and not line.startswith("-"):
                        # This is likely streaming text from the LLM
                        yield f"event: progress\ndata: {json.dumps({'status': 'streaming', 'message': line, 'stage': 'llm_response', 'text': line})}\n\n"
            
            # Wait for process to complete
            return_code = process.wait()
            
            if return_code == 0:
                # Process completed successfully, try to read the JSON output file
                import glob
                json_files = glob.glob(f"lease_flags_{os.path.basename(file_path)}.json")
                
                if json_files:
                    with open(json_files[0], 'r') as f:
                        result_data = json.load(f)
                    
                    # Clean up the JSON file
                    os.remove(json_files[0])
                    
                    yield f"event: complete\ndata: {json.dumps({'status': 'complete', 'data': result_data, 'is_complete': True})}\n\n"
                else:
                    # Fallback: try to extract from stderr or create empty result
                    stderr_output = process.stderr.read()
                    logger.warning(f"No JSON output file found. stderr: {stderr_output}")
                    
                    empty_result = {"lease_flags": []}
                    yield f"event: complete\ndata: {json.dumps({'status': 'complete', 'data': empty_result, 'is_complete': True, 'message': 'Extraction completed but no flags found'})}\n\n"
            else:
                # Process failed
                stderr_output = process.stderr.read()
                error_response = {
                    "status": "error",
                    "error": f"Pipeline execution failed: {stderr_output}",
                    "is_complete": True
                }
                yield f"event: error\ndata: {json.dumps(error_response)}\n\n"
            # Send progress updates
            yield f"event: progress\ndata: {json.dumps({'status': 'streaming', 'message': f'Loading document: {file_path}', 'stage': 'loading'})}\n\n"
            
            yield f"event: progress\ndata: {json.dumps({'status': 'streaming', 'message': 'Processing with LlamaIndex pipeline...', 'stage': 'indexing'})}\n\n"
            
            yield f"event: progress\ndata: {json.dumps({'status': 'streaming', 'message': 'Querying the document for lease flags', 'stage': 'querying'})}\n\n"
            
            yield f"event: progress\ndata: {json.dumps({'status': 'streaming', 'message': 'Starting to receive streaming response from LLM...', 'stage': 'streaming_llm'})}\n\n"
            
            # Run the pipeline function in-process (this will be traced!)
            result = extract_risk_flags_pipeline(file_path)
            
            yield f"event: progress\ndata: {json.dumps({'status': 'streaming', 'message': 'Extraction completed, processing results...', 'stage': 'processing'})}\n\n"
            
            yield f"event: complete\ndata: {json.dumps({'status': 'complete', 'data': result, 'is_complete': True})}\n\n"
                
        except Exception as e:
            logger.error(f"Error in streaming pipeline: {str(e)}")
            error_response = {
                "status": "error",
                "error": f"Streaming error: {str(e)}",
                "is_complete": True
            }
            yield f"event: error\ndata: {json.dumps(error_response)}\n\n"

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': 'http://localhost:3000',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    )

@app.route("/extract-lease-flags-streaming", methods=["POST"])
def extract_lease_flags_streaming():
    """
    Non-streaming endpoint that uses the streaming extractor but returns complete result.
    Useful for testing and as a fallback.
    """
    logger.info('Received lease flags streaming extraction request (non-streaming response)')
    
    filename = None
    
    # Check if it's a file upload or filename-based request
    if "file" in request.files:
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
        
        # Index the file first
        try:
            success = manager.upload_file(filepath)
            if not success:
                logger.error('Failed to index uploaded file')
                return jsonify({"error": "Failed to index uploaded file"}), 500
        except Exception as e:
            logger.error(f'Error indexing uploaded file: {str(e)}')
            return jsonify({"error": f"Error indexing uploaded file: {str(e)}"}), 500
    else:
        # Check for filename in JSON data
        data = request.get_json()
        if data and 'filename' in data:
            filename = data['filename']

    try:
        # Use the pipeline function directly        
        if not filename:
            return jsonify({
                "status": "error",
                "message": "No filename provided"
            }), 400
            
        file_path = os.path.join("uploaded_documents", filename)
        if not os.path.exists(file_path):
            return jsonify({
                "status": "error",
                "message": f"File not found: {filename}"
            }), 404
            
        result = extract_risk_flags_pipeline(file_path)
        
        return jsonify({
            "status": "success",
            "data": result.get("data", {}),
            "message": "Lease flags extraction completed successfully using streaming extractor",
            "extraction_method": "streaming_rag_pipeline"
        }), 200
        
    except Exception as e:
        logger.error(f'Error during streaming lease flags extraction: {str(e)}')
        return jsonify({
            "status": "error",
            "message": f"Error during streaming lease flags extraction: {str(e)}"
        }), 500

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

# User Management Endpoints

@app.route("/sync-user", methods=["POST"])
def sync_user():
    """
    Sync user from better-auth to Flask users table.
    This ensures user exists before document registration.
    """
    logger.info('Received user sync request')
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Required fields
        required_fields = ['user_id', 'email']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        user_id = data['user_id']
        email = data['email']
        name = data.get('name')

        # Sync user to Flask users table
        try:
            user = db_manager.sync_user_from_auth(user_id, email, name)
            
            return jsonify({
                "status": "success",
                "message": "User synced successfully",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "created_at": user.created_at.isoformat() if user.created_at else None
                }
            })
            
        except Exception as e:
            logger.error(f'Error syncing user: {str(e)}')
            return jsonify({
                "status": "error", 
                "message": f"Database error during user sync: {str(e)}"
            }), 500

    except Exception as e:
        logger.error(f'Error processing user sync request: {str(e)}')
        return jsonify({
            "status": "error",
            "message": f"Error processing request: {str(e)}"
        }), 500

# Document Registration and Management Endpoints

@app.route("/register-document", methods=["POST"])
def register_document():
    """
    Register a document with the system and create initial blockchain activity.
    This is the handoff point from try-it-now to logged-in experience.
    """
    logger.info('Received document registration request')
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Required fields
        required_fields = ['file_path', 'title', 'sharing_type', 'user_id']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        file_path = data['file_path']
        title = data['title']
        sharing_type = data['sharing_type']  # private, firm, external, license, coop
        user_id = data['user_id']
        
        # Optional fields
        shared_emails = data.get('shared_emails', [])
        license_fee = data.get('license_fee', 0)
        extracted_data = data.get('extracted_data', {})
        risk_flags = data.get('risk_flags', [])
        asset_type = data.get('asset_type', 'office')

        # Ensure user exists in Flask database before creating document
        # This is a fallback in case the sync-user endpoint wasn't called
        try:
            if not db_manager.user_exists(user_id):
                logger.info(f'User {user_id} does not exist, attempting to create from available data')
                # Try to get user email from the request data or use a placeholder
                user_email = data.get('user_email', f'{user_id}@temp.local')
                user_name = data.get('user_name', 'Unknown User')
                db_manager.sync_user_from_auth(user_id, user_email, user_name)
                logger.info(f'Created user {user_id} in Flask database')
        except Exception as user_creation_error:
            logger.error(f'Failed to create user {user_id}: {str(user_creation_error)}')
            # Continue anyway - the foreign key error will provide a clearer message

        # Save document to database with blockchain activities
        try:
            document = db_manager.create_document({
                'title': title,
                'file_path': file_path,
                'user_id': user_id,
                'sharing_type': sharing_type,
                'shared_emails': shared_emails,
                'license_fee': license_fee,
                'extracted_data': extracted_data,
                'risk_flags': risk_flags,
                'asset_type': asset_type
            })
            
            # Get all activities for the document
            activities = db_manager.get_document_activities(document.id)
            
            # Convert SQLAlchemy objects to dictionaries for JSON response
            document_record = {
                "id": document.id,
                "title": document.title,
                "file_path": document.file_path,
                "user_id": document.user_id,
                "sharing_type": document.sharing_type,
                "shared_emails": document.shared_emails,
                "license_fee": document.license_fee,
                "extracted_data": document.extracted_data,
                "risk_flags": document.risk_flags,
                "asset_type": document.asset_type,
                "activities": [{
                    "id": activity.id,
                    "action": activity.action,
                    "timestamp": activity.timestamp.timestamp(),
                    "actor": activity.actor,
                    "type": activity.activity_type,
                    "status": activity.status,
                    "details": activity.details,
                    "tx_hash": activity.tx_hash,
                    "block_number": activity.block_number,
                    "gas_used": activity.gas_used
                } for activity in activities],
                "created_at": document.created_at.timestamp(),
                "status": document.status,
                "ownership_type": document.ownership_type
            }
            
        except Exception as e:
            logger.error(f'Database error during document registration: {str(e)}')
            return jsonify({
                "status": "error",
                "message": f"Database error: {str(e)}"
            }), 500
        
        logger.info(f'Document registered successfully: {document.id}')
        return jsonify({
            "status": "success",
            "document": document_record,
            "activity_count": len(activities)
        }), 200
        
    except Exception as e:
        logger.error(f'Error during document registration: {str(e)}')
        return jsonify({
            "status": "error",
            "message": f"Error during document registration: {str(e)}"
        }), 500

@app.route("/document/<document_id>", methods=["GET"])
def get_document_by_id(document_id):
    """
    Get a single document by ID with optimized query.
    """
    logger.info(f'Fetching document: {document_id}')
    try:
        document = db_manager.get_document_by_id(document_id)
        
        if not document:
            return jsonify({
                "status": "error",
                "message": "Document not found"
            }), 404
        
        # Convert to response format
        doc_data = {
            "id": document.id,
            "title": document.title,
            "file_path": document.file_path,
            "user_id": document.user_id,
            "sharing_type": document.sharing_type,
            "shared_emails": document.shared_emails,
            "license_fee": document.license_fee,
            "extracted_data": document.extracted_data,
            "risk_flags": document.risk_flags,
            "asset_type": document.asset_type,
            "activities": [{
                "id": activity.id,
                "action": activity.action,
                "timestamp": activity.timestamp.timestamp(),
                "actor": activity.actor,
                "type": activity.activity_type,
                "status": activity.status,
                "details": activity.details,
                "tx_hash": activity.tx_hash,
                "block_number": activity.block_number,
                "gas_used": activity.gas_used
            } for activity in document.activities],
            "created_at": document.created_at.timestamp(),
            "status": document.status,
            "ownership_type": document.ownership_type,
            "revenue_generated": document.revenue_generated
        }
        
        return jsonify({
            "status": "success",
            "document": doc_data
        }), 200
        
    except Exception as e:
        logger.error(f'Error fetching document: {str(e)}')
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route("/user-documents/<user_id>", methods=["GET"])
def get_user_documents(user_id):
    """
    Get all documents for a specific user.
    """
    logger.info(f'Fetching documents for user: {user_id}')
    try:
        documents = db_manager.get_user_documents(user_id)
        
        # Convert SQLAlchemy objects to dictionaries
        documents_data = []
        for doc in documents:
            activities = db_manager.get_document_activities(doc.id)
            doc_data = {
                "id": doc.id,
                "title": doc.title,
                "file_path": doc.file_path,
                "user_id": doc.user_id,
                "sharing_type": doc.sharing_type,
                "shared_emails": doc.shared_emails,
                "license_fee": doc.license_fee,
                "extracted_data": doc.extracted_data,
                "risk_flags": doc.risk_flags,
                "asset_type": doc.asset_type,
                "activities": [{
                    "id": activity.id,
                    "action": activity.action,
                    "timestamp": activity.timestamp.timestamp(),
                    "actor": activity.actor,
                    "type": activity.activity_type,
                    "status": activity.status,
                    "details": activity.details,
                    "tx_hash": activity.tx_hash,
                    "block_number": activity.block_number,
                    "gas_used": activity.gas_used
                } for activity in activities],
                "created_at": doc.created_at.timestamp(),
                "status": doc.status,
                "ownership_type": doc.ownership_type,
                "revenue_generated": doc.revenue_generated
            }
            documents_data.append(doc_data)
        
        return jsonify({
            "status": "success",
            "documents": documents_data,
            "count": len(documents_data)
        }), 200
        
    except Exception as e:
        logger.error(f'Error fetching user documents: {str(e)}')
        return jsonify({
            "status": "error", 
            "message": f"Error fetching user documents: {str(e)}"
        }), 500

@app.route("/document-activities/<document_id>", methods=["GET"])
def get_document_activities(document_id):
    """
    Get all blockchain activities for a specific document.
    """
    logger.info(f'Fetching activities for document: {document_id}')
    try:
        activities = db_manager.get_document_activities(document_id)
        
        # Convert SQLAlchemy objects to dictionaries
        activities_data = [{
            "id": activity.id,
            "action": activity.action,
            "timestamp": activity.timestamp.timestamp(),
            "actor": activity.actor,
            "actor_name": getattr(activity, 'actor_name', None),
            "type": activity.activity_type,
            "status": activity.status,
            "details": activity.details,
            "tx_hash": activity.tx_hash,
            "block_number": activity.block_number,
            "gas_used": activity.gas_used,
            "revenue_impact": activity.revenue_impact,
                            # "metadata": getattr(activity, 'activity_metadata', {})  # Temporarily commented out
        } for activity in activities]
        
        return jsonify({
            "status": "success",
            "activities": activities_data,
            "count": len(activities_data)
        }), 200
        
    except Exception as e:
        logger.error(f'Error fetching document activities: {str(e)}')
        return jsonify({
            "status": "error",
            "message": f"Error fetching document activities: {str(e)}"
        }), 500

@app.route("/add-blockchain-activity", methods=["POST"])
def add_blockchain_activity():
    """
    Add a new blockchain activity to a document.
    Used for events like document downloads, license expired, sharing revoked, etc.
    """
    logger.info('Received add blockchain activity request')
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Required fields
        required_fields = ['document_id', 'action', 'actor']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        document_id = data['document_id']
        action = data['action']
        actor = data['actor']
        
        # Optional fields
        details = data.get('details', f"{action.replace('_', ' ').title()} event")
        activity_type = data.get('type', 'access')  # Default to access type
        revenue_impact = data.get('revenue_impact', 0.0)
        metadata = data.get('metadata', {})

        # Validate action against known blockchain events
        if action not in BLOCKCHAIN_EVENTS:
            logger.warning(f'Unknown blockchain action: {action}')
            # Still allow it, but use default type
            activity_type = activity_type or 'misc'
        else:
            activity_type = BLOCKCHAIN_EVENTS[action]['type']
            if not details or details == f"{action.replace('_', ' ').title()} event":
                details = BLOCKCHAIN_EVENTS[action]['description']

        # Add the blockchain activity
        activity = db_manager.add_blockchain_activity(document_id, {
            'action': action,
            'type': activity_type,
            'actor': actor,
            'details': details,
            'revenue_impact': revenue_impact,
            'metadata': metadata
        })

        # Activity is now returned as a dict from add_blockchain_activity
        activity_data = activity.copy()
        # Convert timestamp to timestamp format if it's a datetime object
        if hasattr(activity['timestamp'], 'timestamp'):
            activity_data['timestamp'] = activity['timestamp'].timestamp()
        else:
            activity_data['timestamp'] = activity['timestamp']
        
        # Rename activity_type to type for frontend compatibility
        activity_data['type'] = activity_data.pop('activity_type')

        logger.info(f'Blockchain activity added successfully: {activity_data["id"]}')
        return jsonify({
            "status": "success",
            "activity": activity_data
        }), 200
        
    except Exception as e:
        logger.error(f'Error adding blockchain activity: {str(e)}')
        return jsonify({
            "status": "error",
            "message": f"Error adding blockchain activity: {str(e)}"
        }), 500

@app.route("/blockchain-events", methods=["GET"])
def get_blockchain_events():
    """
    Get all available blockchain event types.
    """
    return jsonify({
        "status": "success",
        "events": BLOCKCHAIN_EVENTS
    }), 200

@app.route("/share-with-firm/<document_id>", methods=["POST"])
def share_with_firm(document_id):
    """
    Share a document with firm members.
    """
    logger.info(f'Sharing document {document_id} with firm')
    try:
        data = request.get_json() or {}
        ledger_events = data.get('ledger_events', [])
        
        # In a real implementation, this would:
        # 1. Query SCIM directory for firm members
        # 2. Send notifications to all firm members
        # 3. Update document permissions
        # 4. Create blockchain transaction
        
        activity_data = {
            'action': 'SHARE_WITH_FIRM',
            'type': 'sharing',
            'actor': 'user',
            'details': 'Document shared with firm members through SCIM directory integration',
            'revenue_impact': 0
        }
        
        # Add ledger events if provided
        if ledger_events:
            activity_data['ledger_events'] = ledger_events
        
        activity = db_manager.add_blockchain_activity(document_id, activity_data)
        
        return jsonify({
            "status": "success",
            "message": "Document successfully shared with firm",
            "activity_id": activity["id"]
        }), 200
        
    except Exception as e:
        logger.error(f'Error sharing with firm: {str(e)}')
        return jsonify({
            "status": "error",
            "message": f"Error sharing with firm: {str(e)}"
        }), 500

@app.route("/share-with-external/<document_id>", methods=["POST"])
def share_with_external(document_id):
    """
    Share a document with external parties.
    """
    logger.info(f'Sharing document {document_id} with external parties')
    try:
        data = request.get_json()
        shared_emails = data.get('shared_emails', [])
        ledger_events = data.get('ledger_events', [])
        
        if not shared_emails:
            return jsonify({"error": "No email addresses provided"}), 400
        
        # In a real implementation, this would:
        # 1. Create secure access tokens for each email
        # 2. Send invitation emails with access links
        # 3. Update document permissions
        # 4. Create blockchain transaction
        
        activity_data = {
            'action': 'INVITE_PARTNER',
            'type': 'sharing',
            'actor': 'user',
            'details': f"Document shared with {len(shared_emails)} external partner{'s' if len(shared_emails) > 1 else ''}: {', '.join(shared_emails)}",
            'revenue_impact': 0
        }
        
        # Add ledger events if provided
        if ledger_events:
            activity_data['ledger_events'] = ledger_events
        
        activity = db_manager.add_blockchain_activity(document_id, activity_data)
        
        return jsonify({
            "status": "success",
            "message": f"Document successfully shared with {len(shared_emails)} external partner{'s' if len(shared_emails) > 1 else ''}",
            "activity_id": activity["id"],
            "shared_emails": shared_emails
        }), 200
        
    except Exception as e:
        logger.error(f'Error sharing with external parties: {str(e)}')
        return jsonify({
            "status": "error",
            "message": f"Error sharing with external parties: {str(e)}"
        }), 500

@app.route("/create-license/<document_id>", methods=["POST"])
def create_license(document_id):
    """
    Create a license offer for a document.
    """
    logger.info(f'Creating license offer for document {document_id}')
    try:
        data = request.get_json()
        licensed_emails = data.get('licensed_emails', [])
        monthly_fee = data.get('monthly_fee', 0)
        ledger_events = data.get('ledger_events', [])
        
        if not licensed_emails:
            return jsonify({"error": "No email addresses provided"}), 400
        
        if monthly_fee <= 0:
            return jsonify({"error": "Monthly fee must be greater than 0"}), 400
        
        # In a real implementation, this would:
        # 1. Create license terms and conditions
        # 2. Set up payment processing
        # 3. Send license offers to potential licensees
        # 4. Create blockchain transaction for the license offer
        
        total_potential_revenue = monthly_fee * len(licensed_emails)
        
        activity_data = {
            'action': 'CREATE_LICENSE_OFFER',
            'type': 'licensing',
            'actor': 'user',
            'details': f"License offer created for {len(licensed_emails)} party{'ies' if len(licensed_emails) > 1 else ''} at ${monthly_fee} USDC/month: {', '.join(licensed_emails)}",
            'revenue_impact': total_potential_revenue
        }
        
        # Add ledger events if provided
        if ledger_events:
            activity_data['ledger_events'] = ledger_events
        
        activity = db_manager.add_blockchain_activity(document_id, activity_data)
        
        return jsonify({
            "status": "success",
            "message": f"License offer created for ${monthly_fee} USDC/month",
            "activity_id": activity["id"],
            "licensed_emails": licensed_emails,
            "monthly_fee": monthly_fee,
            "potential_revenue": total_potential_revenue
        }), 200
        
    except Exception as e:
        logger.error(f'Error creating license: {str(e)}')
        return jsonify({
            "status": "error",
            "message": f"Error creating license: {str(e)}"
        }), 500

@app.route("/share-with-coop/<document_id>", methods=["POST"])
def share_with_coop(document_id):
    """
    Share a document with the data co-op marketplace.
    """
    logger.info(f'Publishing document {document_id} to data co-op marketplace')
    try:
        data = request.get_json()
        price_usdc = data.get('price_usdc', 0)
        license_template = data.get('license_template', 'Data Co-op Standard')
        ledger_events = data.get('ledger_events', [])
        
        if price_usdc <= 0:
            return jsonify({"error": "Invalid price"}), 400
        
        # In a real implementation, this would:
        # 1. Create marketplace listing with pricing
        # 2. Set up royalty distribution (95% owner, 5% DAO)
        # 3. Index the document for marketplace search
        # 4. Create blockchain transaction for the listing
        
        owner_revenue = int(price_usdc * 0.85)  # 85% to owner
        
        activity_data = {
            'action': 'PUBLISH_TO_MARKETPLACE',
            'type': 'licensing',
            'actor': 'user',
            'details': f"Document published to Atlas Data Co-op marketplace at ${price_usdc} USDC with {license_template} license",
            'revenue_impact': owner_revenue
        }
        
        # Add ledger events if provided
        if ledger_events:
            activity_data['ledger_events'] = ledger_events
        
        activity = db_manager.add_blockchain_activity(document_id, activity_data)
        
        return jsonify({
            "status": "success",
            "message": f"Document published to marketplace at ${price_usdc} USDC",
            "activity_id": activity["id"],
            "price_usdc": price_usdc,
            "license_template": license_template,
            "owner_revenue_per_sale": owner_revenue
        }), 200
        
    except Exception as e:
        logger.error(f'Error sharing with coop: {str(e)}')
        return jsonify({
            "status": "error",
            "message": f"Error sharing with coop: {str(e)}"
        }), 500

@app.route("/document-sharing-state/<document_id>", methods=['GET'])
def get_document_sharing_state(document_id):
    """Get the current sharing state of a document based on its activities"""
    try:
        logger.info(f"Getting sharing state for document: {document_id}")
        
        # Get all activities for this document
        activities = db_manager.get_document_activities(document_id)
        
        sharing_state = {
            'firm_shared': False,
            'firm_share_details': None,
            'external_shares': [],
            'licenses': [],
            'marketplace_status': None
        }
        
        for activity in activities:
            if activity.action == 'SHARE_WITH_FIRM' and activity.status == 'success':
                sharing_state['firm_shared'] = True
                sharing_state['firm_share_details'] = {
                    'shared_at': activity.timestamp.isoformat() if activity.timestamp else None,
                    'actor': activity.actor_name or activity.actor,
                    'details': activity.details,
                    'extra_data': activity.extra_data
                }
            
            elif activity.action == 'SHARE_EXTERNAL' and activity.status == 'success':
                external_share = {
                    'shared_at': activity.timestamp.isoformat() if activity.timestamp else None,
                    'actor': activity.actor_name or activity.actor,
                    'details': activity.details,
                    'extra_data': activity.extra_data,
                    'batch_id': activity.extra_data.get('batch_id') if activity.extra_data else None
                }
                sharing_state['external_shares'].append(external_share)
            
            elif activity.action == 'CREATE_LICENSE_OFFER' and activity.status == 'success':
                license_info = {
                    'created_at': activity.timestamp.isoformat() if activity.timestamp else None,
                    'actor': activity.actor_name or activity.actor,
                    'details': activity.details,
                    'extra_data': activity.extra_data,
                    'monthly_fee': activity.extra_data.get('monthly_fee') if activity.extra_data else None,
                    'licensed_emails': activity.extra_data.get('licensed_emails') if activity.extra_data else []
                }
                sharing_state['licenses'].append(license_info)
            
            elif activity.action == 'SHARE_MARKETPLACE' and activity.status == 'success':
                sharing_state['marketplace_status'] = {
                    'shared_at': activity.timestamp.isoformat() if activity.timestamp else None,
                    'actor': activity.actor_name or activity.actor,
                    'details': activity.details,
                    'extra_data': activity.extra_data
                }
        
        return jsonify({
            "status": "success",
            "sharing_state": sharing_state
        }), 200
        
    except Exception as e:
        logger.error(f'Error getting document sharing state: {str(e)}')
        return jsonify({
            "status": "error",
            "message": f"Error getting document sharing state: {str(e)}"
        }), 500

@app.route("/activity/<activity_id>/ledger-events", methods=['GET'])
def get_activity_ledger_events(activity_id):
    """Get ledger events for a specific blockchain activity"""
    try:
        logger.info(f"Getting ledger events for activity: {activity_id}")
        
        # Get ledger events from database
        ledger_events = db_manager.get_activity_ledger_events(activity_id)
        
        return jsonify({
            "status": "success",
            "ledger_events": ledger_events
        }), 200
        
    except Exception as e:
        logger.error(f'Error getting ledger events: {str(e)}')
        return jsonify({
            "status": "error",
            "message": f"Error getting ledger events: {str(e)}"
        }), 500

@app.route("/")
def home():
    return "Welcome to Atlas Data's API!"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5601)