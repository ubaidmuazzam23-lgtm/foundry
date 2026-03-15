# File: backend/app/services/gmail_service.py
import os
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict
from app.utils.logger import logger

class GmailService:
    """Creates draft emails in user's Gmail."""

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
        return build("gmail", "v1", credentials=creds)

    def _create_message(self, subject: str, body: str) -> Dict:
        message            = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"]    = "me"
        message.attach(MIMEText(body, "plain"))
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        return {"raw": raw}

    def create_draft(self, subject: str, body: str) -> Dict:
        try:
            message = self._create_message(subject, body)
            draft   = self.service.users().drafts().create(
                userId = "me",
                body   = {"message": message}
            ).execute()
            logger.info(f"✅ Gmail draft created: {subject}")
            return {"success": True, "draft_id": draft.get("id")}
        except Exception as e:
            logger.error(f"Gmail draft creation failed: {e}")
            return {"success": False, "error": str(e)}

    def create_bulk_drafts(self, templates: List[Dict]) -> Dict:
        created = []
        failed  = []
        for template in templates:
            result = self.create_draft(
                subject = template.get("subject", "No Subject"),
                body    = template.get("body", "")
            )
            if result["success"]:
                created.append({"subject": template["subject"], "draft_id": result["draft_id"]})
            else:
                failed.append({"subject": template["subject"], "error": result["error"]})
        logger.info(f"✅ Created {len(created)} Gmail drafts, {len(failed)} failed")
        return {"created": created, "failed": failed, "total": len(templates)}