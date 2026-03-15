# File: backend/app/api/v1/endpoints/originality.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.originality_service import OriginalityService
from app.utils.logger import logger

router = APIRouter()

_service: Optional[OriginalityService] = None

def get_service() -> OriginalityService:
    global _service
    if _service is None:
        _service = OriginalityService()
    return _service

class OriginalityRequest(BaseModel):
    idea_text: str
    idea_id:   Optional[int] = None

@router.post("/score")
async def score_originality(request: OriginalityRequest):
    if not request.idea_text or len(request.idea_text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Idea text too short (min 20 chars)")
    try:
        service = get_service()
        result  = await service.score(request.idea_text, request.idea_id)
        return result
    except Exception as e:
        logger.error(f"Originality scoring error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def index_status():
    try:
        service = get_service()
        return {
            "status":         "ready",
            "total_startups": service.index.ntotal if service.index else 0,
        }
    except Exception as e:
        return {"status": "error", "detail": str(e)}