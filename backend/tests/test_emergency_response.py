import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ["DATABASE_URL"] = "sqlite:///./test_civicai.db"
os.environ["AI_MODE"] = "mock"

from app.database import Base, get_db
from app.main import app
from app.services.seed import seed_database, seed_emergency_scenario_data
from app.models.models import (
    EmergencyIncident, EmergencyResource, Hospital,
    PatientEmergencyRecord, ResourceDispatch, EmergencyModeEvent,
    EmergencySystemState, EmergencyMode, EmergencyType
)
from app.services.ai.emergency_allocation import (
    calculate_emergency_priority_score,
    select_optimal_hospital,
    allocate_emergency_resources,
    determine_required_capabilities,
    evaluate_resource_suitability,
    calculate_emergency_analytics
)

TEST_DB_URL = "sqlite:///./test_civicai.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_emergency_test_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_emergency_scenario_data(db)
    yield
    db.close()

client = TestClient(app)


# ---------------------------------------------------------------------------
# TEST 1-4: PRIORITY CALCULATION, MAXIMUMS, CLAMPING & EXPLAINABILITY
# ---------------------------------------------------------------------------

def test_priority_calculation_and_explainability():
    incident = {
        "injured_count": 24,
        "critical_count": 7,
        "trapped_count": 3,
        "vulnerable_count": 4,
        "fire_severity": "LOW",
        "collapse_risk": "HIGH",
        "traffic_level": "HIGH",
        "road_accessibility": "BLOCKED",
        "population_density": "HIGH",
        "type": "BUILDING_COLLAPSE",
    }
    result = calculate_emergency_priority_score(incident, current_mode="DISASTER", system_stress={"icu_scarcity": True, "simultaneous_critical_count": 3})
    
    assert 80.0 <= result["total_score"] <= 100.0
    assert result["priority_level"] == "CRITICAL"
    assert len(result["reasons"]) >= 4
    assert any("critical" in r.lower() for r in result["reasons"])
    assert any("trapped" in r.lower() for r in result["reasons"])


def test_priority_score_max_100_clamp():
    # Extreme incident that would exceed 100 without clamping
    extreme_incident = {
        "injured_count": 500,
        "critical_count": 100,
        "trapped_count": 50,
        "vulnerable_count": 80,
        "fire_severity": "CRITICAL",
        "fire_spread_risk": "CRITICAL",
        "collapse_risk": "CRITICAL",
        "hazmat_risk": "CRITICAL",
        "traffic_level": "HIGH",
        "road_accessibility": "BLOCKED",
        "population_density": "HIGH",
        "type": "BUILDING_COLLAPSE",
    }
    result = calculate_emergency_priority_score(extreme_incident, current_mode="DISASTER", system_stress={"icu_scarcity": True, "simultaneous_critical_count": 10})
    assert result["total_score"] <= 100.0
    assert result["total_score"] == 100.0
    assert result["casualty_score"] <= 45.0
    assert result["hazard_score"] <= 25.0
    assert result["geographic_score"] <= 15.0
    assert result["system_stress_score"] <= 15.0


def test_component_maximums():
    inc = {
        "injured_count": 1000,
        "critical_count": 200,
        "trapped_count": 100,
        "vulnerable_count": 50,
        "fire_severity": "CRITICAL",
        "fire_spread_risk": "CRITICAL",
        "collapse_risk": "CRITICAL",
        "hazmat_risk": "CRITICAL",
        "traffic_level": "HIGH",
        "road_accessibility": "BLOCKED",
        "population_density": "HIGH",
    }
    res = calculate_emergency_priority_score(inc, current_mode="DISASTER", system_stress={"icu_scarcity": True, "simultaneous_critical_count": 5, "fleet_strain": True})
    assert res["casualty_score"] == 45.0
    assert res["hazard_score"] == 25.0
    assert res["geographic_score"] == 15.0
    assert res["system_stress_score"] == 15.0
    assert res["total_score"] == 100.0


# ---------------------------------------------------------------------------
# TEST 5-9: CAPABILITY MATCHING (ALS, VENTILATOR, LADDER, HAZMAT, HEAVY RESCUE)
# ---------------------------------------------------------------------------

def test_als_and_ventilator_matching():
    class DummyIncident:
        type = "MASS_CASUALTY"
        critical_count = 5
        injured_count = 12
        trapped_count = 0
        fire_severity = "LOW"
        fire_spread_risk = "LOW"
        collapse_risk = "LOW"
        hazmat_risk = "LOW"
        title = "Highway Pileup"
        latitude = 13.0600
        longitude = 80.2500
        traffic_level = "LOW"
        road_accessibility = "CLEAR"

    caps = determine_required_capabilities(DummyIncident())
    assert "ALS_AMBULANCE" in caps
    assert "VENTILATOR_AMBULANCE" in caps
    assert "paramedic_capability" in caps


