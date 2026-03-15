# File: backend/app/api/v1/endpoints/final_report.py
# Feature 11: Final Report Generator API

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.idea import StructuredIdea
from app.models.validation import ValidationSession
from app.agents.report_generator import ReportGenerator
from app.utils.logger import logger
from datetime import datetime
import os

router = APIRouter()


@router.post("/generate/{idea_id}")
async def generate_final_report(idea_id: int, db: Session = Depends(get_db)):
    """Generate comprehensive PDF report."""
    try:
        logger.info(f"📄 Final report requested for idea #{idea_id}")
        
        idea = db.query(StructuredIdea).filter(StructuredIdea.id == idea_id).first()
        if not idea:
            raise HTTPException(status_code=404, detail="Idea not found")
        
        validation_session = db.query(ValidationSession).filter(
            ValidationSession.structured_idea_id == idea_id
        ).order_by(ValidationSession.created_at.desc()).first()
        
        if not validation_session or not validation_session.results:
            raise HTTPException(status_code=404, detail="No validation results found")
        
        results = validation_session.results
        quality_eval = validation_session.quality_evaluation if hasattr(validation_session, 'quality_evaluation') else None
        
        # Generate report
        generator = ReportGenerator()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = f"/mnt/user-data/outputs/Final_Report_{timestamp}.pdf"
        
        report_path = generator.generate_final_report(
            idea=idea,
            market_validation=results.get('market_validation', {}),
            competitor_analysis=results.get('competitor_analysis', {}),
            quality_evaluation=quality_eval,
            output_path=output_path
        )
        
        logger.info(f"✅ Final report generated: {report_path}")
        
        return {
            'status': 'success',
            'file_path': report_path,
            'download_url': f"/api/v1/final-report/download/{idea_id}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Final report generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download/{idea_id}")
async def download_final_report(idea_id: int):
    """Download the generated final report."""
    try:
        output_dir = "/mnt/user-data/outputs"
        files = [f for f in os.listdir(output_dir) if f.startswith('Final_Report_') and f.endswith('.pdf')]
        
        if not files:
            raise HTTPException(status_code=404, detail="Report not found. Generate it first.")
        
        latest_file = sorted(files)[-1]
        file_path = os.path.join(output_dir, latest_file)
        
        return FileResponse(
            path=file_path,
            filename=f"Final_Report_Idea_{idea_id}.pdf",
            media_type="application/pdf"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Report download failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))