from typing import Dict, Any

# Standard statutory SLA hours per department category
DEPARTMENT_SLA_CATALOG = {
    "Water Supply": 24,         # 24 hours standard SLA
    "Electricity": 12,          # 12 hours standard SLA
    "Roads & Infrastructure": 72,# 72 hours standard SLA
    "Garbage / Sanitation": 24, # 24 hours standard SLA
    "Drainage": 24,             # 24 hours standard SLA
    "Public Transport": 48,     # 48 hours standard SLA
    "Healthcare": 36,           # 36 hours standard SLA
    "Public Safety": 12,        # 12 hours emergency SLA
    "Street Lighting": 48,      # 48 hours standard SLA
    "Government Services": 96,  # 96 hours standard SLA
    "Other": 48
}

def predict_sla_resolution(
    category: str,
    severity: str,
    urgency: str,
    affected_population: int,
    department_sla_hours: int = None,
    current_workload_cases: int = 15,
    is_recurring: bool = False
) -> Dict[str, Any]:
    """
    Predicts resolution time in hours using category complexity, severity, and backlog workload.
    Compares against statutory SLA and evaluates SLA risk.
    """
    statutory_sla = department_sla_hours or DEPARTMENT_SLA_CATALOG.get(category, 48)

    # Base hours by category complexity
    base_hours_map = {
        "Water Supply": 18.0,
        "Electricity": 8.0,
        "Roads & Infrastructure": 48.0,
        "Garbage / Sanitation": 14.0,
        "Drainage": 20.0,
        "Public Transport": 30.0,
        "Healthcare": 22.0,
        "Public Safety": 6.0,
        "Street Lighting": 24.0,
        "Government Services": 60.0,
        "Other": 36.0
    }
    predicted = base_hours_map.get(category, 24.0)

    # Severity multiplier (high complexity increases repair duration)
    sev_multiplier = {
        "CRITICAL": 1.4,
        "HIGH": 1.25,
        "MEDIUM": 1.0,
        "LOW": 0.8
    }.get(severity, 1.0)

    # Workload queue delay (+1.5 hours per active case in queue beyond 10)
    workload_delay = max(0, current_workload_cases - 10) * 1.5

    # Population scale factor
    pop_delay = 4.0 if affected_population > 200 else 0.0

    # Repeat penalty if recurring
    rec_delay = 6.0 if is_recurring else 0.0

    predicted = (predicted * sev_multiplier) + workload_delay + pop_delay + rec_delay
    predicted_hours = round(predicted, 1)

    # SLA Risk Evaluation
    ratio = predicted_hours / statutory_sla
    if ratio >= 1.0 or (statutory_sla - predicted_hours) <= 4:
        sla_risk = "HIGH"
        reasoning = (
            f"Predicted resolution time of {predicted_hours}h exceeds statutory SLA of {statutory_sla}h "
            f"due to multi-street outage complexity and department caseload backlog."
        )
    elif ratio >= 0.70:
        sla_risk = "MEDIUM"
        reasoning = (
            f"Predicted resolution time ({predicted_hours}h) is approaching statutory SLA limit ({statutory_sla}h)."
        )
    else:
        sla_risk = "LOW"
        reasoning = (
            f"Predicted resolution time ({predicted_hours}h) is comfortably within statutory SLA ({statutory_sla}h)."
        )

    return {
        "predicted_resolution_hours": predicted_hours,
        "department_sla_hours": statutory_sla,
        "sla_risk": sla_risk,
        "reasoning": reasoning
    }
