import enum
from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    OFFICER = "OFFICER"
    CALL_OPERATOR = "CALL_OPERATOR"
    CITIZEN = "CITIZEN"

class OfficerStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    ON_FIELD = "ON_FIELD"
    BUSY = "BUSY"
    OFFLINE = "OFFLINE"

class ComplaintSource(str, enum.Enum):
    VOICE_CALL = "VOICE_CALL"
    WEB_PORTAL = "WEB_PORTAL"
    MOBILE_APP = "MOBILE_APP"
    OPERATOR_MANUAL = "OPERATOR_MANUAL"

class SeverityLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class UrgencyLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    EMERGENCY = "EMERGENCY"

class SentimentType(str, enum.Enum):
    POSITIVE = "POSITIVE"
    NEUTRAL = "NEUTRAL"
    FRUSTRATED = "FRUSTRATED"
    ANGRY = "ANGRY"
    DISTRESSED = "DISTRESSED"

class PriorityLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class SLARiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class ComplaintStatus(str, enum.Enum):
    RECEIVED = "RECEIVED"
    AI_ANALYZED = "AI_ANALYZED"
    CLASSIFIED = "CLASSIFIED"
    DEPARTMENT_ASSIGNED = "DEPARTMENT_ASSIGNED"
    OFFICER_ASSIGNED = "OFFICER_ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CITIZEN_CONFIRMED = "CITIZEN_CONFIRMED"
    CLOSED = "CLOSED"
    ESCALATED = "ESCALATED"

class EventType(str, enum.Enum):
    STATUS_CHANGE = "STATUS_CHANGE"
    AI_ANALYSIS = "AI_ANALYSIS"
    ASSIGNMENT = "ASSIGNMENT"
    OFFICER_REASSIGN = "OFFICER_REASSIGN"
    ESCALATION = "ESCALATION"
    NOTE_ADDED = "NOTE_ADDED"
    MERGE = "MERGE"
    RESOLUTION = "RESOLUTION"
    CITIZEN_CONFIRMATION = "CITIZEN_CONFIRMATION"

class NotificationType(str, enum.Enum):
    CRITICAL_ALERT = "CRITICAL_ALERT"
    ASSIGNMENT = "ASSIGNMENT"
    SLA_WARNING = "SLA_WARNING"
    SLA_BREACH = "SLA_BREACH"
    DUPLICATE_DETECTED = "DUPLICATE_DETECTED"
    STATUS_UPDATE = "STATUS_UPDATE"
    RESOLVED = "RESOLVED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.CITIZEN.value, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", back_populates="users")
    officer_profile = relationship("Officer", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")

class Citizen(Base):
    __tablename__ = "citizens"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False, index=True)
    preferred_language = Column(String(50), default="English")
    location = Column(String(255), default="Chennai")
    created_at = Column(DateTime, default=datetime.utcnow)

    complaints = relationship("Complaint", back_populates="citizen")

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False)
    sla_hours = Column(Integer, default=48)
    location = Column(String(255), default="Chennai Central")
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="department")
    officers = relationship("Officer", back_populates="department")
    complaints = relationship("Complaint", back_populates="department")

