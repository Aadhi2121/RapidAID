import os
import shutil
import tempfile
import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Department, Officer, Complaint
from app.schemas.schemas import TranscribeResponse, AIAnalysisResult, CallAnalyzeRequest
from app.services.ai.speech_to_text import transcribe_audio_file, get_audio_duration
from app.services.ai.complaint_intelligence import analyze_complaint_pipeline

logger = logging.getLogger("civicai.calls")
router = APIRouter(prefix="/calls", tags=["Citizen Calls & Speech AI"])

@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_call_audio(
    audio: Optional[UploadFile] = File(None),
    language: Optional[str] = Form(None)
):
    """
    Transcribes incoming citizen audio recording into text with language detection,
    Whisper ASR processing, and confidence scoring.
    """
    if audio is None:
        logger.info("[UPLOAD] No audio file attached — using default preset")
        return {
            "transcript": "வார்டு 12-ல் மூன்று நாட்களாக பல தெருக்களில் குடிநீர் விநியோகம் இல்லை. முந்தைய புகார்கள் புறக்கணிக்கப்பட்டன.",
            "language": "ta",
            "confidence": 0.96,
            "detected_language_name": "Tamil",
            "engine_used": "Catalog Fallback — Demo",
            "file_name": "preset_tamil_water.wav",
            "duration_seconds": 14.0
        }

    filename = audio.filename or "call_audio.wav"
    content_type = audio.content_type or "audio/wav"
    suffix = os.path.splitext(filename)[1].lower()
    allowed_extensions = {".wav", ".mp3", ".m4a", ".webm", ".ogg", ".flac", ".aac"}
    if suffix and suffix not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format '{suffix}'. Allowed formats: .wav, .mp3, .m4a, .webm"
        )

    # Save to temporary file
    actual_suffix = suffix if suffix else ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=actual_suffix) as tmp:
        shutil.copyfileobj(audio.file, tmp)
        tmp_path = tmp.name

    file_size = os.path.getsize(tmp_path) if os.path.exists(tmp_path) else 0

    logger.info("[UPLOAD] Audio received")
    logger.info(f"[UPLOAD] Filename: {filename}")
    logger.info(f"[UPLOAD] Size: {file_size} bytes")
    logger.info(f"[UPLOAD] Content type: {content_type}")

    try:
        duration = get_audio_duration(tmp_path)
        transcript, lang_code, confidence, engine_used = transcribe_audio_file(
            tmp_path,
            hint_language=language if language != "auto" else None,
            original_filename=filename
        )
        lang_names = {"ta": "Tamil", "hi": "Hindi", "en": "English", "te": "Telugu", "kn": "Kannada", "ml": "Malayalam"}
        return {
            "transcript": transcript,
            "language": lang_code,
            "confidence": confidence,
            "detected_language_name": lang_names.get(lang_code, lang_code.upper()),
            "engine_used": engine_used,
            "file_name": filename,
            "duration_seconds": duration
        }
    finally:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass


@router.post("/analyze", response_model=AIAnalysisResult)
def analyze_call_content(
    payload: CallAnalyzeRequest,
    db: Session = Depends(get_db)
):
    """
    Runs full 9-stage CivicAI pipeline on call audio transcript or typed text.
    """
    text = payload.text
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Transcript or text is required for AI analysis.")

    logger.info("[AI] Starting complaint intelligence")

    # Retrieve context from DB
    depts = [
        {"id": d.id, "name": d.name, "category": d.category, "sla_hours": d.sla_hours}
        for d in db.query(Department).all()
    ]
    
    officers = []
    for off in db.query(Officer).all():
        officers.append({
            "id": off.id,
            "department_id": off.department_id,
            "status": off.status,
            "active_cases": off.active_cases,
            "sla_compliance": off.sla_compliance,
            "location": off.location,
            "name": off.user.name if off.user else f"Officer #{off.id}"
        })

    existing_complaints = [
        {
            "id": c.id,
            "category": c.category,
            "subcategory": c.subcategory,
            "summary": c.summary,
            "transcript": c.transcript,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "location_name": c.location_name,
            "status": c.status
        }
        for c in db.query(Complaint).all()
    ]

    result = analyze_complaint_pipeline(
        raw_text=text,
        hint_language=None if payload.language == "auto" else payload.language,
        location_hint=payload.location,
        departments_list=depts,
        officers_list=officers,
        existing_complaints=existing_complaints
    )

    logger.info("[API] Returning analysis")
    return result
