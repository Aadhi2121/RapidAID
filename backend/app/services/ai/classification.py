import os
import re
from typing import Dict, Any, Tuple

# Domain Categories & Subcategories
CATEGORY_HIERARCHY = {
    "Water Supply": [
        "Water Shortage", "Low Pressure", "Contaminated Water",
        "Pipeline Burst", "Tanker Request", "Leakage in Valve"
    ],
    "Electricity": [
        "Power Outage", "Sparking Transformer", "Low Voltage",
        "Meter Fault", "Street Light Pole Spark", "Fallen Electric Wire"
    ],
    "Roads & Infrastructure": [
        "Pothole", "Road Cave-in", "Broken Footpath",
        "Illegal Road Cutting", "Speed Breaker Damage", "Bridge Hazard"
    ],
    "Garbage / Sanitation": [
        "Garbage Dump Overflow", "Uncollected Waste", "Dead Animal Removal",
        "Public Urination / Open Littering", "Commercial Waste Dumping"
    ],
    "Drainage": [
        "Sewage Overflow", "Blocked Storm Drain", "Manhole Missing / Open",
        "Monsoon Waterlogging", "Foul Odor Emission"
    ],
    "Public Transport": [
        "Bus Frequency Shortage", "Bus Stop Shelter Damage", "Bus Overcrowding",
        "Rash Driving", "Route Extension Request"
    ],
    "Healthcare": [
        "Dengue / Mosquito Fogging Request", "Primary Health Center Delay",
        "Stray Dog Menace", "Public Sanitation Risk", "Vaccine Stock Shortage"
    ],
    "Public Safety": [
        "Open Borewell Hazard", "Broken Tree Branch Over Road",
        "Building Structural Hazard", "Illegal Encroachment", "Dark Unlit Alley"
    ],
    "Street Lighting": [
        "Street Light Not Working", "Flashing / Defective Light",
        "Underground Cable Snag", "Timer Misconfiguration"
    ],
    "Government Services": [
        "Certificate Issuance Delay", "Property Tax Assessment Error",
        "Ration Distribution Issue", "Citizen Service Counter Delay"
    ],
    "Other": [
        "General Civic Grievance", "Administrative Inquiry"
    ]
}

CATEGORY_KEYWORDS = {
    "Water Supply": [
        "water", "drinking water", "water supply", "tanker", "pipe", "pipeline",
        "tap", "borewell", "kudineer", "thanni", "paani", "shortage", "burst"
    ],
    "Electricity": [
        "electricity", "power", "current", "power outage", "blackout", "transformer",
        "voltage", "spark", "sparking", "wire", "eb", "tangedco", "bijli", "minsaram"
    ],
    "Roads & Infrastructure": [
        "road", "pothole", "potholes", "tar", "footpath", "salai", "sadak",
        "speed breaker", "cave-in", "crater", "asphalt", "flyover"
    ],
    "Garbage / Sanitation": [
        "garbage", "trash", "waste", "dump", "dustbin", "kuppai", "kachra",
        "dead animal", "litter", "uncollected", "cleanliness"
    ],
    "Drainage": [
        "drainage", "sewage", "gutter", "manhole", "drain", "waterlogging",
        "stormwater", "overflow", "stagnant", "choked", "stink", "foul smell"
    ],
    "Public Transport": [
        "bus", "transport", "bus stop", "route", "conductor", "driver",
        "depot", "mtc", "commute", "ticket"
    ],
    "Healthcare": [
        "mosquito", "dengue", "fogging", "dog bite", "stray dog", "clinic",
        "hospital", "doctor", "health center", "phc", "epidemic"
    ],
    "Public Safety": [
        "borewell", "hazard", "tree fallen", "branch", "collapse", "danger",
        "illegal construction", "safety", "fire"
    ],
    "Street Lighting": [
        "street light", "light", "lamp post", "darkness", "bulb", "unlit",
        "vilakku", "batti", "pole"
    ],
    "Government Services": [
        "ration", "certificate", "birth certificate", "death certificate",
        "property tax", "revenue", "taluk", "pension", "bribe", "officer delay"
    ]
}

