# File: backend/app/api/v1/endpoints/rag.py
# RAG System Management Endpoints

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List
from pydantic import BaseModel
from app.services.faiss_service import FAISSService
from app.utils.logger import logger
import PyPDF2
import io

router = APIRouter()


class DocumentAdd(BaseModel):
    text: str
    source: str
    metadata: dict = {}


@router.post("/faiss/add-document")
async def add_document_to_faiss(doc: DocumentAdd):
    """
    Add a document to FAISS vector database.
    
    Example:
    {
        "text": "The global EdTech market is valued at $250B in 2024...",
        "source": "Market Research Report 2024",
        "metadata": {"industry": "edtech", "year": 2024}
    }
    """
    try:
        faiss = FAISSService()
        
        documents = [{
            'text': doc.text,
            'source': doc.source,
            'metadata': doc.metadata
        }]
        
        faiss.add_documents(documents)
        
        stats = faiss.get_stats()
        
        return {
            "message": "Document added successfully",
            "total_documents": stats['total_documents']
        }
        
    except Exception as e:
        logger.error(f"Error adding document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/faiss/add-documents-bulk")
async def add_documents_bulk(docs: List[DocumentAdd]):
    """Add multiple documents at once."""
    try:
        faiss = FAISSService()
        
        documents = [
            {
                'text': doc.text,
                'source': doc.source,
                'metadata': doc.metadata
            }
            for doc in docs
        ]
        
        faiss.add_documents(documents)
        
        stats = faiss.get_stats()
        
        return {
            "message": f"Added {len(documents)} documents successfully",
            "total_documents": stats['total_documents']
        }
        
    except Exception as e:
        logger.error(f"Error adding documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/faiss/upload-pdf")
async def upload_pdf_to_faiss(
    file: UploadFile = File(...),
    source_name: str = "Uploaded PDF"
):
    """
    Upload a PDF and add it to FAISS.
    Extracts text from PDF and indexes it.
    """
    try:
        # Read PDF
        contents = await file.read()
        pdf_file = io.BytesIO(contents)
        
        # Extract text
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text_chunks = []
        
        for page_num, page in enumerate(pdf_reader.pages):
            text = page.extract_text()
            if text.strip():
                text_chunks.append({
                    'text': text,
                    'source': f"{source_name} (Page {page_num + 1})",
                    'metadata': {
                        'filename': file.filename,
                        'page': page_num + 1
                    }
                })
        
        if not text_chunks:
            raise HTTPException(status_code=400, detail="No text found in PDF")
        
        # Add to FAISS
        faiss = FAISSService()
        faiss.add_documents(text_chunks)
        
        stats = faiss.get_stats()
        
        return {
            "message": f"PDF processed successfully",
            "pages_added": len(text_chunks),
            "total_documents": stats['total_documents']
        }
        
    except Exception as e:
        logger.error(f"Error processing PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/faiss/stats")
async def get_faiss_stats():
    """Get FAISS database statistics."""
    try:
        faiss = FAISSService()
        stats = faiss.get_stats()
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/faiss/search")
async def search_faiss(query: str, k: int = 5):
    """
    Search FAISS database.
    
    Args:
        query: Search query
        k: Number of results
    """
    try:
        faiss = FAISSService()
        results = faiss.search(query, k=k)
        
        return {
            "query": query,
            "results": results,
            "count": len(results)
        }
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))