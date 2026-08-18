import logging
from typing import Dict, Any, List, Optional
from app.services.ai.language_detection import detect_and_translate
from app.services.ai.entity_extraction import extract_civic_entities
from app.services.ai.classification import classify_complaint
from app.services.ai.sentiment import analyze_sentiment
from app.services.ai.summarization import generate_structured_summary
from app.services.ai.duplicate_detection import find_duplicate_complaints
from app.services.ai.department_recommendation import recommend_department
from app.services.ai.priority import calculate_priority_score
from app.services.ai.sla_prediction import predict_sla_resolution
from app.services.ai.officer_recommendation import recommend_officer

logger = logging.getLogger("civicai.ai")

def analyze_complaint_pipeline(
    raw_text: str,
    hint_language: Optional[str] = None,
    location_hint: Optional[str] = None,
    departments_list: Optional[List[Dict[str, Any]]] = None,
    officers_list: Optional[List[Dict[str, Any]]] = None,
    existing_complaints: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Complete master orchestration executing the 10-stage AI pipeline:
    1. Language Detection & Translation (Tamil / Hindi / English)
    2. Civic NLP & Named Entity Extraction
    3. Category & Subcategory Classification + Severity/Urgency
    4. Sentiment Analysis
    5. Structured AI Summary
    6. Semantic + Geospatial Duplicate Detection
    7. Department Recommendation
    8. Explainable 0-100 Priority Scoring
    9. SLA Resolution Time & Risk Prediction
    10. Officer Recommendation
    """
    logger.info("[AI] Starting complaint intelligence")
    depts = departments_list or []
    officers = officers_list or []
    existing = existing_complaints or []

    # Stage 1: Language Detection & Translation
    lang_code, lang_name, lang_conf, translated_text = detect_and_translate(raw_text, hint_language)

    # Stage 2: Civic NLP & Entity Extraction
    effective_text_for_nlp = f"{translated_text} {location_hint or ''}"
    entities = extract_civic_entities(effective_text_for_nlp)

    # Stage 3: Complaint Classification
    classification = classify_complaint(translated_text)
    cat = classification["category"]
    subcat = classification["subcategory"]
    sev = classification["severity"]
    urg = classification["urgency"]
    cls_conf = classification["confidence"]
    logger.info(f"[AI] Classification completed: {cat} / {subcat} (severity={sev}, urgency={urg})")

    # Stage 4: Sentiment Analysis
    sentiment_result = analyze_sentiment(effective_text_for_nlp)
    sentiment = sentiment_result["sentiment"]
    sentiment_score = sentiment_result["sentiment_score"]
    logger.info(f"[AI] Sentiment completed: {sentiment} ({sentiment_score})")

    # Stage 5: Structured Summary
    summary = generate_structured_summary(
        category=cat,
        subcategory=subcat,
        entities=entities,
        severity=sev,
        urgency=urg,
        raw_text=translated_text
    )

    # Stage 6: Duplicate Detection (Semantic + Geospatial)
    duplicates = find_duplicate_complaints(
        new_text=f"{cat} {subcat} {summary} {translated_text}",
        new_lat=entities["latitude"],
        new_lng=entities["longitude"],
        new_category=cat,
        existing_complaints=existing
    )
    logger.info(f"[AI] Duplicate detection completed: {len(duplicates)} matching candidates found")

    # Stage 7: Department Recommendation
    recommended_dept = recommend_department(
        category=cat,
        subcategory=subcat,
        location_name=entities["location_name"],
        ward=entities["ward"],
        complaint_text=translated_text,
        departments_list=depts,
        similar_complaints=duplicates
    )
    logger.info(f"[AI] Department recommendation completed: {recommended_dept.get('department_name')}")

    # Stage 8: SLA Prediction
    sla_result = predict_sla_resolution(
        category=cat,
        severity=sev,
        urgency=urg,
        affected_population=entities["affected_population"],
        is_recurring=entities.get("has_recurrence_claim", False) or len(duplicates) > 0
    )
    logger.info(f"[AI] SLA prediction completed: {sla_result.get('predicted_resolution_hours')}h (risk={sla_result.get('sla_risk')})")

    # Stage 9: Priority Engine (30% Sev + 25% Urg + 20% SLA Risk + 15% Pop + 10% Recurrence)
    priority_result = calculate_priority_score(
        severity=sev,
        urgency=urg,
        sla_risk=sla_result["sla_risk"],
        affected_population=entities["affected_population"],
        has_recurrence=entities.get("has_recurrence_claim", False) or len(duplicates) > 0,
        sentiment=sentiment
    )
    logger.info(f"[AI] Priority completed: {priority_result.get('priority_score')}/100 ({priority_result.get('priority_level')})")

    # Stage 10: Officer Recommendation
    recommended_off = recommend_officer(
        department_id=recommended_dept["department_id"],
        location_name=entities["location_name"],
        ward=entities["ward"],
        officers_list=officers
    )

    return {
        "original_transcript": raw_text,
        "language": lang_name,
        "language_confidence": lang_conf,
        "translated_transcript": translated_text,
        "summary": summary,
        "category": cat,
        "subcategory": subcat,
        "classification_confidence": cls_conf,
        "severity": sev,
        "urgency": urg,
        "sentiment": sentiment,
        "sentiment_score": sentiment_score,
        "affected_population": entities["affected_population"],
        "entities": entities,
        "duplicates": duplicates,
        "recommended_department": recommended_dept,
        "priority": priority_result,
        "sla": sla_result,
        "recommended_officer": recommended_off
    }
