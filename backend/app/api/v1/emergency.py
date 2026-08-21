import json
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import (
    User, UserRole,
    EmergencySystemState, EmergencyMode, EmergencyType,
    EmergencyIncident, EmergencyResource, Hospital,
    PatientEmergencyRecord, ResourceDispatch, EmergencyModeEvent,
    DispatchStatus, ResourceStatus, HospitalStatus,
    LocationSource, LocationConfidence, PatientTriageStatus, PatientRescueStatus
)
from app.schemas.schemas import (
    EmergencyModeResponse, EmergencyModeUpdateRequest,
    EmergencyIncidentCreate, EmergencyIncidentUpdate, EmergencyIncidentResponse,
    EmergencyResourceCreate, EmergencyResourceResponse,
    HospitalCreate, HospitalResponse, HospitalCapacityOverview,
    PatientEmergencyRecordResponse, PatientLocationUpdateRequest,
    ResourceDispatchResponse, DispatchConfirmRequest, DispatchStatusUpdateRequest,
    GlobalAllocationResult, EmergencyAnalyticsResponse, PriorityScoreResponse
)
from app.services.ai.emergency_allocation import (
    calculate_emergency_priority_score,
    select_optimal_hospital,
    allocate_emergency_resources,
    calculate_emergency_analytics
)

logger = logging.getLogger("rapidAID.emergency")
router = APIRouter(prefix="/emergency", tags=["Emergency Response & Resource Allocation"])


def get_current_system_mode(db: Session) -> str:
    state = db.query(EmergencySystemState).first()
    if not state:
        state = EmergencySystemState(current_mode=EmergencyMode.NORMAL.value)
        db.add(state)
        db.commit()
        db.refresh(state)
    return state.current_mode


# ---------------------------------------------------------------------------
# 1. EMERGENCY MODES
# ---------------------------------------------------------------------------

@router.get("/mode", response_model=EmergencyModeResponse)
def get_emergency_mode(db: Session = Depends(get_db)):
    mode = get_current_system_mode(db)
    state = db.query(EmergencySystemState).first()
    events = db.query(EmergencyModeEvent).order_by(EmergencyModeEvent.timestamp.desc()).limit(10).all()
    history = [
        {
            "id": e.id,
            "previous_mode": e.previous_mode,
            "new_mode": e.new_mode,
            "changed_by": e.changed_by,
            "reason": e.reason,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
        }
        for e in events
    ]
    return {
        "current_mode": mode,
        "updated_at": state.updated_at if state else datetime.utcnow(),
        "history": history,
    }


@router.post("/mode", response_model=EmergencyModeResponse)
def set_emergency_mode(
    req: EmergencyModeUpdateRequest,
    changed_by: str = Query("Admin Commissioner", description="Authorized Operator or Commissioner"),
    db: Session = Depends(get_db)
):
    target_mode = req.mode.upper()
    valid_modes = [m.value for m in EmergencyMode]
    if target_mode not in valid_modes:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid mode '{target_mode}'. Valid modes: {valid_modes}"
        )

    state = db.query(EmergencySystemState).first()
    prev_mode = state.current_mode if state else EmergencyMode.NORMAL.value

    if not state:
        state = EmergencySystemState(current_mode=target_mode)
        db.add(state)
    else:
        state.current_mode = target_mode
        state.updated_at = datetime.utcnow()

    # Log audit event
    event = EmergencyModeEvent(
        previous_mode=prev_mode,
        new_mode=target_mode,
        changed_by=changed_by,
        reason=req.reason or f"Emergency Mode updated to {target_mode}",
        timestamp=datetime.utcnow()
    )
    db.add(event)

    # Recalculate priority scores for all active incidents under new mode
    active_incidents = db.query(EmergencyIncident).filter(EmergencyIncident.status == "ACTIVE").all()
    for inc in active_incidents:
        inc_data = {
            "injured_count": inc.injured_count,
            "critical_count": inc.critical_count,
            "trapped_count": inc.trapped_count,
            "vulnerable_count": inc.vulnerable_count,
            "fire_severity": inc.fire_severity,
            "fire_spread_risk": inc.fire_spread_risk,
            "collapse_risk": inc.collapse_risk,
            "hazmat_risk": inc.hazmat_risk,
            "traffic_level": inc.traffic_level,
            "road_accessibility": inc.road_accessibility,
            "population_density": inc.population_density,
            "type": inc.type,
        }
        pri_calc = calculate_emergency_priority_score(inc_data, current_mode=target_mode)
        inc.priority_score = pri_calc["total_score"]
        inc.priority_level = pri_calc["priority_level"]

    db.commit()
    db.refresh(state)

    events = db.query(EmergencyModeEvent).order_by(EmergencyModeEvent.timestamp.desc()).limit(10).all()
    history = [
        {
            "id": e.id,
            "previous_mode": e.previous_mode,
            "new_mode": e.new_mode,
            "changed_by": e.changed_by,
            "reason": e.reason,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
        }
        for e in events
    ]

    return {
        "current_mode": state.current_mode,
        "updated_at": state.updated_at,
        "history": history,
    }


