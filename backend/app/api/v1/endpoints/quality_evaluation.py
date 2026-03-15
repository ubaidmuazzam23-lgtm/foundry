# File: backend/app/api/v1/endpoints/quality_evaluation.py
# FIXED: Now saves to results dict so pitch deck can access it

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.db.session import get_db
from app.models.idea import StructuredIdea
from app.models.validation import ValidationSession
from app.agents.critic_agent import CriticAgent
from app.utils.logger import logger
from sqlalchemy import JSON, Column, Integer, DateTime, Float, Boolean
from datetime import datetime

router = APIRouter()


@router.post("/evaluate/{idea_id}")
async def evaluate_quality(
    idea_id: int,
    db: Session = Depends(get_db)
):
    """
    Evaluate quality of market validation and competitor analysis.
    
    Returns:
    - Market validation evaluation
    - Competitor analysis evaluation
    - Overall pass/fail status
    - Required improvements
    """
    try:
        logger.info(f"🔍 Quality evaluation requested for idea #{idea_id}")
        
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
        
        # Initialize critic
        critic = CriticAgent(threshold=7.0)
        
        results = validation_session.results
        evaluations = {}
        
        # Evaluate market validation
        if results.get('market_validation'):
            logger.info("Evaluating market validation...")
            market_eval = critic.evaluate_market_validation(
                results['market_validation']
            )
            evaluations['market_validation'] = market_eval
        
        # Evaluate competitor analysis
        if results.get('competitor_analysis'):
            logger.info("Evaluating competitor analysis...")
            competitor_eval = critic.evaluate_competitor_analysis(
                results['competitor_analysis']
            )
            evaluations['competitor_analysis'] = competitor_eval
        
        # Overall status
        all_passed = all(
            e.get('passed', False) for e in evaluations.values()
        )
        
        avg_score = sum(
            e.get('overall_score', 0) for e in evaluations.values()
        ) / len(evaluations) if evaluations else 0
        
        # Collect all required improvements
        all_improvements = []
        for eval_type, evaluation in evaluations.items():
            if not evaluation.get('passed'):
                for improvement in evaluation.get('required_improvements', []):
                    all_improvements.append({
                        'type': eval_type,
                        'improvement': improvement
                    })
        
        # Create quality evaluation result
        quality_result = {
            'evaluations': evaluations,
            'overall_passed': all_passed,
            'average_score': avg_score,
            'scores': {  # Add individual scores for pitch deck
                'market_validation': evaluations.get('market_validation', {}).get('overall_score', 0),
                'competitor_analysis': evaluations.get('competitor_analysis', {}).get('overall_score', 0)
            },
            'overall_score': round(avg_score, 2),  # For pitch deck
            'evaluated_at': datetime.utcnow().isoformat()
        }
        
        # 🔥 FIXED: Save to BOTH places
        # 1. Save to quality_evaluation column (for compatibility)
        validation_session.quality_evaluation = quality_result
        
        # 2. Save to results dict (for pitch deck to access)
        if not validation_session.results:
            validation_session.results = {}
        validation_session.results['quality_evaluation'] = quality_result
        
        db.commit()
        
        logger.info(f"✅ Evaluation complete - Overall: {'PASSED' if all_passed else 'FAILED'}")
        logger.info(f"✅ Saved to results dict for pitch deck access")
        
        return {
            'status': 'success',
            'evaluations': evaluations,
            'overall_passed': all_passed,
            'average_score': round(avg_score, 2),
            'required_improvements': all_improvements,
            'message': 'All outputs passed quality checks!' if all_passed else 'Some outputs need improvement'
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quality evaluation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results/{idea_id}")
async def get_evaluation_results(
    idea_id: int,
    db: Session = Depends(get_db)
):
    """Get stored quality evaluation results."""
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
        quality_eval = None
        
        # Try results dict first (new way)
        if validation_session.results and 'quality_evaluation' in validation_session.results:
            quality_eval = validation_session.results['quality_evaluation']
        # Fallback to quality_evaluation column (old way)
        elif hasattr(validation_session, 'quality_evaluation') and validation_session.quality_evaluation:
            quality_eval = validation_session.quality_evaluation
        
        if not quality_eval:
            return {
                'status': 'not_evaluated',
                'message': 'Quality evaluation not yet performed'
            }
        
        return {
            'status': 'success',
            'evaluation': quality_eval
        }
        
    except Exception as e:
        logger.error(f"Failed to get evaluation results: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/re-evaluate/{idea_id}")
async def re_evaluate_after_refinement(
    idea_id: int,
    db: Session = Depends(get_db)
):
    """
    Re-evaluate after refinement.
    
    This is called after the Refiner Agent improves weak sections.
    """
    try:
        logger.info(f"🔄 Re-evaluating after refinement for idea #{idea_id}")
        
        # Same logic as evaluate but with note that this is post-refinement
        return await evaluate_quality(idea_id, db)
        
    except Exception as e:
        logger.error(f"Re-evaluation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))