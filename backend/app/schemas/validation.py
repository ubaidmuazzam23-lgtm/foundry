from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

class CrossQuestionResponse(BaseModel):
    """
    Feature 4: Dynamic Cross-Questioning
    Response containing next question to ask user
    """
    question: str = Field(..., description="Question to ask user")
    field_name: str = Field(..., description="Which field this question fills")
    is_mandatory: bool = Field(..., description="Whether this field is required")
    current_completion: float = Field(..., description="Percentage of mandatory fields completed")

class ValidationProgress(BaseModel):
    """Track validation progress through agent pipeline"""
    idea_id: str
    status: str
    current_step: str
    completed_steps: List[str]
    pending_steps: List[str]
    started_at: datetime
    updated_at: datetime
    # ADD to validation.py schemas:



class ValidationPlanResponse(BaseModel):
    """Response with validation plan"""
    structured_idea_id: int
    execution_plan: List[str]
    priority: str
    reasoning: str
    estimated_time: str