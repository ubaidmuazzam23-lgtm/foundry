"""
Application Configuration
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    SECRET_KEY: str
    
    # Database
    DATABASE_URL: str
    
    # Clerk
    CLERK_SECRET_KEY: str
    CLERK_WEBHOOK_SECRET: str
    
    # LLM
    ANTHROPIC_API_KEY: str
    OPENAI_API_KEY: str
    
    # Vector DB
    VECTOR_DB_PATH: str = "./data/vector_store"
    EMBEDDING_MODEL: str = "text-embedding-ada-002"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1"]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Audio
    MAX_AUDIO_DURATION_SECONDS: int = 300
    AUDIO_SAMPLE_RATE: int = 16000
    
    # Agent Settings
    MAX_REFINEMENT_ITERATIONS: int = 3
    QUALITY_THRESHOLD_SCORE: float = 0.7
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