class Officer(Base):
    __tablename__ = "officers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    status = Column(String(50), default=OfficerStatus.AVAILABLE.value)
    active_cases = Column(Integer, default=0)
    sla_compliance = Column(Float, default=95.0)
    location = Column(String(255), default="Chennai")

    user = relationship("User", back_populates="officer_profile")
    department = relationship("Department", back_populates="officers")
    complaints = relationship("Complaint", back_populates="assigned_officer")

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(50), primary_key=True, index=True)  # e.g., CIVIC-2026-0001
    citizen_id = Column(Integer, ForeignKey("citizens.id"), nullable=True)
    source = Column(String(50), default=ComplaintSource.VOICE_CALL.value)
    language = Column(String(50), default="English")
    transcript = Column(Text, nullable=False)
    translation = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    subcategory = Column(String(100), nullable=True)
    severity = Column(String(50), default=SeverityLevel.MEDIUM.value)
    urgency = Column(String(50), default=UrgencyLevel.MEDIUM.value)
    sentiment = Column(String(50), default=SentimentType.NEUTRAL.value)
    sentiment_score = Column(Float, default=0.0)
    affected_population = Column(Integer, default=1)
    latitude = Column(Float, default=13.0827)
    longitude = Column(Float, default=80.2707)
    location_name = Column(String(255), default="Chennai")
    priority_score = Column(Float, default=50.0)
    priority_level = Column(String(50), default=PriorityLevel.MEDIUM.value)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    assigned_officer_id = Column(Integer, ForeignKey("officers.id"), nullable=True)
    sla_hours = Column(Integer, default=48)
    sla_deadline = Column(DateTime, nullable=True)
    predicted_resolution_hours = Column(Float, default=24.0)
    sla_risk = Column(String(50), default=SLARiskLevel.LOW.value)
    status = Column(String(50), default=ComplaintStatus.RECEIVED.value)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    citizen = relationship("Citizen", back_populates="complaints")
    department = relationship("Department", back_populates="complaints")
    assigned_officer = relationship("Officer", back_populates="complaints")
    events = relationship("ComplaintEvent", back_populates="complaint", cascade="all, delete-orphan")
    duplicates = relationship(
        "ComplaintDuplicate",
        foreign_keys="ComplaintDuplicate.complaint_id",
        back_populates="complaint",
        cascade="all, delete-orphan"
    )
    ai_analyses = relationship("AIAnalysis", back_populates="complaint", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="complaint", cascade="all, delete-orphan")

class ComplaintDuplicate(Base):
    __tablename__ = "complaint_duplicates"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(String(50), ForeignKey("complaints.id"), nullable=False)
    related_complaint_id = Column(String(50), ForeignKey("complaints.id"), nullable=False)
    similarity_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", foreign_keys=[complaint_id], back_populates="duplicates")
    related_complaint = relationship("Complaint", foreign_keys=[related_complaint_id])

class ComplaintEvent(Base):
    __tablename__ = "complaint_events"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(String(50), ForeignKey("complaints.id"), nullable=False)
    event_type = Column(String(50), default=EventType.STATUS_CHANGE.value)
    description = Column(Text, nullable=False)
    created_by = Column(String(255), default="System")
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="events")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    complaint_id = Column(String(50), ForeignKey("complaints.id"), nullable=True)
    type = Column(String(50), default=NotificationType.STATUS_UPDATE.value)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
    complaint = relationship("Complaint", back_populates="notifications")

class AIAnalysis(Base):
    __tablename__ = "ai_analysis"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(String(50), ForeignKey("complaints.id"), nullable=False)
    model_name = Column(String(100), default="CivicAI Multi-Engine")
    model_version = Column(String(50), default="1.0")
    classification_confidence = Column(Float, default=0.0)
    department_confidence = Column(Float, default=0.0)
    priority_reasoning = Column(Text, nullable=True)
    department_reasoning = Column(Text, nullable=True)
    duplicate_reasoning = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="ai_analyses")


# ============================================================================
# EMERGENCY RESPONSE & INTELLIGENT RESOURCE ALLOCATION MODELS
# ============================================================================

class EmergencyMode(str, enum.Enum):
    NORMAL = "NORMAL"
    ELEVATED = "ELEVATED"
    HIGH_ALERT = "HIGH_ALERT"
    DISASTER = "DISASTER"

class EmergencyType(str, enum.Enum):
    ROAD_ACCIDENT = "ROAD_ACCIDENT"
    BUILDING_COLLAPSE = "BUILDING_COLLAPSE"
    FIRE = "FIRE"
    INDUSTRIAL_ACCIDENT = "INDUSTRIAL_ACCIDENT"
    FLOOD = "FLOOD"
    CYCLONE = "CYCLONE"
    HAZMAT = "HAZMAT"
    MASS_CASUALTY = "MASS_CASUALTY"
    OTHER = "OTHER"

