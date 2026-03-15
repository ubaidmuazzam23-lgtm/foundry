from app.services.landing_page_service import AgenticLandingPageService, StartupDataExtractor

@router.get("/debug/{structured_idea_id}")
async def debug_landing_data(
    structured_idea_id: int,
    db: Session = Depends(get_db)
):
    structured_idea = db.query(StructuredIdea).filter(
        StructuredIdea.id == structured_idea_id
    ).first()

    if not structured_idea:
        raise HTTPException(status_code=404, detail="Not found")

    extractor = StartupDataExtractor()
    extracted = extractor.extract(structured_idea.structured_data)

    return {
        "raw": structured_idea.structured_data,
        "extracted": extracted
    }
