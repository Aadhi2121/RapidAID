import re
from typing import Dict, Any, Tuple

CHENNAI_LOCALITY_COORDINATES: Dict[str, Tuple[float, float, str]] = {
    "anna nagar": (13.0850, 80.2100, "Ward 104"),
    "t. nagar": (13.0418, 80.2341, "Ward 117"),
    "t nagar": (13.0418, 80.2341, "Ward 117"),
    "adyar": (13.0012, 80.2565, "Ward 175"),
    "velachery": (12.9815, 80.2180, "Ward 178"),
    "guindy": (13.0067, 80.2024, "Ward 170"),
    "mylapore": (13.0368, 80.2676, "Ward 124"),
    "tambaram": (12.9249, 80.1000, "Ward 190"),
    "porur": (13.0382, 80.1565, "Ward 150"),
    "royapettah": (13.0537, 80.2642, "Ward 115"),
    "kodambakkam": (13.0524, 80.2250, "Ward 112"),
    "perambur": (13.1075, 80.2337, "Ward 72"),
    "nungambakkam": (13.0569, 80.2425, "Ward 110"),
    "saidapet": (13.0213, 80.2231, "Ward 142"),
    "triplicane": (13.0587, 80.2757, "Ward 116"),
    "egmore": (13.0732, 80.2609, "Ward 77"),
    "george town": (13.0900, 80.2800, "Ward 54"),
    "thiruvanmiyur": (12.9830, 80.2594, "Ward 179"),
    "alwarpet": (13.0334, 80.2505, "Ward 123"),
    "kilpauk": (13.0784, 80.2410, "Ward 102"),
    "ward 12": (13.1120, 80.2150, "Ward 12"),
    "ward 8": (13.1250, 80.2200, "Ward 8"),
    "ward 14": (13.0980, 80.2050, "Ward 14"),
    "ward 104": (13.0850, 80.2100, "Ward 104"),
}

DEFAULT_CHENNAI_LAT = 13.0827
DEFAULT_CHENNAI_LNG = 80.2707

def extract_civic_entities(text: str) -> Dict[str, Any]:
    """
    Extracts civic entities:
    - location_name, ward, latitude, longitude
    - duration
    - affected_population
    - infrastructure_type
    - urgency_indicators
    - department_terms
    """
    lower = text.lower()
    
    # 1. Ward Extraction
    ward_match = re.search(r'(?:ward|வார்டு|वार्ड)\s*(\d+)', lower)
    ward = f"Ward {ward_match.group(1)}" if ward_match else None

    # 2. Locality & Coordinates
    detected_locality = "Chennai"
    lat, lng = DEFAULT_CHENNAI_LAT, DEFAULT_CHENNAI_LNG

    for locality_name, coords in CHENNAI_LOCALITY_COORDINATES.items():
        if locality_name in lower:
            detected_locality = locality_name.title()
            lat, lng = coords[0], coords[1]
            if not ward:
                ward = coords[2]
            break

    if ward and detected_locality == "Chennai":
        detected_locality = f"{ward}, Chennai"
        # Synthetic slight offset based on ward number for realistic mapping
        if ward_match:
            wn = int(ward_match.group(1))
            lat = 13.05 + (wn % 20) * 0.005
            lng = 80.20 + ((wn * 7) % 20) * 0.005

    # 3. Duration Extraction
    duration = "Unspecified"
    duration_match = re.search(r'(\d+|three|two|four|five|six|seven|several)\s*(?:days|day|hours|hour|weeks|week|நாட்கள்|दिन)', lower)
    if duration_match:
        val = duration_match.group(0)
        duration = val
    elif "today" in lower:
        duration = "Today"
    elif "since yesterday" in lower:
        duration = "Since yesterday (24h)"

    # 4. Affected Population Estimation
    affected_population = 50  # Default reasonable street level
    if "multiple streets" in lower or "entire street" in lower or "whole area" in lower or "all residents" in lower:
        affected_population = 250
    elif "multiple wards" in lower or "entire colony" in lower or "neighbourhood" in lower or "neighborhood" in lower:
        affected_population = 800
    elif "apartment" in lower or "complex" in lower or "building" in lower:
        affected_population = 120
    elif "my house" in lower or "individual" in lower or "one house" in lower:
        affected_population = 5

    # Check for direct numbers
    pop_match = re.search(r'(\d+)\s*(?:people|residents|families|houses|households|streets)', lower)
    if pop_match:
        num = int(pop_match.group(1))
        if "street" in pop_match.group(0):
            affected_population = num * 60
        else:
            affected_population = num

    # 5. Infrastructure Type
    infrastructure = "General Civic Asset"
    if any(k in lower for k in ["water", "pipeline", "tap", "tanker", "pipe", "borewell", "குடிநீர்", "தண்ணீர்"]):
        infrastructure = "Water Supply Main Pipeline"
    elif any(k in lower for k in ["electric", "transformer", "power", "pole", "wire", "voltage", "current", "மின்சாரம்"]):
        infrastructure = "Electrical Grid / Distribution Transformer"
    elif any(k in lower for k in ["drainage", "sewage", "manhole", "gutter", "சாக்கடை"]):
        infrastructure = "Underground Drainage & Sewage Network"
    elif any(k in lower for k in ["garbage", "dump", "bin", "waste", "trash", "குப்பை", "कचरा"]):
        infrastructure = "Municipal Solid Waste Collection"
    elif any(k in lower for k in ["road", "pothole", "tar", "footpath", "salai", "சாலை", "सड़क"]):
        infrastructure = "Public Roadway / Arterial Street"
    elif any(k in lower for k in ["street light", "light", "dark", "vilakku", "lamp"]):
        infrastructure = "Street Lighting Infrastructure"
    elif any(k in lower for k in ["bus", "transport", "stop", "depot"]):
        infrastructure = "Public Transport Facility"
    elif any(k in lower for k in ["hospital", "clinic", "dengue", "mosquito", "dog"]):
        infrastructure = "Public Health Center"

    # 6. Urgency Indicators
    urgency_terms = []
    for term in ["ignored", "urgent", "immediate", "emergency", "severe", "danger", "hazard", "sparking", "overflowing", "critical", "children", "hospital", "patient"]:
        if term in lower:
            urgency_terms.append(term)

    return {
        "location_name": detected_locality,
        "ward": ward or "Ward 12",
        "latitude": lat,
        "longitude": lng,
        "duration": duration,
        "affected_population": affected_population,
        "infrastructure_type": infrastructure,
        "urgency_indicators": urgency_terms,
        "has_recurrence_claim": "ignored" in lower or "previous" in lower or "already complained" in lower or "again" in lower
    }