def classify_complaint(text: str) -> Dict[str, Any]:
    """
    Classifies complaint text into Category, Subcategory, Severity, and Urgency.
    Returns:
        category, subcategory, confidence, severity, urgency
    """
    lower = text.lower()
    
    # 1. Keyword match scoring
    scores = {}
    for cat, kws in CATEGORY_KEYWORDS.items():
        score = 0
        for kw in kws:
            if kw in lower:
                # Give higher weight to exact phrases
                score += 2 if len(kw.split()) > 1 else 1
        scores[cat] = score

    best_cat = max(scores, key=scores.get)
    max_score = scores[best_cat]

    if max_score == 0:
        best_cat = "Other"
        confidence = 0.50
    else:
        confidence = min(0.65 + (max_score * 0.08), 0.96)

    # 2. Determine Subcategory
    subcat = CATEGORY_HIERARCHY.get(best_cat, ["General"])[0]
    
    if best_cat == "Water Supply":
        if "shortage" in lower or "no water" in lower or "three days" in lower or "2 days" in lower:
            subcat = "Water Shortage"
        elif "burst" in lower or "leaking" in lower or "pipe burst" in lower:
            subcat = "Pipeline Burst"
        elif "dirty" in lower or "contaminated" in lower or "muddy" in lower or "smell" in lower:
            subcat = "Contaminated Water"
        elif "tanker" in lower or "lorry" in lower:
            subcat = "Tanker Request"
        elif "low pressure" in lower:
            subcat = "Low Pressure"
    elif best_cat == "Electricity":
        if "spark" in lower or "transformer" in lower or "fire" in lower:
            subcat = "Sparking Transformer"
        elif "outage" in lower or "no power" in lower or "blackout" in lower or "no electricity" in lower:
            subcat = "Power Outage"
        elif "voltage" in lower:
            subcat = "Low Voltage"
        elif "wire" in lower or "fallen" in lower:
            subcat = "Fallen Electric Wire"
    elif best_cat == "Drainage":
        if "manhole" in lower or "open" in lower:
            subcat = "Manhole Missing / Open"
        elif "overflow" in lower or "sewage" in lower:
            subcat = "Sewage Overflow"
        elif "waterlog" in lower or "flood" in lower:
            subcat = "Monsoon Waterlogging"
        else:
            subcat = "Blocked Storm Drain"
    elif best_cat == "Roads & Infrastructure":
        if "pothole" in lower or "crater" in lower:
            subcat = "Pothole"
        elif "cave" in lower or "collapse" in lower:
            subcat = "Road Cave-in"
        elif "footpath" in lower or "pedestrian" in lower:
            subcat = "Broken Footpath"
    elif best_cat == "Garbage / Sanitation":
        if "overflow" in lower or "pile" in lower:
            subcat = "Garbage Dump Overflow"
        elif "animal" in lower or "dog" in lower or "dead" in lower:
            subcat = "Dead Animal Removal"
        else:
            subcat = "Uncollected Waste"
    elif best_cat == "Street Lighting":
        if "dark" in lower or "not working" in lower:
            subcat = "Street Light Not Working"

    # 3. Assess Severity & Urgency
    severity = "MEDIUM"
    urgency = "MEDIUM"

    # Critical indicators
    if any(w in lower for w in ["spark", "fire", "open borewell", "manhole missing", "hospital", "patient", "poison", "collapse"]):
        severity = "CRITICAL"
        urgency = "EMERGENCY"
    elif any(w in lower for w in ["three days", "3 days", "4 days", "week", "multiple streets", "ignored", "severe", "overflowing"]):
        severity = "HIGH"
        urgency = "HIGH"
    elif any(w in lower for w in ["minor", "request", "inquiry", "one day"]):
        severity = "LOW"
        urgency = "LOW"

    return {
        "category": best_cat,
        "subcategory": subcat,
        "confidence": round(confidence, 2),
        "severity": severity,
        "urgency": urgency
    }
