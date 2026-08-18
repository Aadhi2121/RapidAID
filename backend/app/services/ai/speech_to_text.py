import os
import logging
from typing import Dict, Any, Tuple, Optional

logger = logging.getLogger("civicai.whisper")

# Sample demo transcript catalog for rapid demonstration and zero-GPU fallback
AUDIO_CATALOG = {
    "tamil_water": {
        "text": "வார்டு 12-ல் மூன்று நாட்களாக பல தெருக்களில் குடிநீர் விநியோகம் இல்லை. முந்தைய புகார்கள் புறக்கணிக்கப்பட்டன.",
        "language": "ta",
        "name": "Tamil"
    },
    "hindi_electricity": {
        "text": "वार्ड 8 में पिछले दो दिनों से बिजली नहीं है। ट्रांसफार्मर में स्पार्क हो रहा है और बच्चों की पढ़ाई रुक गई है।",
        "language": "hi",
        "name": "Hindi"
    },
    "english_sewage": {
        "text": "Severe sewage overflow and blocked drainage near Anna Nagar 2nd Avenue for 4 days affecting over 500 residents.",
        "language": "en",
        "name": "English"
    },
    "default": {
        "text": "No water supply for three days across multiple streets in Ward 12. Previous complaints were ignored.",
        "language": "ta",
        "name": "Tamil"
    }
}

_whisper_model = None

def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        try:
            logger.info("[WHISPER] Loading model: base (device=CPU)")
            import whisper
            # Load base model for fast multilingual transcription on CPU
            _whisper_model = whisper.load_model("base", device="cpu")
            logger.info("[WHISPER] Model loaded successfully (base model on CPU)")
        except Exception as e:
            logger.warning(f"[WHISPER] REAL TRANSCRIPTION FAILED to load model: {e}")
            _whisper_model = False
    return _whisper_model

def get_audio_duration(file_path: str) -> Optional[float]:
    """Calculates duration of audio in seconds if soundfile is available."""
    try:
        import soundfile as sf
        info = sf.info(file_path)
        return round(info.duration, 2)
    except Exception:
        return None

def transcribe_audio_file(
    file_path: str,
    hint_language: Optional[str] = None,
    original_filename: Optional[str] = None
) -> Tuple[str, str, float, str]:
    """
    Transcribes audio file.
    Returns: (transcript, language_code, confidence, engine_used)
    engine_used is either 'Whisper — Real' or 'Catalog Fallback — Demo'
    """
    filename_to_match = (original_filename or os.path.basename(file_path)).lower()
    clean_hint = None if (not hint_language or hint_language == "auto") else hint_language
    
    logger.info("[WHISPER] Attempting REAL Whisper transcription")
    logger.info(f"[WHISPER] Model: base (multilingual)")
    logger.info(f"[WHISPER] Device: CPU")
    logger.info(f"[WHISPER] File: {filename_to_match} (hint_lang={clean_hint})")

    # 1. Attempt Real Whisper speech-to-text
    whisper_error_reason = None
    model = get_whisper_model()
    if model and model is not False:
        try:
            import soundfile as sf
            import numpy as np
            
            logger.info(f"[WHISPER] Decoding audio: {file_path}")
            audio_data, sr = sf.read(file_path)
            if len(audio_data.shape) > 1:
                audio_data = np.mean(audio_data, axis=1)
            audio_data = audio_data.astype(np.float32)

            # Resample to 16000Hz if needed for Whisper
            if sr != 16000:
                try:
                    import scipy.signal
                    num_samples = int(len(audio_data) * 16000 / sr)
                    audio_data = scipy.signal.resample(audio_data, num_samples).astype(np.float32)
                except Exception as resample_err:
                    logger.debug(f"[WHISPER] Resampling via scipy skipped: {resample_err}")

            logger.info("[WHISPER] Transcribing audio with Whisper ASR...")
            result = model.transcribe(
                audio_data,
                fp16=False,
                language=clean_hint
            )
            text = result.get("text", "").strip()
            lang = result.get("language", "en")
            
            if text:
                logger.info(f"[WHISPER] Transcription completed (lang={lang}, length={len(text)} chars)")
                return text, lang, 0.95, "Whisper — Real"
            else:
                whisper_error_reason = "Whisper decoded audio but returned empty transcription text."
                logger.warning(f"[WHISPER] REAL TRANSCRIPTION FAILED: {whisper_error_reason}")
        except Exception as e:
            whisper_error_reason = str(e)
            logger.warning(f"[WHISPER] REAL TRANSCRIPTION FAILED")
            logger.warning(f"[WHISPER] Error: {e}")
    else:
        whisper_error_reason = "Whisper package/model is not loaded in backend environment."
        logger.warning(f"[WHISPER] REAL TRANSCRIPTION FAILED")
        logger.warning(f"[WHISPER] Error: {whisper_error_reason}")

    # 2. Intelligent Catalog Fallback for Demo and Zero-GPU mode
    engine_mode = "Catalog Fallback — Demo"
    logger.info(f"[FALLBACK] Using catalog fallback because: {whisper_error_reason}")
    if "tamil" in filename_to_match or "water" in filename_to_match:
        data = AUDIO_CATALOG["tamil_water"]
    elif "hindi" in filename_to_match or "electric" in filename_to_match:
        data = AUDIO_CATALOG["hindi_electricity"]
    elif "sewage" in filename_to_match or "drain" in filename_to_match or "anna" in filename_to_match:
        data = AUDIO_CATALOG["english_sewage"]
    else:
        # Check if hint_language provided
        if clean_hint == "ta":
            data = AUDIO_CATALOG["tamil_water"]
        elif clean_hint == "hi":
            data = AUDIO_CATALOG["hindi_electricity"]
        elif clean_hint == "en":
            data = AUDIO_CATALOG["english_sewage"]
        else:
            data = AUDIO_CATALOG["default"]
            
    return data["text"], data["language"], 0.92, engine_mode


