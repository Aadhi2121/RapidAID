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
