from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# --- AUTH SCHEMAS ---
class UserBase(BaseModel):
    name: str
    email: str
    role: str
    department_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- CITIZEN SCHEMAS ---
class CitizenBase(BaseModel):
    name: str
    phone: str
    preferred_language: str = "English"
    location: str = "Chennai"

class CitizenCreate(CitizenBase):
    pass

class CitizenResponse(CitizenBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- DEPARTMENT SCHEMAS ---
class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    sla_hours: int = 48
    location: str = "Chennai Central"

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class DepartmentRecommendation(BaseModel):
    department_id: Optional[int] = None
    department_name: str
    confidence: float
    reasoning: str

# --- OFFICER SCHEMAS ---
class OfficerBase(BaseModel):
    department_id: int
    status: str = "AVAILABLE"
    active_cases: int = 0
    sla_compliance: float = 95.0
    location: str = "Chennai"

class OfficerResponse(OfficerBase):
    id: int
    user_id: int
    name: Optional[str] = None
    email: Optional[str] = None
    department_name: Optional[str] = None

    class Config:
        from_attributes = True

class OfficerRecommendation(BaseModel):
    officer_id: Optional[int] = None
    officer_name: str
    confidence: float
    reasoning: str

class OfficerAssignRequest(BaseModel):
    officer_id: int
    notes: Optional[str] = None

# --- AI ANALYSIS RESULT SCHEMAS ---
class DuplicateMatch(BaseModel):
    complaint_id: str
    summary: Optional[str] = None
    category: Optional[str] = None
    similarity_score: float
    distance_km: Optional[float] = None
    reason: str

class PriorityResult(BaseModel):
    priority_score: float
    priority_level: str
    breakdown: Dict[str, float]
    reasoning: str

class SLAResult(BaseModel):
    predicted_resolution_hours: float
    department_sla_hours: int
    sla_risk: str
    reasoning: str

class AIAnalysisResult(BaseModel):
    original_transcript: str
    language: str
    language_confidence: float
    translated_transcript: str
    summary: str
    category: str
    subcategory: str
    classification_confidence: float
    severity: str
    urgency: str
    sentiment: str
    sentiment_score: float
    affected_population: int
    entities: Dict[str, Any] = Field(default_factory=dict)
    duplicates: List[DuplicateMatch] = Field(default_factory=list)
    recommended_department: DepartmentRecommendation
    priority: PriorityResult
    sla: SLAResult
    recommended_officer: OfficerRecommendation

# --- COMPLAINT SCHEMAS ---
class ComplaintEventResponse(BaseModel):
    id: int
    complaint_id: str
    event_type: str
    description: str
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintDuplicateResponse(BaseModel):
    id: int
    complaint_id: str
    related_complaint_id: str
    similarity_score: float
    created_at: datetime

    class Config:
        from_attributes = True

class AIAnalysisRecordResponse(BaseModel):
    id: int
    model_name: str
    model_version: str
    classification_confidence: float
    department_confidence: float
    priority_reasoning: Optional[str] = None
    department_reasoning: Optional[str] = None
    duplicate_reasoning: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintBase(BaseModel):
    source: str = "VOICE_CALL"
    language: str = "English"
    transcript: str
    translation: Optional[str] = None
    summary: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    severity: str = "MEDIUM"
    urgency: str = "MEDIUM"
    sentiment: str = "NEUTRAL"
    sentiment_score: float = 0.0
    affected_population: int = 1
    latitude: float = 13.0827
    longitude: float = 80.2707
    location_name: str = "Chennai"
    priority_score: float = 50.0
    priority_level: str = "MEDIUM"
    department_id: Optional[int] = None
    assigned_officer_id: Optional[int] = None
    sla_hours: int = 48
    predicted_resolution_hours: float = 24.0
    sla_risk: str = "LOW"
    status: str = "RECEIVED"

class ComplaintCreate(BaseModel):
    source: str = "VOICE_CALL"
    transcript: str
    language: Optional[str] = None
    citizen_name: Optional[str] = "Anonymous Caller"
    citizen_phone: Optional[str] = "9000000000"
    location_name: Optional[str] = "Chennai"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    run_ai: bool = True

class ComplaintUpdate(BaseModel):
    status: Optional[str] = None
    department_id: Optional[int] = None
    assigned_officer_id: Optional[int] = None
    severity: Optional[str] = None
    urgency: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    notes: Optional[str] = None

class ComplaintEscalateRequest(BaseModel):
    reason: str
    escalated_to_department_id: Optional[int] = None

class ComplaintResolveRequest(BaseModel):
    resolution_notes: str
    resolved_by: Optional[str] = None

class ComplaintMergeRequest(BaseModel):
    target_complaint_id: str
    reason: str

class ComplaintResponse(ComplaintBase):
    id: str
    citizen_id: Optional[int] = None
    citizen_name: Optional[str] = None
    citizen_phone: Optional[str] = None
    department_name: Optional[str] = None
    assigned_officer_name: Optional[str] = None
    sla_deadline: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ComplaintDetailResponse(ComplaintResponse):
    events: List[ComplaintEventResponse] = []
    duplicates: List[ComplaintDuplicateResponse] = []
    ai_analyses: List[AIAnalysisRecordResponse] = []

# --- CALL & TRANSCRIBE SCHEMAS ---
class TranscribeRequest(BaseModel):
    language: Optional[str] = None

class TranscribeResponse(BaseModel):
    transcript: str
    language: str
    confidence: float
    detected_language_name: str
    engine_used: str = "DEMO / FALLBACK MODE"
    file_name: Optional[str] = None
    duration_seconds: Optional[float] = None

class CallAnalyzeRequest(BaseModel):
    text: Optional[str] = None
    language: Optional[str] = "auto"
    location: Optional[str] = None
    caller_name: Optional[str] = None
    caller_phone: Optional[str] = None

# --- NOTIFICATION SCHEMAS ---
class NotificationResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    complaint_id: Optional[str] = None
    type: str
    title: str
    message: str
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- ANALYTICS SCHEMAS ---
class AnalyticsOverviewResponse(BaseModel):
    total_complaints: int
    active_complaints: int
    critical_complaints: int
    resolved_complaints: int
    sla_compliance_rate: float
    avg_resolution_hours: float
    duplicate_count: int
    high_sla_risk_count: int
    department_distribution: List[Dict[str, Any]]
    category_distribution: List[Dict[str, Any]]
    sentiment_distribution: List[Dict[str, Any]]
    priority_distribution: List[Dict[str, Any]]
    insights: List[Dict[str, Any]]

class TrendPoint(BaseModel):
    date: str
    total: int
    resolved: int
    critical: int

class AnalyticsTrendsResponse(BaseModel):
    daily_trends: List[TrendPoint]
    category_growth: List[Dict[str, Any]]

class HotspotPoint(BaseModel):
    id: str
    location_name: str
    ward: str
    latitude: float
    longitude: float
    category: str
    priority_level: str
    status: str
    complaint_count: int
    risk_level: str
    summary: str

class AnalyticsHotspotsResponse(BaseModel):
    hotspots: List[HotspotPoint]
    critical_zones: List[Dict[str, Any]]
