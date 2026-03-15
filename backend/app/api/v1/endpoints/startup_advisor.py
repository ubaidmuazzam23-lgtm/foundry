# File: backend/app/api/v1/endpoints/startup_advisor.py
# API endpoint for AI startup advisor chatbot

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from app.db.session import get_db
from app.agents.startup_advisor_agent import StartupAdvisorAgent
from app.utils.logger import logger

router = APIRouter()


class ChatMessage(BaseModel):
    """Chat message structure."""
    role: str  # 'user' or 'assistant'
    content: str


class ChatRequest(BaseModel):
    """Request to chat with advisor."""
    idea_id: int
    message: str
    conversation_history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    """Response from advisor."""
    response: str
    sources: List[str]
    suggestions: List[str]
    timestamp: str


@router.post("/chat", response_model=ChatResponse)
async def chat_with_advisor(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Chat with AI startup advisor.
    
    The advisor knows everything about the startup from validation results.
    Provides contextual, data-driven advice.
    """
    try:
        logger.info(f"💬 Chat request for idea #{request.idea_id}")
        
        # Initialize advisor
        advisor = StartupAdvisorAgent()
        
        # Convert Pydantic models to dicts
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in request.conversation_history
        ]
        
        # Get response
        result = advisor.chat(
            idea_id=request.idea_id,
            user_message=request.message,
            conversation_history=history
        )
        
        logger.info(f"   ✅ Response generated")
        
        return ChatResponse(**result)
        
    except Exception as e:
        logger.error(f"❌ Chat failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Chat failed: {str(e)}"
        )


@router.get("/suggested-questions/{idea_id}")
async def get_suggested_questions(
    idea_id: int,
    db: Session = Depends(get_db)
):
    """
    Get suggested questions based on available data.
    
    Returns context-aware questions the founder might want to ask.
    """
    try:
        advisor = StartupAdvisorAgent()
        questions = advisor.get_suggested_questions(idea_id)
        
        return {
            'questions': questions
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get questions: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed: {str(e)}"
        )


@router.get("/context/{idea_id}")
async def get_startup_context(
    idea_id: int,
    db: Session = Depends(get_db)
):
    """
    Get summary of what the advisor knows about the startup.
    
    Useful for debugging or showing users what data is available.
    """
    try:
        advisor = StartupAdvisorAgent()
        context = advisor._gather_startup_context(idea_id)
        
        # Create summary
        idea = context.get('idea', {})
        market = context.get('market_validation', {})
        competitors = context.get('competitor_analysis', {})
        financials = context.get('financial_projections', {})
        quality = context.get('quality_evaluation', {})
        
        summary = {
            'startup_name': idea.get('startup_name', 'Unknown'),
            'has_market_validation': bool(market),
            'has_competitor_analysis': bool(competitors),
            'has_financial_projections': bool(financials and len(str(financials)) > 10),
            'has_quality_evaluation': bool(quality),
            'data_completeness': 0
        }
        
        # Calculate completeness
        completeness = 0
        if summary['has_market_validation']:
            completeness += 25
        if summary['has_competitor_analysis']:
            completeness += 25
        if summary['has_financial_projections']:
            completeness += 25
        if summary['has_quality_evaluation']:
            completeness += 25
        
        summary['data_completeness'] = completeness
        
        return summary
        
    except Exception as e:
        logger.error(f"❌ Failed to get context: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed: {str(e)}"
        )