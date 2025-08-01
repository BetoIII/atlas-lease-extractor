#!/usr/bin/env python3
"""
Simple script to test database connectivity and basic operations
"""
import os
from dotenv import load_dotenv
load_dotenv()

from database import db_manager, Document, BlockchainActivity

def test_database():
    print("Testing database connection...")
    
    try:
        # Test database connection
        db_manager.create_tables()
        print("✓ Database tables created successfully")
        
        # Create a test user first
        from database import User
        session = db_manager.get_session()
        try:
            # Check if user already exists
            existing_user = session.query(User).filter(User.id == 'test_user_123').first()
            if not existing_user:
                test_user = User(
                    id='test_user_123',
                    email='test@example.com',
                    name='Test User'
                )
                session.add(test_user)
                session.commit()
                print("✓ Test user created")
            else:
                print("✓ Test user already exists")
        finally:
            session.close()
        
        # Test document creation
        test_doc_data = {
            'title': 'Test Lease Document',
            'file_path': '/uploads/test_lease.pdf',
            'user_id': 'test_user_123',
            'sharing_type': 'firm',
            'shared_emails': ['colleague@example.com'],
            'license_fee': 100.0,
            'extracted_data': {'property_type': 'office', 'monthly_rent': 5000},
            'risk_flags': ['late_payment_clause'],
            'asset_type': 'office'
        }
        
        document = db_manager.create_document(test_doc_data)
        document_id = document.id  # Store the ID before session closes
        print(f"✓ Document created with ID: {document_id}")
        
        # Test document retrieval
        documents = db_manager.get_user_documents('test_user_123')
        print(f"✓ Retrieved {len(documents)} documents for user")
        
        # Test activity retrieval
        activities = db_manager.get_document_activities(document_id)
        print(f"✓ Retrieved {len(activities)} activities for document")
        
        # Print some activity details
        for activity in activities:
            print(f"  - {activity.action}: {activity.details}")
            print(f"    TX Hash: {activity.tx_hash}")
            print(f"    Block: {activity.block_number}")
        
        print("\n✅ All database tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

if __name__ == "__main__":
    test_database()