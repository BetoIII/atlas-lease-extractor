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
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'temp_uploads'
app.config['RESULTS_FOLDER'] = 'extraction_results'

# Create required folders if they don't exist
for folder in [app.config['UPLOAD_FOLDER'], app.config['RESULTS_FOLDER']]:
    if not os.path.exists(folder):
        os.makedirs(folder)

# Server configuration - must match index_server.py
SERVER_ADDRESS = ""  # Empty string means localhost
SERVER_PORT = 5602
SERVER_KEY = b"password"

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
        
        if extraction_result['status'] == 'success':
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
        return jsonify({"error": "No selected file"}), 400

    filepath = None
    try:
        uploaded_file = request.files["file"]
        if uploaded_file.filename == '':
            logger.error('No selected file')
            return jsonify({"error": "No selected file"}), 400

        if not allowed_file(uploaded_file.filename):
            logger.error(f'Invalid file type: {uploaded_file.filename}')
            return jsonify({"error": "File type not allowed"}), 400

        # Save to temp uploads folder
        filename = secure_filename(uploaded_file.filename)
        logger.info(f'Processing file: {filename}')
        
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        uploaded_file.save(filepath)

        # Send to index server for processing
        if request.form.get("filename_as_doc_id", None) is not None:
            success = manager.handle_file_upload(filepath, filename)._getvalue()
        else:
            success = manager.handle_file_upload(filepath)._getvalue()

        if not success:
            return jsonify({"error": "Failed to process file"}), 500

        logger.info(f'File {filename} successfully uploaded and processed')
        return jsonify({
            "status": "success",
            "message": "File successfully uploaded and indexed",
            "filename": filename
        }), 200

    except ConnectionRefusedError:
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({"error": "Lost connection to index server"}), 503
    except Exception as e:
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({"error": str(e)}), 500

@app.route("/query", methods=["GET"])
def query_index():
    logger.info('Received query request')
    query_text = request.args.get("text", None)
    if query_text is None:
        return jsonify({
            "error": "No text found, please include a ?text=blah parameter in the URL"
        }), 400
    
    try:
        response = manager.query_index(query_text)._getvalue()
        logger.info('Query processed successfully')
        return jsonify({"response": str(response)}), 200
    except ConnectionRefusedError:
        return jsonify({"error": "Lost connection to index server"}), 503
    except Exception as e:
        logger.error(f'Error processing query: {str(e)}')
        return jsonify({"error": str(e)}), 500

@app.route("/")
def home():
    return "Welcome to LamaCloud API!"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5601)