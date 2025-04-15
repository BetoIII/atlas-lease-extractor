from multiprocessing.managers import BaseManager
from flask import Flask, request, jsonify
import os
from werkzeug.utils import secure_filename
import sys
import time

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'temp_uploads'

# Create upload folder if it doesn't exist
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

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

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "Please send a POST request with a file"}), 400

    filepath = None
    try:
        uploaded_file = request.files["file"]
        if uploaded_file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        if not allowed_file(uploaded_file.filename):
            return jsonify({"error": "File type not allowed"}), 400

        filename = secure_filename(uploaded_file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        uploaded_file.save(filepath)

        # Send to index server for processing
        if request.form.get("filename_as_doc_id", None) is not None:
            success = manager.handle_file_upload(filepath, filename)._getvalue()
        else:
            success = manager.handle_file_upload(filepath)._getvalue()

        if not success:
            return jsonify({"error": "Failed to process file"}), 500

    except ConnectionRefusedError:
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({"error": "Lost connection to index server"}), 503
    except Exception as e:
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({"error": str(e)}), 500

    # Cleanup temp file
    if filepath and os.path.exists(filepath):
        os.remove(filepath)

    return jsonify({"message": "File successfully uploaded and indexed"}), 200

@app.route("/query", methods=["GET"])
def query_index():
    query_text = request.args.get("text", None)
    if query_text is None:
        return jsonify({
            "error": "No text found, please include a ?text=blah parameter in the URL"
        }), 400
    
    try:
        response = manager.query_index(query_text)._getvalue()
        return jsonify({"response": str(response)}), 200
    except ConnectionRefusedError:
        return jsonify({"error": "Lost connection to index server"}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/")
def home():
    return "Welcome to LamaCloud API!"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5601)