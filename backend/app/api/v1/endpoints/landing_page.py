# File: backend/app/api/v1/endpoints/landing_page.py
# Landing Page Endpoint — Generate + Auto-Deploy

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.session import get_db
from app.models.idea import StructuredIdea
from app.services.landing_page_service import AgenticLandingPageService
from app.utils.logger import logger

router = APIRouter()


class GenerateRequest(BaseModel):
    structured_idea_id: int
    brand_color: Optional[str] = "#6366f1"   # Optional override
    cta_text:    Optional[str] = None          # Optional override


class GenerateResponse(BaseModel):
    structured_idea_id: int
    startup_name:       str
    live_url:           str
    html_preview:       str
    html_length:        int
    status:             str


@router.post("/generate", response_model=GenerateResponse)
async def generate_landing_page(
    request: GenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Agentic endpoint:
    1. Pulls structured idea from DB
    2. Extracts startup data
    3. Generates HTML via GPT-4o
    4. Auto-deploys to GitHub Pages
    5. Returns live URL
    """
    logger.info(f"🎯 Landing page requested for idea ID: {request.structured_idea_id}")

    # Fetch structured idea
    structured_idea = db.query(StructuredIdea).filter(
        StructuredIdea.id == request.structured_idea_id
    ).first()

    if not structured_idea:
        raise HTTPException(status_code=404, detail="Structured idea not found")

    if structured_idea.is_complete != "yes":
        raise HTTPException(
            status_code=400,
            detail="Idea is not complete yet. Finish the questioning flow first."
        )

    try:
        # Merge optional overrides into structured data
        structured_data = dict(structured_idea.structured_data)
        if request.brand_color:
            structured_data["brand_color"] = request.brand_color
        if request.cta_text:
            structured_data["cta"] = request.cta_text

        # Run agentic pipeline
        service = AgenticLandingPageService()
        result  = await service.run(structured_data)

        return GenerateResponse(
            structured_idea_id=request.structured_idea_id,
            **result
        )

    except ValueError as e:
        # Missing env vars (API keys etc)
        logger.error(f"Config error: {e}")
        raise HTTPException(status_code=500, detail=f"Configuration error: {str(e)}")

    except Exception as e:
        logger.error(f"Landing page pipeline failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{structured_idea_id}")
async def get_landing_page_status(
    structured_idea_id: int,
    db: Session = Depends(get_db)
):
    """Check if a landing page can be generated for this idea."""
    structured_idea = db.query(StructuredIdea).filter(
        StructuredIdea.id == structured_idea_id
    ).first()

    if not structured_idea:
        raise HTTPException(status_code=404, detail="Structured idea not found")

    return {
        "structured_idea_id": structured_idea_id,
        "is_complete":        structured_idea.is_complete,
        "ready_to_generate":  structured_idea.is_complete == "yes",
        "missing_fields":     structured_idea.missing_fields or [],
    }

from app.services.landing_page_service import AgenticLandingPageService, StartupDataExtractor

@router.get("/checkdb/{structured_idea_id}")
async def checkdb(
    structured_idea_id: int,
    db: Session = Depends(get_db)
):
    structured_idea = db.query(StructuredIdea).filter(
        StructuredIdea.id == structured_idea_id
    ).first()

    if not structured_idea:
        raise HTTPException(status_code=404, detail="Not found")

    extractor = StartupDataExtractor()
    extracted = extractor.extract(structured_idea.structured_data)

    return {
        "raw": structured_idea.structured_data,
        "extracted": extracted
    }
