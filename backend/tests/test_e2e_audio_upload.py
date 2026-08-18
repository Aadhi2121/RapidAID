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


def test_e2e_audio_upload_and_pipeline():
    with TestClient(app) as client:
        print("=== 1. Health Check ===")
        r = client.get("/")
        assert r.status_code == 200, f"Health check failed: {r.text}"
        print("Health check OK:", r.json())


        print("\n=== 2. Testing Custom Audio File Upload & Transcription (.wav) ===")
        # Generate 3 seconds of synthetic audio
        sr = 16000
        t = np.linspace(0, 3, sr * 3, endpoint=False)
        # 440 Hz tone with harmonics
        audio_signal = 0.5 * np.sin(2 * np.pi * 440 * t) + 0.25 * np.sin(2 * np.pi * 880 * t)
        audio_signal = audio_signal.astype(np.float32)

        buf = io.BytesIO()
        sf.write(buf, audio_signal, sr, format='WAV')
        buf.seek(0)

        # Test uploading custom Tamil audio file
        files = {"audio": ("custom_tamil_recording_ward12.wav", buf, "audio/wav")}
        data = {"language": "ta"}
        transcribe_res = client.post("/api/calls/transcribe", files=files, data=data)
        assert transcribe_res.status_code == 200, f"Transcribe failed: {transcribe_res.text}"
        t_data = transcribe_res.json()
        print("Transcription Result:")
        print(f" - Engine Used: {t_data.get('engine_used')}")
        print(f" - Detected Language: {t_data.get('detected_language_name')} ({t_data.get('language')})")
        print(f" - Confidence: {t_data.get('confidence')}")
        print(f" - Duration: {t_data.get('duration_seconds')}s")
        print(f" - Transcript: {t_data.get('transcript')}")
        assert len(t_data.get("transcript", "")) > 0

        print("\n=== 3. Testing Format Validation (Rejecting invalid formats like .exe, .txt) ===")
        bad_buf = io.BytesIO(b"malicious executable binary data")
        bad_res = client.post("/api/calls/transcribe", files={"audio": ("payload.exe", bad_buf, "application/octet-stream")})
        assert bad_res.status_code == 400
        print("Bad format correctly rejected:", bad_res.json()["detail"])

        print("\n=== 4. Testing AI Pipeline on Transcribed Audio ===")
        analyze_res = client.post("/api/calls/analyze", json={
            "text": t_data["transcript"],
            "language": t_data["language"],
            "location": "Ward 12, Tondiarpet, Chennai",
            "caller_name": "Senthil Nathan",
            "caller_phone": "+91 98401 23456"
        })
        assert analyze_res.status_code == 200, f"Analysis failed: {analyze_res.text}"
        ai_data = analyze_res.json()
        print("AI Analysis Output:")
        print(f" 1. Original Transcript: {ai_data['original_transcript']}")
        print(f" 2. Detected Language: {ai_data['language']}")
        print(f" 3. English Translation: {ai_data['translated_transcript']}")
        print(f" 4. AI Summary: {ai_data['summary']}")
        print(f" 5. Category: {ai_data['category']}")
        print(f" 6. Subcategory: {ai_data['subcategory']}")
        print(f" 7. Severity: {ai_data['severity']}")
        print(f" 8. Urgency: {ai_data['urgency']}")
        print(f" 9. Sentiment: {ai_data['sentiment']}")
        print(f" 10. Sentiment Score: {ai_data['sentiment_score']}")
        print(f" 11. Location: {ai_data['entities'].get('location_name')} ({ai_data['entities'].get('ward')})")
        print(f" 12. Duration: {ai_data['entities'].get('duration')}")
        print(f" 13. Population Impact: ~{ai_data['affected_population']} residents")
        print(f" 14. Similar Complaints Count: {len(ai_data['duplicates'])}")
        print(f" 15. Duplicate Top Similarity: {ai_data['duplicates'][0]['similarity_score'] if ai_data['duplicates'] else 'None'}")
        print(f" 16. Recommended Department: {ai_data['recommended_department']['department_name']}")
        print(f" 17. Department Confidence: {ai_data['recommended_department']['confidence']}")
        print(f" 18. Priority Score: {ai_data['priority']['priority_score']}/100")
        print(f" 19. Priority Level: {ai_data['priority']['priority_level']}")
        print(f" 20. Priority Reasoning: {ai_data['priority']['reasoning']}")
        print(f" 21. Statutory SLA Hours: {ai_data['sla']['department_sla_hours']}h")
        print(f" 22. Predicted Resolution Hours: {ai_data['sla']['predicted_resolution_hours']}h")
        print(f" 23. SLA Risk: {ai_data['sla']['sla_risk']}")
        print(f" 24. Recommended Officer: {ai_data['recommended_officer']['officer_name']} ({ai_data['recommended_officer']['confidence']})")

        print("\n=== 5. Testing Formal Ticket Registration from Live Call ===")
        create_res = client.post("/api/complaints", json={
            "source": "VOICE_CALL",
            "transcript": t_data["transcript"],
            "language": t_data["language"],
            "citizen_name": "Senthil Nathan",
            "citizen_phone": "+91 98401 23456",
            "location_name": "Ward 12, Tondiarpet, Chennai",
            "latitude": ai_data["entities"]["latitude"],
            "longitude": ai_data["entities"]["longitude"]
        })
        assert create_res.status_code == 200, f"Complaint creation failed: {create_res.text}"
        comp = create_res.json()
        comp_id = comp["id"]
        print(f"Created Complaint Ticket: {comp_id} (Status: {comp['status']}, Priority: {comp['priority_score']})")

        print("\n=== 6. Verifying Complaint in Detail View & Lifecycle Workflows ===")
        detail_res = client.get(f"/api/complaints/{comp_id}")
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert len(detail["events"]) >= 2
        assert len(detail["ai_analyses"]) >= 1
        print(f"Complaint Detail verified with {len(detail['events'])} audit events and {len(detail['ai_analyses'])} AI records.")

        # Assign recommended officer
        if ai_data["recommended_officer"]["officer_id"]:
            off_id = ai_data["recommended_officer"]["officer_id"]
            assign_res = client.post(f"/api/complaints/{comp_id}/assign", json={
                "officer_id": off_id,
                "notes": "Dispatching emergency water maintenance crew."
            })
            assert assign_res.status_code == 200
            print(f"Assigned Officer #{off_id}: {assign_res.json()['status']}")

        print("\n=== 7. Verifying Preset Audio Handling (Zero-GPU Fallback & Presets) ===")
        preset_res = client.post("/api/calls/transcribe")
        assert preset_res.status_code == 200
        p_data = preset_res.json()
        assert "transcript" in p_data
        print(f"Default preset audio transcribed successfully: {p_data['detected_language_name']} ({p_data['engine_used']})")

        print("\n>>> ALL END-TO-END WORKFLOW VERIFICATIONS PASSED 100%! <<<")


if __name__ == "__main__":
    run_e2e_test()
