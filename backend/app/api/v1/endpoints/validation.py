# # File: backend/app/api/v1/endpoints/validation.py
# # Feature 6: Validation Planning API endpoints

# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# from app.db.session import get_db
# from app.agents.planner_agent import PlannerAgent
# from app.models.idea import StructuredIdea
# from app.utils.logger import logger

# router = APIRouter()


# @router.post("/plan")
# async def create_validation_plan(
#     structured_idea_id: int,
#     db: Session = Depends(get_db)
# ):
#     """
#     Feature 6: Create validation execution plan.
    
#     Takes a completed structured idea and creates a plan for validation.
#     Uses Planner Agent to decide which validation steps to run.
#     """
#     logger.info(f"Creating validation plan for structured idea #{structured_idea_id}")
    
#     # Get the structured idea from database
#     idea = db.query(StructuredIdea).filter(
#         StructuredIdea.id == structured_idea_id
#     ).first()
    
#     if not idea:
#         raise HTTPException(status_code=404, detail="Structured idea not found")
    
#     # Check if idea is complete
#     if idea.is_complete != "yes":
#         raise HTTPException(
#             status_code=400, 
#             detail="Idea is not complete. Please finish cross-questioning first."
#         )
    
#     try:
#         # Use Planner Agent to create execution plan
#         planner = PlannerAgent()
#         plan = planner.create_execution_plan(idea.structured_data)
        
#         logger.info(f"Execution plan created: {plan['execution_plan']}")
#         logger.info(f"Priority: {plan['priority']}, Time: {plan['estimated_time']}")
        
#         # Return the plan
#         return {
#             "structured_idea_id": structured_idea_id,
#             "execution_plan": plan['execution_plan'],
#             "priority": plan['priority'],
#             "reasoning": plan['reasoning'],
#             "estimated_time": plan['estimated_time'],
#             "status": "plan_created"
#         }
        
#     except Exception as e:
#         logger.error(f"Error creating validation plan: {e}")
#         raise HTTPException(status_code=500, detail=f"Failed to create plan: {str(e)}")


# @router.get("/plan/{structured_idea_id}")
# async def get_validation_plan(
#     structured_idea_id: int,
#     db: Session = Depends(get_db)
# ):
#     """
#     Get the validation plan for a structured idea.
#     (For future use when we store plans in database)
#     """
#     idea = db.query(StructuredIdea).filter(
#         StructuredIdea.id == structured_idea_id
#     ).first()
    
#     if not idea:
#         raise HTTPException(status_code=404, detail="Structured idea not found")
    
#     return {
#         "structured_idea_id": structured_idea_id,
#         "message": "Plan retrieval from database will be implemented when validation_session table is used",
#         "note": "For now, call POST /plan to generate a new plan"
#     }

# File: backend/app/api/v1/endpoints/validation.py
# Feature 6 & 7: Validation endpoints
# UPDATED: Added market validation execution

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.agents.planner_agent import PlannerAgent
from app.agents.market_validator import MarketValidatorAgent
from app.models.idea import StructuredIdea
from app.models.validation import ValidationSession
from app.utils.logger import logger
from datetime import datetime
from pydantic import BaseModel

router = APIRouter()


