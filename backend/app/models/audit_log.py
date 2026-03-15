# File: backend/app/models/audit_log.py
# Feature 12: Auditability - Log all agent actions

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON
from datetime import datetime
from app.db.session import Base


class AuditLog(Base):
    """Feature 12: Audit trail for all agent invocations"""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    # Context
    user_id = Column(Integer, nullable=True, index=True)
    session_id = Column(String, nullable=True, index=True)
    idea_id = Column(Integer, nullable=True, index=True)
    
    # Agent information
    agent_name = Column(String, nullable=False, index=True)
    agent_action = Column(String, nullable=False)
    
    # Input/Output
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    
    # Quality metrics
    quality_score = Column(Float, nullable=True)
    passed_validation = Column(String, default="pending")
    
    # Performance
    execution_time_ms = Column(Integer, nullable=True)
    
    # Status
    status = Column(String, default="success")
    error_message = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)