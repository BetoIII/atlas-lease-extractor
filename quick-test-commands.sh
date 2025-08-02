#!/bin/bash

# Quick Test Commands for Manage Doc Flow

echo "🧪 Testing Document Registration API..."

# Test document registration endpoint
curl -X POST http://localhost:5601/register-document \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Lease Document",
    "file_path": "/test/lease.pdf",
    "user_id": "test-user-123",
    "sharing_type": "firm",
    "extracted_data": {"tenant": "Test Tenant"},
    "risk_flags": ["test-flag"],
    "asset_type": "office"
  }' | jq '.'

echo -e "\n📋 Testing User Documents API..."

# Test user documents retrieval
curl -X GET http://localhost:5601/user-documents/test-user-123 | jq '.'

echo -e "\n🔍 Testing Document Activities API..."

# Test activities retrieval (replace doc-id with actual ID from above)
# curl -X GET http://localhost:5601/document-activities/{doc-id} | jq '.'

echo -e "\n✅ API tests complete!"
echo "Next: Test the frontend flow manually using the checklist in test-manage-doc-flow.md"