from datetime import datetime, timedelta
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.database import get_db
from app.models.models import (
    Complaint, ComplaintStatus, ComplaintEvent, EventType,
    ComplaintDuplicate, AIAnalysis, Department, Officer,
    Citizen, Notification, NotificationType, User
)
from app.schemas.schemas import (
    ComplaintCreate, ComplaintUpdate, ComplaintResponse,
    ComplaintDetailResponse, AIAnalysisResult, CallAnalyzeRequest,
    OfficerAssignRequest, ComplaintEscalateRequest,
    ComplaintResolveRequest, ComplaintMergeRequest,
    ComplaintDuplicateResponse
)
from app.services.ai.complaint_intelligence import analyze_complaint_pipeline
from app.services.auth import get_current_user

router = APIRouter(prefix="/complaints", tags=["Complaints & Lifecycle"])

def generate_complaint_id(db: Session) -> str:
    """Generates unique ID formatted as CIVIC-2026-XXXX"""
    count = db.query(Complaint).count() + 1
    return f"CIVIC-2026-{count:04d}"

def serialize_complaint(c: Complaint) -> dict:
    d_name = c.department.name if c.department else None
    off_name = c.assigned_officer.user.name if (c.assigned_officer and c.assigned_officer.user) else None
    cit_name = c.citizen.name if c.citizen else None
    cit_phone = c.citizen.phone if c.citizen else None

    return {
        "id": c.id,
        "citizen_id": c.citizen_id,
        "citizen_name": cit_name,
        "citizen_phone": cit_phone,
        "source": c.source,
        "language": c.language,
        "transcript": c.transcript,
        "translation": c.translation,
        "summary": c.summary,
        "category": c.category,
        "subcategory": c.subcategory,
        "severity": c.severity,
        "urgency": c.urgency,
        "sentiment": c.sentiment,
        "sentiment_score": c.sentiment_score,
        "affected_population": c.affected_population,
        "latitude": c.latitude,
        "longitude": c.longitude,
        "location_name": c.location_name,
        "priority_score": c.priority_score,
        "priority_level": c.priority_level,
        "department_id": c.department_id,
        "department_name": d_name,
        "assigned_officer_id": c.assigned_officer_id,
        "assigned_officer_name": off_name,
        "sla_hours": c.sla_hours,
        "sla_deadline": c.sla_deadline,
        "predicted_resolution_hours": c.predicted_resolution_hours,
        "sla_risk": c.sla_risk,
        "status": c.status,
        "created_at": c.created_at,
        "updated_at": c.updated_at,
        "resolved_at": c.resolved_at
    }

@router.post("/analyze", response_model=AIAnalysisResult)
def direct_analyze_complaint(payload: CallAnalyzeRequest, db: Session = Depends(get_db)):
    """Triggers AI pipeline directly on text."""
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text is required.")

    depts = [{"id": d.id, "name": d.name, "category": d.category, "sla_hours": d.sla_hours} for d in db.query(Department).all()]
    officers = [
        {
            "id": off.id,
            "department_id": off.department_id,
            "status": off.status,
            "active_cases": off.active_cases,
            "sla_compliance": off.sla_compliance,
            "location": off.location,
            "name": off.user.name if off.user else f"Officer #{off.id}"
        }
        for off in db.query(Officer).all()
    ]
    existing = [
        {
            "id": c.id, "category": c.category, "subcategory": c.subcategory,
            "summary": c.summary, "transcript": c.transcript,
            "latitude": c.latitude, "longitude": c.longitude,
            "location_name": c.location_name, "status": c.status
        }
        for c in db.query(Complaint).all()
    ]

    return analyze_complaint_pipeline(
        raw_text=payload.text,
        hint_language=None if payload.language == "auto" else payload.language,
        location_hint=payload.location,
        departments_list=depts,
        officers_list=officers,
        existing_complaints=existing
    )

