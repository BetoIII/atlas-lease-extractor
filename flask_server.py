from multiprocessing.managers import BaseManager
from flask import Flask, request, jsonify
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
from dotenv import load_dotenv
from lease_summary_agent_schema import LeaseSummary
from lease_summary_extractor import LeaseSummaryExtractor
from lease_flags_extractor import LeaseFlagsExtractor
from lease_flags_schema import LeaseFlagsSchema
import chromadb
from llama_index.core import load_index_from_storage
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core import StorageContext
from llama_index.llms.openai import OpenAI

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
    manager.register("handle_file_upload")
    
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
            success = manager.handle_file_upload(filepath)._getvalue()
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
        agent = llama_manager.get_agent(llama_manager.AGENT_NAME)
        agent.data_schema = LeaseSummary.model_json_schema()
        agent.save()
        return jsonify({
            "status": "success",
            "message": "Lease summary agent schema updated successfully",
            "schema": agent.data_schema
        }), 200
    except Exception as e:
        logger.error(f'Error updating lease summary agent schema: {str(e)}')
        return jsonify({
            "status": "error",
            "message": f"Error updating lease summary agent schema: {str(e)}"
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
        extractor = LeaseSummaryExtractor()
        summary_result = extractor.process_document(filepath)
        # Access attributes directly
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

@app.route("/extract-lease-flags", methods=["POST"])
def extract_lease_flags():
    logger.info('Received lease flags extraction request')
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
        extractor = LeaseFlagsExtractor()
        flags_result = extractor.process_document(filepath)
        # Access attributes directly
        data = getattr(flags_result, 'data', {})
        extraction_metadata = getattr(flags_result, 'extraction_metadata', {})
        return jsonify({
            "status": "success",
            "data": data,
            "sourceData": extraction_metadata,
            "message": "Lease flags extraction completed successfully"
        }), 200
    except Exception as e:
        logger.error(f'Error during lease flags extraction: {str(e)}')
        return jsonify({
            "status": "error",
            "message": f"Error during lease flags extraction: {str(e)}"
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
        output_parser = PydanticOutputParser(LeaseFlagsSchema)
        
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

@app.route("/")
def home():
    return "Welcome to Atlas Data's API!"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5601)