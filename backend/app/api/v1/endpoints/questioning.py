# File: backend/app/api/v1/endpoints/questioning.py
# PERMANENT FIX: Proper JSON field tracking

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import Optional
import json

from app.db.session import get_db
from app.models.idea import UserInput, StructuredIdea
from app.services.ideanormalizer import IdeaNormalizerService
from app.services.crossquestioning import CrossQuestioningService
from app.schemas.ideaschema import MandatoryIdeaSchema
from app.utils.logger import logger
from pydantic import BaseModel

router = APIRouter()


class NormalizeRequest(BaseModel):
    user_input_id: int


class NormalizeResponse(BaseModel):
    structured_idea_id: int
    structured_data: dict
    is_complete: bool
    next_question: Optional[dict] = None


class AnswerQuestionRequest(BaseModel):
    structured_idea_id: int
    field_name: str
    answer: str


class AnswerQuestionResponse(BaseModel):
    structured_idea_id: int
    updated_data: dict
    is_complete: bool
    next_question: Optional[dict] = None


@router.post("/normalize", response_model=NormalizeResponse)
async def normalize_idea(
    request: NormalizeRequest,
    db: Session = Depends(get_db)
):
    """Normalize raw text and get first question."""
    logger.info(f"Normalizing user input ID: {request.user_input_id}")
    
    user_input = db.query(UserInput).filter(UserInput.id == request.user_input_id).first()
    if not user_input:
        raise HTTPException(status_code=404, detail="User input not found")
    
    try:
        # Normalize the idea
        normalizer = IdeaNormalizerService()
        structured_data = normalizer.normalize_idea(user_input.raw_input)
        
        # Initialize tracking
        structured_data['_asked_fields'] = []
        structured_data['_questions_count'] = 0
        
        # Check completeness
        idea_schema = MandatoryIdeaSchema(**structured_data)
        is_complete = idea_schema.is_complete()
        
        # Create structured idea
        structured_idea = StructuredIdea(
            user_input_id=user_input.id,
            structured_data=structured_data,
            version=1,
            is_complete="yes" if is_complete else "no",
            missing_fields=idea_schema.get_missing_fields()
        )
        
        db.add(structured_idea)
        db.commit()
        db.refresh(structured_idea)
        
        logger.info(f"✅ Structured idea created: ID {structured_idea.id}")
        
        # Get first question
        next_question = None
        if not is_complete:
            questioning_service = CrossQuestioningService()
            next_question = questioning_service.get_next_question(
                structured_data,
                questions_asked=0,
                asked_fields=[]
            )
        
        return NormalizeResponse(
            structured_idea_id=structured_idea.id,
            structured_data=structured_data,
            is_complete=is_complete,
            next_question=next_question
        )
        
    except Exception as e:
        logger.error(f"Error normalizing: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/answer", response_model=AnswerQuestionResponse)
async def answer_question(
    request: AnswerQuestionRequest,
    db: Session = Depends(get_db)
):
    """Answer a question. Auto-completes after 5 questions. FIXED VERSION."""
    logger.info(f"Processing answer for idea ID: {request.structured_idea_id}")
    
    structured_idea = db.query(StructuredIdea).filter(
        StructuredIdea.id == request.structured_idea_id
    ).first()
    
    if not structured_idea:
        raise HTTPException(status_code=404, detail="Structured idea not found")
    
    try:
        questioning_service = CrossQuestioningService()
        
        # IMPORTANT: Work with a fresh copy of the data
        updated_data = dict(structured_idea.structured_data)
        
        # Update the field
        updated_data = questioning_service.update_structured_idea(
            structured_idea=updated_data,
            field_name=request.field_name,
            answer=request.answer
        )
        
        # Track asked fields - FIXED VERSION
        asked_fields = updated_data.get('_asked_fields', [])
        if request.field_name not in asked_fields:
            asked_fields.append(request.field_name)
        
        # Update tracking fields
        updated_data['_asked_fields'] = list(asked_fields)  # Force new list
        questions_count = len(asked_fields)
        updated_data['_questions_count'] = questions_count
        
        # CRITICAL FIX: Mark as modified for SQLAlchemy to detect JSON change
        structured_idea.structured_data = updated_data
        flag_modified(structured_idea, 'structured_data')
        structured_idea.version += 1
        
        # Check if we should mark complete
        is_complete = False
        
        if questions_count >= 5:
            # FORCE COMPLETE after 5 questions
            logger.info(f"🎯 5 questions answered - MARKING COMPLETE")
            structured_idea.is_complete = "yes"
            structured_idea.missing_fields = []
            is_complete = True
        else:
            # Check normal completeness
            idea_schema = MandatoryIdeaSchema(**updated_data)
            is_complete = idea_schema.is_complete()
            structured_idea.is_complete = "yes" if is_complete else "no"
            structured_idea.missing_fields = idea_schema.get_missing_fields()
        
        db.commit()
        db.refresh(structured_idea)
        
        logger.info(f"✅ Question {questions_count}/5 answered. Complete: {is_complete}")
        
        # Get next question (only if not complete)
        next_question = None
        if not is_complete:
            next_question = questioning_service.get_next_question(
                updated_data,
                questions_asked=questions_count,
                asked_fields=asked_fields
            )
            
            # Safety check: if no next question, mark complete
            if not next_question:
                logger.info("No more questions - marking complete")
                structured_idea.is_complete = "yes"
                structured_idea.missing_fields = []
                db.commit()
                is_complete = True
        
        return AnswerQuestionResponse(
            structured_idea_id=structured_idea.id,
            updated_data=updated_data,
            is_complete=is_complete,
            next_question=next_question
        )
        
    except Exception as e:
        logger.error(f"Error processing answer: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/structured/{structured_idea_id}")
async def get_structured_idea(
    structured_idea_id: int,
    db: Session = Depends(get_db)
):
    """Get a structured idea by ID."""
    structured_idea = db.query(StructuredIdea).filter(
        StructuredIdea.id == structured_idea_id
    ).first()
    
    if not structured_idea:
        raise HTTPException(status_code=404, detail="Structured idea not found")
    
    return {
        "id": structured_idea.id,
        "user_input_id": structured_idea.user_input_id,
        "structured_data": structured_idea.structured_data,
        "is_complete": structured_idea.is_complete,
        "missing_fields": structured_idea.missing_fields,
        "version": structured_idea.version,
        "created_at": structured_idea.created_at
    }