@router.post("/plan")
async def create_validation_plan(
    structured_idea_id: int,
    db: Session = Depends(get_db)
):
    """
    Feature 6: Create validation execution plan.
    
    Takes a completed structured idea and creates a plan for validation.
    Uses Planner Agent to decide which validation steps to run.
    """
    logger.info(f"Creating validation plan for structured idea #{structured_idea_id}")
    
    # Get the structured idea from database
    idea = db.query(StructuredIdea).filter(
        StructuredIdea.id == structured_idea_id
    ).first()
    
    if not idea:
        raise HTTPException(status_code=404, detail="Structured idea not found")
    
    # Check if idea is complete
    if idea.is_complete != "yes":
        raise HTTPException(
            status_code=400, 
            detail="Idea is not complete. Please finish cross-questioning first."
        )
    
    try:
        # Use Planner Agent to create execution plan
        planner = PlannerAgent()
        plan = planner.create_execution_plan(idea.structured_data)
        
        logger.info(f"Execution plan created: {plan['execution_plan']}")
        logger.info(f"Priority: {plan['priority']}, Time: {plan['estimated_time']}")
        
        # Save plan to validation_session (if table exists)
        try:
            validation_session = ValidationSession(
                structured_idea_id=structured_idea_id,
                execution_plan=plan['execution_plan'],
                plan_priority=plan.get('priority'),
                plan_reasoning=plan.get('reasoning'),
                estimated_time=plan.get('estimated_time'),
                status='pending'
            )
            db.add(validation_session)
            db.commit()
            db.refresh(validation_session)
            
            plan['validation_session_id'] = validation_session.id
        except Exception as e:
            logger.warning(f"Could not save to validation_session: {e}")
            # Continue anyway
        
        # Return the plan
        return {
            "structured_idea_id": structured_idea_id,
            "execution_plan": plan['execution_plan'],
            "priority": plan['priority'],
            "reasoning": plan['reasoning'],
            "estimated_time": plan['estimated_time'],
            "status": "plan_created",
            "validation_session_id": plan.get('validation_session_id')
        }
        
    except Exception as e:
        logger.error(f"Error creating validation plan: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create plan: {str(e)}")


@router.post("/execute/market")
async def execute_market_validation(
    structured_idea_id: int,
    db: Session = Depends(get_db)
):
    """
    Feature 7: Execute market validation.
    
    Validates market demand using Market Validator Agent.
    Returns evidence-backed market assessment.
    """
    logger.info(f"Executing market validation for idea #{structured_idea_id}")
    
    # Get structured idea
    idea = db.query(StructuredIdea).filter(
        StructuredIdea.id == structured_idea_id
    ).first()
    
    if not idea:
        raise HTTPException(status_code=404, detail="Structured idea not found")
    
    if idea.is_complete != "yes":
        raise HTTPException(status_code=400, detail="Idea not complete")
    
    try:
        # Execute market validation
        validator = MarketValidatorAgent()
        result = validator.validate_market(idea.structured_data)
        
        logger.info(f"✅ Market validation complete")
        logger.info(f"   Demand: {result.get('market_demand')}")
        logger.info(f"   Recommendation: {result.get('recommendation')}")
        
        # Try to save results to validation_session
        try:
            session = db.query(ValidationSession).filter(
                ValidationSession.structured_idea_id == structured_idea_id
            ).order_by(ValidationSession.id.desc()).first()
            
            if session:
                # Update with results
                if not session.results:
                    session.results = {}
                session.results['market_validation'] = result
                session.status = 'in_progress'
                db.commit()
        except Exception as e:
            logger.warning(f"Could not save results: {e}")
        
        return {
            "structured_idea_id": structured_idea_id,
            "agent": "market_validator",
            "status": "completed",
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Error in market validation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results/{structured_idea_id}")
async def get_validation_results(
    structured_idea_id: int,
    db: Session = Depends(get_db)
):
    """Get all validation results for a structured idea."""
    
    try:
        session = db.query(ValidationSession).filter(
            ValidationSession.structured_idea_id == structured_idea_id
        ).order_by(ValidationSession.id.desc()).first()
        
        if not session:
            return {
                "structured_idea_id": structured_idea_id,
                "status": "no_validation_found",
                "results": {}
            }
        
        return {
            "structured_idea_id": structured_idea_id,
            "validation_session_id": session.id,
            "status": session.status,
            "execution_plan": session.execution_plan,
            "results": session.results or {},
            "created_at": session.created_at
        }
        
    except Exception as e:
        logger.error(f"Error fetching results: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/plan/{structured_idea_id}")
async def get_validation_plan(
    structured_idea_id: int,
    db: Session = Depends(get_db)
):
    """
    Get the validation plan for a structured idea.
    """
    idea = db.query(StructuredIdea).filter(
        StructuredIdea.id == structured_idea_id
    ).first()
    
    if not idea:
        raise HTTPException(status_code=404, detail="Structured idea not found")
    
    return {
        "structured_idea_id": structured_idea_id,
        "message": "Plan retrieval from database",
        "note": "Call POST /plan to generate a new plan"
    }