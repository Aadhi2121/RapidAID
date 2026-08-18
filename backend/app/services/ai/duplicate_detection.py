import math
from typing import List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates great-circle distance between two geographic coordinates in kilometers.
    """
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def compute_text_similarity(new_text: str, existing_texts: List[str]) -> List[float]:
    """
    Computes cosine similarity between new_text and a list of existing_texts.
    Uses TF-IDF vectorized n-grams for fast, robust semantic matching.
    """
    if not existing_texts:
        return []
    
    corpus = [new_text] + existing_texts
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
    try:
        tfidf_matrix = vectorizer.fit_transform(corpus)
        sims = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        return [float(s) for s in sims]
    except Exception:
        # Fallback keyword overlap if TF-IDF fails on ultra-short text
        new_words = set(new_text.lower().split())
        sims = []
        for text in existing_texts:
            other_words = set(text.lower().split())
            intersection = new_words.intersection(other_words)
            union = new_words.union(other_words)
            sims.append(len(intersection) / max(len(union), 1))
        return sims

def find_duplicate_complaints(
    new_text: str,
    new_lat: float,
    new_lng: float,
    new_category: str,
    existing_complaints: List[Dict[str, Any]],
    similarity_threshold: float = 0.65,
    distance_threshold_km: float = 3.0
) -> List[Dict[str, Any]]:
    """
    Searches existing complaints for semantic and geospatial duplicates.
    Returns matches sorted by similarity score.
    """
    if not existing_complaints:
        return []

    existing_texts = [
        f"{c.get('category', '')} {c.get('subcategory', '')} {c.get('summary', '')} {c.get('transcript', '')}"
        for c in existing_complaints
    ]

    semantic_sims = compute_text_similarity(new_text, existing_texts)
    matches = []

    for idx, complaint in enumerate(existing_complaints):
        sem_score = semantic_sims[idx] if idx < len(semantic_sims) else 0.0
        c_lat = complaint.get("latitude", new_lat)
        c_lng = complaint.get("longitude", new_lng)
        c_cat = complaint.get("category", "")
        c_status = complaint.get("status", "RECEIVED")

        # Skip already closed/resolved historical complaints if comparing against active duplicates
        if c_status in ["CLOSED", "RESOLVED"]:
            status_penalty = 0.9
        else:
            status_penalty = 1.0

        dist_km = calculate_haversine_distance(new_lat, new_lng, c_lat, c_lng)
        
        # Category bonus
        cat_match_bonus = 0.15 if c_cat.lower() == new_category.lower() else 0.0
        
        # Spatial proximity factor (1.0 at 0km, down to 0.0 beyond 5km)
        spatial_factor = max(0.0, 1.0 - (dist_km / 5.0))
        
        # Combined score
        combined_score = round(min(1.0, (sem_score * 0.65 + spatial_factor * 0.25 + cat_match_bonus) * status_penalty), 2)

        # Flag if semantic similarity is high and nearby
        if (combined_score >= similarity_threshold and dist_km <= distance_threshold_km) or sem_score > 0.82:
            reason = (
                f"High semantic overlap ({int(sem_score*100)}%) in same category '{c_cat}' "
                f"within {round(dist_km, 2)} km of location ({complaint.get('location_name', 'nearby')})."
            )
            matches.append({
                "complaint_id": complaint.get("id"),
                "summary": complaint.get("summary"),
                "category": c_cat,
                "similarity_score": combined_score,
                "distance_km": round(dist_km, 2),
                "status": c_status,
                "reason": reason
            })

    # Sort descending by similarity score
    matches.sort(key=lambda x: x["similarity_score"], reverse=True)
    return matches
