# File: backend/app/api/v1/endpoints/risk_analysis.py
# Feature F: Risk Analysis API

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.idea import StructuredIdea
from app.models.validation import ValidationSession
from app.agents.risk_analyzer import RiskAnalyzer
from app.utils.logger import logger

router = APIRouter()


@router.post("/analyze/{idea_id}")
async def analyze_risks(idea_id: int, db: Session = Depends(get_db)):
    """Analyze startup risks across 6 categories."""
    try:
        logger.info(f"⚠️ Risk analysis requested for idea #{idea_id}")
        
        idea = db.query(StructuredIdea).filter(StructuredIdea.id == idea_id).first()
        if not idea:
            raise HTTPException(status_code=404, detail="Idea not found")
        
        validation_session = db.query(ValidationSession).filter(
            ValidationSession.structured_idea_id == idea_id
        ).order_by(ValidationSession.created_at.desc()).first()
        
        if not validation_session or not validation_session.results:
            raise HTTPException(status_code=404, detail="No validation results found")
        
        results = validation_session.results
        
        analyzer = RiskAnalyzer()
        analysis = analyzer.analyze_risks(
            idea=idea,
            market_validation=results.get('market_validation', {}),
            competitor_analysis=results.get('competitor_analysis', {})
        )
        
        return {'status': 'success', 'risk_analysis': analysis}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Risk analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))