# File: backend/app/api/v1/endpoints/content_marketing.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.idea import StructuredIdea
from app.models.validation import ValidationSession
from app.agents.content_marketing_agent import ContentMarketingAgent
from app.utils.logger import logger
from datetime import datetime
import json

router = APIRouter()


@router.post("/generate/{idea_id}")
async def generate_content_strategy(
    idea_id:       int,
    clerk_user_id: str  = "",
    enable_mcp:    bool = True,
    db:            Session = Depends(get_db)
):
    logger.info(f"📝 Content strategy requested for idea #{idea_id} (MCP: {enable_mcp}, User: {clerk_user_id or 'anonymous'})")

    idea = db.query(StructuredIdea).filter(StructuredIdea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    try:
        agent    = ContentMarketingAgent()
        strategy = agent.generate_content_strategy(idea_id, enable_mcp=enable_mcp)

        if "error" in strategy:
            return {
                "status":   "insufficient_data",
                "message":  strategy["message"],
                "required": strategy["required_features"]
            }

        # ── Google Calendar + Gmail integration ──────────────────────
        google_sync    = {"calendar": None, "gmail": None, "connected": False}
        google_message = None

        if clerk_user_id:
            try:
                from app.api.v1.endpoints.google_oauth import get_user_token
                from app.models.oauth import GoogleOAuthToken
                from app.services.google_calendar_service import GoogleCalendarService
                from app.services.gmail_service import GmailService

                token_row     = db.query(GoogleOAuthToken).filter(
                    GoogleOAuthToken.clerk_user_id == clerk_user_id
                ).first()
                access_token  = get_user_token(clerk_user_id, db)
                refresh_token = token_row.refresh_token if token_row else None

                if access_token:
                    google_sync["connected"] = True

                    # Push calendar events
                    calendar_events = strategy.get("calendar_events", [])
                    if calendar_events:
                        cal_service             = GoogleCalendarService(access_token, refresh_token)
                        cal_result              = cal_service.create_bulk_events(calendar_events)
                        google_sync["calendar"] = cal_result
                        logger.info(f"📅 {cal_result.get('total', 0)} events pushed to Google Calendar")

                    # Push Gmail drafts
                    email_templates = strategy.get("email_templates", [])
                    if email_templates:
                        gmail_service        = GmailService(access_token, refresh_token)
                        gmail_result         = gmail_service.create_bulk_drafts(email_templates)
                        google_sync["gmail"] = gmail_result
                        logger.info(f"📧 {gmail_result.get('total', 0)} drafts saved to Gmail")

                    google_message = f"✅ {len(calendar_events)} calendar events + {len(email_templates)} Gmail drafts synced"
                else:
                    google_message = "Google not connected — skipped sync"

            except Exception as e:
                logger.error(f"Google sync error: {e}")
                google_message = f"Google sync failed: {str(e)}"

        # ── Store results in DB ───────────────────────────────────────
        validation_session = db.query(ValidationSession).filter(
            ValidationSession.structured_idea_id == idea_id
        ).order_by(ValidationSession.created_at.desc()).first()

        if validation_session:
            if not validation_session.results:
                validation_session.results = {}
            if isinstance(validation_session.results, str):
                validation_session.results = json.loads(validation_session.results)

            validation_session.results["content_strategy"] = strategy
            validation_session.updated_at = datetime.utcnow()

            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(validation_session, "results")
            db.commit()

        logger.info(f"✅ Strategy complete — {len(strategy.get('blog_ideas', []))} blogs, {len(strategy.get('content_calendar', []))} calendar items")

        return {
            "status":           "success",
            "idea_id":          idea_id,
            "content_strategy": strategy,
            "google_sync":      google_sync,
            "google_message":   google_message,
            "mcp_features": {
                "enabled":         enable_mcp,
                "email_templates": len(strategy.get("email_templates", [])),
                "calendar_events": len(strategy.get("calendar_events", [])),
                "trending_topics": len(strategy.get("trending_topics", [])),
            }
        }

    except Exception as e:
        logger.error(f"Content strategy generation failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results/{idea_id}")
async def get_content_strategy(idea_id: int, db: Session = Depends(get_db)):
    validation_session = db.query(ValidationSession).filter(
        ValidationSession.structured_idea_id == idea_id
    ).order_by(ValidationSession.created_at.desc()).first()

    if not validation_session:
        raise HTTPException(status_code=404, detail="No validation found")

    if not validation_session.results or "content_strategy" not in validation_session.results:
        return {"status": "not_found", "message": "Content strategy not yet generated"}

    strategy = validation_session.results["content_strategy"]

    return {
        "status":           "success",
        "idea_id":          idea_id,
        "content_strategy": strategy,
        "mcp_features": {
            "enabled":         strategy.get("mcp_enabled", False),
            "email_templates": len(strategy.get("email_templates", [])),
            "calendar_events": len(strategy.get("calendar_events", [])),
            "trending_topics": len(strategy.get("trending_topics", [])),
        }
    }


@router.get("/calendar/{idea_id}")
async def get_content_calendar(idea_id: int, db: Session = Depends(get_db)):
    validation_session = db.query(ValidationSession).filter(
        ValidationSession.structured_idea_id == idea_id
    ).order_by(ValidationSession.created_at.desc()).first()

    if not validation_session or "content_strategy" not in (validation_session.results or {}):
        raise HTTPException(status_code=404, detail="Content strategy not found")

    strategy = validation_session.results["content_strategy"]
    return {
        "status":   "success",
        "calendar": strategy.get("content_calendar", []),
        "count":    len(strategy.get("content_calendar", []))
    }


@router.get("/social-templates/{idea_id}")
async def get_social_templates(idea_id: int, db: Session = Depends(get_db)):
    validation_session = db.query(ValidationSession).filter(
        ValidationSession.structured_idea_id == idea_id
    ).order_by(ValidationSession.created_at.desc()).first()

    if not validation_session or "content_strategy" not in (validation_session.results or {}):
        raise HTTPException(status_code=404, detail="Content strategy not found")

    strategy = validation_session.results["content_strategy"]
    return {
        "status":    "success",
        "templates": strategy.get("social_templates", []),
        "count":     len(strategy.get("social_templates", []))
    }