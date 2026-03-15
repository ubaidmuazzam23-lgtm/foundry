# File: backend/app/api/v1/api.py
from fastapi import APIRouter
from app.api.v1.endpoints import (
    ideas,
    validation,
    competitor_analysis,
    quality_evaluation,
    refinement,
    financial_projections,
    startup_advisor,
    hiring_plan,
    content_marketing,
    questioning,
    landing_page,
    originality,
    google_oauth,
)

api_router = APIRouter()

# Core features
api_router.include_router(ideas.router,               prefix="/ideas",               tags=["ideas"])
api_router.include_router(validation.router,          prefix="/validation",          tags=["validation"])
api_router.include_router(competitor_analysis.router, prefix="/competitor-analysis", tags=["competitor-analysis"])
api_router.include_router(quality_evaluation.router,  prefix="/quality-evaluation",  tags=["quality-evaluation"])
api_router.include_router(refinement.router,          prefix="/refinement",          tags=["refinement"])

# Advanced features
api_router.include_router(financial_projections.router, prefix="/financial-projections", tags=["financial-projections"])
api_router.include_router(startup_advisor.router,       prefix="/startup-advisor",       tags=["startup-advisor"])
api_router.include_router(hiring_plan.router,           prefix="/hiring-plan",           tags=["hiring-plan"])
api_router.include_router(content_marketing.router,     prefix="/content-marketing",     tags=["content-marketing"])
api_router.include_router(questioning.router,           prefix="/questioning",           tags=["questioning"])

# Agentic features
api_router.include_router(landing_page.router,          prefix="/landing-page",          tags=["landing-page"])

# AI/ML features
api_router.include_router(originality.router,           prefix="/originality",           tags=["originality"])

# Google OAuth + Calendar + Gmail
api_router.include_router(google_oauth.router,          prefix="/google",                tags=["google"])