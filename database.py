"""
Database models and operations for Atlas Lease Extractor
"""

import os
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Text, Boolean, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

# Database setup
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False)
    name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    documents = relationship("Document", back_populates="owner")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    
    # Document metadata
    sharing_type = Column(String, nullable=False)  # private, firm, external, license, coop
    asset_type = Column(String, default='office')
    status = Column(String, default='active')
    ownership_type = Column(String, default='owned')
    
    # Financial data
    license_fee = Column(Float, default=0.0)
    revenue_generated = Column(Float, default=0.0)
    
    # JSON fields for complex data
    shared_emails = Column(JSONB, default=lambda: [])
    extracted_data = Column(JSONB, default=lambda: {})
    risk_flags = Column(JSONB, default=lambda: [])
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="documents")
    activities = relationship("BlockchainActivity", back_populates="document", cascade="all, delete-orphan")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_documents_user_id', 'user_id'),
        Index('idx_documents_sharing_type', 'sharing_type'),
        Index('idx_documents_created_at', 'created_at'),
    )

class BlockchainActivity(Base):
    __tablename__ = "blockchain_activities"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey('documents.id'), nullable=False)
    
    # Activity details
    action = Column(String, nullable=False)  # REGISTER_ASSET, SHARE_WITH_FIRM, etc.
    activity_type = Column(String, nullable=False)  # origination, sharing, licensing, validation
    status = Column(String, default='success')  # success, pending, failed
    
    # Actor information
    actor = Column(String, nullable=False)  # user_id or system actor
    actor_name = Column(String)  # Human readable actor name
    
    # Transaction simulation
    tx_hash = Column(String)  # Simulated blockchain transaction hash
    block_number = Column(Integer)  # Simulated block number
    gas_used = Column(Integer)  # Simulated gas cost
    
    # Activity metadata
    details = Column(Text)
    extra_data = Column(JSONB, default=lambda: {})  # Additional activity-specific data
    
    # Financial impact
    revenue_impact = Column(Float, default=0.0)  # Revenue generated from this activity
    
    # Timestamps
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="activities")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_activities_document_id', 'document_id'),
        Index('idx_activities_action', 'action'),
        Index('idx_activities_type', 'activity_type'),
        Index('idx_activities_timestamp', 'timestamp'),
        Index('idx_activities_actor', 'actor'),
    )

# Database Operations

