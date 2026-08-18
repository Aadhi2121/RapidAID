import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
import requests
import io
import soundfile as sf
import numpy as np

print("--- Checking Backend Health ---")
r_health = requests.get("http://localhost:8000/")
print("Backend Health:", r_health.status_code, r_health.json())

print("\n--- Checking Frontend Server ---")
r_fe = requests.get("http://localhost:5173/")
print("Frontend Server:", r_fe.status_code, "HTML Length:", len(r_fe.text))

print("\n--- Testing Custom Audio Upload & Transcription ---")
sr = 16000
audio_data = (0.5 * np.sin(2 * np.pi * 440 * np.linspace(0, 2, sr * 2))).astype(np.float32)
buf = io.BytesIO()
sf.write(buf, audio_data, sr, format="WAV")
buf.seek(0)

r_trans = requests.post(
    "http://localhost:8000/api/calls/transcribe",
    files={"audio": ("citizen_tamil_recording.wav", buf, "audio/wav")},
    data={"language": "ta"}
)
print("Audio Transcribe:", r_trans.status_code)
trans_data = r_trans.json()
print("Transcribe Response:", trans_data)

print("\n--- Testing AI Complaint Pipeline on Transcribed Audio ---")
r_ai = requests.post("http://localhost:8000/api/calls/analyze", json={
    "text": trans_data["transcript"],
    "language": trans_data["language"],
    "location": "Ward 12, Tondiarpet, Chennai",
    "caller_name": "Senthil Nathan",
    "caller_phone": "+91 98401 23456"
})
print("AI Analysis Status:", r_ai.status_code)
ai_data = r_ai.json()
print("Category:", ai_data["category"], "/", ai_data["subcategory"])
print("Summary:", ai_data["summary"])
print("Priority:", ai_data["priority"]["priority_score"], f"({ai_data['priority']['priority_level']})")
print("Recommended Dept:", ai_data["recommended_department"]["department_name"])
print("Recommended Officer:", ai_data["recommended_officer"]["officer_name"])

print("\n--- Testing Complaint Creation ---")
r_comp = requests.post("http://localhost:8000/api/complaints", json={
    "source": "VOICE_CALL",
    "transcript": trans_data["transcript"],
    "language": trans_data["language"],
    "citizen_name": "Senthil Nathan",
    "citizen_phone": "+91 98401 23456",
    "location_name": "Ward 12, Tondiarpet, Chennai",
    "latitude": ai_data["entities"]["latitude"],
    "longitude": ai_data["entities"]["longitude"]
})
print("Complaint Created:", r_comp.status_code, "ID:", r_comp.json()["id"])

print("\n>>> ALL LIVE HTTP CHECKS PASSED! <<<")
