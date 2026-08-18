# CivicAI — Architecture & Rapid-Aid Adaptation

## 1. Existing Project Inspection & Analysis

During inspection of the workspace and existing files, we identified the **Rapid-Aid** repository (`Rapid-Aid-main`):
- **Core ML Notebook (`Rapid-Aid.ipynb`)**: Implemented emergency call triage using Whisper for ASR, spaCy for basic entity extraction, `RandomForestClassifier` for severity classification, `GradientBoostingRegressor` for response time prediction, and `LogisticRegression` for outcome risk.
- **Dataset (`emergency_ml_dataset_1000.csv`)**: 1,000 synthetic emergency records (e.g. `heart_attack`, `fire_house`, `road_accident`, response time, severity).
- **Map module**: Static Folium maps with emergency locations and ambulance positions.
- **Audio sample (`Audio.wav`)**: English speech emergency call.

## 2. Adaptation Strategy: Emergency → Civic Governance

CivicAI transforms emergency-response logic into a robust, multilingual, AI-driven civic intelligence system:

| Rapid-Aid Feature | CivicAI Adaptation |
|---|---|
| **Ambulance Allocation** | **Department & Officer Routing**: Assigns complaints to relevant civic departments (Water Supply, Electricity, Roads, Sanitation, Drainage, etc.) and best-fit available officers based on workload, location, and SLA compliance. |
| **Hospital Allocation** | **Civic Department Classification**: Automatically maps complaints to 10+ public administrative departments and subcategories. |
| **Emergency Response Time** | **SLA Resolution Prediction**: Predicts resolution time in hours and flags high-risk SLA breaches against statutory department deadlines. |
| **Emergency Severity** | **Explainable Civic Priority Engine**: Computes normalized score (0–100) using 5 weighted factors (30% Severity, 25% Urgency, 20% SLA Risk, 15% Affected Population, 10% Recurrence). |
| **Single-language Whisper** | **Multilingual AI Pipeline**: Transcribes English, Tamil, and Hindi audio, detects language, preserves original vernacular, and produces standardized English translations for downstream NLP. |
| **Basic spaCy LOC** | **Civic Entity & Location Extraction**: Extracts Ward numbers, localities (Chennai-centered), affected population count, duration, infrastructure types, and urgency terms. |
| **Static Folium Map** | **Interactive Leaflet Hotspot & Geospatial Intelligence**: Visualizes complaint density, category clustering, and predictive outbreak/hotspot warnings. |
| **New Feature: Duplicate Detection** | **Semantic & Geospatial Duplicate Engine**: Computes semantic embedding similarity + GPS proximity to identify cluster complaints and prevent duplicate work without destructive auto-merging. |

---

## 3. End-to-End System Workflow

```
[ Citizen Voice (EN/TA/HI) / Text ]
              │
              ▼
[ Speech-to-Text (Whisper / Fallback) ]
              │
              ▼
[ Language Detection & Translation ]
              │
              ▼
[ Multilingual NLP & Entity Extraction (spaCy / Patterns) ]
       │              │               │
       ▼              ▼               ▼
[ Classification ] [ Sentiment ] [ AI Summary ]
       │              │               │
       └──────────────┼───────────────┘
                      ▼
[ Duplicate Detection (Semantic Embeddings + Proximity) ]
                      │
                      ▼
[ Department Recommendation (Hybrid ML + Rule Engine) ]
                      │
                      ▼
[ Priority Score Calculation (Explainable 0–100 Formula) ]
                      │
                      ▼
[ SLA Resolution Time & Risk Prediction ]
                      │
                      ▼
[ Officer Recommendation (Workload + SLA + Location) ]
                      │
                      ▼
[ Relational Persistence (PostgreSQL / SQLite) ]
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
[ Admin Dashboard ] [ Officer Hub ] [ Citizen Portal ]
```

---

## 4. Technology Stack

- **Backend**: FastAPI, SQLAlchemy ORM, Alembic migrations, Pydantic v2 schemas, JWT Authentication (`PyJWT`, `passlib`/`bcrypt`).
- **AI / ML Layer**:
  - `openai-whisper` + soundfile for speech-to-text.
  - `spacy` / multilingual NLP for named entity extraction.
  - `scikit-learn` for Category Classification and SLA GradientBoosting regression.
  - `sentence-transformers` / vectorized cosine similarity for semantic duplicate detection.
  - Transparent rule engine for explainable 0–100 Priority and SLA Risk scoring.
  - Zero-hardware mock fallback mode (`AI_MODE=mock` / `AI_MODE=real`) ensuring 100% testability and reliability anywhere.
- **Database**: PostgreSQL with SQLite seamless local fallback support.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide-React, Recharts, Leaflet / React-Leaflet.
- **Deployment**: Docker Compose with multi-stage builds.
