# File: backend/app/services/google_calendar_service.py
import os
from datetime import datetime, timedelta
from typing import List, Dict
from app.utils.logger import logger

class GoogleCalendarService:
    """Creates events in user's Google Calendar."""

    def __init__(self, access_token: str, refresh_token: str = None):
        self.access_token  = access_token
        self.refresh_token = refresh_token
        self.service       = self._build_service()

    def _build_service(self):
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        creds = Credentials(
            token         = self.access_token,
            refresh_token = self.refresh_token,
            token_uri     = "https://oauth2.googleapis.com/token",
            client_id     = os.getenv("GOOGLE_CLIENT_ID"),
            client_secret = os.getenv("GOOGLE_CLIENT_SECRET"),
        )
        return build("calendar", "v3", credentials=creds)

    def create_event(self, title: str, date: str, description: str, reminder_days: int = 1) -> Dict:
        try:
            event_date = datetime.strptime(date, "%Y-%m-%d")
            event = {
                "summary":     title,
                "description": description,
                "start": {"date": date, "timeZone": "Asia/Kolkata"},
                "end":   {"date": (event_date + timedelta(days=1)).strftime("%Y-%m-%d"), "timeZone": "Asia/Kolkata"},
                "reminders": {
                    "useDefault": False,
                    "overrides": [
                        {"method": "email", "minutes": reminder_days * 24 * 60},
                        {"method": "popup", "minutes": reminder_days * 24 * 60},
                    ]
                }
            }
            result = self.service.events().insert(calendarId="primary", body=event).execute()
            logger.info(f"✅ Calendar event created: {title}")
            return {"success": True, "event_id": result.get("id"), "link": result.get("htmlLink")}
        except Exception as e:
            logger.error(f"Calendar event creation failed: {e}")
            return {"success": False, "error": str(e)}

    def create_bulk_events(self, events: List[Dict]) -> Dict:
        created = []
        failed  = []
        for event in events:
            result = self.create_event(
                title         = event["title"],
                date          = event["date"],
                description   = event.get("description", ""),
                reminder_days = 1 if event.get("type") == "publish" else 3
            )
            if result["success"]:
                created.append({"title": event["title"], "event_id": result["event_id"], "link": result["link"]})
            else:
                failed.append({"title": event["title"], "error": result["error"]})
        logger.info(f"✅ Created {len(created)} calendar events, {len(failed)} failed")
        return {"created": created, "failed": failed, "total": len(events)}