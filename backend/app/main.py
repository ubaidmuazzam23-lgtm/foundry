# # File: backend/app/main.py
# # Main FastAPI application entry point

# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware

# from app.config import settings
# from app.db.session import init_db
# from app.api.v1.router import api_router
# from app.utils.logger import logger

# app = FastAPI(
#     title="Autonomous AI Startup Builder API",
#     description="Backend API for AI-powered startup validation system - Feature 2: Text Input Collection",
#     version="1.0.0",
#     docs_url="/docs" if settings.DEBUG else None,
#     redoc_url="/redoc" if settings.DEBUG else None
# )

# # CORS middleware for React frontend
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:3000",
#         "http://localhost:5173",
#         "http://127.0.0.1:3000",
#         "http://127.0.0.1:5173"
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# @app.on_event("startup")
# async def startup_event():
#     """Initialize database on startup"""
#     logger.info("Starting Autonomous AI Startup Builder API...")
#     init_db()
#     logger.info("✅ Database initialized successfully")


# @app.get("/")
# async def root():
#     """Health check endpoint"""
#     return {
#         "status": "online",
#         "service": "Autonomous AI Startup Builder API",
#         "version": "1.0.0",
#         "environment": settings.ENVIRONMENT
#     }


# @app.get("/health")
# async def health_check():
#     """Detailed health check"""
#     return {
#         "status": "healthy",
#         "database": "connected",
#         "environment": settings.ENVIRONMENT
#     }


# # Include v1 API router
# app.include_router(api_router, prefix="/api/v1")

# File: backend/app/main.py
# Production-ready: Railway PORT, CORS for Vercel, env-based settings

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.session import init_db
from app.api.v1.router import api_router
from app.utils.logger import logger

app = FastAPI(
    title="Autonomous AI Startup Builder API",
    description="Backend API for AI-powered startup validation system",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
# Read allowed origins from environment so you can add your Vercel URL
# without changing code. Falls back to localhost for local dev.
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173",
)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    logger.info("Starting Autonomous AI Startup Builder API...")
    init_db()
    logger.info("✅ Database initialized successfully")

# ── Health checks ─────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Autonomous AI Startup Builder API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "environment": settings.ENVIRONMENT,
    }

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix="/api/v1")