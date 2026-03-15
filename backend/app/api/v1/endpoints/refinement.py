# File: backend/app/api/v1/endpoints/refinement.py
# Feature 10: Refinement API

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.idea import StructuredIdea
from app.models.validation import ValidationSession
from app.agents.refiner_agent import RefinerAgent
from app.utils.logger import logger

router = APIRouter()


@router.post("/refine/{idea_id}")
async def refine_outputs(
    idea_id: int,
    db: Session = Depends(get_db)
):
    """
    Trigger hybrid refinement of failed outputs.
    Phase 1: LLM rewrites weak sections
    Phase 2: Targeted data re-gathering
    Phase 3: Programmatic fixes
    """
    try:
        logger.info(f"🔧 Refinement requested for idea #{idea_id}")

        # Validate idea exists
        idea = db.query(StructuredIdea).filter(StructuredIdea.id == idea_id).first()
        if not idea:
            raise HTTPException(status_code=404, detail="Idea not found")

        # Validate there's something to refine
        session = db.query(ValidationSession).filter(
            ValidationSession.structured_idea_id == idea_id
        ).order_by(ValidationSession.created_at.desc()).first()

        if not session or not session.quality_evaluation:
            raise HTTPException(
                status_code=400,
                detail="No quality evaluation found. Run quality check first."
            )

        if session.quality_evaluation.get('overall_passed', False):
            return {
                'status': 'already_passed',
                'message': 'All outputs already passed quality checks.'
            }

        refiner = RefinerAgent()
        result = refiner.refine_all(idea_id, db)

        return {
            'status': 'success',
            **result
        }

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Refinement failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{idea_id}")
async def get_refinement_status(
    idea_id: int,
    db: Session = Depends(get_db)
):
    """Get refinement status and comparison data."""
    try:
        session = db.query(ValidationSession).filter(
            ValidationSession.structured_idea_id == idea_id
        ).order_by(ValidationSession.created_at.desc()).first()

        if not session:
            return {'status': 'not_found'}

        quality_eval = session.quality_evaluation or {}
        refinement_log = quality_eval.get('refinement_log')

        return {
            'status': 'success',
            'has_been_refined': refinement_log is not None,
            'refinement_log': refinement_log,
            'refined_at': quality_eval.get('refined_at'),
            'original_evaluation': quality_eval.get('evaluations', {}),
            'overall_passed': quality_eval.get('overall_passed', False),
            'original_scores': {
                'market_validation': quality_eval.get('evaluations', {}).get('market_validation', {}).get('overall_score'),
                'competitor_analysis': quality_eval.get('evaluations', {}).get('competitor_analysis', {}).get('overall_score'),
            },
            'original_issues': {
                'market_validation': quality_eval.get('evaluations', {}).get('market_validation', {}).get('programmatic_checks', {}).get('issues_summary', []),
                'competitor_analysis': quality_eval.get('evaluations', {}).get('competitor_analysis', {}).get('programmatic_checks', {}).get('issues_summary', []),
            }
        }

    except Exception as e:
        logger.error(f"Failed to get refinement status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
