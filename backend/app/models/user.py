# File: backend/app/models/user.py
# User model for authentication

from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.db.session import Base


class User(Base):
    """User model - integrated with Clerk"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    clerk_user_id = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)