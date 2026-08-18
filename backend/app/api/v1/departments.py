from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Department, Complaint
from app.schemas.schemas import DepartmentResponse, DepartmentRecommendation
from app.services.ai.department_recommendation import recommend_department

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.get("", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    """Returns all civic departments."""
    return db.query(Department).all()

@router.get("/recommend", response_model=DepartmentRecommendation)
def get_department_recommendation(
    category: str = Query(..., description="Complaint category"),
    subcategory: Optional[str] = Query("", description="Complaint subcategory"),
    location: Optional[str] = Query("Chennai", description="Location or ward"),
    ward: Optional[str] = Query("Ward 12", description="Ward number"),
    text: Optional[str] = Query("", description="Complaint text"),
    db: Session = Depends(get_db)
):
    """
    Intelligent department recommendation endpoint.
    """
    depts = [
        {"id": d.id, "name": d.name, "category": d.category, "sla_hours": d.sla_hours}
        for d in db.query(Department).all()
    ]
    
    similar_complaints = [
        {"id": c.id, "category": c.category, "location_name": c.location_name}
        for c in db.query(Complaint).filter(Complaint.category == category).limit(5).all()
    ]

    result = recommend_department(
        category=category,
        subcategory=subcategory or "",
        location_name=location or "Chennai",
        ward=ward or "Ward 12",
        complaint_text=text or "",
        departments_list=depts,
        similar_complaints=similar_complaints
    )

    return result
