from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.schemas import (
    AnalyticsOverviewResponse,
    AnalyticsTrendsResponse,
    AnalyticsHotspotsResponse
)
from app.services.analytics import (
    get_analytics_overview,
    get_analytics_trends,
    get_analytics_hotspots
)

router = APIRouter(prefix="/analytics", tags=["Predictive Governance & Analytics"])

@router.get("/overview", response_model=AnalyticsOverviewResponse)
def analytics_overview(db: Session = Depends(get_db)):
    """Returns executive overview KPIs, charts, and AI predictive insights."""
    return get_analytics_overview(db)

@router.get("/trends", response_model=AnalyticsTrendsResponse)
def analytics_trends(db: Session = Depends(get_db)):
    """Returns 7-day trend history and category growth rates."""
    return get_analytics_trends(db)

@router.get("/hotspots", response_model=AnalyticsHotspotsResponse)
def analytics_hotspots(db: Session = Depends(get_db)):
    """Returns geospatial cluster data and hotspot points for Leaflet map."""
    return get_analytics_hotspots(db)
