# File: backend/app/schemas/idea.py
# Pydantic schemas for idea input and validation

from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, Dict, Any, List


class TextInputRequest(BaseModel):
    """Request schema for text input - Feature 2"""
    text: str = Field(..., min_length=10, max_length=5000, description="Startup idea description")
    user_id: Optional[str] = Field(None, description="Clerk user ID (optional for now)")

    @validator('text')
    def validate_text(cls, v):
        if not v.strip():
            raise ValueError("Input text cannot be empty")
        return v.strip()


class TextInputResponse(BaseModel):
    """Response schema for text input - Feature 2"""
    id: int
    raw_input: str
    input_type: str
    confidence_score: float
    needs_clarification: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True


class StructuredIdeaRequest(BaseModel):
    """Request schema for structured idea - Feature 5"""
    user_input_id: int
    structured_data: Dict[str, Any]


class StructuredIdeaResponse(BaseModel):
    """Response schema for structured idea - Feature 5"""
    id: int
    user_input_id: int
    structured_data: Dict[str, Any]
    version: int
    is_complete: str
    missing_fields: Optional[List[str]]
    created_at: datetime

    class Config:
        from_attributes = True


class IdeaSchema(BaseModel):
    """
    Mandatory idea schema - defines required fields
    Feature 5: Structured Idea Normalization
    """
    problem_statement: Optional[str] = None
    target_audience: Optional[str] = None
    solution_description: Optional[str] = None
    unique_value_proposition: Optional[str] = None
    business_model: Optional[str] = None
    market_size_estimate: Optional[str] = None
    competitors: Optional[List[str]] = None
    key_features: Optional[List[str]] = None
    
    def get_missing_fields(self) -> List[str]:
        """Return list of missing (None) fields"""
        missing = []
        for field_name, field_value in self.dict().items():
            if field_value is None:
                missing.append(field_name)
        return missing
    
    def is_complete(self) -> bool:
        """Check if all mandatory fields are filled"""
        return len(self.get_missing_fields()) == 0