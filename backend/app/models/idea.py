# File: backend/app/models/idea.py
# Idea model for Feature 2: Input Collection & Feature 5: Structured Normalization

from sqlalchemy import Column, Integer, String, Text, Float, DateTime, JSON
from datetime import datetime
from app.db.session import Base


class UserInput(Base):
    """Feature 2: Stores raw user input (text/voice)"""
    __tablename__ = "user_inputs"

    id = Column(Integer, primary_key=True, index=True)
    clerk_user_id = Column(String, nullable=True, index=True)
    
    # Input data
    raw_input = Column(Text, nullable=False)
    input_type = Column(String, default="text")
    
    # Confidence tracking (Feature 2)
    confidence_score = Column(Float, default=1.0)
    needs_clarification = Column(String, default="no")
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class StructuredIdea(Base):
    """Feature 5: Normalized structured idea representation"""
    __tablename__ = "structured_ideas"

    id = Column(Integer, primary_key=True, index=True)
    user_input_id = Column(Integer, index=True)
    
    # Structured data as JSON
    structured_data = Column(JSON, nullable=False)
    
    # Versioning
    version = Column(Integer, default=1)
    
    # Completeness tracking
    is_complete = Column(String, default="no")
    missing_fields = Column(JSON, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)