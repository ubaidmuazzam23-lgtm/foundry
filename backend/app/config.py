# File: backend/app/config.py
# Application configuration management

from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # Database
    DATABASE_URL: str
    
    # Clerk
    CLERK_SECRET_KEY: Optional[str] = None
    CLERK_WEBHOOK_SECRET: Optional[str] = None
    
    # LLMs
    ANTHROPIC_API_KEY: str
    OPENAI_API_KEY: str
    GROQ_API_KEY: str = ""  # Add this line
    
    # FAISS
    VECTOR_DB_PATH: str = "./data/vector_store"
    EMBEDDING_MODEL: str = "text-embedding-ada-002"
    
    # Application
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    
    # Security
    SECRET_KEY: Optional[str] = None
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Audio Settings
    MAX_AUDIO_DURATION_SECONDS: int = 300
    AUDIO_SAMPLE_RATE: int = 16000
    
    # Agent Quality Settings
    MAX_REFINEMENT_ITERATIONS: int = 3
    QUALITY_THRESHOLD_SCORE: float = 0.7
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # Allow extra fields from .env

settings = Settings()