def test_ladder_truck_matching():
    class DummyIncident:
        type = "FIRE"
        title = "Commercial Building 12-Story Blaze"
        critical_count = 0
        injured_count = 2
        trapped_count = 0
        fire_severity = "HIGH"
        fire_spread_risk = "HIGH"
        collapse_risk = "LOW"
        hazmat_risk = "LOW"
        latitude = 13.0800
        longitude = 80.2600
        traffic_level = "LOW"
        road_accessibility = "CLEAR"

    caps = determine_required_capabilities(DummyIncident())
    assert "FIRE_ENGINE" in caps
    assert "LADDER_TRUCK" in caps


def test_hazmat_unit_matching():
    class DummyIncident:
        type = "HAZMAT"
        title = "Chemical Plant Ammonia Leak"
        critical_count = 2
        injured_count = 6
        trapped_count = 0
        fire_severity = "LOW"
        fire_spread_risk = "LOW"
        collapse_risk = "LOW"
        hazmat_risk = "HIGH"
        latitude = 13.1100
        longitude = 80.1600
        traffic_level = "LOW"
        road_accessibility = "CLEAR"

    caps = determine_required_capabilities(DummyIncident())
    assert "HAZMAT_UNIT" in caps
    assert "hazmat_capability" in caps


def test_heavy_rescue_matching():
    class DummyIncident:
        type = "BUILDING_COLLAPSE"
        title = "Metro Pier Structural Collapse"
        critical_count = 4
        injured_count = 10
        trapped_count = 3
        fire_severity = "LOW"
        fire_spread_risk = "LOW"
        collapse_risk = "HIGH"
        hazmat_risk = "LOW"
        latitude = 13.0604
        longitude = 80.2496
        traffic_level = "HIGH"
        road_accessibility = "BLOCKED"

    caps = determine_required_capabilities(DummyIncident())
    assert "HEAVY_RESCUE_TEAM" in caps
    assert "heavy_rescue_capability" in caps


# ---------------------------------------------------------------------------
# TEST 10-11: INTELLIGENT HOSPITAL CAPACITY ROUTING & NEAREST BYPASS
# ---------------------------------------------------------------------------

def test_hospital_capacity_routing_and_nearest_bypass():
    """
    Hospital A: 1 available ICU bed, 5-min ETA (0.5 km)
    Hospital B: 18 available ICU beds, 9-min ETA (4.2 km)
    Emergency: 7 critical casualties
    System MUST bypass Hospital A because demand exceeds safe capacity!
    """
    class HospitalA:
        id = 1
        name = "Hospital A (Nearest Care)"
        latitude = 13.0620
        longitude = 80.2510
        available_icu_beds = 1  # Only 1 ICU bed!
        available_emergency_beds = 4
        available_ventilators = 2
        emergency_department_occupancy = 88.0
        trauma_capability = True
        operating_theatre_availability = 1
        status = "LIMITED"

    class HospitalB:
        id = 2
        name = "Hospital B (Government General Hospital)"
        latitude = 13.0805
        longitude = 80.2785
        available_icu_beds = 18  # 18 ICU beds available!
        available_emergency_beds = 45
        available_ventilators = 15
        emergency_department_occupancy = 73.5
        trauma_capability = True
        operating_theatre_availability = 6
        status = "ACCEPTING"

    class SevereIncident:
        latitude = 13.0604
        longitude = 80.2496
        traffic_level = "LOW"
        road_accessibility = "CLEAR"
        critical_count = 7
        injured_count = 24

    routing = select_optimal_hospital(SevereIncident(), [HospitalA(), HospitalB()])

    assert routing["recommended_hospital"].name == "Hospital B (Government General Hospital)"
    assert len(routing["bypassed_hospitals"]) > 0
    assert routing["bypassed_hospitals"][0]["hospital_name"] == "Hospital A (Nearest Care)"
    assert "Only 1 ICU bed(s) available for 7 critical patients" in routing["bypassed_hospitals"][0]["reason"]
    assert any("safely accommodate 7 critical casualties" in r for r in routing["reasons"])


# ---------------------------------------------------------------------------
# TEST 12-13: MULTI-INCIDENT RESOURCE CONFLICT & SHORTAGE DETECTION
# ---------------------------------------------------------------------------

