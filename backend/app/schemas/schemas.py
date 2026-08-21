import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, field_validator

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


# ============================================================================
# EMERGENCY RESPONSE SCHEMAS
# ============================================================================

class EmergencyModeResponse(BaseModel):
    current_mode: str
    updated_at: datetime
    history: Optional[List[Dict[str, Any]]] = []

    class Config:
        from_attributes = True

class EmergencyModeUpdateRequest(BaseModel):
    mode: str
    reason: Optional[str] = "Manual operator mode shift"

class PatientEmergencyRecordResponse(BaseModel):
    id: str
    emergency_id: str
    triage_status: str
    rescue_status: str
    incident_location: Optional[str] = None
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    location_source: str
    location_confidence: str
    assigned_ambulance: Optional[str] = None
    destination_hospital: Optional[str] = None
    ventilator_requirement: bool = False
    notes: Optional[str] = None
    last_updated: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class PatientLocationUpdateRequest(BaseModel):
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    location_source: str
    location_confidence: str = "HIGH"
    assigned_ambulance: Optional[str] = None
    destination_hospital: Optional[str] = None
    triage_status: Optional[str] = None
    rescue_status: Optional[str] = None
    notes: Optional[str] = None

class ResourceDispatchResponse(BaseModel):
    id: str
    incident_id: str
    resource_id: str
    resource_name: Optional[str] = None
    resource_type: Optional[str] = None
    status: str
    eta_minutes: float
    reasoning: Optional[str] = None
    recommended_at: datetime
    dispatched_at: Optional[datetime] = None
    confirmed_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class EmergencyIncidentCreate(BaseModel):
    id: Optional[str] = None
    type: str = "ROAD_ACCIDENT"
    title: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    location_name: Optional[str] = "Chennai"
    injured_count: int = 0
    critical_count: int = 0
    trapped_count: int = 0
    vulnerable_count: int = 0
    fire_severity: str = "LOW"
    fire_spread_risk: str = "LOW"
    collapse_risk: str = "LOW"
    hazmat_risk: str = "LOW"
    road_accessibility: str = "CLEAR"
    traffic_level: str = "LOW"
    population_density: str = "MEDIUM"
    required_capabilities: Optional[List[str]] = None

class EmergencyIncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    injured_count: Optional[int] = None
    critical_count: Optional[int] = None
    trapped_count: Optional[int] = None
    vulnerable_count: Optional[int] = None
    fire_severity: Optional[str] = None
    fire_spread_risk: Optional[str] = None
    collapse_risk: Optional[str] = None
    hazmat_risk: Optional[str] = None
    road_accessibility: Optional[str] = None
    traffic_level: Optional[str] = None
    population_density: Optional[str] = None
    status: Optional[str] = None

