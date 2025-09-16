import os
from dotenv import load_dotenv
load_dotenv()
# Initialize LlamaTrace Phoenix observability (only if properly configured)
phoenix_api_key = os.getenv("PHOENIX_API_KEY")

# Only initialize Phoenix if we have a real API key (not the default placeholder)
if phoenix_api_key and phoenix_api_key != "YOUR_PHOENIX_API_KEY":
    try:
        import llama_index.core
        
        # Set Phoenix API key for LlamaTrace
        os.environ["OTEL_EXPORTER_OTLP_HEADERS"] = f"api_key={phoenix_api_key}"
        
        # Set global handler for Arize Phoenix via LlamaTrace
        llama_index.core.set_global_handler(
            "arize_phoenix", 
            endpoint="https://llamatrace.com/v1/traces"
        )
        print("✅ LlamaTrace Phoenix observability initialized successfully")
    except Exception as e:
        print(f"⚠️  LlamaTrace Phoenix setup failed: {e}")
else:
    print("ℹ️  Phoenix observability disabled (no API key configured)")
from multiprocessing.managers import BaseManager
from multiprocessing.context import AuthenticationError as MPAuthenticationError
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.exceptions import HTTPException
import sys
import time
import logging
from datetime import datetime
from logging.handlers import RotatingFileHandler
from llama_cloud_manager import LlamaCloudManager
from lease_summary_extractor import LeaseSummaryExtractor
from risk_flags.risk_flags_extractor import RiskFlagsExtractor
from risk_flags.risk_flags_schema import RiskFlagsSchema
import chromadb
from llama_index.core import load_index_from_storage
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core import StorageContext
from llama_index.core.output_parsers import PydanticOutputParser
from llama_index.core.prompts import PromptTemplate
import json
import threading
import queue
from asset_type_classification import classify_asset_type, AssetTypeClassification, AssetType
from database import db_manager, Document, BlockchainActivity, BLOCKCHAIN_EVENTS
from sqlalchemy.exc import SQLAlchemyError
from google_drive_auth import GoogleDriveAuth
from google_drive_ingestion import GoogleDriveIngestion
from database import GoogleDriveFile, GoogleDriveSync
from key_terms_extractor import KeyTermsExtractor
import shutil

# Load environment variables
load_dotenv()

# Initialize LlamaCloud Manager
llama_manager = LlamaCloudManager()
index = llama_manager.get_index()

# Initialize Google Drive components (optional)
google_auth = None
google_ingestion = None

try:
    google_auth = GoogleDriveAuth()
    google_ingestion = GoogleDriveIngestion(google_auth)
    print("Google Drive integration enabled")
except ValueError as e:
    print(f"Google Drive integration disabled: {e}")
    print("To enable Google Drive integration, set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables")

def check_google_drive_available():
    """Check if Google Drive integration is available"""
    if google_auth is None or google_ingestion is None:
        return False, jsonify({
            "error": "Google Drive integration not available",
            "message": "Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables"
        }), 503
    return True, None, None

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
CORS(app, origins=["http://localhost:3000", "http://localhost:3001"], supports_credentials=True)

# Server configuration - must match index_server.py
INDEX_SERVER_HOST = os.getenv("INDEX_SERVER_HOST", "127.0.0.1")
INDEX_SERVER_PORT = int(os.getenv("INDEX_SERVER_PORT", "5602"))

def _runtime_env() -> str:
    """Get runtime environment with robust detection."""
    env_vars = ["FLASK_ENV", "ENV", "NODE_ENV", "ENVIRONMENT"]
    for var in env_vars:
        env_value = os.getenv(var)
        if env_value and env_value.strip():
            return env_value.strip().lower()
    return "development"

def validate_index_server_key(key_value: str | None, env_override: str | None = None) -> bytes:
    """Validate and return an index server key.
    - If a non-default key (not 'change-me') of sufficient length (>=16) is provided, use it.
    - In development, generate an ephemeral key if missing.
    - In production, missing/weak keys raise RuntimeError.
    """
    env = (env_override or _runtime_env()).lower()
    if key_value and key_value != "change-me" and len(key_value) >= 16:
        return key_value.encode()
    if env in ("development", "dev", "local"):
        rand_key = os.urandom(32)
        logger.warning("INDEX_SERVER_KEY not set; generating ephemeral key for development. Set INDEX_SERVER_KEY in production.")
        return rand_key
    raise RuntimeError("INDEX_SERVER_KEY is required in production and must be >=16 bytes and not 'change-me'.")

