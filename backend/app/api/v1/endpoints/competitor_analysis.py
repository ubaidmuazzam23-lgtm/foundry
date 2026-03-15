# File: backend/app/api/v1/endpoints/competitor_analysis.py
# API endpoints for Feature 8: Competitor Analysis

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.idea import StructuredIdea
from app.models.validation import ValidationSession
from app.agents.competitor_analyzer import CompetitorAnalyzerAgent
from app.utils.logger import logger
from datetime import datetime
import json

router = APIRouter()


@router.post("/analyze/{structured_idea_id}")
async def analyze_competitors(
    structured_idea_id: int,
    db: Session = Depends(get_db)
):
    """
    Execute competitor analysis for a structured idea.
    
    Process:
    1. Gets competitors from market validation
    2. Deep-dives each competitor
    3. Identifies gaps and opportunities
    4. Returns strategic recommendations
    """
    logger.info(f"🔍 Competitor analysis requested for idea #{structured_idea_id}")
    
    # Verify idea exists
    idea = db.query(StructuredIdea).filter(
        StructuredIdea.id == structured_idea_id
    ).first()
    
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    # Check if market validation exists
    validation_session = db.query(ValidationSession).filter(
        ValidationSession.structured_idea_id == structured_idea_id
    ).order_by(ValidationSession.created_at.desc()).first()
    
    if not validation_session:
        raise HTTPException(
            status_code=400, 
            detail="Please run market validation first"
        )
    
    if not validation_session.results or 'market_validation' not in validation_session.results:
        raise HTTPException(
            status_code=400,
            detail="Market validation results not found"
        )
    
    try:
        # Execute competitor analysis
        analyzer = CompetitorAnalyzerAgent()
        analysis_results = analyzer.analyze_competitors(structured_idea_id)
        
        # Store results in validation session
        if not validation_session.results:
            validation_session.results = {}
        
        # Ensure results is a dict, not a string
        if isinstance(validation_session.results, str):
            import json
            validation_session.results = json.loads(validation_session.results)
        
        validation_session.results['competitor_analysis'] = analysis_results
        validation_session.updated_at = datetime.utcnow()
        
        # Mark as modified for SQLAlchemy
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(validation_session, "results")
        
        db.commit()
        db.refresh(validation_session)
        
        logger.info(f"✅ Competitor analysis complete for idea #{structured_idea_id}")
        
        return {
            "status": "success",
            "structured_idea_id": structured_idea_id,
            "analysis": analysis_results
        }
        
    except Exception as e:
        logger.error(f"Competitor analysis failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results/{structured_idea_id}")
async def get_competitor_analysis(
    structured_idea_id: int,
    db: Session = Depends(get_db)
):
    """Get competitor analysis results for an idea."""
    
    validation_session = db.query(ValidationSession).filter(
        ValidationSession.structured_idea_id == structured_idea_id
    ).order_by(ValidationSession.created_at.desc()).first()
    
    if not validation_session:
        raise HTTPException(status_code=404, detail="No validation found")
    
    if not validation_session.results or 'competitor_analysis' not in validation_session.results:
        return {
            "status": "not_found",
            "message": "Competitor analysis not yet run"
        }
    
    return {
        "status": "success",
        "structured_idea_id": structured_idea_id,
        "analysis": validation_session.results['competitor_analysis']
    }

