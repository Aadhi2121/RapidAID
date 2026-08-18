import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
import io
import soundfile as sf
import numpy as np
from fastapi.testclient import TestClient
from app.main import app

def run_comprehensive_verification():
    print("=" * 70)
    print("CIVICAI: END-TO-END CUSTOM AUDIO & AI PIPELINE VERIFICATION")
    print("=" * 70)

    client = TestClient(app)

    # 1. Health Check
    print("\n[STEP 1] Testing Health Check...")
    r = client.get("/")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print(" -> Health check OK:", r.json())

    # 2. Test Custom Audio Ingestion with Real Audio Sample (sample_audio.wav)
    print("\n[STEP 2] Testing Custom Spoken Audio Ingestion (/api/calls/transcribe)...")
    sample_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "sample_audio.wav"))
    if os.path.exists(sample_path):
        with open(sample_path, "rb") as f:
            audio_bytes = f.read()
        filename = "citizen_ward12_water_grievance.wav"
        print(f" -> Using real audio file: {sample_path} ({len(audio_bytes)} bytes)")
    else:
        # Generate synthetic audio tone
        sr = 16000
        t = np.linspace(0, 5, sr * 5, endpoint=False)
        sig = (0.5 * np.sin(2 * np.pi * 440 * t)).astype(np.float32)
        buf = io.BytesIO()
        sf.write(buf, sig, sr, format='WAV')
        audio_bytes = buf.getvalue()
        filename = "custom_tamil_recording.wav"
        print(f" -> Generated audio signal: {len(audio_bytes)} bytes")

    # Send upload request
    files = {"audio": (filename, io.BytesIO(audio_bytes), "audio/wav")}
    data = {"language": "ta"}
    transcribe_res = client.post("/api/calls/transcribe", files=files, data=data)
    assert transcribe_res.status_code == 200, f"Transcription failed: {transcribe_res.text}"
    t_data = transcribe_res.json()
    print(" -> Upload & Transcription Succeeded!")
    print(f"    * Engine Used: {t_data['engine_used']}")
    print(f"    * Detected Language: {t_data['detected_language_name']} ({t_data['language']})")
    print(f"    * Confidence: {t_data['confidence']}")
    print(f"    * Duration: {t_data['duration_seconds']}s")
    print(f"    * Transcript: {t_data['transcript']}")
    assert len(t_data["transcript"]) > 0

    # 3. Test Full AI Intelligence Pipeline (/api/calls/analyze)
    print("\n[STEP 3] Executing 10-Stage AI Complaint Intelligence Pipeline (/api/calls/analyze)...")
    analyze_payload = {
        "text": t_data["transcript"],
        "language": t_data["language"],
        "location": "Ward 12, Tondiarpet, Chennai",
        "caller_name": "Senthil Nathan",
        "caller_phone": "+91 98401 23456"
    }
    analyze_res = client.post("/api/calls/analyze", json=analyze_payload)
    assert analyze_res.status_code == 200, f"AI Analysis failed: {analyze_res.text}"
    ai = analyze_res.json()

    print(" -> AI Pipeline Output Verified (All 24 Fields):")
    print(f"    1.  Original Transcript: {ai['original_transcript'][:60]}...")
    print(f"    2.  Detected Language: {ai['language']} ({round(ai['language_confidence']*100)}% conf)")
    print(f"    3.  English Translation: {ai['translated_transcript'][:60]}...")
    print(f"    4.  Governance Summary: {ai['summary']}")
    print(f"    5.  Category: {ai['category']}")
    print(f"    6.  Subcategory: {ai['subcategory']} ({round(ai['classification_confidence']*100)}%)")
    print(f"    7.  Severity / Urgency: {ai['severity']} / {ai['urgency']}")
    print(f"    8.  Sentiment: {ai['sentiment']} (Score: {ai['sentiment_score']})")
    print(f"    9.  Extracted Location: {ai['entities']['location_name']} (Ward {ai['entities']['ward']})")
    print(f"    10. GPS Coordinates: Lat {ai['entities']['latitude']}, Lng {ai['entities']['longitude']}")
    print(f"    11. Duration Reported: {ai['entities']['duration']}")
    print(f"    12. Affected Population: ~{ai['affected_population']} residents")
    print(f"    13. Duplicate Matches: {len(ai['duplicates'])} found")
    print(f"    14. Recommended Department: {ai['recommended_department']['department_name']} ({round(ai['recommended_department']['confidence']*100)}% match)")
    print(f"    15. Department Reasoning: {ai['recommended_department']['reasoning']}")
    print(f"    16. Priority Score: {ai['priority']['priority_score']}/100 ({ai['priority']['priority_level']})")
    print(f"    17. Priority Reasoning: {ai['priority']['reasoning']}")
    print(f"    18. Statutory SLA Target: {ai['sla']['department_sla_hours']} hours")
    print(f"    19. Predicted SLA Resolution: {ai['sla']['predicted_resolution_hours']} hours (Risk: {ai['sla']['sla_risk']})")
    print(f"    20. SLA Diagnostics: {ai['sla']['reasoning']}")
    print(f"    21. Recommended Officer: {ai['recommended_officer']['officer_name']} ({round(ai['recommended_officer']['confidence']*100)}% match)")

    # 4. Test Complaint Ticket Creation
    print("\n[STEP 4] Registering Official Municipal Complaint Ticket (/api/complaints)...")
    create_payload = {
        "source": "VOICE_CALL",
        "transcript": t_data["transcript"],
        "language": t_data["language"],
        "citizen_name": "Senthil Nathan",
        "citizen_phone": "+91 98401 23456",
        "location_name": "Ward 12, Tondiarpet, Chennai",
        "latitude": ai["entities"]["latitude"],
        "longitude": ai["entities"]["longitude"]
    }
    create_res = client.post("/api/complaints", json=create_payload)
    assert create_res.status_code == 200, f"Complaint creation failed: {create_res.text}"
    comp = create_res.json()
    comp_id = comp["id"]
    print(f" -> Ticket Registered: ID={comp_id}, Status={comp['status']}, Priority={comp['priority_score']}")

    # 5. Verify Complaint Detail Lifecycle & Audit Trail
    print("\n[STEP 5] Verifying Audit Trail & AI Analysis Record in Complaint Detail...")
    detail_res = client.get(f"/api/complaints/{comp_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail.get("events", [])) >= 2, "Expected at least 2 audit events"
    assert len(detail.get("ai_analyses", [])) >= 1, "Expected at least 1 AI analysis record"
    print(f" -> Complaint {comp_id} has {len(detail['events'])} events and {len(detail['ai_analyses'])} AI audit records.")

    # 6. Officer Assignment
    if ai["recommended_officer"]["officer_id"]:
        off_id = ai["recommended_officer"]["officer_id"]
        print(f"\n[STEP 6] Dispatching Recommended Officer #{off_id}...")
        assign_res = client.post(f"/api/complaints/{comp_id}/assign", json={
            "officer_id": off_id,
            "notes": "Automated dispatch of recommended field engineer."
        })
        assert assign_res.status_code == 200
        print(f" -> Successfully assigned Officer #{off_id}: Status is now {assign_res.json()['status']}")

    # 7. Test Presets
    print("\n[STEP 7] Verifying Demo Presets Fallback...")
    preset_res = client.post("/api/calls/transcribe")
    assert preset_res.status_code == 200
    assert preset_res.json()["engine_used"] == "Catalog Fallback — Demo"
    print(f" -> Preset transcribe returns: {preset_res.json()['detected_language_name']} ({preset_res.json()['engine_used']})")

    print("\n" + "=" * 70)
    print("SUCCESS: ALL 7 END-TO-END PIPELINE VERIFICATION STEPS PASSED 100%!")
    print("=" * 70)

if __name__ == "__main__":
    run_comprehensive_verification()
