# File: backend/app/api/v1/endpoints/financial_projections.py
# FIXED: Now saves to results dict so pitch deck can access it

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.idea import StructuredIdea
from app.models.validation import ValidationSession
from app.agents.financial_projections import FinancialProjectionsEngine
from app.utils.logger import logger

router = APIRouter()


@router.post("/generate/{idea_id}")
async def generate_financial_projections(
    idea_id: int,
    db: Session = Depends(get_db)
):
    """
    Generate 3-year financial projections.
    
    Returns:
    - Revenue projections (monthly for 36 months)
    - Unit economics (CAC, LTV, ratios)
    - Funding requirements
    - Cost structure
    - Key metrics
    """
    try:
        logger.info(f"💰 Financial projections requested for idea #{idea_id}")
        
        # Get idea
        idea = db.query(StructuredIdea).filter(StructuredIdea.id == idea_id).first()
        if not idea:
            raise HTTPException(status_code=404, detail="Idea not found")
        
        # Get latest validation session
        validation_session = db.query(ValidationSession).filter(
            ValidationSession.structured_idea_id == idea_id
        ).order_by(ValidationSession.created_at.desc()).first()
        
        if not validation_session or not validation_session.results:
            raise HTTPException(
                status_code=404,
                detail="No validation results found. Run market validation first."
            )
        
        # Parse results (might be JSON string)
        results = validation_session.results
        if isinstance(results, str):
            import json
            results = json.loads(results)
        
        market_validation = results.get('market_validation', {})
        competitor_analysis = results.get('competitor_analysis', {})
        
        # Generate projections
        engine = FinancialProjectionsEngine()
        projections = engine.generate_projections(
            idea=idea,
            market_validation=market_validation,
            competitor_analysis=competitor_analysis
        )
        
        # 🔥 FIXED: Save to BOTH places
        # 1. Save to financial_projections column (for compatibility)
        if hasattr(validation_session, 'financial_projections'):
            validation_session.financial_projections = projections
        else:
            logger.warning("financial_projections column not in database schema")
        
        # 2. Save to results dict (for pitch deck to access) - THIS IS THE KEY FIX
        if not validation_session.results:
            validation_session.results = {}
        validation_session.results['financial_projections'] = projections
        
        db.commit()
        
        logger.info("✅ Financial projections generated")
        logger.info("✅ Saved to results dict for pitch deck access")
        logger.info(f"   Keys in projections: {list(projections.keys())[:10]}")
        
        return {
            'status': 'success',
            'projections': projections
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Financial projections failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results/{idea_id}")
async def get_financial_projections(
    idea_id: int,
    db: Session = Depends(get_db)
):
    """Get stored financial projections."""
    try:
        validation_session = db.query(ValidationSession).filter(
            ValidationSession.structured_idea_id == idea_id
        ).order_by(ValidationSession.created_at.desc()).first()
        
        if not validation_session:
            return {
                'status': 'not_found',
                'message': 'No validation session found'
            }
        
        # Check both places
        projections = None
        
        # Try results dict first (new way)
        if validation_session.results and 'financial_projections' in validation_session.results:
            projections = validation_session.results['financial_projections']
        # Fallback to financial_projections column (old way)
        elif hasattr(validation_session, 'financial_projections') and validation_session.financial_projections:
            projections = validation_session.financial_projections
        
        if not projections:
            return {
                'status': 'not_generated',
                'message': 'Financial projections not yet generated'
            }
        
        return {
            'status': 'success',
            'projections': projections
        }
        
    except Exception as e:
        logger.error(f"Failed to get financial projections: {e}")
        raise HTTPException(status_code=500, detail=str(e))