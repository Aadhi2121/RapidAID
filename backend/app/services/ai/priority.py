from typing import Dict, Any

SEVERITY_WEIGHTS = {
    "CRITICAL": 100,
    "HIGH": 80,
    "MEDIUM": 50,
    "LOW": 20
}

URGENCY_WEIGHTS = {
    "EMERGENCY": 100,
    "HIGH": 80,
    "MEDIUM": 50,
    "LOW": 20
}

SLA_RISK_WEIGHTS = {
    "HIGH": 95,
    "MEDIUM": 55,
    "LOW": 20
}

def calculate_priority_score(
    severity: str,
    urgency: str,
    sla_risk: str,
    affected_population: int,
    has_recurrence: bool,
    sentiment: str = "NEUTRAL"
) -> Dict[str, Any]:
    """
    Computes explainable 0–100 priority score using transparent formula:
    - Severity: 30%
    - Urgency: 25%
    - SLA Risk: 20%
    - Affected Population: 15%
    - Recurrence: 10%
    """
    # 1. Component scores (0-100)
    sev_val = SEVERITY_WEIGHTS.get(severity.upper(), 50)
    urg_val = URGENCY_WEIGHTS.get(urgency.upper(), 50)
    sla_val = SLA_RISK_WEIGHTS.get(sla_risk.upper(), 30)

    # Population scaling: 1-5 -> 10, 50 -> 40, 200 -> 75, 500+ -> 95, 1000+ -> 100
    if affected_population >= 500:
        pop_val = 100
    elif affected_population >= 200:
        pop_val = 80
    elif affected_population >= 50:
        pop_val = 50
    elif affected_population >= 10:
        pop_val = 30
    else:
        pop_val = 15

    # Recurrence factor (citizen reported previous ignored complaints / repeat issue)
    rec_val = 90 if has_recurrence else 15

    # Minor sentiment factor adjustment for distressed/angry citizens (+1 to +3 pts capped)
    sentiment_bonus = 0
    if sentiment in ["DISTRESSED", "ANGRY"]:
        sentiment_bonus = 2.5
    elif sentiment == "FRUSTRATED":
        sentiment_bonus = 1.5

    # 2. Weighted Sum
    # Formula: 30% Severity, 25% Urgency, 20% SLA Risk, 15% Affected Population, 10% Recurrence
    score = (
        (sev_val * 0.30) +
        (urg_val * 0.25) +
        (sla_val * 0.20) +
        (pop_val * 0.15) +
        (rec_val * 0.10) +
        sentiment_bonus
    )

    score = round(min(100.0, max(0.0, score)), 1)

    # 3. Categorize Priority Level
    if score >= 80:
        priority_level = "CRITICAL"
    elif score >= 60:
        priority_level = "HIGH"
    elif score >= 35:
        priority_level = "MEDIUM"
    else:
        priority_level = "LOW"

    # 4. Formulate Detailed Reasoning
    reasons = []
    if sev_val >= 80:
        reasons.append(f"High severity hazard ({severity})")
    if urg_val >= 80:
        reasons.append(f"Immediate urgency ({urgency})")
    if sla_val >= 80:
        reasons.append("Imminent SLA breach risk based on historical response times")
    if pop_val >= 70:
        reasons.append(f"Large civic impact affecting ~{affected_population} residents across multiple streets")
    if has_recurrence:
        reasons.append("Unresolved repeat complaint with historical recurrence penalty")

    if not reasons:
        reasons.append(f"Standard priority assignment ({priority_level}) for routine civic maintenance")

    reasoning = f"Calculated {score}/100 ({priority_level}) — " + "; ".join(reasons) + "."

    return {
        "priority_score": score,
        "priority_level": priority_level,
        "breakdown": {
            "severity_component": round(sev_val * 0.30, 1),
            "urgency_component": round(urg_val * 0.25, 1),
            "sla_risk_component": round(sla_val * 0.20, 1),
            "population_component": round(pop_val * 0.15, 1),
            "recurrence_component": round(rec_val * 0.10, 1),
            "sentiment_adjustment": round(sentiment_bonus, 1)
        },
        "reasoning": reasoning
    }
