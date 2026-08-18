# CivicAI — AI-Powered Citizen Call Intelligence Platform

> **Transforming unstructured citizen voice & text calls into structured government intelligence, intelligent department routing, explainable priority scoring, SLA breach forecasting, and predictive governance.**

![CivicAI Platform](https://img.shields.io/badge/CivicAI-v1.0.0-0284c7?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)
![OpenStreetMap](https://img.shields.io/badge/Leaflet-GIS-78c953?style=for-the-badge&logo=leaflet)

---

## 🌟 Key Capabilities

1. **Multilingual Speech Ingestion**: Converts citizen voice calls in **Tamil (தமிழ்)**, **Hindi (हिंदी)**, and **English** into text via Whisper with confidence scoring.
2. **Language Normalization & Translation**: Detects the citizen's vernacular, preserves the original transcript, and produces standardized English translations for downstream NLP.
3. **Civic Named Entity Extraction**: Automatically pinpoints Chennai Ward numbers, localities, infrastructure types, duration, affected population, and urgency terms.
4. **Hierarchical Classification**: Categorizes complaints into 10+ public administrative departments and dozens of subcategories.
5. **Explainable Priority Engine (0–100)**: Transparent multi-factor formula:
   $$\text{Score} = (\text{Severity} \times 30\%) + (\text{Urgency} \times 25\%) + (\text{SLA Risk} \times 20\%) + (\text{Population} \times 15\%) + (\text{Recurrence} \times 10\%)$$
6. **SLA Resolution Prediction**: Predicts resolution time in hours and flags statutory deadline breach risks.
7. **Semantic & Geospatial Duplicate Detection**: Combines TF-IDF / sentence embeddings with Haversine distance to flag clusters without destructive auto-merging.
8. **Intelligent Department & Officer Routing**: Matches complaints to the optimal municipal department and ranks field engineers by active caseload and SLA compliance history.
9. **Interactive Geospatial Hotspots**: Visualizes complaint density across Chennai wards with Leaflet & OpenStreetMap.
10. **Predictive Governance**: Dynamically detects category surges (e.g. *"Water complaints in Ward 12 increased 63% this week"*), recurring failure clusters, and zonal SLA risks.

---

## 🚀 Quick Start Guide

### Option 1: Running Locally (Fastest)

#### 1. Backend Setup
```bash
cd backend

# Create & activate virtual environment (Windows PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start backend (auto-creates SQLite db & seeds 35+ records)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend API will run at `http://localhost:8000`. OpenAPI Swagger docs at `http://localhost:8000/docs`.*

#### 2. Frontend Setup
```bash
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
*Frontend will open at `http://localhost:5173`.*

---

### Option 2: Running with Docker Compose

```bash
# Build and run Postgres, Backend, and Frontend containers
docker compose up --build
```
*Frontend runs on `http://localhost:3000`, Backend on `http://localhost:8000`.*

---

## 👥 Demo Persona Logins

| Persona | Email | Password | Role Description |
|---|---|---|---|
| **Admin Commissioner** | `admin@civicai.local` | `civicai123` | Citywide command center, SLA monitoring, duplicate approvals |
| **Field Officer** | `officer@civicai.local` | `civicai123` | Assigned task queue, work progress, on-site resolution |
| **Control Room Operator** | `operator@civicai.local` | `civicai123` | Live citizen call transcription and AI triage station |
| **Citizen** | `citizen@civicai.local` | `civicai123` | Public voice/text submission and step-by-step tracking |

*(You can also use the **Role Switcher** in the top navigation bar to switch personas instantly with one click.)*

---

## 🎬 End-to-End Judge Demonstration Scenario

Follow these steps for a complete evaluation of the platform:

1. **Navigate to Live Call Screen** (`Live Call Intelligence` in sidebar).
2. **Select the Tamil Audio Preset**:
   - Audio Sample: *"Tamil: Ward 12 Water Shortage"*
   - Citizen: Senthil Nathan (Ward 12, Tondiarpet)
   - Transcript: *"வார்டு 12-ல் மூன்று நாட்களாக பல தெருக்களில் குடிநீர் விநியோகம் இல்லை. முந்தைய புகார்கள் புறக்கணிக்கப்பட்டன."*
3. **Click "Run AI Intelligence Pipeline"**:
   - **Speech & Translation**: Detects Tamil, translates to *"No water supply for three days across multiple streets in Ward 12. Previous complaints were ignored."*
   - **NLP & Classification**: Classifies as **Water Supply / Water Shortage**, detects **Ward 12**, **~250 residents**, and **FRUSTRATED** sentiment.
   - **Duplicate Detection**: Identifies nearby matching complaints with high similarity score.
   - **Priority Engine**: Computes score **~91.2/100 (CRITICAL)** with transparent 5-factor breakdown.
   - **SLA Predictor**: Forecasts 28.5h resolution against 24h statutory target (**HIGH SLA Risk**).
   - **Intelligent Routing**: Recommends **Chennai Metro Water & Sewerage Board (CMWSSB)** and field officer **Er. S. Selvakumar**.
4. **Click "Register Complaint Ticket"**:
   - Creates formal ticket with immutable audit events.
5. **Inspect Complaint Detail View**:
   - View structured AI summary, entities, and event history timeline.
   - Click **"Assign Officer"** to confirm field dispatch.
   - Click **"Resolve Ticket"** to log the field work completion report.
6. **Open "Hotspot Map"**:
   - Explore Chennai ward cluster pins and view high-density outbreak alerts.
7. **Open "Predictive Governance" (Analytics)**:
   - View category surge warnings (*"Water Supply complaints +64.7% this week"*).

---

## 🧪 Automated Testing

To run the automated backend test suite (10/10 tests):
```bash
cd backend
.\venv\Scripts\pytest.exe -v
```

---

## 📁 Repository Structure

```
civicai/
├── ARCHITECTURE.md          # Detailed architectural adaptation of Rapid-Aid
├── README.md                # Project documentation & demo guide
├── API.md                   # REST API documentation
├── docker-compose.yml       # Docker compose multi-container definition
├── .env.example             # Environment variable template
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application entrypoint
│   │   ├── config.py        # Pydantic settings & environment configuration
│   │   ├── database.py      # SQLAlchemy DB engine (SQLite/PostgreSQL)
│   │   ├── models/          # Relational database models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── auth.py      # JWT authentication & password hashing
│   │   │   ├── analytics.py # Predictive governance & trend analytics
│   │   │   ├── seed.py      # Database seeder (35+ complaints, 10 depts, 10 officers)
│   │   │   └── ai/          # Dedicated 9-stage AI service layer
│   │   └── api/v1/          # Modular REST API endpoints
│   ├── tests/               # Pytest automated test suite
│   ├── requirements.txt     # Python backend dependencies
│   └── Dockerfile           # Backend container build
└── frontend/
    ├── src/
    │   ├── context/         # AuthContext & role state
    │   ├── services/        # Typed Axios API client
    │   ├── components/      # Reusable UI components & modals
    │   ├── pages/           # 8 core application views
    │   └── types/           # TypeScript interfaces
    ├── package.json         # React + Vite dependencies
    └── Dockerfile           # Frontend Nginx container build
```