# ---------------------------------------------------------------------------
# 2. EMERGENCY INCIDENTS & PRIORITY QUEUE
# ---------------------------------------------------------------------------

@router.get("/incidents", response_model=List[EmergencyIncidentResponse])
def get_incidents(
    status: Optional[str] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(EmergencyIncident)
    if status:
        query = query.filter(EmergencyIncident.status == status.upper())
    if type:
        query = query.filter(EmergencyIncident.type == type.upper())
    return query.order_by(EmergencyIncident.priority_score.desc()).all()


@router.post("/incidents", response_model=EmergencyIncidentResponse)
def create_incident(
    req: EmergencyIncidentCreate,
    db: Session = Depends(get_db)
):
    mode = get_current_system_mode(db)
    
    # Priority engine evaluation
    inc_data = req.model_dump()
    pri_res = calculate_emergency_priority_score(inc_data, current_mode=mode)

    # Generate sequential incident ID if not provided
    inc_id = req.id
    if not inc_id:
        count = db.query(EmergencyIncident).count() + 1
        inc_id = f"EMG-2026-{count:04d}"

    req_caps_json = json.dumps(req.required_capabilities or [])

    incident = EmergencyIncident(
        id=inc_id,
        type=req.type,
        title=req.title,
        description=req.description,
        latitude=req.latitude,
        longitude=req.longitude,
        location_name=req.location_name or "Chennai",
        injured_count=req.injured_count,
        critical_count=req.critical_count,
        trapped_count=req.trapped_count,
        vulnerable_count=req.vulnerable_count,
        fire_severity=req.fire_severity,
        fire_spread_risk=req.fire_spread_risk,
        collapse_risk=req.collapse_risk,
        hazmat_risk=req.hazmat_risk,
        road_accessibility=req.road_accessibility,
        traffic_level=req.traffic_level,
        population_density=req.population_density,
        required_capabilities=req_caps_json,
        priority_score=pri_res["total_score"],
        priority_level=pri_res["priority_level"],
        status="ACTIVE",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


@router.get("/incidents/{incident_id}", response_model=EmergencyIncidentResponse)
def get_incident_detail(incident_id: str, db: Session = Depends(get_db)):
    incident = db.query(EmergencyIncident).filter(EmergencyIncident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found")
    return incident


@router.patch("/incidents/{incident_id}", response_model=EmergencyIncidentResponse)
def update_incident(
    incident_id: str,
    req: EmergencyIncidentUpdate,
    db: Session = Depends(get_db)
):
    incident = db.query(EmergencyIncident).filter(EmergencyIncident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found")

    update_data = req.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(incident, k, v)

    # Recalculate priority if metrics changed
    mode = get_current_system_mode(db)
    inc_data = {
        "injured_count": incident.injured_count,
        "critical_count": incident.critical_count,
        "trapped_count": incident.trapped_count,
        "vulnerable_count": incident.vulnerable_count,
        "fire_severity": incident.fire_severity,
        "fire_spread_risk": incident.fire_spread_risk,
        "collapse_risk": incident.collapse_risk,
        "hazmat_risk": incident.hazmat_risk,
        "traffic_level": incident.traffic_level,
        "road_accessibility": incident.road_accessibility,
        "population_density": incident.population_density,
        "type": incident.type,
    }
    pri_calc = calculate_emergency_priority_score(inc_data, current_mode=mode)
    incident.priority_score = pri_calc["total_score"]
    incident.priority_level = pri_calc["priority_level"]
    incident.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(incident)
    return incident


@router.get("/priority-queue")
def get_priority_queue(db: Session = Depends(get_db)):
    """
    Returns active emergencies ranked in deterministic priority order with full explainability.
    """
    mode = get_current_system_mode(db)
    incidents = db.query(EmergencyIncident).filter(EmergencyIncident.status == "ACTIVE").order_by(EmergencyIncident.priority_score.desc()).all()
    
    queue = []
    for inc in incidents:
        inc_data = {
            "injured_count": inc.injured_count,
            "critical_count": inc.critical_count,
            "trapped_count": inc.trapped_count,
            "vulnerable_count": inc.vulnerable_count,
            "fire_severity": inc.fire_severity,
            "fire_spread_risk": inc.fire_spread_risk,
            "collapse_risk": inc.collapse_risk,
            "hazmat_risk": inc.hazmat_risk,
            "traffic_level": inc.traffic_level,
            "road_accessibility": inc.road_accessibility,
            "population_density": inc.population_density,
            "type": inc.type,
        }
        breakdown = calculate_emergency_priority_score(inc_data, current_mode=mode)
        queue.append({
            "incident_id": inc.id,
            "type": inc.type,
            "title": inc.title,
            "location_name": inc.location_name,
            "latitude": inc.latitude,
            "longitude": inc.longitude,
            "critical_count": inc.critical_count,
            "injured_count": inc.injured_count,
            "trapped_count": inc.trapped_count,
            "priority_score": inc.priority_score,
            "priority_level": inc.priority_level,
            "breakdown": breakdown,
            "created_at": inc.created_at.isoformat() if inc.created_at else None,
        })
    return {"emergency_mode": mode, "queue": queue}


# ---------------------------------------------------------------------------
# 3. FLEET & EMERGENCY RESOURCES
# ---------------------------------------------------------------------------

@router.get("/resources", response_model=List[EmergencyResourceResponse])
def get_all_resources(db: Session = Depends(get_db)):
    return db.query(EmergencyResource).all()


@router.get("/ambulances", response_model=List[EmergencyResourceResponse])
def get_ambulances(db: Session = Depends(get_db)):
    return db.query(EmergencyResource).filter(EmergencyResource.category == "AMBULANCE").all()


@router.get("/fire-units", response_model=List[EmergencyResourceResponse])
def get_fire_units(db: Session = Depends(get_db)):
    return db.query(EmergencyResource).filter(EmergencyResource.category.in_(["FIRE_RESCUE", "SPECIALIZED"])).all()


# ---------------------------------------------------------------------------
# 4. HOSPITALS & CAPACITY INTELLIGENCE
# ---------------------------------------------------------------------------

@router.get("/hospitals", response_model=List[HospitalResponse])
def get_hospitals(db: Session = Depends(get_db)):
    return db.query(Hospital).all()


@router.get("/hospitals/capacity", response_model=HospitalCapacityOverview)
def get_hospitals_capacity(db: Session = Depends(get_db)):
    hospitals = db.query(Hospital).all()
    total_icu = sum(h.icu_beds for h in hospitals)
    avail_icu = sum(h.available_icu_beds for h in hospitals)
    total_er = sum(h.emergency_beds for h in hospitals)
    avail_er = sum(h.available_emergency_beds for h in hospitals)
    total_vent = sum(h.ventilators for h in hospitals)
    avail_vent = sum(h.available_ventilators for h in hospitals)
    avg_occ = round(sum(h.emergency_department_occupancy for h in hospitals) / max(1, len(hospitals)), 1) if hospitals else 70.0

    return {
        "total_hospitals": len(hospitals),
        "total_icu_beds": total_icu,
        "available_icu_beds": avail_icu,
        "total_er_beds": total_er,
        "available_er_beds": avail_er,
        "total_ventilators": total_vent,
        "available_ventilators": avail_vent,
        "avg_occupancy": avg_occ,
        "hospitals": hospitals,
    }


# ---------------------------------------------------------------------------
# 5. PATIENT & CASUALTY TRACKING (ANONYMOUS PAT-1001..25)
# ---------------------------------------------------------------------------

@router.get("/patients", response_model=List[PatientEmergencyRecordResponse])
def get_patients(
    emergency_id: Optional[str] = None,
    triage_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(PatientEmergencyRecord)
    if emergency_id:
        query = query.filter(PatientEmergencyRecord.emergency_id == emergency_id)
    if triage_status:
        query = query.filter(PatientEmergencyRecord.triage_status == triage_status.upper())
    return query.all()


@router.get("/patients/{patient_id}/location")
def get_patient_location(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(PatientEmergencyRecord).filter(PatientEmergencyRecord.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient record '{patient_id}' not found")
    return {
        "patient_id": patient.id,
        "emergency_id": patient.emergency_id,
        "current_latitude": patient.current_latitude,
        "current_longitude": patient.current_longitude,
        "location_source": patient.location_source,
        "location_confidence": patient.location_confidence,
        "last_updated": patient.last_updated.isoformat() if patient.last_updated else None,
        "assigned_ambulance": patient.assigned_ambulance,
        "destination_hospital": patient.destination_hospital,
        "simulation_disclaimer": "SIMULATED DATA for emergency multi-source telemetry validation",
    }


@router.patch("/patients/{patient_id}/location", response_model=PatientEmergencyRecordResponse)
def update_patient_location(
    patient_id: str,
    req: PatientLocationUpdateRequest,
    db: Session = Depends(get_db)
):
    patient = db.query(PatientEmergencyRecord).filter(PatientEmergencyRecord.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient record '{patient_id}' not found")

    if req.current_latitude is not None:
        patient.current_latitude = req.current_latitude
    if req.current_longitude is not None:
        patient.current_longitude = req.current_longitude
    if req.location_source:
        patient.location_source = req.location_source
    if req.location_confidence:
        patient.location_confidence = req.location_confidence
    if req.assigned_ambulance is not None:
        patient.assigned_ambulance = req.assigned_ambulance
    if req.destination_hospital is not None:
        patient.destination_hospital = req.destination_hospital
    if req.triage_status is not None:
        patient.triage_status = req.triage_status
    if req.rescue_status is not None:
        patient.rescue_status = req.rescue_status
    if req.notes is not None:
        patient.notes = req.notes

    patient.last_updated = datetime.utcnow()
    db.commit()
    db.refresh(patient)
    return patient


# ---------------------------------------------------------------------------
# 6. GLOBAL ALLOCATION, CONFLICT DETECTION, & DISPATCH LIFECYCLE
# ---------------------------------------------------------------------------

@router.post("/allocate", response_model=GlobalAllocationResult)
def run_global_allocation(db: Session = Depends(get_db)):
    """
    Executes Multi-Incident Global Resource Allocation & Hospital Routing Engine.
    Detects resource conflicts and shortages across simultaneous active incidents.
    """
    mode = get_current_system_mode(db)
    active_incidents = db.query(EmergencyIncident).filter(EmergencyIncident.status == "ACTIVE").all()
    resources = db.query(EmergencyResource).all()
    hospitals = db.query(Hospital).all()

    result = allocate_emergency_resources(
        incidents=active_incidents,
        resources=resources,
        hospitals=hospitals,
        current_mode=mode
    )
    return result


@router.get("/dispatches", response_model=List[ResourceDispatchResponse])
def get_dispatches(
    status: Optional[str] = None,
    incident_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ResourceDispatch)
    if status:
        query = query.filter(ResourceDispatch.status == status.upper())
    if incident_id:
        query = query.filter(ResourceDispatch.incident_id == incident_id)
    return query.order_by(ResourceDispatch.recommended_at.desc()).all()


@router.post("/dispatch", response_model=ResourceDispatchResponse)
def confirm_dispatch(
    req: DispatchConfirmRequest,
    operator: str = Query("Admin Commissioner", description="Authorized Operator"),
    db: Session = Depends(get_db)
):
    """
    Confirms dispatch of a recommended resource to an incident.
    Transitions dispatch status to DISPATCHED / EN_ROUTE and updates resource status.
    """
    incident = db.query(EmergencyIncident).filter(EmergencyIncident.id == req.incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident '{req.incident_id}' not found")

    resource = db.query(EmergencyResource).filter(EmergencyResource.id == req.resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail=f"Resource '{req.resource_id}' not found")

    dsp_count = db.query(ResourceDispatch).count() + 1
    dsp_id = f"DSP-2026-{dsp_count:04d}"

    dispatch = ResourceDispatch(
        id=dsp_id,
        incident_id=req.incident_id,
        resource_id=req.resource_id,
        status=req.status or "DISPATCHED",
        eta_minutes=req.eta_minutes or 5.0,
        reasoning=req.reasoning or f"Authorized emergency dispatch of {resource.name} to {incident.title}",
        recommended_at=datetime.utcnow(),
        dispatched_at=datetime.utcnow(),
        confirmed_by=operator,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(dispatch)

    # Update resource availability & current assignment
    resource.status = "DISPATCHED"
    resource.availability = False
    resource.current_assignment = req.incident_id
    resource.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(dispatch)
    return dispatch


@router.patch("/dispatches/{dispatch_id}/status", response_model=ResourceDispatchResponse)
def update_dispatch_status(
    dispatch_id: str,
    req: DispatchStatusUpdateRequest,
    db: Session = Depends(get_db)
):
    dispatch = db.query(ResourceDispatch).filter(ResourceDispatch.id == dispatch_id).first()
    if not dispatch:
        raise HTTPException(status_code=404, detail=f"Dispatch '{dispatch_id}' not found")

    new_st = req.status.upper()
    dispatch.status = new_st
    dispatch.updated_at = datetime.utcnow()

    # Update assigned resource status accordingly
    resource = db.query(EmergencyResource).filter(EmergencyResource.id == dispatch.resource_id).first()
    if resource:
        if new_st in ["COMPLETED", "CANCELLED"]:
            resource.status = "AVAILABLE"
            resource.availability = True
            resource.current_assignment = None
        elif new_st in ["EN_ROUTE", "DISPATCHED", "ON_SCENE", "TRANSPORTING"]:
            resource.status = new_st
            resource.availability = False
        resource.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(dispatch)
    return dispatch


# ---------------------------------------------------------------------------
# 7. EMERGENCY ANALYTICS & PREDICTIVE INSIGHTS
# ---------------------------------------------------------------------------

@router.get("/analytics", response_model=EmergencyAnalyticsResponse)
def get_emergency_analytics(db: Session = Depends(get_db)):
    mode = get_current_system_mode(db)
    incidents = db.query(EmergencyIncident).all()
    resources = db.query(EmergencyResource).all()
    hospitals = db.query(Hospital).all()
    dispatches = db.query(ResourceDispatch).all()

    analytics = calculate_emergency_analytics(
        incidents=incidents,
        resources=resources,
        hospitals=hospitals,
        dispatches=dispatches,
        current_mode=mode
    )
    return analytics


# ---------------------------------------------------------------------------
# 8. DISASTER SIMULATION SCENARIO RESET (3 INCIDENTS, 25 CASUALTIES)
# ---------------------------------------------------------------------------

@router.post("/demo/reset-scenario")
def reset_disaster_scenario(db: Session = Depends(get_db)):
    """
    Resets and populates the official Disaster Simulation Scenario:
    - 3 Simultaneous Major Incidents (Building Collapse, Factory Fire, Flood Rescue)
    - Exactly 25 Anonymous Casualties (PAT-1001 to PAT-1025)
    - Limited Emergency Fleet to trigger conflict detection
    - 4 Network Hospitals with distinct ICU/ER/Ventilator capacities
    - Sets Emergency Mode to DISASTER
    - Computes and returns global allocation decisions & reasoning
    """
    from app.services.seed import seed_emergency_scenario_data
    seed_emergency_scenario_data(db)

    # Return refreshed global allocation
    mode = get_current_system_mode(db)
    active_incidents = db.query(EmergencyIncident).filter(EmergencyIncident.status == "ACTIVE").all()
    resources = db.query(EmergencyResource).all()
    hospitals = db.query(Hospital).all()

    allocation_result = allocate_emergency_resources(
        incidents=active_incidents,
        resources=resources,
        hospitals=hospitals,
        current_mode=mode
    )

    return {
        "status": "success",
        "message": "Disaster Scenario initialized with 3 simultaneous incidents and 25 anonymous casualty records.",
        "emergency_mode": mode,
        "active_incidents_count": len(active_incidents),
        "total_patients_seeded": 25,
        "allocation_result": allocation_result,
        "disclaimer": "SIMULATED DATA for rapidAID Emergency Command validation"
    }