class EmergencyIncidentResponse(BaseModel):
    id: str
    type: str
    title: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    location_name: str
    injured_count: int
    critical_count: int
    trapped_count: int
    vulnerable_count: int
    fire_severity: str
    fire_spread_risk: str
    collapse_risk: str
    hazmat_risk: str
    road_accessibility: str
    traffic_level: str
    population_density: str
    required_capabilities: Optional[List[str]] = []
    priority_score: float
    priority_level: str
    status: str
    created_at: datetime
    updated_at: datetime
    patients: Optional[List[PatientEmergencyRecordResponse]] = []
    dispatches: Optional[List[ResourceDispatchResponse]] = []

    @field_validator("required_capabilities", mode="before")
    @classmethod
    def parse_required_capabilities(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [v] if v else []
        return v or []

    class Config:
        from_attributes = True

class EmergencyResourceCreate(BaseModel):
    id: str
    name: str
    resource_type: str
    category: str
    latitude: float = 13.0827
    longitude: float = 80.2707
    location: str = "Chennai"
    availability: bool = True
    status: str = "AVAILABLE"
    capacity: int = 1
    equipment: Optional[List[str]] = []
    capabilities: Optional[List[str]] = []
    oxygen_capability: bool = False
    ventilator_capability: bool = False
    paramedic_capability: bool = False
    ladder_capability: bool = False
    hazmat_capability: bool = False
    heavy_rescue_capability: bool = False

class EmergencyResourceResponse(BaseModel):
    id: str
    name: str
    resource_type: str
    category: str
    latitude: float
    longitude: float
    location: str
    availability: bool
    status: str
    capacity: int
    equipment: Optional[List[str]] = []
    capabilities: Optional[List[str]] = []
    oxygen_capability: bool
    ventilator_capability: bool
    paramedic_capability: bool
    ladder_capability: bool
    hazmat_capability: bool
    heavy_rescue_capability: bool
    current_assignment: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @field_validator("equipment", "capabilities", mode="before")
    @classmethod
    def parse_json_lists(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [v] if v else []
        return v or []

    class Config:
        from_attributes = True

class HospitalCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    total_beds: int = 100
    available_beds: int = 20
    emergency_beds: int = 20
    available_emergency_beds: int = 5
    icu_beds: int = 10
    available_icu_beds: int = 2
    ventilators: int = 10
    available_ventilators: int = 2
    trauma_capability: bool = True
    operating_theatre_availability: int = 2
    emergency_department_occupancy: float = 70.0
    status: str = "ACCEPTING"

class HospitalResponse(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    total_beds: int
    available_beds: int
    emergency_beds: int
    available_emergency_beds: int
    icu_beds: int
    available_icu_beds: int
    ventilators: int
    available_ventilators: int
    trauma_capability: bool
    operating_theatre_availability: int
    emergency_department_occupancy: float
    incoming_patient_count: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class HospitalCapacityOverview(BaseModel):
    total_hospitals: int
    total_icu_beds: int
    available_icu_beds: int
    total_er_beds: int
    available_er_beds: int
    total_ventilators: int
    available_ventilators: int
    avg_occupancy: float
    hospitals: List[HospitalResponse]

class PriorityScoreResponse(BaseModel):
    casualty_score: float
    hazard_score: float
    geographic_score: float
    system_stress_score: float
    total_score: float
    priority_level: str
    reasons: List[str]

class DispatchConfirmRequest(BaseModel):
    incident_id: str
    resource_id: str
    status: str = "DISPATCHED"
    reasoning: Optional[str] = None
    eta_minutes: Optional[float] = 5.0

class DispatchStatusUpdateRequest(BaseModel):
    status: str

class BypassedHospital(BaseModel):
    hospital_name: str
    eta_minutes: float
    reason: str

class HospitalRoutingDecision(BaseModel):
    recommended_hospital: Optional[HospitalResponse] = None
    hospital_score: float
    eta_minutes: float
    reasons: List[str]
    bypassed_hospitals: List[BypassedHospital] = []

class AllocatedDispatchItem(BaseModel):
    incident_id: str
    incident_title: str
    resource_id: str
    resource_name: str
    resource_type: str
    eta_minutes: float
    suitability_score: float
    reasoning: str
    status: str = "RECOMMENDED"

class ResourceConflictAlert(BaseModel):
    resource_id: str
    resource_type: str
    contending_incidents: List[str]
    awarded_to_incident_id: str
    reason: str

class ResourceShortageAlert(BaseModel):
    capability: str
    required_count: int
    available_count: int
    deficit: int
    severity: str
    message: str

class GlobalAllocationResult(BaseModel):
    emergency_mode: str
    active_incidents_count: int
    allocated_dispatches: List[AllocatedDispatchItem]
    conflicts: List[ResourceConflictAlert]
    shortages: List[ResourceShortageAlert]
    mitigations: List[str]
    hospital_routings: Dict[str, HospitalRoutingDecision]

class EmergencyAnalyticsResponse(BaseModel):
    emergency_mode: str
    active_incidents: int
    total_casualties: int
    critical_casualties: int
    trapped_victims: int
    available_ambulances: int
    total_ambulances: int
    available_fire_units: int
    total_fire_units: int
    total_icu_beds: int
    available_icu_beds: int
    total_er_beds: int
    available_er_beds: int
    avg_hospital_occupancy: float
    avg_dispatch_time_minutes: float
    avg_response_time_minutes: float
    ambulance_utilization_rate: float
    fire_rescue_utilization_rate: float
    icu_utilization_rate: float
    resource_conflicts_detected: int
    resource_shortages_detected: int
    emergency_hotspots: List[Dict[str, Any]]
    predictive_insights: List[Dict[str, Any]]

