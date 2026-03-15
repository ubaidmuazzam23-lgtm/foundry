# File: backend/app/api/v1/endpoints/hiring_plan.py

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.idea import StructuredIdea
from app.models.validation import ValidationSession
from app.agents.hiring_plan_agent import HiringPlanAgentMCP
from app.api.v1.endpoints.google_oauth import get_user_token
from app.services.gmail_service import GmailService
from app.services.google_calendar_service import GoogleCalendarService
from app.utils.logger import logger
from datetime import datetime
import json

router = APIRouter()


@router.post("/generate/{idea_id}")
async def generate_hiring_plan(
    idea_id:       int,
    enable_mcp:    bool = True,
    clerk_user_id: str  = None,
    db:            Session = Depends(get_db)
):
    logger.info(f"🚀 Hiring plan requested for idea #{idea_id} (MCP: {enable_mcp})")

    idea = db.query(StructuredIdea).filter(StructuredIdea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    try:
        agent       = HiringPlanAgentMCP()
        hiring_plan = agent.generate_hiring_plan(idea_id, enable_mcp=enable_mcp)

        if 'error' in hiring_plan:
            return {
                "status":   "insufficient_data",
                "message":  hiring_plan['message'],
                "required": hiring_plan['required_features']
            }

        # ── Google sync ──────────────────────────────────────────────────
        google_sync = {"connected": False, "calendar": 0, "gmail": 0}

        if clerk_user_id:
            from app.models.oauth import GoogleOAuthToken
            token_row = db.query(GoogleOAuthToken).filter(
                GoogleOAuthToken.clerk_user_id == clerk_user_id
            ).first()

            access_token  = get_user_token(clerk_user_id, db)
            refresh_token = token_row.refresh_token if token_row else None

            if access_token:
                google_sync["connected"] = True

                # Push Gmail drafts
                gmail_drafts = hiring_plan.get("gmail_drafts", [])
                if gmail_drafts:
                    try:
                        gmail  = GmailService(access_token, refresh_token)
                        emails = [
                            {"subject": d["subject"], "body": d["body"]}
                            for d in gmail_drafts
                        ]
                        result = gmail.create_bulk_drafts(emails)
                        google_sync["gmail"] = len(result.get("created", []))
                        logger.info(f"📧 {google_sync['gmail']} Gmail drafts saved")
                    except Exception as e:
                        logger.error(f"Gmail sync failed: {e}")

                # Push Calendar events
                calendar_events = hiring_plan.get("calendar_events", [])
                if calendar_events:
                    try:
                        cal    = GoogleCalendarService(access_token, refresh_token)
                        events = []
                        for e in calendar_events:
                            if isinstance(e, dict):
                                events.append({
                                    "title":       e.get("title", ""),
                                    "date":        e.get("date", ""),
                                    "description": e.get("description", ""),
                                })
                            elif isinstance(e, str):
                                events.append({"title": e, "date": "", "description": ""})
                        result = cal.create_bulk_events(events)
                        google_sync["calendar"] = len(result.get("created", []))
                        logger.info(f"📅 {google_sync['calendar']} Calendar events pushed")
                    except Exception as e:
                        logger.error(f"Calendar sync failed: {e}")

        # ── Persist results ──────────────────────────────────────────────
        validation_session = db.query(ValidationSession).filter(
            ValidationSession.structured_idea_id == idea_id
        ).order_by(ValidationSession.created_at.desc()).first()

        if validation_session:
            if not validation_session.results:
                validation_session.results = {}
            if isinstance(validation_session.results, str):
                validation_session.results = json.loads(validation_session.results)

            validation_session.results['hiring_plan'] = hiring_plan
            validation_session.updated_at = datetime.utcnow()

            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(validation_session, "results")
            db.commit()

        logger.info(f"✅ Plan complete — {len(hiring_plan.get('hiring_timeline', []))} roles")

        return {
            "status":      "success",
            "idea_id":     idea_id,
            "hiring_plan": hiring_plan,
            "google_sync": google_sync,
            "google_message": (
                f"✅ Synced to Google: {google_sync['gmail']} Gmail drafts, "
                f"{google_sync['calendar']} Calendar events"
                if google_sync["connected"]
                else "Connect Google to sync drafts & calendar events"
            ),
            "mcp_features": {
                "enabled":                  enable_mcp,
                "gmail_drafts_created":     len(hiring_plan.get('gmail_drafts', [])),
                "calendar_events_created":  len(hiring_plan.get('calendar_events', []))
            }
        }

    except Exception as e:
        logger.error(f"Hiring plan generation failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results/{idea_id}")
async def get_hiring_plan(idea_id: int, db: Session = Depends(get_db)):
    validation_session = db.query(ValidationSession).filter(
        ValidationSession.structured_idea_id == idea_id
    ).order_by(ValidationSession.created_at.desc()).first()

    if not validation_session:
        raise HTTPException(status_code=404, detail="No validation found")

    if not validation_session.results or 'hiring_plan' not in validation_session.results:
        return {"status": "not_found", "message": "Hiring plan not yet generated"}

    hiring_plan = validation_session.results['hiring_plan']

    return {
        "status":      "success",
        "idea_id":     idea_id,
        "hiring_plan": hiring_plan,
        "mcp_features": {
            "enabled":         hiring_plan.get('mcp_enabled', False),
            "gmail_drafts":    len(hiring_plan.get('gmail_drafts', [])),
            "calendar_events": len(hiring_plan.get('calendar_events', []))
        }
    }


@router.get("/gmail-drafts/{idea_id}")
async def get_gmail_drafts(idea_id: int, db: Session = Depends(get_db)):
    validation_session = db.query(ValidationSession).filter(
        ValidationSession.structured_idea_id == idea_id
    ).order_by(ValidationSession.created_at.desc()).first()

    if not validation_session or 'hiring_plan' not in validation_session.results:
        raise HTTPException(status_code=404, detail="Hiring plan not found")

    drafts = validation_session.results['hiring_plan'].get('gmail_drafts', [])
    return {"status": "success", "idea_id": idea_id, "drafts": drafts, "count": len(drafts)}


@router.get("/calendar-events/{idea_id}")
async def get_calendar_events(idea_id: int, db: Session = Depends(get_db)):
    validation_session = db.query(ValidationSession).filter(
        ValidationSession.structured_idea_id == idea_id
    ).order_by(ValidationSession.created_at.desc()).first()

    if not validation_session or 'hiring_plan' not in validation_session.results:
        raise HTTPException(status_code=404, detail="Hiring plan not found")

    events = validation_session.results['hiring_plan'].get('calendar_events', [])
    return {"status": "success", "idea_id": idea_id, "events": events, "count": len(events)}