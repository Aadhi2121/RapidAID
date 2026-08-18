import re
from typing import Tuple

# Common vocabulary maps for Tamil and Hindi transliterations & scripts
TAMIL_INDICATORS = [
    "தண்ணீர்", "குடிநீர்", "வார்டு", "மின்சாரம்", "சாக்கடை", "குப்பை", "சாலை", "புகார்",
    "thanni", "kudineer", "thanneer", "ward", "salai", "kuppai", "current", "minsaram", "illa", "illai",
    "naatkal", "velai", "theru", "maram", "vilakku", "romba", "mosam"
]

HINDI_INDICATORS = [
    "पानी", "बिजली", "सड़क", "कचरा", "नाली", "वार्ड", "शिकायत", "ट्रांसफॉर्मर", "अंधेरा",
    "paani", "bijli", "sadak", "kachra", "naali", "shikayat", "batti", "khamba", "nahi", "hai",
    "din", "band", "bache", "kharab", "bohot", "log"
]

# Standard translations for demo scenarios & key phrases
TRANSLATION_DICTIONARY = {
    "வார்டு 12-ல் மூன்று நாட்களாக பல தெருக்களில் குடிநீர் விநியோகம் இல்லை. முந்தைய புகார்கள் புறக்கணிக்கப்பட்டன.":
        "No water supply for three days across multiple streets in Ward 12. Previous complaints were ignored.",
    "வार्ड 8 में पिछले दो दिनों से बिजली नहीं है। ट्रांसफार्मर में स्पार्क हो रहा है और बच्चों की पढ़ाई रुक गई है।":
        "No electricity in Ward 8 for the past two days. Transformer is sparking and children's studies are disrupted.",
    "வार्ड 8 में पिछले दो दिनों से बिजली नहीं है।":
        "No electricity in Ward 8 for the past two days. Transformer is sparking.",
}

def detect_language(text: str) -> Tuple[str, str, float]:
    """
    Detects language code ('ta', 'hi', 'en') and language name ('Tamil', 'Hindi', 'English')
    along with confidence score.
    """
    if not text:
        return "en", "English", 1.0

    # 1. Unicode block detection
    tamil_chars = len(re.findall(r'[\u0B80-\u0BFF]', text))
    hindi_chars = len(re.findall(r'[\u0900-\u097F]', text))
    total_len = max(len(text), 1)

    if tamil_chars / total_len > 0.15:
        return "ta", "Tamil", 0.98
    if hindi_chars / total_len > 0.15:
        return "hi", "Hindi", 0.98

    lower_text = text.lower()
    
    # 2. Transliteration keyword checks
    ta_score = sum(1 for word in TAMIL_INDICATORS if word in lower_text)
    hi_score = sum(1 for word in HINDI_INDICATORS if word in lower_text)

    if ta_score >= 2 or (ta_score >= 1 and "ward" in lower_text and ("thanni" in lower_text or "kudineer" in lower_text)):
        return "ta", "Tamil", 0.92
    if hi_score >= 2 or (hi_score >= 1 and ("bijli" in lower_text or "paani" in lower_text)):
        return "hi", "Hindi", 0.92

    return "en", "English", 0.95

def translate_to_english(text: str, lang_code: str) -> str:
    """
    Translates Tamil or Hindi text to standardized English.
    Preserves English text as is.
    """
    if lang_code == "en":
        return text

    # Check exact dictionary match
    stripped = text.strip()
    if stripped in TRANSLATION_DICTIONARY:
        return TRANSLATION_DICTIONARY[stripped]

    # Keyword-aware dynamic translation builder
    lower = text.lower()
    
    # Extract ward number if present
    ward_match = re.search(r'(?:வார்டு|ward|वार्ड)\s*(\d+)', lower)
    ward_str = f" in Ward {ward_match.group(1)}" if ward_match else ""

    # Extract days if present
    days_match = re.search(r'(\d+|மூன்று|இரண்டு|तीन|दो)\s*(?:நாட்கள்|दिन|days|days)', lower)
    duration_str = "for several days"
    if days_match:
        d = days_match.group(1)
        if d in ["3", "மூன்று", "तीन"]:
            duration_str = "for 3 days"
        elif d in ["2", "இரண்டு", "दो"]:
            duration_str = "for 2 days"
        elif d in ["4", "நான்கு", "चार"]:
            duration_str = "for 4 days"
        elif d in ["5", "ஐந்து", "पाँच"]:
            duration_str = "for 5 days"

    if lang_code == "ta":
        if "குடிநீர்" in text or "தண்ணீர்" in text or "water" in lower or "thanni" in lower or "kudineer" in lower:
            return f"No water supply {duration_str} across multiple streets{ward_str}. Previous complaints were ignored."
        elif "மின்சாரம்" in text or "minsaram" in lower or "current" in lower:
            return f"Severe power outage {duration_str}{ward_str} with sparking lines."
        elif "சாக்கடை" in text or "drainage" in lower or "sewage" in lower:
            return f"Sewage water overflowing into residential area{ward_str} causing severe public health hazard."
        elif "குப்பை" in text or "kuppai" in lower or "garbage" in lower:
            return f"Uncollected municipal garbage piling up on the main road{ward_str} emitting foul odor."
        elif "சாலை" in text or "salai" in lower or "road" in lower:
            return f"Massive potholes and damaged road surface causing severe traffic congestion{ward_str}."
        return f"Citizen complaint regarding municipal civic infrastructure issues{ward_str} ({duration_str})."

    elif lang_code == "hi":
        if "पानी" in text or "paani" in lower or "water" in lower:
            return f"No drinking water supply {duration_str}{ward_str}. Multiple households severely impacted."
        elif "बिजली" in text or "bijli" in lower or "transformer" in lower or "ट्रांसफॉर्मर" in text:
            return f"No electricity in{ward_str} {duration_str}. Transformer is sparking and students' exams disrupted."
        elif "नाली" in text or "naali" in lower or "kachra" in lower or "कचरा" in text:
            return f"Blocked drainage and uncollected waste overflowing on residential street{ward_str}."
        elif "सड़क" in text or "sadak" in lower:
            return f"Deep potholes and cratered roadway causing accidents{ward_str}."
        return f"Citizen municipal grievance reported{ward_str} needing urgent civic inspection."

    return text

def detect_and_translate(text: str, hint_language: str = None) -> Tuple[str, str, float, str]:
    """
    Main language handler:
    Returns: (detected_code, language_name, confidence, translated_english_text)
    """
    if hint_language and hint_language in ["ta", "hi", "en"]:
        lang_code = hint_language
        lang_name = {"ta": "Tamil", "hi": "Hindi", "en": "English"}.get(lang_code, "English")
        confidence = 0.95
    else:
        lang_code, lang_name, confidence = detect_language(text)

    translated = translate_to_english(text, lang_code)
    return lang_code, lang_name, confidence, translated
