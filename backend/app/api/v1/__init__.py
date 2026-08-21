from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.calls import router as calls_router
from app.api.v1.complaints import router as complaints_router
from app.api.v1.departments import router as departments_router
from app.api.v1.officers import router as officers_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.emergency import router as emergency_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(calls_router)
api_router.include_router(complaints_router)
api_router.include_router(departments_router)
api_router.include_router(officers_router)
api_router.include_router(analytics_router)
api_router.include_router(notifications_router)
api_router.include_router(emergency_router)
