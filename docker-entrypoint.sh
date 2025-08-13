#!/bin/bash
set -e

# Function to handle shutdown
cleanup() {
    echo "Shutting down servers..."
    kill -TERM "$index_pid" "$flask_pid" 2>/dev/null || true
    wait "$index_pid" "$flask_pid" 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Validate environment in production
if [ "${FLASK_ENV:-development}" != "development" ] && [ "${NODE_ENV:-development}" != "development" ]; then
    echo "Production environment detected, validating configuration..."
    
    # Check required environment variables
    required_vars=(
        "OPENAI_API_KEY"
        "LLAMA_CLOUD_API_KEY" 
        "LLAMA_CLOUD_ORG_ID"
        "INDEX_SERVER_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo "ERROR: Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Validate INDEX_SERVER_KEY
    if [ "${INDEX_SERVER_KEY}" = "change-me" ] || [ ${#INDEX_SERVER_KEY} -lt 16 ]; then
        echo "ERROR: INDEX_SERVER_KEY must be at least 16 characters and not 'change-me'"
        exit 1
    fi
fi

# Wait for dependencies (if needed)
if [ -n "${POSTGRES_HOST}" ]; then
    echo "Waiting for PostgreSQL..."
    until nc -z "${POSTGRES_HOST}" "${POSTGRES_PORT:-5432}"; do
        sleep 1
    done
    echo "PostgreSQL is ready"
fi

# Initialize database if needed
if [ "${INIT_DB:-false}" = "true" ]; then
    echo "Initializing database..."
    python -c "from database import db_manager; db_manager.init_db()"
fi

echo "Starting Atlas Lease Extractor backend..."

# Start index server in background
echo "Starting Index Server on port 5602..."
python index_server.py &
index_pid=$!

# Give index server time to start
sleep 5

# Start Flask server in background
echo "Starting Flask API Server on port 5601..."
python flask_server.py &
flask_pid=$!

# Wait for both processes
wait "$index_pid" "$flask_pid"