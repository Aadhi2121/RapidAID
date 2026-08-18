from typing import Tuple, Dict, Any

ANGRY_INDICATORS = [
    "angry", "furious", "unacceptable", "useless", "bribe", "protest",
    "shameful", "horrible", "disaster", "negligence", "corruption", "sue"
]

FRUSTRATED_INDICATORS = [
    "ignored", "no response", "how many times", "again and again", "several times",
    "repeatedly", "tired of", "no action", "complained before", "still not fixed",
    "nobody cares", "unresolved", "delay", "waiting"
]

DISTRESSED_INDICATORS = [
    "help", "emergency", "danger", "dying", "severe pain", "panic", "hazard",
    "children suffering", "elderly", "sick", "crying", "scared", "risk"
]

POSITIVE_INDICATORS = [
    "thank you", "thanks", "appreciate", "quick response", "good job", "resolved", "grateful"
]

def analyze_sentiment(text: str) -> Dict[str, Any]:
    """
    Analyzes emotional tone of the citizen communication.
    Returns:
        sentiment: POSITIVE | NEUTRAL | FRUSTRATED | ANGRY | DISTRESSED
        sentiment_score: float (-1.0 to 1.0)
        reasoning: explanation
    """
    lower = text.lower()
    
    angry_count = sum(1 for kw in ANGRY_INDICATORS if kw in lower)
    frustrated_count = sum(1 for kw in FRUSTRATED_INDICATORS if kw in lower)
    distressed_count = sum(1 for kw in DISTRESSED_INDICATORS if kw in lower)
    positive_count = sum(1 for kw in POSITIVE_INDICATORS if kw in lower)

    # Check distress / safety crisis first
    if distressed_count >= 1 and ("danger" in lower or "spark" in lower or "severe" in lower or "children" in lower):
        sentiment = "DISTRESSED"
        score = -0.75
        reason = "Citizen expresses severe distress and health/safety concerns for residents."
    elif angry_count >= 1:
        sentiment = "ANGRY"
        score = -0.85
        reason = "Citizen shows strong anger regarding prolonged municipal inaction."
    elif frustrated_count >= 1 or "three days" in lower or "ignored" in lower:
        sentiment = "FRUSTRATED"
        score = -0.60
        reason = "Citizen expresses frustration due to repeated or unresolved civic issues."
    elif positive_count >= 1:
        sentiment = "POSITIVE"
        score = 0.80
        reason = "Citizen communication conveys appreciation or acknowledgement."
    else:
        sentiment = "NEUTRAL"
        score = 0.0
        reason = "Objective reporting of civic issue with standard tone."

    return {
        "sentiment": sentiment,
        "sentiment_score": round(score, 2),
        "reasoning": reason
    }
