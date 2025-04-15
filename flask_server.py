from multiprocessing.managers import BaseManager
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import sys
import time
import asyncio
from asgiref.sync import async_to_sync
from extract_lease_workflow import ExtractLease
from pathlib import Path
import logging
from logging.handlers import RotatingFileHandler

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
app.config['DATA_FOLDER'] = 'data'
app.config['RESULTS_FOLDER'] = 'extraction_results'

# Create required folders if they don't exist
for folder in [app.config['UPLOAD_FOLDER'], app.config['DATA_FOLDER'], app.config['RESULTS_FOLDER']]:
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

async def run_extraction_workflow():
    """Run the lease extraction workflow"""
    workflow = ExtractLease(timeout=300, verbose=True)  # 5 minute timeout
    result = await workflow.run()
    return result

@app.route("/extract", methods=["POST"])
def extract_leases():
    """
    Extract information from all lease documents in the data directory.
    Returns the extraction results for all processed documents.
    """
    logger.info('Received lease extraction request')
    try:
        # Run the extraction workflow using async_to_sync
        result = async_to_sync(run_extraction_workflow)()
        
        # Format the response
        response = {
            "status": "success",
            "results": result.result,  # Access the results from StopEvent
            "message": "Lease extraction completed successfully"
        }
        logger.info('Lease extraction completed successfully')
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f'Error during lease extraction: {str(e)}')
        error_response = {
            "status": "error",
            "message": f"Error during lease extraction: {str(e)}"
        }
        return jsonify(error_response), 500

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

        # Save to both temp uploads (for indexing) and data folder (for extraction)
        filename = secure_filename(uploaded_file.filename)
        logger.info(f'Processing file: {filename}')
        
        # Save to temp uploads for indexing
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        uploaded_file.save(filepath)
        
        # Also save to data folder for extraction
        data_filepath = os.path.join(app.config['DATA_FOLDER'], filename)
        uploaded_file.seek(0)  # Reset file pointer
        uploaded_file.save(data_filepath)

        # Send to index server for processing
        if request.form.get("filename_as_doc_id", None) is not None:
            success = manager.handle_file_upload(filepath, filename)._getvalue()
        else:
            success = manager.handle_file_upload(filepath)._getvalue()

        if not success:
            return jsonify({"error": "Failed to process file"}), 500

        logger.info(f'File {filename} successfully uploaded and processed')
        return jsonify({
            "message": "File successfully uploaded, indexed, and ready for extraction",
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

    # Cleanup temp file (but keep the one in data folder)
    if filepath and os.path.exists(filepath):
        os.remove(filepath)

    return jsonify({
        "message": "File successfully uploaded, indexed, and ready for extraction",
        "filename": filename
    }), 200

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