class DatabaseManager:
    def __init__(self):
        self.engine = engine
        self.SessionLocal = SessionLocal
    
    def create_tables(self):
        """Create all database tables"""
        Base.metadata.create_all(bind=self.engine)
    
    def get_session(self) -> Session:
        """Get a database session"""
        return self.SessionLocal()
    
    def create_document(self, document_data: Dict[str, Any]) -> Document:
        """Create a new document with initial blockchain activities"""
        session = self.get_session()
        try:
            # Create document
            document = Document(
                title=document_data['title'],
                file_path=document_data['file_path'],
                user_id=document_data['user_id'],
                sharing_type=document_data['sharing_type'],
                asset_type=document_data.get('asset_type', 'office'),
                license_fee=document_data.get('license_fee', 0.0),
                shared_emails=document_data.get('shared_emails', []),
                extracted_data=document_data.get('extracted_data', {}),
                risk_flags=document_data.get('risk_flags', [])
            )
            
            session.add(document)
            session.flush()  # Get the document ID
            
            # Create initial blockchain activities
            activities = self._generate_initial_activities(document, document_data)
            for activity_data in activities:
                activity = BlockchainActivity(
                    document_id=document.id,
                    action=activity_data['action'],
                    activity_type=activity_data['type'],
                    actor=activity_data['actor'],
                    details=activity_data['details'],
                    tx_hash=self._generate_tx_hash(),
                    block_number=self._generate_block_number(),
                    gas_used=self._generate_gas_cost(),
                    revenue_impact=activity_data.get('revenue_impact', 0.0)
                )
                session.add(activity)
            
            session.commit()
            session.refresh(document)  # Refresh to get updated attributes
            return document
            
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
    
    def get_user_documents(self, user_id: str) -> List[Document]:
        """Get all documents for a user"""
        session = self.get_session()
        try:
            return session.query(Document).filter(Document.user_id == user_id).order_by(Document.created_at.desc()).all()
        finally:
            session.close()
    
    def get_document_activities(self, document_id: str) -> List[BlockchainActivity]:
        """Get all blockchain activities for a document"""
        session = self.get_session()
        try:
            return session.query(BlockchainActivity).filter(
                BlockchainActivity.document_id == document_id
            ).order_by(BlockchainActivity.timestamp.desc()).all()
        finally:
            session.close()
    
    def add_blockchain_activity(self, document_id: str, activity_data: Dict[str, Any]) -> BlockchainActivity:
        """Add a new blockchain activity to a document"""
        session = self.get_session()
        try:
            activity = BlockchainActivity(
                document_id=document_id,
                action=activity_data['action'],
                activity_type=activity_data['type'],
                actor=activity_data['actor'],
                details=activity_data['details'],
                tx_hash=self._generate_tx_hash(),
                block_number=self._generate_block_number(),
                gas_used=self._generate_gas_cost(),
                revenue_impact=activity_data.get('revenue_impact', 0.0),
                extra_data=activity_data.get('extra_data', {})
            )
            
            session.add(activity)
            session.commit()
            return activity
            
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
    
    def _generate_initial_activities(self, document: Document, document_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate initial blockchain activities based on document registration"""
        activities = []
        
        # Always create REGISTER_ASSET activity
        activities.append({
            "action": "REGISTER_ASSET",
            "type": "origination",
            "actor": document.user_id,
            "details": "Document registered as digital asset"
        })
        
        # Add DECLARE_OWNER activity
        activities.append({
            "action": "DECLARE_OWNER", 
            "type": "origination",
            "actor": document.user_id,
            "details": "Document ownership declared on-chain"
        })

        # Add sharing-specific activities
        sharing_type = document_data['sharing_type']
        shared_emails = document_data.get('shared_emails', [])
        license_fee = document_data.get('license_fee', 0)
        
        if sharing_type == "firm":
            activities.append({
                "action": "SHARE_WITH_FIRM",
                "type": "sharing",
                "actor": document.user_id,
                "details": "Document shared with firm members"
            })
        elif sharing_type == "external" and shared_emails:
            for email in shared_emails:
                activities.append({
                    "action": "INVITE_PARTNER",
                    "type": "sharing",
                    "actor": document.user_id,
                    "details": f"Sent access rights to {email}"
                })
        elif sharing_type == "license":
            activities.append({
                "action": "CREATE_LICENSE_OFFER",
                "type": "licensing",
                "actor": document.user_id,
                "details": f"License offer created with ${license_fee} fee"
            })
        elif sharing_type == "coop":
            activities.append({
                "action": "PUBLISH_TO_MARKETPLACE",
                "type": "licensing",
                "actor": document.user_id,
                "details": "Document published to data co-op marketplace"
            })
        
        return activities
    
    def _generate_tx_hash(self) -> str:
        """Generate a simulated blockchain transaction hash"""
        return f"0x{uuid.uuid4().hex[:16]}"
    
    def _generate_block_number(self) -> int:
        """Generate a simulated block number"""
        import random
        return random.randint(18000000, 19000000)
    
    def _generate_gas_cost(self) -> int:
        """Generate a simulated gas cost"""
        import random
        return random.randint(21000, 150000)

# Additional blockchain event types for future use
BLOCKCHAIN_EVENTS = {
    # Document lifecycle
    'REGISTER_ASSET': {'type': 'origination', 'description': 'Document registered as digital asset'},
    'DECLARE_OWNER': {'type': 'origination', 'description': 'Document ownership declared on-chain'},
    'UPDATE_METADATA': {'type': 'validation', 'description': 'Document metadata updated'},
    
    # Sharing events
    'SHARE_WITH_FIRM': {'type': 'sharing', 'description': 'Document shared with firm members'},
    'INVITE_PARTNER': {'type': 'sharing', 'description': 'Partner invited to access document'},
    'ACCEPT_INVITE': {'type': 'sharing', 'description': 'Access invitation accepted'},
    'REVOKE_ACCESS': {'type': 'sharing', 'description': 'Document access revoked'},
    'SHARING_EXPIRED': {'type': 'sharing', 'description': 'Sharing access expired'},
    
    # Licensing events
    'CREATE_LICENSE_OFFER': {'type': 'licensing', 'description': 'License offer created'},
    'REQUEST_LICENSE': {'type': 'licensing', 'description': 'License requested by external party'},
    'ACCEPT_LICENSE': {'type': 'licensing', 'description': 'License agreement accepted'},
    'LICENSE_EXPIRED': {'type': 'licensing', 'description': 'License agreement expired'},
    'RELEASE_ESCROW': {'type': 'licensing', 'description': 'Escrow funds released'},
    
    # Access events
    'DOCUMENT_DOWNLOADED': {'type': 'access', 'description': 'Document downloaded by authorized party'},
    'DOCUMENT_VIEWED': {'type': 'access', 'description': 'Document viewed by authorized party'},
    'DATA_EXPORTED': {'type': 'access', 'description': 'Document data exported'},
    
    # Marketplace events
    'PUBLISH_TO_MARKETPLACE': {'type': 'licensing', 'description': 'Document published to marketplace'},
    'REMOVE_FROM_MARKETPLACE': {'type': 'licensing', 'description': 'Document removed from marketplace'},
    'PRICE_UPDATED': {'type': 'licensing', 'description': 'License price updated'},
    
    # Validation events
    'AI_ABSTRACT_SUBMIT': {'type': 'validation', 'description': 'AI-generated abstract submitted'},
    'ABSTRACT_VALIDATE': {'type': 'validation', 'description': 'Document abstract validated'},
    'COMPLIANCE_CHECK': {'type': 'validation', 'description': 'Compliance verification completed'},
}

# Initialize database manager
db_manager = DatabaseManager()

# Create tables on import
try:
    db_manager.create_tables()
    print("Database tables created successfully")
except Exception as e:
    print(f"Database initialization error: {e}")