class ResourceCategory(str, enum.Enum):
    AMBULANCE = "AMBULANCE"
    FIRE_RESCUE = "FIRE_RESCUE"
    SPECIALIZED = "SPECIALIZED"
    MEDICAL_TEAM = "MEDICAL_TEAM"

class ResourceType(str, enum.Enum):
    BLS_AMBULANCE = "BLS_AMBULANCE"
    ALS_AMBULANCE = "ALS_AMBULANCE"
    VENTILATOR_AMBULANCE = "VENTILATOR_AMBULANCE"
    FIRE_ENGINE = "FIRE_ENGINE"
    LADDER_TRUCK = "LADDER_TRUCK"
    HAZMAT_UNIT = "HAZMAT_UNIT"
    RESCUE_VEHICLE = "RESCUE_VEHICLE"
    HEAVY_RESCUE_TEAM = "HEAVY_RESCUE_TEAM"

class ResourceStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    DISPATCHED = "DISPATCHED"
    EN_ROUTE = "EN_ROUTE"
    ON_SCENE = "ON_SCENE"
    RETURNING = "RETURNING"
    MAINTENANCE = "MAINTENANCE"

class HospitalStatus(str, enum.Enum):
    ACCEPTING = "ACCEPTING"
    LIMITED = "LIMITED"
    NEAR_CAPACITY = "NEAR_CAPACITY"
    FULL = "FULL"

class PatientTriageStatus(str, enum.Enum):
    CRITICAL = "CRITICAL"
    MODERATE = "MODERATE"
    MINOR = "MINOR"
    DECEASED = "DECEASED"
    PENDING = "PENDING"

class PatientRescueStatus(str, enum.Enum):
    TRAPPED = "TRAPPED"
    BEING_RESCUED = "BEING_RESCUED"
    RESCUED = "RESCUED"
    TRANSPORTING = "TRANSPORTING"
    HOSPITALIZED = "HOSPITALIZED"

class LocationSource(str, enum.Enum):
    CALLER_GPS = "CALLER_GPS"
    DEVICE_GPS = "DEVICE_GPS"
    INCIDENT_LOCATION = "INCIDENT_LOCATION"
    AMBULANCE_GPS = "AMBULANCE_GPS"
    HOSPITAL_LOCATION = "HOSPITAL_LOCATION"
    ESTIMATED = "ESTIMATED"
    MANUAL = "MANUAL"

