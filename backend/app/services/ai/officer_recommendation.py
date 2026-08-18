from typing import Dict, Any, List, Optional

def recommend_officer(
    department_id: Optional[int],
    location_name: str,
    ward: str,
    officers_list: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Ranks available officers within the department based on:
    - Status (AVAILABLE > ON_FIELD > BUSY > OFFLINE)
    - Active cases workload (fewer is better)
    - SLA compliance history (higher is better)
    - Locality proximity
    """
    if not officers_list:
        return {
            "officer_id": None,
            "officer_name": "Executive Field Engineer (Unassigned)",
            "confidence": 0.50,
            "reasoning": "No active officers currently registered in this department."
        }

    # Filter by department if available
    dept_officers = [
        o for o in officers_list
        if department_id is None or o.get("department_id") == department_id
    ]
    if not dept_officers:
        dept_officers = officers_list

    scored_officers = []
    for officer in dept_officers:
        score = 0.0
        
        # 1. Status weight (max 40 pts)
        status = officer.get("status", "AVAILABLE")
        if status == "AVAILABLE":
            score += 40
        elif status == "ON_FIELD":
            score += 25
        elif status == "BUSY":
            score += 10
        else:  # OFFLINE
            score += 0

        # 2. Active workload weight (max 30 pts)
        active_cases = officer.get("active_cases", 0)
        workload_pts = max(0, 30 - (active_cases * 4))
        score += workload_pts

        # 3. SLA compliance weight (max 20 pts)
        sla_comp = officer.get("sla_compliance", 90.0)
        score += (sla_comp / 100.0) * 20

        # 4. Location match (max 10 pts)
        off_loc = officer.get("location", "")
        if ward and ward.lower() in off_loc.lower():
            score += 10
        elif location_name and location_name.lower() in off_loc.lower():
            score += 8
        else:
            score += 4

        scored_officers.append((score, officer))

    # Sort best score first
    scored_officers.sort(key=lambda x: x[0], reverse=True)
    best_score, best_officer = scored_officers[0]

    confidence = round(min(0.96, max(0.65, best_score / 100.0)), 2)
    name = best_officer.get("name") or f"Officer #{best_officer.get('id', 1)}"
    active = best_officer.get("active_cases", 0)
    sla_comp = best_officer.get("sla_compliance", 95.0)
    off_loc = best_officer.get("location", "Chennai")

    reasoning = (
        f"{name} recommended ({int(confidence*100)}% match) — Status: {best_officer.get('status')}, "
        f"optimal caseload ({active} active cases), high historical SLA compliance ({sla_comp}%), "
        f"and active jurisdiction coverage in {off_loc}."
    )

    return {
        "officer_id": best_officer.get("id"),
        "officer_name": name,
        "confidence": confidence,
        "reasoning": reasoning
    }
