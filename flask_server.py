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
from lease_extractor import main as extract_lease
from llama_index.indices.managed.llama_cloud import LlamaCloudIndex
from dotenv import load_dotenv
from update_lease_summary_agent import get_extraction_config, AGENT_ID, AGENT_NAME
from llama_cloud_manager import LlamaCloudManager
from lease_summary_extractor import LeaseSummaryExtractor
import requests

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


@app.route("/extract", methods=["POST"])
def extract_leases():
    """
    Extract information from a lease document.
    Expects a file path to a PDF in the request.
    """
    logger.info('Received lease extraction request')
    
    try:
        # Get file path from request
        file_data = request.get_json()
        if not file_data or 'file_path' not in file_data:
            logger.error('No file path provided in request')
            return jsonify({"error": "No file path provided"}), 400

        file_path = file_data['file_path']
        abs_file_path = os.path.abspath(file_path)
        
        if not os.path.exists(abs_file_path):
            logger.error(f'File not found: {abs_file_path}')
            return jsonify({"error": "File not found"}), 404
            
        # Call the lease extractor script
        extraction_result = extract_lease(abs_file_path)
        
        if extraction_result['status'] == 'success' and extraction_result['data']:
            logger.info('Lease extraction completed successfully')
            return jsonify({
                "status": "success",
                "data": extraction_result['data'],
                "message": "Lease extraction completed successfully"
            }), 200
        else:
            logger.error(f'Extraction failed: {extraction_result["status"]}')
            return jsonify({
                "status": "error",
                "message": f"Extraction failed: {extraction_result['status']}"
            }), 500
            
    except Exception as e:
        logger.error(f'Error during lease extraction: {str(e)}')
        return jsonify({
            "status": "error",
            "message": f"Error during lease extraction: {str(e)}"
        }), 500

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
    temp_dir = "temp_uploads"
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
    filepath = os.path.join(temp_dir, filename)
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
    """
    Update the extraction agent configuration.
    """
    logger.info('Received update extraction agent request')
    
    try:
        # Get the extraction configuration
        config = get_extraction_config()
        
        # Get the agent by ID directly
        agent = llama_manager.get_agent(AGENT_NAME)
        if not agent:
            logger.error('Failed to connect to extraction agent')
            return jsonify({
                "status": "error",
                "message": "Failed to connect to extraction agent"
            }), 500
            
        # Update the agent configuration using the SDK
        updated_agent = llama_manager.update_agent(
            agent_id=AGENT_ID,
            data_schema=config["data_schema"],
            config=config["config"]
        )
        
        if not updated_agent:
            logger.error('Failed to update extraction agent configuration')
            return jsonify({
                "status": "error",
                "message": "Failed to update extraction agent configuration"
            }), 500
            
        logger.info(f'Successfully updated agent configuration: {updated_agent.id}')
        return jsonify({
            "status": "success",
            "message": "Successfully updated extraction agent configuration",
            "agent_id": updated_agent.id,
            "agent_name": AGENT_NAME,
            "config": config
        }), 200
            
    except Exception as e:
        logger.error(f'Error updating extraction agent: {str(e)}')
        return jsonify({
            "status": "error", 
            "message": f"Error updating extraction agent: {str(e)}"
        }), 500

@app.route("/extract-summary", methods=["POST"])
def extract_summary():
    logger.info('Received lease summary extraction request')
    file_path = request.data.decode("utf-8").strip()
    if not file_path or not os.path.exists(file_path):
        logger.error('No valid file path provided in request')
        return jsonify({"status": "error", "message": "No valid file path provided"}), 400
    try:
        extractor = LeaseSummaryExtractor()
        summary_result = extractor.process_document(file_path)
        data = getattr(summary_result, 'data', summary_result)
        return jsonify({
            "status": "success",
            "data": data,
            "message": "Lease summary extraction completed successfully"
        }), 200
    except Exception as e:
        logger.error(f'Error during lease summary extraction: {str(e)}')
        return jsonify({
            "status": "error",
            "message": f"Error during lease summary extraction: {str(e)}"
        }), 500

@app.route("/")
def home():
    return "Welcome to Atlas Data's API!"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5601)