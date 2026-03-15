# File: backend/app/api/v1/endpoints/ideas.py
# Feature 2: Multimodal Input Collection (Text)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.idea import UserInput
from app.schemas.idea import TextInputRequest, TextInputResponse
from app.utils.logger import logger

router = APIRouter()


@router.post("/text", response_model=TextInputResponse, status_code=201)
async def submit_text_input(
    request: TextInputRequest,
    db: Session = Depends(get_db)
):
    """
    Feature 2: Text Input Collection
    
    Purpose: Collect startup ideas using text input
    Input: Text description of startup idea
    Processing: Validate and store text input with confidence score
    Output: Stored input record with metadata
    Constraints: 
        - Minimum 10 characters, maximum 5000 characters
        - No assumptions about correctness
        - All inputs logged for auditability
    """
    try:
        logger.info(f"Receiving text input from user: {request.user_id}")
        
        # Create user input record
        user_input = UserInput(
            clerk_user_id=request.user_id,
            raw_input=request.text,
            input_type="text",
            confidence_score=1.0,  # Text always has 100% confidence
            needs_clarification="no"  # Will be determined by cross-questioning engine
        )
        
        db.add(user_input)
        db.commit()
        db.refresh(user_input)
        
        logger.info(f"Text input stored successfully with ID: {user_input.id}")
        
        return TextInputResponse(
            id=user_input.id,
            raw_input=user_input.raw_input,
            input_type=user_input.input_type,
            confidence_score=user_input.confidence_score,
            needs_clarification=user_input.needs_clarification,
            message="Input received successfully. Ready for processing.",
            created_at=user_input.created_at
        )
        
    except Exception as e:
        logger.error(f"Error storing text input: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to store input: {str(e)}")


@router.get("/{input_id}", response_model=TextInputResponse)
async def get_input(
    input_id: int,
    db: Session = Depends(get_db)
):
    """Retrieve a specific user input by ID"""
    user_input = db.query(UserInput).filter(UserInput.id == input_id).first()
    
    if not user_input:
        raise HTTPException(status_code=404, detail="Input not found")
    
    return TextInputResponse(
        id=user_input.id,
        raw_input=user_input.raw_input,
        input_type=user_input.input_type,
        confidence_score=user_input.confidence_score,
        needs_clarification=user_input.needs_clarification,
        message="Input retrieved successfully",
        created_at=user_input.created_at
    )


@router.get("/", response_model=dict)
async def list_inputs(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """List all user inputs with pagination"""
    inputs = db.query(UserInput).order_by(UserInput.created_at.desc()).offset(skip).limit(limit).all()
    total = db.query(UserInput).count()
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "inputs": [
            {
                "id": inp.id,
                "raw_input": inp.raw_input[:100] + "..." if len(inp.raw_input) > 100 else inp.raw_input,
                "input_type": inp.input_type,
                "created_at": inp.created_at
            }
            for inp in inputs
        ]
    }