def _load_dev_key_from_file() -> bytes:
    """Load or persist a dev key to ensure both processes share the same key in development."""
    path = os.getenv("INDEX_SERVER_KEY_FILE", ".dev_index_server.key")
    try:
        if os.path.exists(path):
            with open(path, "rb") as f:
                data = f.read()
            if isinstance(data, (bytes, bytearray)) and len(data) >= 16:
                return data
        key = os.urandom(32)
        with open(path, "wb") as f:
            f.write(key)
        try:
            os.chmod(path, 0o600)
        except (PermissionError, OSError):
            # Best effort on permissions
            pass
        return key
    except OSError:
        # Fall back to in-memory ephemeral if filesystem not writable
        return os.urandom(32)

def _load_index_server_key() -> bytes:
    """Load a secure key for the index server.
    - In production, env var INDEX_SERVER_KEY is REQUIRED and must not be 'change-me'.
    - In development, if not set, persist/load a local key file so both processes share the same key.
    """
    env = _runtime_env()
    env_val = os.getenv("INDEX_SERVER_KEY")
    if env_val:
        return validate_index_server_key(env_val, env_override=env)
    if env in ("development", "dev", "local"):
        return _load_dev_key_from_file()
    return validate_index_server_key(None, env_override=env)

INDEX_SERVER_KEY = _load_index_server_key()

