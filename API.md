# CivicAI — REST API Documentation

Base URL: `/api`
Interactive Swagger UI: `http://localhost:8000/docs`
ReDoc Specification: `http://localhost:8000/redoc`

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/login`
Authenticates a user and returns a signed JWT token.
- **Request Body**:
```json
{
  "email": "admin@civicai.local",
  "password": "civicai123"
}
```
- **Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "Admin Commissioner",
    "email": "admin@civicai.local",
    "role": "ADMIN",
    "created_at": "2026-08-16T14:30:00Z"
  }
}
```

### `GET /api/auth/me`
Returns the currently authenticated user based on the `Authorization: Bearer <token>` header.

---

## 2. Citizen Calls & Speech AI (`/api/calls`)

### `POST /api/calls/transcribe`
Accepts multipart audio file (`audio/wav`, `mp3`) and returns Whisper transcript with language detection.
- **Form Data**:
  - `audio`: File
  - `language`: string (optional, e.g. "ta", "hi", "en")
- **Response**:
```json
{
  "transcript": "வார்டு 12-ல் மூன்று நாட்களாக பல தெருக்களில் குடிநீர் விநியோகம் இல்லை. முந்தைய புகார்கள் புறக்கணிக்கப்பட்டன.",
  "language": "ta",
  "confidence": 0.96,
  "detected_language_name": "Tamil"
}
```

### `POST /api/calls/analyze`
Executes the full 9-stage AI intelligence pipeline on text or transcribed speech.
- **Request Body**:
```json
{
  "text": "No water supply for three days across multiple streets in Ward 12. Previous complaints were ignored.",
  "language": "ta",
  "location": "Ward 12, Tondiarpet, Chennai"
}
```
- **Response**: `AIAnalysisResult` containing:
  - `language`: `"Tamil"`
  - `translated_transcript`: Normalized English text
  - `summary`: Concise structured summary
  - `category`: `"Water Supply"`
  - `subcategory`: `"Water Shortage"`
  - `sentiment`: `"FRUSTRATED"`
  - `priority`: `{ "priority_score": 91.2, "priority_level": "CRITICAL", "breakdown": {...}, "reasoning": "..." }`
  - `sla`: `{ "predicted_resolution_hours": 28.5, "department_sla_hours": 24, "sla_risk": "HIGH" }`
  - `duplicates`: Array of semantic and geospatial match tickets
  - `recommended_department`: `{ "department_name": "Chennai Metro Water & Sewerage Board (CMWSSB)", "confidence": 0.94 }`
  - `recommended_officer`: `{ "officer_name": "Er. S. Selvakumar", "confidence": 0.96 }`

---

## 3. Complaints & Lifecycle (`/api/complaints`)

### `POST /api/complaints`
Creates a formal municipal complaint. Runs the AI pipeline to auto-fill category, priority, SLA risk, and routing.
- **Request Body**:
```json
{
  "source": "VOICE_CALL",
  "transcript": "வார்டு 12-ல் மூன்று நாட்களாக பல தெருக்களில் குடிநீர் விநியோகம் இல்லை.",
  "citizen_name": "Senthil Nathan",
  "citizen_phone": "+91 98401 23456",
  "location_name": "Ward 12, Tondiarpet, Chennai"
}
```

### `GET /api/complaints`
Returns complaints with multi-criteria filtering:
- Query Parameters: `category`, `priority_level`, `status`, `department_id`, `assigned_officer_id`, `search`, `limit`, `offset`.

### `GET /api/complaints/{id}`
Returns complete complaint record with full event timeline, duplicate links, and AI analysis records.

### `POST /api/complaints/{id}/assign`
Assigns or reassigns an officer.
- **Request Body**: `{ "officer_id": 1, "notes": "Dispatched emergency crew" }`

### `POST /api/complaints/{id}/escalate`
Escalates ticket priority with audit justification.
- **Request Body**: `{ "reason": "SLA breach imminent due to pipeline replacement" }`

### `POST /api/complaints/{id}/resolve`
Resolves ticket with field completion report.
- **Request Body**: `{ "resolution_notes": "Main distribution valve replaced. Supply restored.", "resolved_by": "Er. K. Natarajan" }`

### `POST /api/complaints/{id}/merge`
Merges duplicate ticket into target master ticket.
- **Request Body**: `{ "target_complaint_id": "CIVIC-2026-0001", "reason": "Confirmed duplicate incident" }`

---

## 4. Departments & Officers (`/api/departments`, `/api/officers`)

- `GET /api/departments`: List all 10 civic departments.
- `GET /api/departments/recommend?category=Water%20Supply&location=Ward%2012`: Intelligent department recommendation.
- `GET /api/officers`: List field engineers with active caseload and SLA compliance metrics.
- `GET /api/officers/recommend?department_id=1&location=Ward%2012`: Workload-balanced officer matching.

---

## 5. Analytics & Hotspots (`/api/analytics`)

- `GET /api/analytics/overview`: Citywide KPIs, category distributions, sentiment breakdown, and predictive governance insights.
- `GET /api/analytics/trends`: 7-day volume trends and category growth percentages.
- `GET /api/analytics/hotspots`: Geospatial coordinates for Chennai wards with cluster density and critical zone alerts.

---

## 6. Notifications (`/api/notifications`)

- `GET /api/notifications`: Feed of critical alerts, SLA warnings, assignments, and duplicate detections.
- `PATCH /api/notifications/{id}/read`: Mark notification as read.
- `POST /api/notifications/mark-all-read`: Mark all notifications as read.
