# File: backend/app/api/v1/endpoints/team_building.py
# Feature C: Team Building Assistant API

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.idea import StructuredIdea
from app.models.validation import ValidationSession
from app.agents.team_building_assistant import TeamBuildingAssistant
from app.utils.logger import logger

router = APIRouter()


@router.post("/analyze/{idea_id}")
async def analyze_team_needs(idea_id: int, db: Session = Depends(get_db)):
    """Analyze team building needs and generate hiring roadmap."""
    try:
        logger.info(f"👥 Team building analysis requested for idea #{idea_id}")
        
        idea = db.query(StructuredIdea).filter(StructuredIdea.id == idea_id).first()
        if not idea:
            raise HTTPException(status_code=404, detail="Idea not found")
        
        validation_session = db.query(ValidationSession).filter(
            ValidationSession.structured_idea_id == idea_id
        ).order_by(ValidationSession.created_at.desc()).first()
        
        if not validation_session or not validation_session.results:
            raise HTTPException(status_code=404, detail="No validation results found")
        
        results = validation_session.results
        
        # Get risk analysis if available
        risk_analysis = results.get('risk_analysis')
        
        assistant = TeamBuildingAssistant()
        analysis = assistant.analyze_team_needs(
            idea=idea,
            market_validation=results.get('market_validation', {}),
            risk_analysis=risk_analysis
        )
        
        return {'status': 'success', 'team_analysis': analysis}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Team building analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))