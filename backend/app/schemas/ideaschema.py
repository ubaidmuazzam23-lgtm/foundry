# File: backend/app/schemas/ideaschema.py
# Mandatory schema for structured ideas - Feature 5

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class MandatoryIdeaSchema(BaseModel):
    """
    Mandatory fields for a complete startup idea.
    Feature 4 uses this to identify missing fields.
    Feature 5 uses this to normalize ideas.
    """
    
    # Core Problem & Solution
    problem_statement: Optional[str] = Field(
        None, 
        description="What specific problem does this solve?"
    )
    target_audience: Optional[str] = Field(
        None,
        description="Who are the primary users/customers?"
    )
    solution_description: Optional[str] = Field(
        None,
        description="How does your solution work?"
    )
    
    # Market & Competition
    market_size_estimate: Optional[str] = Field(
        None,
        description="What is the potential market size?"
    )
    competitors: Optional[List[str]] = Field(
        None,
        description="Who are the main competitors?"
    )
    unique_value_proposition: Optional[str] = Field(
        None,
        description="What makes this different/better?"
    )
    
    # Business Model
    business_model: Optional[str] = Field(
        None,
        description="How will this make money?"
    )
    key_features: Optional[List[str]] = Field(
        None,
        description="What are the core features?"
    )
    
    # Additional Context
    stage: Optional[str] = Field(
        None,
        description="Current stage: idea/prototype/mvp/launched"
    )
    
    def get_missing_fields(self) -> List[str]:
        """Return list of fields that are None or empty"""
        missing = []
        for field_name, field_value in self.model_dump().items():
            if field_value is None or (isinstance(field_value, list) and len(field_value) == 0):
                missing.append(field_name)
        return missing
    
    def is_complete(self) -> bool:
        """Check if all mandatory fields are filled"""
        return len(self.get_missing_fields()) == 0
    
    def get_field_description(self, field_name: str) -> str:
        """Get the description for a field"""
        return self.model_fields[field_name].description or field_name
    
    @classmethod
    def get_all_fields(cls) -> Dict[str, str]:
        """Get all field names and their descriptions"""
        return {
            name: field.description or name 
            for name, field in cls.model_fields.items()
        }