def test_multi_incident_resource_conflict_and_shortage():
    class IncidentHigh:
        id = "INC-01"
        title = "Major High-Rise Collapse"
        type = "BUILDING_COLLAPSE"
        priority_score = 95.0
        critical_count = 8
        injured_count = 25
        trapped_count = 4
        latitude = 13.0604
        longitude = 80.2496
        traffic_level = "HIGH"
        road_accessibility = "BLOCKED"
        fire_severity = "LOW"
        hazmat_risk = "LOW"

    class IncidentMedium:
        id = "INC-02"
        title = "Secondary Commercial Fire"
        type = "FIRE"
        priority_score = 72.0
        critical_count = 2
        injured_count = 8
        trapped_count = 0
        latitude = 13.1100
        longitude = 80.1600
        traffic_level = "MEDIUM"
        road_accessibility = "CLEAR"
        fire_severity = "HIGH"
        hazmat_risk = "MEDIUM"

    # Only 1 Heavy Rescue vehicle and only 1 ALS Ambulance in the system
    class ResourceHeavy:
        id = "RES-HVY-01"
        name = "Heavy Rescue 1"
        resource_type = "HEAVY_RESCUE_TEAM"
        category = "SPECIALIZED"
        status = "AVAILABLE"
        availability = True
        latitude = 13.0700
        longitude = 80.2500
        heavy_rescue_capability = True
        oxygen_capability = False
        ventilator_capability = False
        paramedic_capability = False
        ladder_capability = False
        hazmat_capability = False

    class ResourceALS:
        id = "AMB-ALS-01"
        name = "ALS Unit 1"
        resource_type = "ALS_AMBULANCE"
        category = "AMBULANCE"
        status = "AVAILABLE"
        availability = True
        latitude = 13.0650
        longitude = 80.2550
        oxygen_capability = True
        ventilator_capability = True
        paramedic_capability = True
        heavy_rescue_capability = False
        ladder_capability = False
        hazmat_capability = False

    class HospitalDummy:
        id = 1
        name = "RGGGH"
        latitude = 13.0805
        longitude = 80.2785
        available_icu_beds = 20
        available_emergency_beds = 50
        available_ventilators = 10
        emergency_department_occupancy = 70.0
        trauma_capability = True
        operating_theatre_availability = 4
        status = "ACCEPTING"

    res_alloc = allocate_emergency_resources(
        incidents=[IncidentHigh(), IncidentMedium()],
        resources=[ResourceHeavy(), ResourceALS()],
        hospitals=[HospitalDummy()],
        current_mode="DISASTER"
    )

    assert len(res_alloc["allocated_dispatches"]) > 0
    # Higher priority incident INC-01 should receive ResourceALS & ResourceHeavy
    awarded_inc_ids = [d["incident_id"] for d in res_alloc["allocated_dispatches"]]
    assert "INC-01" in awarded_inc_ids

    # Shortages should be detected because total demand (8+2 critical = 10 critical -> 5 ALS needed) exceeds 1 available ALS
    assert len(res_alloc["shortages"]) > 0
    als_shortage = [s for s in res_alloc["shortages"] if s["capability"] == "ALS_AMBULANCE"]
    assert len(als_shortage) > 0
    assert als_shortage[0]["deficit"] > 0
    assert len(res_alloc["mitigations"]) > 0


# ---------------------------------------------------------------------------
# TEST 14-15: EMERGENCY MODE EFFECT & AUDIT TRAIL
# ---------------------------------------------------------------------------

def test_emergency_mode_effect_on_priority():
    incident = {
        "injured_count": 10,
        "critical_count": 2,
        "trapped_count": 0,
        "vulnerable_count": 1,
        "fire_severity": "LOW",
        "collapse_risk": "LOW",
        "hazmat_risk": "LOW",
        "traffic_level": "LOW",
        "road_accessibility": "CLEAR",
        "population_density": "MEDIUM",
        "type": "ROAD_ACCIDENT",
    }
    res_normal = calculate_emergency_priority_score(incident, current_mode="NORMAL")
    res_disaster = calculate_emergency_priority_score(incident, current_mode="DISASTER")

    assert res_disaster["total_score"] > res_normal["total_score"]
    assert res_disaster["system_stress_score"] > res_normal["system_stress_score"]
    assert any("DISASTER mode active" in r for r in res_disaster["reasons"])