@router.post("", response_model=ComplaintResponse)
def create_complaint(
    payload: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Creates a new complaint. Runs full AI pipeline to automatically populate category,
    priority, SLA risk, duplicates, and department routing.
    """
    now = datetime.utcnow()
    comp_id = generate_complaint_id(db)

    # 1. Citizen record
    cit = None
    if payload.citizen_phone:
        cit = db.query(Citizen).filter(Citizen.phone == payload.citizen_phone).first()
        if not cit:
            cit = Citizen(
                name=payload.citizen_name or "Citizen Caller",
                phone=payload.citizen_phone,
                preferred_language=payload.language or "Tamil",
                location=payload.location_name or "Chennai"
            )
            db.add(cit)
            db.flush()

    # 2. Run AI pipeline
    depts = [{"id": d.id, "name": d.name, "category": d.category, "sla_hours": d.sla_hours} for d in db.query(Department).all()]
    officers = [
        {
            "id": off.id,
            "department_id": off.department_id,
            "status": off.status,
            "active_cases": off.active_cases,
            "sla_compliance": off.sla_compliance,
            "location": off.location,
            "name": off.user.name if off.user else f"Officer #{off.id}"
        }
        for off in db.query(Officer).all()
    ]
    existing = [
        {
            "id": c.id, "category": c.category, "subcategory": c.subcategory,
            "summary": c.summary, "transcript": c.transcript,
            "latitude": c.latitude, "longitude": c.longitude,
            "location_name": c.location_name, "status": c.status
        }
        for c in db.query(Complaint).all()
    ]

    ai_res = analyze_complaint_pipeline(
        raw_text=payload.transcript,
        hint_language=payload.language,
        location_hint=payload.location_name,
        departments_list=depts,
        officers_list=officers,
        existing_complaints=existing
    )

    lat = payload.latitude or ai_res["entities"].get("latitude", 13.0827)
    lng = payload.longitude or ai_res["entities"].get("longitude", 80.2707)
    loc_name = payload.location_name if payload.location_name != "Chennai" else ai_res["entities"].get("location_name", "Chennai")

    dept_id = ai_res["recommended_department"].get("department_id")
    sla_h = ai_res["sla"].get("department_sla_hours", 24)
    deadline = now + timedelta(hours=sla_h)

    # 3. Create Complaint
    complaint = Complaint(
        id=comp_id,
        citizen_id=cit.id if cit else None,
        source=payload.source,
        language=ai_res["language"],
        transcript=payload.transcript,
        translation=ai_res["translated_transcript"],
        summary=ai_res["summary"],
        category=ai_res["category"],
        subcategory=ai_res["subcategory"],
        severity=ai_res["severity"],
        urgency=ai_res["urgency"],
        sentiment=ai_res["sentiment"],
        sentiment_score=ai_res["sentiment_score"],
        affected_population=ai_res["affected_population"],
        latitude=lat,
        longitude=lng,
        location_name=loc_name,
        priority_score=ai_res["priority"]["priority_score"],
        priority_level=ai_res["priority"]["priority_level"],
        department_id=dept_id,
        assigned_officer_id=None,  # Not auto-assigned until approved
        sla_hours=sla_h,
        sla_deadline=deadline,
        predicted_resolution_hours=ai_res["sla"]["predicted_resolution_hours"],
        sla_risk=ai_res["sla"]["sla_risk"],
        status=ComplaintStatus.AI_ANALYZED.value,
        created_at=now,
        updated_at=now
    )
    db.add(complaint)
    db.flush()

    # 4. Save AI Analysis Record
    ai_rec = AIAnalysis(
        complaint_id=comp_id,
        model_name="CivicAI Multi-Engine Intelligence",
        model_version="1.0",
        classification_confidence=ai_res["classification_confidence"],
        department_confidence=ai_res["recommended_department"]["confidence"],
        priority_reasoning=ai_res["priority"]["reasoning"],
        department_reasoning=ai_res["recommended_department"]["reasoning"],
        duplicate_reasoning=f"Identified {len(ai_res['duplicates'])} potential matching complaints in vicinity."
    )
    db.add(ai_rec)

    # 5. Save Events
    ev1 = ComplaintEvent(
        complaint_id=comp_id,
        event_type=EventType.STATUS_CHANGE.value,
        description=f"Complaint received via {payload.source}.",
        created_by=current_user.name if current_user else "Citizen Ingestion Gateway",
        created_at=now
    )
    db.add(ev1)

    ev2 = ComplaintEvent(
        complaint_id=comp_id,
        event_type=EventType.AI_ANALYSIS.value,
        description=f"AI Pipeline completed: Classified as '{ai_res['category']} / {ai_res['subcategory']}', Priority {ai_res['priority']['priority_score']} ({ai_res['priority']['priority_level']}), Recommended '{ai_res['recommended_department']['department_name']}'.",
        created_by="CivicAI Engine",
        created_at=now + timedelta(seconds=2)
    )
    db.add(ev2)

    # 6. Save Duplicate Relationships
    for dup in ai_res["duplicates"]:
        dup_record = ComplaintDuplicate(
            complaint_id=comp_id,
            related_complaint_id=dup["complaint_id"],
            similarity_score=dup["similarity_score"],
            created_at=now
        )
        db.add(dup_record)

    # 7. Create Notifications if Critical or High Risk
    if ai_res["priority"]["priority_level"] == "CRITICAL":
        notif = Notification(
            complaint_id=comp_id,
            type=NotificationType.CRITICAL_ALERT.value,
            title=f"CRITICAL: {ai_res['category']} in {loc_name}",
            message=f"Score: {ai_res['priority']['priority_score']}/100. {ai_res['summary']}",
            read=False,
            created_at=now
        )
        db.add(notif)

    if ai_res["sla"]["sla_risk"] == "HIGH":
        notif_sla = Notification(
            complaint_id=comp_id,
            type=NotificationType.SLA_WARNING.value,
            title=f"High SLA Breach Risk ({comp_id})",
            message=f"Predicted resolution {ai_res['sla']['predicted_resolution_hours']}h exceeds SLA {sla_h}h.",
            read=False,
            created_at=now
        )
        db.add(notif_sla)

    db.commit()
    db.refresh(complaint)
    return serialize_complaint(complaint)

@router.get("", response_model=List[ComplaintResponse])
def get_complaints(
    category: Optional[str] = None,
    priority_level: Optional[str] = None,
    status: Optional[str] = None,
    department_id: Optional[int] = None,
    assigned_officer_id: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    List complaints with multi-criteria filtering and search.
    """
    query = db.query(Complaint)

    if category:
        query = query.filter(Complaint.category == category)
    if priority_level:
        query = query.filter(Complaint.priority_level == priority_level)
    if status:
        query = query.filter(Complaint.status == status)
    if department_id:
        query = query.filter(Complaint.department_id == department_id)
    if assigned_officer_id:
        query = query.filter(Complaint.assigned_officer_id == assigned_officer_id)
    if search:
        search_filter = or_(
            Complaint.id.ilike(f"%{search}%"),
            Complaint.summary.ilike(f"%{search}%"),
            Complaint.location_name.ilike(f"%{search}%"),
            Complaint.transcript.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    # Order by priority score descending, then created_at descending
    results = query.order_by(desc(Complaint.created_at)).offset(offset).limit(limit).all()
    return [serialize_complaint(c) for c in results]

@router.get("/{complaint_id}", response_model=ComplaintDetailResponse)
def get_complaint_detail(complaint_id: str, db: Session = Depends(get_db)):
    """
    Returns complete complaint details, including timeline events, duplicate links, and AI analysis.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    data = serialize_complaint(complaint)
    data["events"] = complaint.events
    data["duplicates"] = complaint.duplicates
    data["ai_analyses"] = complaint.ai_analyses
    return data

@router.patch("/{complaint_id}", response_model=ComplaintResponse)
def update_complaint(
    complaint_id: str,
    payload: ComplaintUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Updates complaint attributes with automatic event history logging.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    now = datetime.utcnow()
    user_name = current_user.name if current_user else "Officer / Operator"

    if payload.status and payload.status != complaint.status:
        old_st = complaint.status
        complaint.status = payload.status
        ev = ComplaintEvent(
            complaint_id=complaint.id,
            event_type=EventType.STATUS_CHANGE.value,
            description=f"Status changed from {old_st} to {payload.status}." + (f" Note: {payload.notes}" if payload.notes else ""),
            created_by=user_name,
            created_at=now
        )
        db.add(ev)

    if payload.department_id and payload.department_id != complaint.department_id:
        complaint.department_id = payload.department_id
        d = db.query(Department).filter(Department.id == payload.department_id).first()
        d_name = d.name if d else f"Dept #{payload.department_id}"
        ev = ComplaintEvent(
            complaint_id=complaint.id,
            event_type=EventType.ASSIGNMENT.value,
            description=f"Department reassigned to {d_name}.",
            created_by=user_name,
            created_at=now
        )
        db.add(ev)

    if payload.assigned_officer_id and payload.assigned_officer_id != complaint.assigned_officer_id:
        complaint.assigned_officer_id = payload.assigned_officer_id
        off = db.query(Officer).filter(Officer.id == payload.assigned_officer_id).first()
        off_name = off.user.name if off and off.user else f"Officer #{payload.assigned_officer_id}"
        complaint.status = ComplaintStatus.OFFICER_ASSIGNED.value
        ev = ComplaintEvent(
            complaint_id=complaint.id,
            event_type=EventType.ASSIGNMENT.value,
            description=f"Assigned to field officer {off_name}.",
            created_by=user_name,
            created_at=now
        )
        db.add(ev)

    if payload.severity:
        complaint.severity = payload.severity
    if payload.urgency:
        complaint.urgency = payload.urgency
    if payload.category:
        complaint.category = payload.category
    if payload.subcategory:
        complaint.subcategory = payload.subcategory

    complaint.updated_at = now
    db.commit()
    db.refresh(complaint)
    return serialize_complaint(complaint)

@router.post("/{complaint_id}/assign", response_model=ComplaintResponse)
def assign_officer(
    complaint_id: str,
    payload: OfficerAssignRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Assigns an officer to this complaint, updates active workload, and logs event history.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    officer = db.query(Officer).filter(Officer.id == payload.officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")

    now = datetime.utcnow()
    user_name = current_user.name if current_user else "Admin Dispatcher"
    off_name = officer.user.name if officer.user else f"Officer #{officer.id}"

    complaint.assigned_officer_id = officer.id
    complaint.department_id = officer.department_id
    complaint.status = ComplaintStatus.OFFICER_ASSIGNED.value
    complaint.updated_at = now

    # Update officer workload
    officer.active_cases = (officer.active_cases or 0) + 1

    ev = ComplaintEvent(
        complaint_id=complaint.id,
        event_type=EventType.ASSIGNMENT.value,
        description=f"Assigned to {off_name} ({officer.department.name})." + (f" Note: {payload.notes}" if payload.notes else ""),
        created_by=user_name,
        created_at=now
    )
    db.add(ev)

    # Notification for officer
    notif = Notification(
        user_id=officer.user_id,
        complaint_id=complaint.id,
        type=NotificationType.ASSIGNMENT.value,
        title=f"New Case Assigned: {complaint.id}",
        message=f"{complaint.category} in {complaint.location_name}. Priority: {complaint.priority_score}/100.",
        read=False,
        created_at=now
    )
    db.add(notif)

    db.commit()
    db.refresh(complaint)
    return serialize_complaint(complaint)

@router.post("/{complaint_id}/escalate", response_model=ComplaintResponse)
def escalate_complaint(
    complaint_id: str,
    payload: ComplaintEscalateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Escalates complaint to higher priority / department with audit reasoning.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    now = datetime.utcnow()
    user_name = current_user.name if current_user else "Supervisor"

    complaint.status = ComplaintStatus.ESCALATED.value
    complaint.priority_level = PriorityLevel.CRITICAL.value
    complaint.priority_score = min(100.0, complaint.priority_score + 15.0)
    complaint.updated_at = now

    if payload.escalated_to_department_id:
        complaint.department_id = payload.escalated_to_department_id

    ev = ComplaintEvent(
        complaint_id=complaint.id,
        event_type=EventType.ESCALATION.value,
        description=f"Complaint ESCALATED. Reason: {payload.reason}",
        created_by=user_name,
        created_at=now
    )
    db.add(ev)

    # Critical Notification
    notif = Notification(
        complaint_id=complaint.id,
        type=NotificationType.CRITICAL_ALERT.value,
        title=f"ESCALATION ALERT: {complaint.id}",
        message=f"Escalated by {user_name}. Reason: {payload.reason}",
        read=False,
        created_at=now
    )
    db.add(notif)

    db.commit()
    db.refresh(complaint)
    return serialize_complaint(complaint)

@router.post("/{complaint_id}/resolve", response_model=ComplaintResponse)
def resolve_complaint(
    complaint_id: str,
    payload: ComplaintResolveRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Resolves complaint, logs resolution summary, decrements officer active cases.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    now = datetime.utcnow()
    resolver = payload.resolved_by or (current_user.name if current_user else "Field Engineer")

    complaint.status = ComplaintStatus.RESOLVED.value
    complaint.resolved_at = now
    complaint.updated_at = now

    # Decrement officer workload if assigned
    if complaint.assigned_officer_id:
        off = db.query(Officer).filter(Officer.id == complaint.assigned_officer_id).first()
        if off and off.active_cases > 0:
            off.active_cases -= 1

    ev = ComplaintEvent(
        complaint_id=complaint.id,
        event_type=EventType.RESOLUTION.value,
        description=f"Complaint resolved by {resolver}. Resolution Report: {payload.resolution_notes}",
        created_by=resolver,
        created_at=now
    )
    db.add(ev)

    # Notification
    notif = Notification(
        complaint_id=complaint.id,
        type=NotificationType.RESOLVED.value,
        title=f"Complaint Resolved: {complaint.id}",
        message=f"Field work completed. Notes: {payload.resolution_notes}",
        read=False,
        created_at=now
    )
    db.add(notif)

    db.commit()
    db.refresh(complaint)
    return serialize_complaint(complaint)

@router.post("/{complaint_id}/merge", response_model=ComplaintResponse)
def merge_complaints(
    complaint_id: str,
    payload: ComplaintMergeRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Merges duplicate complaint into target master complaint with audit trace.
    """
    source_c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    target_c = db.query(Complaint).filter(Complaint.id == payload.target_complaint_id).first()

    if not source_c or not target_c:
        raise HTTPException(status_code=404, detail="Source or target complaint not found")

    now = datetime.utcnow()
    user_name = current_user.name if current_user else "Admin Official"

    source_c.status = ComplaintStatus.CLOSED.value
    source_c.updated_at = now

    # Log on source
    ev_source = ComplaintEvent(
        complaint_id=source_c.id,
        event_type=EventType.MERGE.value,
        description=f"Merged into master ticket {target_c.id}. Reason: {payload.reason}",
        created_by=user_name,
        created_at=now
    )
    db.add(ev_source)

    # Log on target
    ev_target = ComplaintEvent(
        complaint_id=target_c.id,
        event_type=EventType.MERGE.value,
        description=f"Duplicate ticket {source_c.id} merged into this master ticket. (Affected population aggregated +{source_c.affected_population}).",
        created_by=user_name,
        created_at=now
    )
    db.add(ev_target)

    # Increase target affected population
    target_c.affected_population = (target_c.affected_population or 1) + (source_c.affected_population or 1)

    db.commit()
    db.refresh(source_c)
    return serialize_complaint(source_c)

@router.get("/{complaint_id}/duplicates", response_model=List[ComplaintDuplicateResponse])
def get_complaint_duplicates(complaint_id: str, db: Session = Depends(get_db)):
    """
    Returns flagged duplicate relationships for a complaint.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint.duplicates
