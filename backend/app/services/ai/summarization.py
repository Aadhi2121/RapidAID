from typing import Dict, Any

def generate_structured_summary(
    category: str,
    subcategory: str,
    entities: Dict[str, Any],
    severity: str,
    urgency: str,
    raw_text: str
) -> str:
    """
    Generates a concise structured civic summary containing:
    Problem, Location, Duration, Affected population, Previous complaints, Urgency.
    """
    loc_name = entities.get("location_name", "Chennai")
    ward = entities.get("ward", "")
    duration = entities.get("duration", "")
    pop = entities.get("affected_population", 50)
    has_recurrence = entities.get("has_recurrence_claim", False)

    # Location formatting
    loc_str = ward if ward else loc_name
    if loc_name and ward and ward not in loc_name:
        loc_str = f"{loc_name} ({ward})"

    # Duration formatting
    dur_str = f" for {duration}" if duration and duration != "Unspecified" else ""

    # Problem description
    problem_str = f"{subcategory}" if subcategory else f"{category} issue"
    if "No water supply" in raw_text or "குடிநீர் விநியோகம் இல்லை" in raw_text:
        problem_str = "No water supply"
    elif "Sparking Transformer" in subcategory:
        problem_str = "Transformer sparking hazard and severe power outage"
    elif "Sewage Overflow" in subcategory:
        problem_str = "Severe sewage overflow"

    # Population formatting
    pop_str = f"affecting ~{pop} residents across multiple streets" if pop > 100 else f"affecting local residents in {loc_str}"

    summary = f"{problem_str}{dur_str} in {loc_str} {pop_str}."

    if has_recurrence:
        summary += " Citizen reports previous complaints were ignored."

    return summary
