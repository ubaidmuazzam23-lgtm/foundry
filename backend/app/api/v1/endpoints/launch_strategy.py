# File: backend/app/api/v1/endpoints/launch_strategy.py
# Feature E: Launch Strategy API

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.idea import StructuredIdea
from app.models.validation import ValidationSession
from app.agents.launch_strategy_generator import LaunchStrategyGenerator
from app.utils.logger import logger

router = APIRouter()


@router.post("/generate/{idea_id}")
async def generate_launch_strategy(idea_id: int, db: Session = Depends(get_db)):
    """Generate 90-day launch strategy."""
    try:
        logger.info(f"🚀 Launch strategy requested for idea #{idea_id}")
        
        idea = db.query(StructuredIdea).filter(StructuredIdea.id == idea_id).first()
        if not idea:
            raise HTTPException(status_code=404, detail="Idea not found")
        
        validation_session = db.query(ValidationSession).filter(
            ValidationSession.structured_idea_id == idea_id
        ).order_by(ValidationSession.created_at.desc()).first()
        
        if not validation_session or not validation_session.results:
            raise HTTPException(status_code=404, detail="No validation results found")
        
        results = validation_session.results
        
        generator = LaunchStrategyGenerator()
        strategy = generator.generate_launch_strategy(
            idea=idea,
            market_validation=results.get('market_validation', {}),
            competitor_analysis=results.get('competitor_analysis', {})
        )
        
        return {'status': 'success', 'strategy': strategy}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Launch strategy generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))