def connect_to_index_server(max_retries=5, retry_delay=2):
    """Connect to the index server with retries"""
    manager = BaseManager((INDEX_SERVER_HOST, INDEX_SERVER_PORT), INDEX_SERVER_KEY)
    manager.register("query")
    manager.register("upload_file")
    
    for attempt in range(max_retries):
        try:
            print(f"Attempting to connect to index server (attempt {attempt + 1}/{max_retries})...")
            manager.connect()
            print("Successfully connected to index server!")
            return manager
        except (ConnectionRefusedError, MPAuthenticationError):
            if attempt < max_retries - 1:
                print(f"Connection failed, retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                raise
    
    raise ConnectionError("Failed to connect to index server after maximum retries")

# Initialize manager connection (non-fatal if index server is down)
manager = None
_manager_lock = threading.Lock()
_manager_ready = threading.Event()

def initialize_manager_async(max_retries=0, retry_delay=5):
    def _attempt_connect():
        global manager
        attempts = 0
        while True:
            try:
                connected_manager = connect_to_index_server()
                with _manager_lock:
                    manager = connected_manager
                    _manager_ready.set()
                logger.info("Connected to index server")
                break
            except (ConnectionError, ConnectionRefusedError, OSError, TimeoutError, MPAuthenticationError) as e:
                attempts += 1
                logger.warning(f"Index server unavailable: {e}. Retrying in {retry_delay}s...")
                if max_retries and attempts >= max_retries:
                    logger.error("Max retries reached. Continuing without index server.")
                    break
                time.sleep(retry_delay)
    threading.Thread(target=_attempt_connect, daemon=True).start()

initialize_manager_async()
def get_index_manager(force_connect: bool = True):
    """Thread-safe accessor for the shared index manager.
    When force_connect is True and manager is None, attempt a direct connection
    under the lock to avoid concurrent connection attempts.
    """
    global manager
    with _manager_lock:
        if manager is None and force_connect:
            manager = connect_to_index_server()
            _manager_ready.set()
        return manager


ALLOWED_EXTENSIONS = {'txt', 'pdf', 'doc', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def run_asset_type_classification(file_path: str, result_queue: queue.Queue):
    """Run asset type classification in a separate thread and put result in queue"""
    try:
        logger.info(f"Starting asset type classification for: {file_path}")
        classification = classify_asset_type(file_path)
        logger.info(f"Asset type classification completed: {classification.asset_type.value} (confidence: {classification.confidence})")
        result_queue.put({
            "status": "success",
            "asset_type": classification.asset_type.value,  # Get the string value from enum
            "confidence": classification.confidence
        })
    except (RuntimeError, OSError, ValueError, TypeError) as e:
        logger.exception('Error during asset type classification')
        if "Subscripted generics cannot be used with class and instance checks" in str(e):
            logger.error("Python 3.13 compatibility issue detected with LlamaIndex")
            result_queue.put({
                "status": "error",
                "message": "Asset type classification failed due to Python 3.13 compatibility issue. Please try again."
            })
        else:
            result_queue.put({
                "status": "error",
                "message": "Asset type classification failed"
            })

@app.errorhandler(HTTPException)
def handle_http_exception(e):
    response = e.get_response()
    response.data = json.dumps({"status": "error", "message": e.description})
    response.content_type = "application/json"
    return response, e.code

@app.errorhandler(Exception)
def handle_general_exception(e):
    logger.exception("Unhandled exception")
    return jsonify({"status": "error", "message": "Internal server error"}), 500

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

        # Ensure index server manager is available (lazy connect if needed)
        global manager
        mgr = manager
        if mgr is None:
            try:
                mgr = connect_to_index_server()
                manager = mgr
            except (ConnectionError, ConnectionRefusedError, OSError, TimeoutError) as conn_err:
                logger.error(f'Index server unavailable: {str(conn_err)}')
                return jsonify({"error": "Index server unavailable", "details": str(conn_err)}), 503

        # Index the file with the index server
        try:
            success = mgr.upload_file(filepath)
            if not success:
                logger.error('Failed to index file with index server')
                return jsonify({"error": "Failed to index file"}), 500
        except (ConnectionError, ConnectionRefusedError) as e:
            logger.error(f'Index server connection error: {str(e)}')
            return jsonify({"error": "Index server connection failed"}), 503
        except (RuntimeError, OSError, ValueError):
            logger.exception('Error indexing file')
            return jsonify({"error": "Error indexing file"}), 500

        return jsonify({
            "status": "success",
            "filepath": filepath
        }), 200
    except (OSError, ValueError) as e:
        logger.error(f'Bad indexing request: {str(e)}')
        return jsonify({"error": f"Bad indexing request: {str(e)}"}), 400
    except RuntimeError as e:
        logger.exception('Error during indexing')
        return jsonify({"error": "Internal server error"}), 500

@app.route("/query", methods=["GET"])
def query_index():
    logger.info('Received query request')
    query_text = request.args.get("text", None)
    if query_text is None:
        return jsonify({
            "error": "No text found, please include a ?text=blah parameter in the URL"
        }), 400

    # Get both retrieval results and query response
    nodes = index.as_retriever().retrieve(query_text)
    response = index.as_query_engine().query(query_text)

    logger.info('Query processed successfully')
    return jsonify({
        "response": str(response),
        "retrieved_nodes": [str(node) for node in nodes]
    }), 200

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
    except (ValueError, RuntimeError, TypeError):
        logger.exception('Error updating extraction agent')
        return jsonify({
            "status": "error",
            "message": "Failed to update extraction agent"
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
    except (ValueError, RuntimeError):
        logger.exception('Test error updating risk flags agent')
        return jsonify({
            "status": "error",
            "message": "Test error"
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
    except (RuntimeError, OSError):
        logger.exception('Error during lease summary extraction')
        return jsonify({
            "status": "error",
            "message": "Lease summary extraction failed"
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
    except (RuntimeError, OSError):
        logger.exception('Error during risk flags extraction')
        return jsonify({
            "status": "error",
            "message": "Risk flags extraction failed"
        }), 500

@app.route("/stream-key-terms", methods=["POST", "GET"])
def stream_key_terms():
    """
    Stream key terms extraction using the hybrid approach.
    Supports both file upload (POST) and filename parameter (GET).
    Returns Server-Sent Events (SSE) with live extraction progress.
    """
    logger.info('Received streaming key terms extraction request')
    
    def generate():
        try:
            # Determine file path based on request method
            if request.method == "POST":
                if "file" not in request.files:
                    yield f"data: {json.dumps({'status': 'error', 'error': 'No file provided'})}\n\n"
                    return
                
                uploaded_file = request.files["file"]
                if uploaded_file.filename == '':
                    yield f"data: {json.dumps({'status': 'error', 'error': 'No file selected'})}\n\n"
                    return
                
                filename = secure_filename(uploaded_file.filename)
                upload_dir = "uploaded_documents"
                if not os.path.exists(upload_dir):
                    os.makedirs(upload_dir)
                filepath = os.path.join(upload_dir, filename)
                uploaded_file.save(filepath)
            else:  # GET request
                filename = request.args.get("filename")
                if not filename:
                    yield f"data: {json.dumps({'status': 'error', 'error': 'No filename provided'})}\n\n"
                    return
                
                filepath = os.path.join("uploaded_documents", secure_filename(filename))
                if not os.path.exists(filepath):
                    yield f"data: {json.dumps({'status': 'error', 'error': 'File not found'})}\n\n"
                    return
            
            # Send initial connection event
            yield f"event: connected\ndata: {json.dumps({'status': 'connected', 'message': 'Starting key terms extraction with streaming...', 'filepath': filepath})}\n\n"
            
            # Create a custom extractor that yields progress
            yield f"event: progress\ndata: {json.dumps({'status': 'streaming', 'stage': 'initializing', 'message': 'Initializing extractor...'})}\n\n"
            
            try:
                # Initialize the extractor
                extractor = KeyTermsExtractor()
                
                # Send indexing progress
                yield f"event: progress\ndata: {json.dumps({'status': 'streaming', 'stage': 'indexing', 'message': 'Indexing document in LlamaCloud...'})}\n\n"
                
                # Process the document (this will stream internally but we can't capture that here)
                # For true streaming, we'd need to modify the extractor to yield events
                result = extractor.process_document(filepath)
                
                # Send completion event with results
                if result.get("status") == "success":
                    yield f"event: complete\ndata: {json.dumps({'status': 'complete', 'data': result['data'], 'metadata': result.get('extraction_metadata', {}), 'is_complete': True})}\n\n"
                else:
                    yield f"event: error\ndata: {json.dumps({'status': 'error', 'error': result.get('message', 'Extraction failed'), 'is_complete': True})}\n\n"
                    
            except Exception as e:
                logger.exception('Error during streaming key terms extraction')
                yield f"event: error\ndata: {json.dumps({'status': 'error', 'error': str(e), 'is_complete': True})}\n\n"
                
        except Exception as e:
            logger.exception('Error in stream generator')
            yield f"event: error\ndata: {json.dumps({'status': 'error', 'error': 'Internal server error', 'is_complete': True})}\n\n"
    
    return Response(generate(), mimetype="text/event-stream")

@app.route("/extract-key-terms", methods=["POST"])
def extract_key_terms():
    """
    Non-streaming key terms extraction endpoint.
    Uses the hybrid approach with LlamaCloud caching.
    """
    logger.info('Received key terms extraction request')
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
        # Use the key terms extractor
        extractor = KeyTermsExtractor()
        result = extractor.process_document(filepath)
        
        if result.get("status") == "success":
            return jsonify({
                "status": "success",
                "data": result["data"],
                "sourceData": result.get("extraction_metadata", {}),
                "message": "Key terms extraction completed successfully"
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": result.get("message", "Key terms extraction failed"),
                "sourceData": result.get("extraction_metadata", {})
            }), 500
            
    except (RuntimeError, OSError):
        logger.exception('Error during key terms extraction')
        return jsonify({
            "status": "error",
            "message": "Key terms extraction failed"
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
    except (RuntimeError, OSError):
        logger.exception('Error during lease extraction')
        return jsonify({
            "status": "error",
            "message": "Lease extraction failed"
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
    except (RuntimeError, OSError, ValueError):
        logger.exception('Error in /rag-query')
        return jsonify({"error": "Query failed"}), 500

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
            
    except (RuntimeError, OSError, ValueError):
        logger.exception('Error in lease flag query')
        return jsonify({"error": "Lease flag query failed"}), 500

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
    except (RuntimeError, OSError):
        logger.exception('Error listing indexed documents')
        return jsonify({"error": "Failed to list indexed documents"}), 500





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
        classification_thread.join(timeout=60)  # 60 second timeout should be sufficient

        if result_queue.empty():
            logger.error("Asset type classification timed out after 60 seconds")
            return jsonify({
                "status": "error",
                "message": "Asset type classification timed out"
            }), 504

        result = result_queue.get()
        if result["status"] == "error":
            logger.error(f"Asset type classification failed: {result['message']}")
            return jsonify(result), 500

        logger.info(f"Asset type classification response: {result}")
        return jsonify(result), 200
    except (RuntimeError, OSError, TypeError) as e:
        logger.exception('Error during asset type classification')
        if "Subscripted generics cannot be used with class and instance checks" in str(e):
            logger.error("Python 3.13 compatibility issue detected with LlamaIndex")
            return jsonify({
                "status": "error", 
                "message": "Asset type classification failed due to Python 3.13 compatibility issue. Please try again."
            }), 500
        else:
            return jsonify({
                "status": "error",
                "message": "Asset type classification failed"
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
    except (RuntimeError, ValueError):
        logger.exception('Error during asset type reclassification')
        return jsonify({
            "status": "error",
            "message": "Asset type reclassification failed"
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
            
        except SQLAlchemyError as e:
            logger.error(f'Database error during user sync: {str(e)}')
            return jsonify({
                "status": "error", 
                "message": "Database error during user sync"
            }), 500
        except RuntimeError:
            logger.exception('Error syncing user')
            return jsonify({
                "status": "error", 
                "message": "Unexpected error during user sync"
            }), 500

    except (RuntimeError, ValueError, TypeError):
        logger.exception('Error processing user sync request')
        return jsonify({
            "status": "error",
            "message": "Error processing request"
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
        except SQLAlchemyError as user_creation_error:
            logger.error(f'Database error while ensuring user {user_id}: {str(user_creation_error)}')
        except RuntimeError as user_creation_error:
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
            
        except SQLAlchemyError as e:
            logger.error(f'Database error during document registration: {str(e)}')
            return jsonify({
                "status": "error",
                "message": "Database error during document registration"
            }), 500
        except RuntimeError:
            logger.exception('Unexpected error during document registration')
            return jsonify({
                "status": "error",
                "message": "Unexpected error during document registration"
            }), 500
        
        logger.info(f'Document registered successfully: {document.id}')
        return jsonify({
            "status": "success",
            "document": document_record,
            "activity_count": len(activities)
        }), 200
        
    except RuntimeError:
        logger.exception('Error during document registration')
        return jsonify({
            "status": "error",
            "message": "Error during document registration"
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
        
    except RuntimeError:
        logger.exception('Error fetching document')
        return jsonify({
            "status": "error",
            "message": "Failed to fetch document"
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
        
    except RuntimeError:
        logger.exception('Error fetching user documents')
        return jsonify({
            "status": "error", 
            "message": "Error fetching user documents"
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
        
    except RuntimeError:
        logger.exception('Error fetching document activities')
        return jsonify({
            "status": "error",
            "message": "Error fetching document activities"
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
        
    except SQLAlchemyError as e:
        logger.error(f'Database error adding blockchain activity: {str(e)}')
        return jsonify({
            "status": "error",
            "message": "Database error adding blockchain activity"
        }), 500
    except RuntimeError:
        logger.exception('Error adding blockchain activity')
        return jsonify({
            "status": "error",
            "message": "Error adding blockchain activity"
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
        
    except RuntimeError:
        logger.exception('Error sharing with firm')
        return jsonify({
            "status": "error",
            "message": "Error sharing with firm"
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
        
    except RuntimeError:
        logger.exception('Error sharing with external parties')
        return jsonify({
            "status": "error",
            "message": "Error sharing with external parties"
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
        
    except RuntimeError:
        logger.exception('Error creating license')
        return jsonify({
            "status": "error",
            "message": "Error creating license"
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
        
    except RuntimeError:
        logger.exception('Error sharing with coop')
        return jsonify({
            "status": "error",
            "message": "Error sharing with coop"
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
        
    except RuntimeError:
        logger.exception('Error getting document sharing state')
        return jsonify({
            "status": "error",
            "message": "Error getting document sharing state"
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
        
    except RuntimeError:
        logger.exception('Error getting ledger events')
        return jsonify({
            "status": "error",
            "message": "Error getting ledger events"
        }), 500

# Google Drive Integration Endpoints

@app.route("/api/google-drive/auth/url", methods=["GET"])
def get_google_auth_url():
    """Get the Google OAuth authorization URL"""
    logger.info('Generating Google Drive auth URL')
    try:
        # Check if Google Drive integration is available
        available, error_response, status_code = check_google_drive_available()
        if not available:
            return error_response, status_code
            
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
        
        auth_url = google_auth.get_auth_url(user_id)
        return jsonify({
            "status": "success",
            "auth_url": auth_url
        }), 200
    except Exception as e:
        logger.error(f'Error generating auth URL: {str(e)}')
        return jsonify({
            "status": "error",
            "message": "Failed to generate authorization URL"
        }), 500

@app.route("/api/google-drive/auth/callback", methods=["GET", "POST"])
def google_auth_callback():
    """Handle Google OAuth callback"""
    logger.info('Handling Google Drive auth callback')
    try:
        # Get authorization code from query params
        code = request.args.get('code')
        state = request.args.get('state')  # This should contain user_id
        
        if not code:
            return jsonify({"error": "Authorization code not provided"}), 400
        
        # Exchange code for tokens
        result = google_auth.handle_callback(state, code)
        
        if result['success']:
            # In production, redirect to frontend success page
            return jsonify({
                "status": "success",
                "message": "Successfully connected to Google Drive",
                "user_email": result.get('user_email'),
                "display_name": result.get('display_name')
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": result.get('error', 'Authentication failed')
            }), 400
            
    except Exception as e:
        logger.error(f'OAuth callback error: {str(e)}')
        return jsonify({
            "status": "error",
            "message": "Authentication failed"
        }), 500

@app.route("/api/google-drive/auth/status", methods=["GET"])
def google_auth_status():
    """Check if user is authenticated with Google Drive"""
    logger.info('Checking Google Drive auth status')
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
        
        is_authenticated = google_auth.is_authenticated(user_id)
        return jsonify({
            "status": "success",
            "authenticated": is_authenticated
        }), 200
    except Exception as e:
        logger.error(f'Error checking auth status: {str(e)}')
        return jsonify({
            "status": "error",
            "message": "Failed to check authentication status"
        }), 500

@app.route("/api/google-drive/files", methods=["GET"])
def list_google_drive_files():
    """List files from Google Drive"""
    logger.info('Listing Google Drive files')
    try:
        user_id = request.args.get('user_id')
        folder_id = request.args.get('folder_id')
        page_token = request.args.get('page_token')
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
        
        # Get files from Google Drive
        result = google_ingestion.list_files(
            user_id=user_id,
            folder_id=folder_id,
            page_token=page_token
        )
        
        return jsonify({
            "status": "success",
            "files": result['files'],
            "nextPageToken": result.get('nextPageToken'),
            "totalFiles": result['totalFiles']
        }), 200
        
    except ValueError as e:
        logger.error(f'Auth error: {str(e)}')
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 401
    except Exception as e:
        logger.error(f'Error listing files: {str(e)}')
        return jsonify({
            "status": "error",
            "message": "Failed to list files"
        }), 500

@app.route("/api/google-drive/folders", methods=["GET"])
def list_google_drive_folders():
    """Get folder tree structure from Google Drive"""
    logger.info('Getting Google Drive folder tree')
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
        
        # Get folder tree
        folder_tree = google_ingestion.get_folder_tree(user_id)
        
        return jsonify({
            "status": "success",
            "folder_tree": folder_tree
        }), 200
        
    except ValueError as e:
        logger.error(f'Auth error: {str(e)}')
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 401
    except Exception as e:
        logger.error(f'Error getting folder tree: {str(e)}')
        return jsonify({
            "status": "error",
            "message": "Failed to get folder tree"
        }), 500

@app.route("/api/google-drive/sync", methods=["POST"])
def sync_google_drive():
    """Sync selected files from Google Drive to the RAG pipeline"""
    logger.info('Starting Google Drive sync')
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        user_id = data.get('user_id')
        file_ids = data.get('file_ids', [])
        folder_ids = data.get('folder_ids', [])
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
        
        if not file_ids and not folder_ids:
            return jsonify({"error": "No files or folders selected"}), 400
        
        # Create sync record
        sync_record = GoogleDriveSync(
            user_id=user_id,
            sync_type='manual',
            status='in_progress'
        )
        db_manager.session.add(sync_record)
        db_manager.session.commit()
        
        try:
            # Collect all files to sync
            all_files_to_sync = []
            
            # Add directly selected files
            if file_ids:
                # Get file metadata for selected files
                service = google_ingestion.auth_manager.get_credentials(user_id)
                if not service:
                    raise ValueError("User not authenticated")
                
                from googleapiclient.discovery import build
                service = build('drive', 'v3', credentials=google_ingestion.auth_manager.get_credentials(user_id))
                
                for file_id in file_ids:
                    file_metadata = service.files().get(
                        fileId=file_id,
                        fields="id, name, mimeType, size, modifiedTime, webViewLink"
                    ).execute()
                    all_files_to_sync.append(file_metadata)
            
            # Get all files from selected folders
            if folder_ids:
                folder_files = google_ingestion.get_files_in_folders(user_id, folder_ids)
                all_files_to_sync.extend(folder_files)
            
            # Download and process files
            download_results = []
            for file_metadata in all_files_to_sync:
                try:
                    # Check if file already exists in our database
                    existing_file = db_manager.session.query(GoogleDriveFile).filter_by(
                        drive_file_id=file_metadata['id'],
                        user_id=user_id
                    ).first()
                    
                    # Download file
                    local_path, original_name = google_ingestion.download_file(
                        user_id, file_metadata['id'], file_metadata
                    )
                    
                    # Move to permanent storage
                    permanent_path = os.path.join('uploaded_documents', f'gdrive_{user_id}_{original_name}')
                    shutil.move(local_path, permanent_path)
                    
                    # Create or update database record
                    if existing_file:
                        existing_file.drive_file_name = file_metadata['name']
                        existing_file.mime_type = file_metadata.get('mimeType')
                        existing_file.file_size = int(file_metadata.get('size', 0))
                        existing_file.drive_modified_time = datetime.fromisoformat(
                            file_metadata.get('modifiedTime', '').replace('Z', '+00:00')
                        ) if file_metadata.get('modifiedTime') else None
                        existing_file.last_synced = datetime.utcnow()
                        existing_file.local_file_path = permanent_path
                        existing_file.web_view_link = file_metadata.get('webViewLink')
                        existing_file.index_status = 'pending'
                    else:
                        drive_file = GoogleDriveFile(
                            user_id=user_id,
                            drive_file_id=file_metadata['id'],
                            drive_file_name=file_metadata['name'],
                            mime_type=file_metadata.get('mimeType'),
                            file_size=int(file_metadata.get('size', 0)),
                            drive_modified_time=datetime.fromisoformat(
                                file_metadata.get('modifiedTime', '').replace('Z', '+00:00')
                            ) if file_metadata.get('modifiedTime') else None,
                            local_file_path=permanent_path,
                            web_view_link=file_metadata.get('webViewLink'),
                            index_status='pending'
                        )
                        db_manager.session.add(drive_file)
                    
                    db_manager.session.commit()
                    
                    # Index the file with the RAG pipeline
                    try:
                        mgr = get_index_manager(force_connect=True)
                        if mgr:
                            success = mgr.upload_file(permanent_path)
                            if success:
                                if existing_file:
                                    existing_file.index_status = 'indexed'
                                else:
                                    drive_file.index_status = 'indexed'
                                db_manager.session.commit()
                                
                                download_results.append({
                                    'file_id': file_metadata['id'],
                                    'name': file_metadata['name'],
                                    'status': 'success',
                                    'indexed': True
                                })
                            else:
                                raise Exception("Failed to index file")
                        else:
                            raise Exception("Index server unavailable")
                    except Exception as index_error:
                        logger.error(f"Failed to index file {file_metadata['name']}: {str(index_error)}")
                        if existing_file:
                            existing_file.index_status = 'failed'
                            existing_file.index_error = str(index_error)
                        else:
                            drive_file.index_status = 'failed'
                            drive_file.index_error = str(index_error)
                        db_manager.session.commit()
                        
                        download_results.append({
                            'file_id': file_metadata['id'],
                            'name': file_metadata['name'],
                            'status': 'success',
                            'indexed': False,
                            'index_error': str(index_error)
                        })
                    
                    sync_record.files_processed += 1
                    
                except Exception as e:
                    logger.error(f"Failed to process file {file_metadata.get('name', 'unknown')}: {str(e)}")
                    download_results.append({
                        'file_id': file_metadata['id'],
                        'name': file_metadata.get('name', 'unknown'),
                        'status': 'error',
                        'error': str(e)
                    })
                    sync_record.files_failed += 1
            
            # Update sync record
            sync_record.status = 'completed'
            sync_record.completed_at = datetime.utcnow()
            db_manager.session.commit()
            
            return jsonify({
                "status": "success",
                "sync_id": sync_record.id,
                "files_processed": sync_record.files_processed,
                "files_failed": sync_record.files_failed,
                "results": download_results
            }), 200
            
        except Exception as e:
            # Update sync record with error
            sync_record.status = 'failed'
            sync_record.error_message = str(e)
            sync_record.completed_at = datetime.utcnow()
            db_manager.session.commit()
            raise
            
    except ValueError as e:
        logger.error(f'Auth error: {str(e)}')
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 401
    except Exception as e:
        logger.error(f'Error during sync: {str(e)}')
        return jsonify({
            "status": "error",
            "message": "Sync failed"
        }), 500

@app.route("/api/google-drive/sync/status/<int:sync_id>", methods=["GET"])
def get_sync_status(sync_id):
    """Get the status of a sync operation"""
    logger.info(f'Getting sync status for ID: {sync_id}')
    try:
        sync_record = db_manager.session.query(GoogleDriveSync).get(sync_id)
        if not sync_record:
            return jsonify({"error": "Sync record not found"}), 404
        
        return jsonify({
            "status": "success",
            "sync": sync_record.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f'Error getting sync status: {str(e)}')
        return jsonify({
            "status": "error",
            "message": "Failed to get sync status"
        }), 500

@app.route("/api/google-drive/synced-files", methods=["GET"])
def get_synced_files():
    """Get all synced Google Drive files for a user"""
    logger.info('Getting synced Google Drive files')
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
        
        # Query synced files
        synced_files = db_manager.session.query(GoogleDriveFile).filter_by(
            user_id=user_id
        ).order_by(GoogleDriveFile.last_synced.desc()).all()
        
        files_data = [file.to_dict() for file in synced_files]
        
        return jsonify({
            "status": "success",
            "files": files_data,
            "count": len(files_data)
        }), 200
        
    except Exception as e:
        logger.error(f'Error getting synced files: {str(e)}')
        return jsonify({
            "status": "error",
            "message": "Failed to get synced files"
        }), 500

@app.route("/api/google-drive/refresh/<drive_file_id>", methods=["POST"])
def refresh_google_drive_file(drive_file_id):
    """Refresh a single file from Google Drive"""
    logger.info(f'Refreshing Google Drive file: {drive_file_id}')
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
        
        # Get the file record
        drive_file = db_manager.session.query(GoogleDriveFile).filter_by(
            drive_file_id=drive_file_id,
            user_id=user_id
        ).first()
        
        if not drive_file:
            return jsonify({"error": "File not found"}), 404
        
        # Get latest file metadata from Google Drive
        from googleapiclient.discovery import build
        service = build('drive', 'v3', credentials=google_auth.get_credentials(user_id))
        
        file_metadata = service.files().get(
            fileId=drive_file_id,
            fields="id, name, mimeType, size, modifiedTime, webViewLink"
        ).execute()
        
        # Check if file has been modified
        drive_modified_time = datetime.fromisoformat(
            file_metadata.get('modifiedTime', '').replace('Z', '+00:00')
        ) if file_metadata.get('modifiedTime') else None
        
        if drive_modified_time and drive_file.drive_modified_time:
            if drive_modified_time <= drive_file.drive_modified_time:
                return jsonify({
                    "status": "success",
                    "message": "File is already up to date",
                    "modified": False
                }), 200
        
        # Download updated file
        local_path, original_name = google_ingestion.download_file(
            user_id, drive_file_id, file_metadata
        )
        
        # Replace the existing file
        if os.path.exists(drive_file.local_file_path):
            os.remove(drive_file.local_file_path)
        shutil.move(local_path, drive_file.local_file_path)
        
        # Update database record
        drive_file.drive_file_name = file_metadata['name']
        drive_file.mime_type = file_metadata.get('mimeType')
        drive_file.file_size = int(file_metadata.get('size', 0))
        drive_file.drive_modified_time = drive_modified_time
        drive_file.last_synced = datetime.utcnow()
        drive_file.web_view_link = file_metadata.get('webViewLink')
        drive_file.index_status = 'pending'
        
        # Re-index the file
        try:
            mgr = get_index_manager(force_connect=True)
            if mgr:
                success = mgr.upload_file(drive_file.local_file_path)
                if success:
                    drive_file.index_status = 'indexed'
                else:
                    drive_file.index_status = 'failed'
                    drive_file.index_error = 'Failed to index file'
        except Exception as index_error:
            drive_file.index_status = 'failed'
            drive_file.index_error = str(index_error)
        
        db_manager.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "File refreshed successfully",
            "modified": True,
            "file": drive_file.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f'Error refreshing file: {str(e)}')
        return jsonify({
            "status": "error",
            "message": "Failed to refresh file"
        }), 500

@app.route("/api/google-drive/disconnect", methods=["POST"])
def disconnect_google_drive():
    """Disconnect Google Drive integration"""
    logger.info('Disconnecting Google Drive')
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
        
        # Revoke access
        success = google_auth.revoke_access(user_id)
        
        if success:
            # Mark all user's Google Drive files as disconnected
            db_manager.session.query(GoogleDriveFile).filter_by(
                user_id=user_id
            ).update({
                'index_status': 'disconnected'
            })
            db_manager.session.commit()
            
            return jsonify({
                "status": "success",
                "message": "Google Drive disconnected successfully"
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": "Failed to disconnect Google Drive"
            }), 500
            
    except Exception as e:
        logger.error(f'Error disconnecting: {str(e)}')
        return jsonify({
            "status": "error",
            "message": "Failed to disconnect"
        }), 500

@app.route("/")
def home():
    return "Welcome to Atlas Data's API!"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5601)