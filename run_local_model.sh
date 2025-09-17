#!/bin/bash

# Script to run key terms extractor with local Ollama model
# Make sure Ollama is running first: ollama serve

echo "🦙 Configuring environment for local Ollama model..."

# Set environment variables for local model
export LLM_PROVIDER="ollama"
export LLM_MODEL="llama3.1:8b"
export LLM_TEMPERATURE="0.1"
export LLM_MAX_TOKENS="2048"
export LLM_STREAMING="false"  # Disable streaming for local models
export OLLAMA_BASE_URL="http://localhost:11434"

# Optional: Use local embeddings
export EMBED_PROVIDER="huggingface"
export EMBED_MODEL="BAAI/bge-small-en-v1.5"

echo "Environment configured:"
echo "  LLM_PROVIDER: $LLM_PROVIDER"
echo "  LLM_MODEL: $LLM_MODEL"
echo "  LLM_STREAMING: $LLM_STREAMING"
echo "  OLLAMA_BASE_URL: $OLLAMA_BASE_URL"
echo "  EMBED_PROVIDER: $EMBED_PROVIDER"
echo ""

# Check if Ollama is running
echo "🔍 Checking if Ollama is running..."
if curl -s "$OLLAMA_BASE_URL/api/tags" > /dev/null 2>&1; then
    echo "✅ Ollama is running"
else
    echo "❌ Ollama is not running or not accessible"
    echo "Please start Ollama first: ollama serve"
    exit 1
fi

# Check if the model is available
echo "🔍 Checking if model $LLM_MODEL is available..."
if curl -s "$OLLAMA_BASE_URL/api/tags" | grep -q "$LLM_MODEL"; then
    echo "✅ Model $LLM_MODEL is available"
else
    echo "⚠️  Model $LLM_MODEL not found. Installing..."
    ollama pull "$LLM_MODEL"
fi

echo ""
echo "🚀 Running key terms extractor with local model..."
echo "File: ${1:-data/2019-2022-Lease-Agreement-TETCO-Signed-tiny.pdf}"
echo ""

# Run the extractor
python3 key_terms_extractor.py "${1:-data/2019-2022-Lease-Agreement-TETCO-Signed-tiny.pdf}" --save