def test_emergency_mode_api_and_audit(db: Session = None):
    # Set mode via API
    response = client.post("/api/emergency/mode?changed_by=Commissioner%20Test", json={
        "mode": "DISASTER",
        "reason": "Simulated flood cyclone activation"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["current_mode"] == "DISASTER"
    assert len(data["history"]) > 0
    assert data["history"][0]["changed_by"] == "Commissioner Test"
    assert "flood cyclone" in data["history"][0]["reason"]


# ---------------------------------------------------------------------------
# TEST 16-17: ANONYMOUS CASUALTY TRACKING & MULTI-SOURCE LOCATION
# ---------------------------------------------------------------------------

def test_anonymous_casualty_ids_and_seeding():
    res = client.get("/api/emergency/patients")
    assert res.status_code == 200
    patients = res.json()
    assert len(patients) == 25
    ids = [p["id"] for p in patients]
    assert "PAT-1001" in ids
    assert "PAT-1025" in ids
    # Verify anonymous format
    for p in patients:
        assert p["id"].startswith("PAT-")
        assert "name" not in p  # Anonymous for demo


def test_patient_multi_source_location_update():
    # Fetch patient location
    loc_res = client.get("/api/emergency/patients/PAT-1001/location")
    assert loc_res.status_code == 200
    loc_data = loc_res.json()
    assert loc_data["patient_id"] == "PAT-1001"
    assert "SIMULATED DATA" in loc_data["simulation_disclaimer"]

    # Update patient location via Ambulance GPS
    update_res = client.patch("/api/emergency/patients/PAT-1001/location", json={
        "current_latitude": 13.0655,
        "current_longitude": 80.2585,
        "location_source": "AMBULANCE_GPS",
        "location_confidence": "HIGH",
        "assigned_ambulance": "AMB-ALS-01",
        "destination_hospital": "Rajiv Gandhi Govt General Hospital (RGGGH)",
        "rescue_status": "TRANSPORTING",
        "notes": "Patient stable on ventilator transport corridor"
    })
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["location_source"] == "AMBULANCE_GPS"
    assert updated_data["rescue_status"] == "TRANSPORTING"
    assert updated_data["current_latitude"] == 13.0655


# ---------------------------------------------------------------------------
# TEST 18-20: DISPATCH LIFECYCLE, EMERGENCY APIS & DISASTER SIMULATION
# ---------------------------------------------------------------------------

def test_dispatch_lifecycle():
    # Create new dispatch
    confirm_res = client.post("/api/emergency/dispatch?operator=Command%20HQ", json={
        "incident_id": "EMG-2026-0001",
        "resource_id": "AMB-ALS-01",
        "status": "DISPATCHED",
        "reasoning": "Immediate paramedic response for collapse criticals",
        "eta_minutes": 4.5
    })
    assert confirm_res.status_code == 200
    dsp_data = confirm_res.json()
    assert dsp_data["status"] == "DISPATCHED"
    dsp_id = dsp_data["id"]

    # Transition to ON_SCENE
    patch_res = client.patch(f"/api/emergency/dispatches/{dsp_id}/status", json={"status": "ON_SCENE"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "ON_SCENE"

    # Transition to COMPLETED
    done_res = client.patch(f"/api/emergency/dispatches/{dsp_id}/status", json={"status": "COMPLETED"})
    assert done_res.status_code == 200
    assert done_res.json()["status"] == "COMPLETED"


def test_emergency_api_suite():
    # Incidents
    inc_res = client.get("/api/emergency/incidents")
    assert inc_res.status_code == 200
    assert len(inc_res.json()) >= 3

    # Priority Queue
    pq_res = client.get("/api/emergency/priority-queue")
    assert pq_res.status_code == 200
    assert len(pq_res.json()["queue"]) >= 3

    # Resources
    res_res = client.get("/api/emergency/resources")
    assert res_res.status_code == 200
    assert len(res_res.json()) >= 10

    # Ambulances & Fire
    amb_res = client.get("/api/emergency/ambulances")
    assert amb_res.status_code == 200
    assert len(amb_res.json()) >= 5

    fire_res = client.get("/api/emergency/fire-units")
    assert fire_res.status_code == 200
    assert len(fire_res.json()) >= 5

    # Hospitals & Capacity
    hosp_res = client.get("/api/emergency/hospitals")
    assert hosp_res.status_code == 200
    assert len(hosp_res.json()) == 4

    cap_res = client.get("/api/emergency/hospitals/capacity")
    assert cap_res.status_code == 200
    assert cap_res.json()["total_icu_beds"] > 0

    # Analytics
    an_res = client.get("/api/emergency/analytics")
    assert an_res.status_code == 200
    an_data = an_res.json()
    assert an_data["active_incidents"] >= 3
    assert len(an_data["predictive_insights"]) > 0
    assert any(p["title"].startswith("PREDICTED:") for p in an_data["predictive_insights"])

    # Global Allocation
    alloc_res = client.post("/api/emergency/allocate")
    assert alloc_res.status_code == 200
    alloc_data = alloc_res.json()
    assert len(alloc_data["allocated_dispatches"]) > 0
    assert "hospital_routings" in alloc_data


def test_disaster_simulation_scenario_reset():
    reset_res = client.post("/api/emergency/demo/reset-scenario")
    assert reset_res.status_code == 200
    data = reset_res.json()
    assert data["status"] == "success"
    assert data["emergency_mode"] == "DISASTER"
    assert data["active_incidents_count"] == 3
    assert data["total_patients_seeded"] == 25
    assert len(data["allocation_result"]["allocated_dispatches"]) > 0
    assert "SIMULATED DATA" in data["disclaimer"]
