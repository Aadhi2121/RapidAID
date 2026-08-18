import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Setup test DB before app import
os.environ["DATABASE_URL"] = "sqlite:///./test_civicai.db"
os.environ["AI_MODE"] = "mock"

from app.database import Base, get_db
from app.main import app
from app.services.seed import seed_database
from app.services.ai.complaint_intelligence import analyze_complaint_pipeline
from app.services.ai.language_detection import detect_and_translate
from app.services.ai.priority import calculate_priority_score
from app.services.ai.sla_prediction import predict_sla_resolution
from app.services.ai.duplicate_detection import find_duplicate_complaints

# Test DB Engine
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

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_database(db)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("test_civicai.db"):
        try:
            os.remove("test_civicai.db")
        except Exception:
            pass

client = TestClient(app)

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_auth_login():
    response = client.post("/api/auth/login", json={
        "email": "admin@civicai.local",
        "password": "civicai123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@civicai.local"
    assert data["user"]["role"] == "ADMIN"

def test_auth_invalid_password():
    response = client.post("/api/auth/login", json={
        "email": "admin@civicai.local",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_language_detection_and_translation():
    # Tamil
    ta_text = "வார்டு 12-ல் மூன்று நாட்களாக பல தெருக்களில் குடிநீர் விநியோகம் இல்லை. முந்தைய புகார்கள் புறக்கணிக்கப்பட்டன."
    code, name, conf, trans = detect_and_translate(ta_text)
    assert code == "ta"
    assert name == "Tamil"
    assert "Ward 12" in trans
    assert "water supply" in trans.lower()

    # Hindi
    hi_text = "वार्ड 8 में पिछले दो दिनों से बिजली नहीं है। ट्रांसफार्मर में स्पार्क हो रहा है।"
    code_hi, name_hi, conf_hi, trans_hi = detect_and_translate(hi_text)
    assert code_hi == "hi"
    assert name_hi == "Hindi"
    assert "Ward 8" in trans_hi
    assert "electricity" in trans_hi.lower() or "power" in trans_hi.lower()

def test_ai_priority_calculation():
    result = calculate_priority_score(
        severity="HIGH",
        urgency="HIGH",
        sla_risk="HIGH",
        affected_population=250,
        has_recurrence=True,
        sentiment="FRUSTRATED"
    )
    # Expected around 88-92
    assert 85 <= result["priority_score"] <= 95
    assert result["priority_level"] == "CRITICAL"
    assert "priority_score" in result
    assert "breakdown" in result

def test_sla_risk_prediction():
    sla_res = predict_sla_resolution(
        category="Water Supply",
        severity="HIGH",
        urgency="HIGH",
        affected_population=250,
        department_sla_hours=24,
        is_recurring=True
    )
    assert sla_res["sla_risk"] in ["HIGH", "MEDIUM"]
    assert sla_res["predicted_resolution_hours"] > 20

def test_duplicate_detection():
    existing = [
        {
            "id": "CIVIC-2026-0001",
            "category": "Water Supply",
            "subcategory": "Water Shortage",
            "summary": "No water supply for 3 days in Ward 12 affecting 250 residents.",
            "latitude": 13.1120,
            "longitude": 80.2150,
            "status": "RECEIVED"
        }
    ]
    new_text = "Water Supply Water Shortage No water supply in Ward 12 for 3 days."
    matches = find_duplicate_complaints(
        new_text=new_text,
        new_lat=13.1122,
        new_lng=80.2152,
        new_category="Water Supply",
        existing_complaints=existing
    )
    assert len(matches) > 0
    assert matches[0]["complaint_id"] == "CIVIC-2026-0001"
    assert matches[0]["similarity_score"] > 0.65

def test_demo_tamil_water_complaint_pipeline():
    """
    End-to-end demo test:
    Citizen submits Tamil voice complaint -> AI pipeline -> Water supply classification -> Ward 12 -> Priority ~91 -> High SLA risk
    """
    response = client.post("/api/complaints", json={
        "source": "VOICE_CALL",
        "transcript": "வார்டு 12-ல் மூன்று நாட்களாக பல தெருக்களில் குடிநீர் விநியோகம் இல்லை. முந்தைய புகார்கள் புறக்கணிக்கப்பட்டன.",
        "citizen_name": "Senthil Nathan",
        "citizen_phone": "+91 98401 23456",
        "location_name": "Ward 12, Tondiarpet, Chennai"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Water Supply"
    assert data["subcategory"] == "Water Shortage"
    assert data["priority_level"] in ["CRITICAL", "HIGH"]
    assert data["priority_score"] >= 80
    assert data["sla_risk"] in ["HIGH", "MEDIUM"]
    assert "Ward 12" in (data["location_name"] or "") or "Ward 12" in (data["summary"] or "")
    
    comp_id = data["id"]
    
    # Test Detail View
    detail_res = client.get(f"/api/complaints/{comp_id}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert len(detail_data["events"]) >= 2
    assert len(detail_data["ai_analyses"]) >= 1

    # Test Officer Assignment
    assign_res = client.post(f"/api/complaints/{comp_id}/assign", json={
        "officer_id": 1,
        "notes": "Dispatching emergency water maintenance crew"
    })
    assert assign_res.status_code == 200
    assert assign_res.json()["status"] == "OFFICER_ASSIGNED"

    # Test Resolution
    resolve_res = client.post(f"/api/complaints/{comp_id}/resolve", json={
        "resolution_notes": "Main distribution valve replaced. Water supply restored to all streets.",
        "resolved_by": "Er. K. Natarajan"
    })
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "RESOLVED"

def test_analytics_endpoints():
    overview = client.get("/api/analytics/overview")
    assert overview.status_code == 200
    ov_data = overview.json()
    assert ov_data["total_complaints"] >= 10
    assert len(ov_data["category_distribution"]) > 0
    assert len(ov_data["insights"]) > 0

    trends = client.get("/api/analytics/trends")
    assert trends.status_code == 200
    tr_data = trends.json()
    assert len(tr_data["daily_trends"]) == 7

    hotspots = client.get("/api/analytics/hotspots")
    assert hotspots.status_code == 200
    hs_data = hotspots.json()
    assert len(hs_data["hotspots"]) > 0
    assert len(hs_data["critical_zones"]) > 0

def test_departments_and_officers_recommendations():
    dept_rec = client.get("/api/departments/recommend?category=Water%20Supply&location=Ward%2012")
    assert dept_rec.status_code == 200
    assert "Water" in dept_rec.json()["department_name"]

    off_rec = client.get("/api/officers/recommend?department_id=1&location=Ward%2012")
    assert off_rec.status_code == 200
    assert off_rec.json()["confidence"] > 0.6

def test_calls_transcribe_audio_upload():
    # Test preset default when no file is uploaded
    default_res = client.post("/api/calls/transcribe")
    assert default_res.status_code == 200
    default_data = default_res.json()
    assert "transcript" in default_data
    assert "language" in default_data
    assert "engine_used" in default_data

    # Test file upload with synthetic wav byte data
    import io
    import soundfile as sf
    import numpy as np

    samplerate = 16000
    dummy_audio = np.zeros((samplerate * 2,), dtype=np.float32)
    buf = io.BytesIO()
    sf.write(buf, dummy_audio, samplerate, format='WAV')
    buf.seek(0)

    upload_res = client.post(
        "/api/calls/transcribe",
        files={"audio": ("tamil_water_test.wav", buf, "audio/wav")},
        data={"language": "ta"}
    )
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    assert len(upload_data["transcript"]) > 0
    assert upload_data["language"] in ["ta", "en", "hi"]
    assert "engine_used" in upload_data

def test_calls_transcribe_invalid_format():
    import io
    fake_file = io.BytesIO(b"not an audio file")
    bad_res = client.post(
        "/api/calls/transcribe",
        files={"audio": ("malicious.exe", fake_file, "application/octet-stream")}
    )
    assert bad_res.status_code == 400
    assert "Unsupported audio format" in bad_res.json()["detail"]

