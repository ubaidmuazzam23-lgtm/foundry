# backend/app/api/v1/endpoints/audio.py
from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
import openai
import os
import logging
from pathlib import Path
import tempfile

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class TranscriptionResponse(BaseModel):
    text: str
    confidence: float

@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    Transcribe audio using OpenAI Whisper API
    
    Feature 2: Multimodal Input (Voice)
    - Accepts audio files from voice recorder
    - Uses Whisper for speech-to-text
    - Returns transcription with confidence score
    """
    temp_path = None
    
    try:
        logger.info(f"Received audio file: {audio.filename}, content_type: {audio.content_type}")
        
        # Validate file presence
        if not audio.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Read file content
        content = await audio.read()
        file_size = len(content)
        logger.info(f"File size: {file_size} bytes ({file_size / 1024:.2f} KB)")
        
        # Validate file size
        if file_size == 0:
            raise HTTPException(status_code=400, detail="File is empty")
        
        if file_size > 25 * 1024 * 1024:  # 25MB limit (Whisper API limit)
            raise HTTPException(
                status_code=400, 
                detail="File too large. Maximum size is 25MB"
            )
        
        # Save to temporary file
        file_extension = Path(audio.filename).suffix or '.webm'
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_path = temp_file.name
            temp_file.write(content)
        
        logger.info(f"Saved to temporary file: {temp_path}")
        
        # Verify OpenAI API key
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.error("OPENAI_API_KEY environment variable not set")
            raise HTTPException(
                status_code=500, 
                detail="OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
            )
        
        # Initialize OpenAI client
        client = openai.OpenAI(api_key=api_key)
        
        logger.info("Calling OpenAI Whisper API for transcription...")
        
        # Call Whisper API
        with open(temp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
                language="en"  # Specify English for better accuracy
            )
        
        logger.info(f"Transcription successful. Text length: {len(transcript.text)} characters")
        logger.info(f"Transcription preview: {transcript.text[:100]}...")
        
        # Calculate confidence score
        confidence = 0.95  # Default high confidence
        
        # If the API returns segments with confidence scores, use them
        if hasattr(transcript, 'segments') and transcript.segments:
            segment_confidences = []
            for segment in transcript.segments:
                # avg_logprob is typically between -1 and 0
                if hasattr(segment, 'avg_logprob'):
                    segment_confidences.append(segment.avg_logprob)
            
            if segment_confidences:
                avg_logprob = sum(segment_confidences) / len(segment_confidences)
                # Convert log probability to confidence score (0.5 to 1.0 range)
                confidence = max(0.5, min(1.0, 1 + avg_logprob))
                logger.info(f"Calculated confidence: {confidence:.2f}")
        
        return TranscriptionResponse(
            text=transcript.text,
            confidence=round(confidence, 2)
        )
        
    except openai.APIError as e:
        logger.error(f"OpenAI API error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"OpenAI API error: {str(e)}"
        )
    
    except openai.APIConnectionError as e:
        logger.error(f"OpenAI connection error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to connect to OpenAI API. Please check your internet connection."
        )
    
    except openai.AuthenticationError as e:
        logger.error(f"OpenAI authentication error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Invalid OpenAI API key. Please verify your API key configuration."
        )
    
    except openai.RateLimitError as e:
        logger.error(f"OpenAI rate limit error: {str(e)}")
        raise HTTPException(
            status_code=429, 
            detail="OpenAI API rate limit exceeded. Please try again later."
        )
    
    except Exception as e:
        logger.error(f"Unexpected error during transcription: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Transcription failed: {str(e)}"
        )
    
    finally:
        # Clean up temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
                logger.info(f"Cleaned up temporary file: {temp_path}")
            except Exception as e:
                logger.warning(f"Failed to remove temporary file {temp_path}: {e}")


@router.get("/health")
async def audio_health():
    """
    Health check endpoint for audio service
    
    Returns:
        - Service status
        - OpenAI API key configuration status
        - Supported audio formats
    """
    api_key_configured = bool(os.getenv("OPENAI_API_KEY"))
    
    return {
        "status": "healthy",
        "service": "audio-transcription",
        "openai_api_key_configured": api_key_configured,
        "supported_formats": [
            "webm", "mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "ogg"
        ],
        "max_file_size_mb": 25,
        "whisper_model": "whisper-1"
    }


@router.post("/transcribe-mock", response_model=TranscriptionResponse)
async def transcribe_audio_mock(audio: UploadFile = File(...)):
    """
    Mock transcription endpoint for testing without using OpenAI credits
    
    Use this during development to avoid API costs
    Switch to /transcribe in production
    """
    import asyncio
    
    logger.info(f"Mock transcription requested for: {audio.filename}")
    
    # Read file to validate it exists
    content = await audio.read()
    file_size = len(content)
    
    if file_size == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    
    # Simulate API processing time
    await asyncio.sleep(2)
    
    mock_text = (
        "This is a mock transcription for testing purposes. "
        "I want to build a platform that helps remote teams collaborate "
        "more effectively by combining project management with real-time communication. "
        "The target market would be small to medium-sized tech companies with distributed teams."
    )
    
    return TranscriptionResponse(
        text=mock_text,
        confidence=0.95
    )