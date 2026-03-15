# File: backend/app/models/oauth.py
from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from app.db.session import Base

class GoogleOAuthToken(Base):
    """Stores Google OAuth tokens per user."""
    __tablename__ = "google_oauth_tokens"

    id             = Column(Integer, primary_key=True, index=True)
    clerk_user_id  = Column(String, nullable=False, unique=True, index=True)
    access_token   = Column(Text, nullable=False)
    refresh_token  = Column(Text, nullable=True)
    token_expiry   = Column(DateTime, nullable=True)
    scope          = Column(Text, nullable=True)
    created_at     = Column(DateTime, default=datetime.utcnow)
    updated_at     = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)