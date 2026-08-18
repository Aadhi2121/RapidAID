from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Officer, User, Department
from app.schemas.schemas import OfficerResponse, OfficerRecommendation
from app.services.ai.officer_recommendation import recommend_officer

router = APIRouter(prefix="/officers", tags=["Officers"])

@router.get("", response_model=List[OfficerResponse])
def get_officers(department_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Returns all officers with user profile details."""
    query = db.query(Officer)
    if department_id:
        query = query.filter(Officer.department_id == department_id)
    
    officers = query.all()
    results = []
    for off in officers:
        results.append({
            "id": off.id,
            "user_id": off.user_id,
            "department_id": off.department_id,
            "status": off.status,
            "active_cases": off.active_cases,
            "sla_compliance": off.sla_compliance,
            "location": off.location,
            "name": off.user.name if off.user else f"Officer #{off.id}",
            "email": off.user.email if off.user else None,
            "department_name": off.department.name if off.department else None
        })
    return results

@router.get("/recommend", response_model=OfficerRecommendation)
def get_officer_recommendation(
    department_id: Optional[int] = Query(None, description="Target department ID"),
    location: Optional[str] = Query("Chennai", description="Location name"),
    ward: Optional[str] = Query("Ward 12", description="Ward number"),
    db: Session = Depends(get_db)
):
    """
    Intelligent officer recommendation endpoint based on current workload, SLA, and location.
    """
    officers = []
    for off in db.query(Officer).all():
        officers.append({
            "id": off.id,
            "department_id": off.department_id,
            "status": off.status,
            "active_cases": off.active_cases,
            "sla_compliance": off.sla_compliance,
            "location": off.location,
            "name": off.user.name if off.user else f"Officer #{off.id}"
        })

    return recommend_officer(
        department_id=department_id,
        location_name=location or "Chennai",
        ward=ward or "Ward 12",
        officers_list=officers
    )
