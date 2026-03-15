# File: backend/app/models/validation.py
# Database model for validation sessions - COMPLETE VERSION

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base


class ValidationSession(Base):
    """
    Stores validation sessions for startup ideas.
    Feature 6: Stores execution plans from Planner Agent.
    Feature 7+: Stores results from validation agents.
    """
    __tablename__ = "validation_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Link to structured idea
    structured_idea_id = Column(Integer, ForeignKey("structured_ideas.id"), nullable=False, index=True)
    
    # Feature 6: Execution Plan fields
    execution_plan = Column(JSON, nullable=True)  # ["market_validator", "competitor_analyzer", ...]
    plan_priority = Column(String(20), nullable=True)  # "high", "medium", "low"
    plan_reasoning = Column(Text, nullable=True)  # Why these agents were selected
    estimated_time = Column(String(50), nullable=True)  # "3-4 minutes"
    
    # Session status
    status = Column(String(20), default="pending")  # pending, in_progress, completed, failed
    
    # Feature 7+: Results storage
    results = Column(JSON, nullable=True)  # Stores all agent results
    # Example structure:
    # {
    #   "market_validation": {...},
    #   "competitor_analysis": {...},
    #   "financial_viability": {...}
    # }

    # Feature 9: Quality Evaluation (Critic Agent)
    quality_evaluation = Column(JSON, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)