class LocationConfidence(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class DispatchStatus(str, enum.Enum):
    RECOMMENDED = "RECOMMENDED"
    DISPATCHED = "DISPATCHED"
    EN_ROUTE = "EN_ROUTE"
    ON_SCENE = "ON_SCENE"
    TRANSPORTING = "TRANSPORTING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class EmergencySystemState(Base):
    __tablename__ = "emergency_system_state"

    id = Column(Integer, primary_key=True, index=True)
    current_mode = Column(String(50), default=EmergencyMode.NORMAL.value, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EmergencyIncident(Base):
    __tablename__ = "emergency_incidents"

    id = Column(String(50), primary_key=True, index=True)  # e.g. EMG-2026-0001
    type = Column(String(50), default=EmergencyType.ROAD_ACCIDENT.value, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(255), default="Chennai")
    injured_count = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    trapped_count = Column(Integer, default=0)
    vulnerable_count = Column(Integer, default=0)
    fire_severity = Column(String(50), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    fire_spread_risk = Column(String(50), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    collapse_risk = Column(String(50), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    hazmat_risk = Column(String(50), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    road_accessibility = Column(String(50), default="CLEAR")  # CLEAR, RESTRICTED, BLOCKED
    traffic_level = Column(String(50), default="LOW")  # LOW, MEDIUM, HIGH
    population_density = Column(String(50), default="MEDIUM")  # LOW, MEDIUM, HIGH
    required_capabilities = Column(Text, nullable=True)  # JSON string of required capabilities
    priority_score = Column(Float, default=50.0)
    priority_level = Column(String(50), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(50), default="ACTIVE")  # ACTIVE, CONTAINED, RESOLVED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patients = relationship("PatientEmergencyRecord", back_populates="incident", cascade="all, delete-orphan")
    dispatches = relationship("ResourceDispatch", back_populates="incident", cascade="all, delete-orphan")


class EmergencyResource(Base):
    __tablename__ = "emergency_resources"

    id = Column(String(50), primary_key=True, index=True)  # e.g. AMB-ALS-01
    name = Column(String(255), nullable=False)
    resource_type = Column(String(50), nullable=False)  # ResourceType
    category = Column(String(50), nullable=False)  # ResourceCategory
    latitude = Column(Float, default=13.0827)
    longitude = Column(Float, default=80.2707)
    location = Column(String(255), default="Chennai")
    availability = Column(Boolean, default=True)
    status = Column(String(50), default=ResourceStatus.AVAILABLE.value)
    capacity = Column(Integer, default=1)
    equipment = Column(Text, nullable=True)  # JSON list
    capabilities = Column(Text, nullable=True)  # JSON list
    oxygen_capability = Column(Boolean, default=False)
    ventilator_capability = Column(Boolean, default=False)
    paramedic_capability = Column(Boolean, default=False)
    ladder_capability = Column(Boolean, default=False)
    hazmat_capability = Column(Boolean, default=False)
    heavy_rescue_capability = Column(Boolean, default=False)
    current_assignment = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    dispatches = relationship("ResourceDispatch", back_populates="resource")


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    total_beds = Column(Integer, default=100)
    available_beds = Column(Integer, default=20)
    emergency_beds = Column(Integer, default=20)
    available_emergency_beds = Column(Integer, default=5)
    icu_beds = Column(Integer, default=10)
    available_icu_beds = Column(Integer, default=2)
    ventilators = Column(Integer, default=10)
    available_ventilators = Column(Integer, default=2)
    trauma_capability = Column(Boolean, default=True)
    operating_theatre_availability = Column(Integer, default=2)
    emergency_department_occupancy = Column(Float, default=70.0)  # Percentage 0-100
    incoming_patient_count = Column(Integer, default=0)
    status = Column(String(50), default=HospitalStatus.ACCEPTING.value)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PatientEmergencyRecord(Base):
    __tablename__ = "patient_emergency_records"

    id = Column(String(50), primary_key=True, index=True)  # e.g. PAT-1001
    emergency_id = Column(String(50), ForeignKey("emergency_incidents.id"), nullable=False)
    triage_status = Column(String(50), default=PatientTriageStatus.CRITICAL.value)
    rescue_status = Column(String(50), default=PatientRescueStatus.TRAPPED.value)
    incident_location = Column(String(255), nullable=True)
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    location_source = Column(String(50), default=LocationSource.INCIDENT_LOCATION.value)
    location_confidence = Column(String(50), default=LocationConfidence.HIGH.value)
    assigned_ambulance = Column(String(50), nullable=True)
    destination_hospital = Column(String(255), nullable=True)
    ventilator_requirement = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("EmergencyIncident", back_populates="patients")


class ResourceDispatch(Base):
    __tablename__ = "resource_dispatches"

    id = Column(String(50), primary_key=True, index=True)  # e.g. DSP-2026-0001
    incident_id = Column(String(50), ForeignKey("emergency_incidents.id"), nullable=False)
    resource_id = Column(String(50), ForeignKey("emergency_resources.id"), nullable=False)
    status = Column(String(50), default=DispatchStatus.RECOMMENDED.value)
    eta_minutes = Column(Float, default=5.0)
    reasoning = Column(Text, nullable=True)
    recommended_at = Column(DateTime, default=datetime.utcnow)
    dispatched_at = Column(DateTime, nullable=True)
    confirmed_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    incident = relationship("EmergencyIncident", back_populates="dispatches")
    resource = relationship("EmergencyResource", back_populates="dispatches")


class EmergencyModeEvent(Base):
    __tablename__ = "emergency_mode_events"

    id = Column(Integer, primary_key=True, index=True)
    previous_mode = Column(String(50), default=EmergencyMode.NORMAL.value)
    new_mode = Column(String(50), nullable=False)
    changed_by = Column(String(255), nullable=False)
    reason = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
