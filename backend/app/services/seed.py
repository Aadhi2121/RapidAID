from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models.models import (
    User, UserRole, Citizen, Department, Officer, OfficerStatus,
    Complaint, ComplaintStatus, ComplaintSource, SeverityLevel,
    UrgencyLevel, SentimentType, PriorityLevel, SLARiskLevel,
    ComplaintDuplicate, ComplaintEvent, EventType, Notification,
    NotificationType, AIAnalysis
)
from app.services.auth import hash_password

DEPARTMENTS_SEED = [
    {"name": "Chennai Metro Water & Sewerage Board (CMWSSB)", "category": "Water Supply", "sla_hours": 24, "location": "Zonal Office 4, Tondiarpet"},
    {"name": "Tamil Nadu Generation & Distribution Corp (TANGEDCO)", "category": "Electricity", "sla_hours": 12, "location": "Zonal Substation, Anna Salai"},
    {"name": "GCC Bus Route Roads & Infrastructure", "category": "Roads & Infrastructure", "sla_hours": 72, "location": "Ripon Building, Park Town"},
    {"name": "GCC Solid Waste Management Department", "category": "Garbage / Sanitation", "sla_hours": 24, "location": "Central Sanitation Depot, Royapettah"},
    {"name": "CMWSSB Stormwater Drain & Sewerage Division", "category": "Drainage", "sla_hours": 24, "location": "Drainage Operations Wing, Kilpauk"},
    {"name": "Metropolitan Transport Corporation (MTC)", "category": "Public Transport", "sla_hours": 48, "location": "Pallavan House, Mount Road"},
    {"name": "GCC Public Health & Vector Control Department", "category": "Healthcare", "sla_hours": 36, "location": "Health Headquarters, Egmore"},
    {"name": "Chennai City Disaster & Public Safety Cell", "category": "Public Safety", "sla_hours": 12, "location": "Emergency Operations Center, Ripon Building"},
    {"name": "GCC Electrical & Street Lighting Department", "category": "Street Lighting", "sla_hours": 48, "location": "Street Light Maintenance Center, Alwarpet"},
    {"name": "GCC Revenue & Citizen Services Administration", "category": "Government Services", "sla_hours": 96, "location": "Zonal Citizen Center, Adyar"}
]

CITIZENS_SEED = [
    {"name": "Senthil Nathan", "phone": "+91 98401 23456", "preferred_language": "Tamil", "location": "Ward 12, Tondiarpet"},
    {"name": "Priya Ramanathan", "phone": "+91 98402 34567", "preferred_language": "English", "location": "Anna Nagar West, Ward 104"},
    {"name": "Rajesh Kumar", "phone": "+91 98403 45678", "preferred_language": "Hindi", "location": "Ward 8, Kolathur"},
    {"name": "Karthik Subramanian", "phone": "+91 98404 56789", "preferred_language": "English", "location": "T. Nagar, Ward 117"},
    {"name": "Ananya Sundaram", "phone": "+91 98405 67890", "preferred_language": "Tamil", "location": "Adyar, Ward 175"},
    {"name": "Deepak Sharma", "phone": "+91 98406 78901", "preferred_language": "Hindi", "location": "Velachery, Ward 178"},
    {"name": "Murugan Velan", "phone": "+91 98407 89012", "preferred_language": "Tamil", "location": "Mylapore, Ward 124"},
    {"name": "Swathi Iyer", "phone": "+91 98408 90123", "preferred_language": "English", "location": "Guindy, Ward 170"},
    {"name": "Venkatesh Babu", "phone": "+91 98409 01234", "preferred_language": "Tamil", "location": "Tambaram, Ward 190"},
    {"name": "Meera Krishnan", "phone": "+91 98410 12345", "preferred_language": "English", "location": "Porur, Ward 150"}
]

OFFICERS_SEED = [
    {"name": "Er. K. Natarajan", "email": "officer.water@civicai.local", "dept_idx": 0, "status": "AVAILABLE", "cases": 3, "sla": 97.4, "loc": "Ward 12, Tondiarpet"},
    {"name": "Er. S. Selvakumar", "email": "officer@civicai.local", "dept_idx": 0, "status": "AVAILABLE", "cases": 4, "sla": 98.1, "loc": "Ward 12, Tondiarpet"},
    {"name": "Er. M. Balaji", "email": "officer.eb@civicai.local", "dept_idx": 1, "status": "ON_FIELD", "cases": 6, "sla": 93.8, "loc": "Ward 8, Kolathur"},
    {"name": "Er. R. Arunkumar", "email": "officer.roads@civicai.local", "dept_idx": 2, "status": "AVAILABLE", "cases": 2, "sla": 95.0, "loc": "Ward 104, Anna Nagar"},
    {"name": "Insp. V. Ganesan", "email": "officer.sanitation@civicai.local", "dept_idx": 3, "status": "AVAILABLE", "cases": 5, "sla": 92.5, "loc": "Ward 117, T. Nagar"},
    {"name": "Er. T. Sivaraman", "email": "officer.drainage@civicai.local", "dept_idx": 4, "status": "BUSY", "cases": 8, "sla": 89.2, "loc": "Ward 104, Anna Nagar"},
    {"name": "Off. D. Jayaraman", "email": "officer.mtc@civicai.local", "dept_idx": 5, "status": "AVAILABLE", "cases": 1, "sla": 99.0, "loc": "Mount Road Depot"},
    {"name": "Dr. P. Sharmila", "email": "officer.health@civicai.local", "dept_idx": 6, "status": "AVAILABLE", "cases": 3, "sla": 96.0, "loc": "Ward 175, Adyar"},
    {"name": "Insp. A. Victor", "email": "officer.safety@civicai.local", "dept_idx": 7, "status": "AVAILABLE", "cases": 2, "sla": 98.5, "loc": "Ward 170, Guindy"},
    {"name": "Er. B. Hariprasad", "email": "officer.light@civicai.local", "dept_idx": 8, "status": "AVAILABLE", "cases": 4, "sla": 94.0, "loc": "Ward 124, Mylapore"}
]

USERS_SEED = [
    {"name": "Admin Commissioner", "email": "admin@civicai.local", "role": UserRole.ADMIN.value, "dept_id": None},
    {"name": "Senior Call Operator", "email": "operator@civicai.local", "role": UserRole.CALL_OPERATOR.value, "dept_id": None},
    {"name": "Senthil Nathan (Citizen)", "email": "citizen@civicai.local", "role": UserRole.CITIZEN.value, "dept_id": None},
]

COMPLAINTS_SEED = [
    {
        "id": "CIVIC-2026-0001",
        "cit_idx": 0,
        "source": "VOICE_CALL",
        "lang": "Tamil",
        "transcript": "வார்டு 12-ல் மூன்று நாட்களாக பல தெருக்களில் குடிநீர் விநியோகம் இல்லை. முந்தைய புகார்கள் புறக்கணிக்கப்பட்டன.",
        "translation": "No water supply for three days across multiple streets in Ward 12. Previous complaints were ignored.",
        "summary": "No water supply for 3 days in Ward 12 affecting ~250 residents across multiple streets. Citizen reports previous complaints were ignored.",
        "category": "Water Supply",
        "subcategory": "Water Shortage",
        "severity": "HIGH",
        "urgency": "HIGH",
        "sentiment": "FRUSTRATED",
        "sentiment_score": -0.65,
        "pop": 250,
        "lat": 13.1120,
        "lng": 80.2150,
        "loc": "Ward 12, Tondiarpet, Chennai",
        "pri_score": 91.2,
        "pri_level": "CRITICAL",
        "dept_idx": 0,
        "off_idx": 1,
        "sla_h": 24,
        "pred_h": 28.5,
        "risk": "HIGH",
        "status": "DEPARTMENT_ASSIGNED",
        "created_delta_h": 4
    },
    {
        "id": "CIVIC-2026-0002",
        "cit_idx": 0,
        "source": "VOICE_CALL",
        "lang": "Tamil",
        "transcript": "தண்ணீர் வரவில்லை சார், 3 நாளா தவிக்கிறோம். வார்டு 12 அன்னை சத்யா நகர் பகுதியில் குழாயில் ஒரு சொட்டு தண்ணீர் கூட வரல.",
        "translation": "No water supply for 3 days in Ward 12 Annai Sathya Nagar area. Not a single drop from taps.",
        "summary": "No drinking water for 3 days in Ward 12 Annai Sathya Nagar affecting ~180 residents.",
        "category": "Water Supply",
        "subcategory": "Water Shortage",
        "severity": "HIGH",
        "urgency": "HIGH",
        "sentiment": "FRUSTRATED",
        "sentiment_score": -0.60,
        "pop": 180,
        "lat": 13.1125,
        "lng": 80.2158,
        "loc": "Ward 12, Tondiarpet, Chennai",
        "pri_score": 88.5,
        "pri_level": "CRITICAL",
        "dept_idx": 0,
        "off_idx": 0,
        "sla_h": 24,
        "pred_h": 26.0,
        "risk": "HIGH",
        "status": "AI_ANALYZED",
        "created_delta_h": 2
    },
    {
        "id": "CIVIC-2026-0003",
        "cit_idx": 2,
        "source": "VOICE_CALL",
        "lang": "Hindi",
        "transcript": "वार्ड 8 में पिछले दो दिनों से बिजली नहीं है। ट्रांसफार्मर में स्पार्क हो रहा है और बच्चों की पढ़ाई रुक गई है।",
        "translation": "No electricity in Ward 8 for the past two days. Transformer is sparking and children's studies are disrupted.",
        "summary": "Transformer sparking hazard and severe power outage for 2 days in Ward 8 affecting ~150 residents.",
        "category": "Electricity",
        "subcategory": "Sparking Transformer",
        "severity": "CRITICAL",
        "urgency": "EMERGENCY",
        "sentiment": "DISTRESSED",
        "sentiment_score": -0.78,
        "pop": 150,
        "lat": 13.1250,
        "lng": 80.2200,
        "loc": "Ward 8, Kolathur, Chennai",
        "pri_score": 94.0,
        "pri_level": "CRITICAL",
        "dept_idx": 1,
        "off_idx": 2,
        "sla_h": 12,
        "pred_h": 14.5,
        "risk": "HIGH",
        "status": "OFFICER_ASSIGNED",
        "created_delta_h": 6
    },
    {
        "id": "CIVIC-2026-0004",
        "cit_idx": 1,
        "source": "WEB_PORTAL",
        "lang": "English",
        "transcript": "Severe sewage overflow and blocked drainage near Anna Nagar 2nd Avenue for 4 days affecting over 500 residents.",
        "translation": "Severe sewage overflow and blocked drainage near Anna Nagar 2nd Avenue for 4 days affecting over 500 residents.",
        "summary": "Severe sewage overflow for 4 days in Anna Nagar (Ward 104) affecting ~500 residents.",
        "category": "Drainage",
        "subcategory": "Sewage Overflow",
        "severity": "HIGH",
        "urgency": "HIGH",
        "sentiment": "FRUSTRATED",
        "sentiment_score": -0.65,
        "pop": 500,
        "lat": 13.0850,
        "lng": 80.2100,
        "loc": "Anna Nagar 2nd Ave, Chennai",
        "pri_score": 89.0,
        "pri_level": "CRITICAL",
        "dept_idx": 4,
        "off_idx": 5,
        "sla_h": 24,
        "pred_h": 25.0,
        "risk": "HIGH",
        "status": "IN_PROGRESS",
        "created_delta_h": 12
    },
    {
        "id": "CIVIC-2026-0005",
        "cit_idx": 3,
        "source": "MOBILE_APP",
        "lang": "English",
        "transcript": "Huge garbage accumulation spilling onto South Usman Road market area emitting unbearable stench and attracting stray dogs.",
        "translation": "Huge garbage accumulation spilling onto South Usman Road market area emitting unbearable stench and attracting stray dogs.",
        "summary": "Garbage dump overflow in T. Nagar (Ward 117) affecting market shoppers and 300+ residents.",
        "category": "Garbage / Sanitation",
        "subcategory": "Garbage Dump Overflow",
        "severity": "MEDIUM",
        "urgency": "MEDIUM",
        "sentiment": "FRUSTRATED",
        "sentiment_score": -0.50,
        "pop": 350,
        "lat": 13.0418,
        "lng": 80.2341,
        "loc": "South Usman Road, T. Nagar, Chennai",
        "pri_score": 68.0,
        "pri_level": "HIGH",
        "dept_idx": 3,
        "off_idx": 4,
        "sla_h": 24,
        "pred_h": 16.0,
        "risk": "LOW",
        "status": "RESOLVED",
        "created_delta_h": 36,
        "resolved_delta_h": 18
    },
    {
        "id": "CIVIC-2026-0006",
        "cit_idx": 4,
        "source": "VOICE_CALL",
        "lang": "Tamil",
        "transcript": "அடையாறு எல்.பி. ரோடு பக்கத்தில் மெயின் ரோட்டில் பெரிய பள்ளம் ஏற்பட்டுள்ளது. நேற்று ஒரு பைக் விபத்து நடந்தது.",
        "translation": "Big pothole on LB Road Adyar main carriageway. Yesterday a two-wheeler accident occurred.",
        "summary": "Dangerous road pothole in Adyar (Ward 175) causing vehicular accident hazard.",
        "category": "Roads & Infrastructure",
        "subcategory": "Pothole",
        "severity": "HIGH",
        "urgency": "HIGH",
        "sentiment": "DISTRESSED",
        "sentiment_score": -0.70,
        "pop": 800,
        "lat": 13.0012,
        "lng": 80.2565,
        "loc": "LB Road, Adyar, Chennai",
        "pri_score": 82.5,
        "pri_level": "CRITICAL",
        "dept_idx": 2,
        "off_idx": 3,
        "sla_h": 72,
        "pred_h": 32.0,
        "risk": "LOW",
        "status": "IN_PROGRESS",
        "created_delta_h": 18
    },
    {
        "id": "CIVIC-2026-0007",
        "cit_idx": 5,
        "source": "WEB_PORTAL",
        "lang": "English",
        "transcript": "Street lights not functioning for entire stretch of 100 Feet Bypass Road Velachery creating pitch dark stretch prone to snatching.",
        "translation": "Street lights not functioning for entire stretch of 100 Feet Bypass Road Velachery creating pitch dark stretch prone to snatching.",
        "summary": "Street light failure across 100ft Bypass Road Velachery affecting daily commuters.",
        "category": "Street Lighting",
        "subcategory": "Street Light Not Working",
        "severity": "MEDIUM",
        "urgency": "HIGH",
        "sentiment": "FRUSTRATED",
        "sentiment_score": -0.45,
        "pop": 600,
        "lat": 12.9815,
        "lng": 80.2180,
        "loc": "100 Feet Bypass Road, Velachery, Chennai",
        "pri_score": 64.0,
        "pri_level": "HIGH",
        "dept_idx": 8,
        "off_idx": 9,
        "sla_h": 48,
        "pred_h": 22.0,
        "risk": "LOW",
        "status": "OFFICER_ASSIGNED",
        "created_delta_h": 14
    },
    {
        "id": "CIVIC-2026-0008",
        "cit_idx": 6,
        "source": "VOICE_CALL",
        "lang": "Tamil",
        "transcript": "மைலாப்பூர் கபாலீஸ்வரர் கோவில் அருகில் தெருநாய்கள் தொல்லை அதிகமாக உள்ளது. கடந்த வாரம் இரண்டு குழந்தைகளுக்கு கடி.",
        "translation": "Stray dog menace near Mylapore Kapaleeshwarar Temple. Two children bitten last week.",
        "summary": "Stray dog bite menace and safety hazard in Mylapore (Ward 124).",
        "category": "Healthcare",
        "subcategory": "Stray Dog Menace",
        "severity": "HIGH",
        "urgency": "HIGH",
        "sentiment": "DISTRESSED",
        "sentiment_score": -0.80,
        "pop": 200,
        "lat": 13.0368,
        "lng": 80.2676,
        "loc": "North Mada Street, Mylapore, Chennai",
        "pri_score": 86.0,
        "pri_level": "CRITICAL",
        "dept_idx": 6,
        "off_idx": 7,
        "sla_h": 36,
        "pred_h": 24.0,
        "risk": "LOW",
        "status": "IN_PROGRESS",
        "created_delta_h": 10
    },
    {
        "id": "CIVIC-2026-0009",
        "cit_idx": 7,
        "source": "WEB_PORTAL",
        "lang": "English",
        "transcript": "Heavy tree branch broken and hanging precariously over high tension electrical line on Guindy Industrial Estate road.",
        "translation": "Heavy tree branch broken and hanging precariously over high tension electrical line on Guindy Industrial Estate road.",
        "summary": "Broken tree branch over high tension power line in Guindy causing life hazard.",
        "category": "Public Safety",
        "subcategory": "Broken Tree Branch Over Road",
        "severity": "CRITICAL",
        "urgency": "EMERGENCY",
        "sentiment": "DISTRESSED",
        "sentiment_score": -0.85,
        "pop": 400,
        "lat": 13.0067,
        "lng": 80.2024,
        "loc": "Guindy Industrial Estate, Chennai",
        "pri_score": 96.0,
        "pri_level": "CRITICAL",
        "dept_idx": 7,
        "off_idx": 8,
        "sla_h": 12,
        "pred_h": 8.0,
        "risk": "LOW",
        "status": "RESOLVED",
        "created_delta_h": 28,
        "resolved_delta_h": 6
    },
    {
        "id": "CIVIC-2026-0010",
        "cit_idx": 8,
        "source": "MOBILE_APP",
        "lang": "English",
        "transcript": "Bus route 70V frequency is severely inadequate during morning peak hours at Tambaram Sanatorium with 45 min wait times.",
        "translation": "Bus route 70V frequency is severely inadequate during morning peak hours at Tambaram Sanatorium with 45 min wait times.",
        "summary": "Inadequate bus frequency on Route 70V at Tambaram Sanatorium.",
        "category": "Public Transport",
        "subcategory": "Bus Frequency Shortage",
        "severity": "LOW",
        "urgency": "MEDIUM",
        "sentiment": "FRUSTRATED",
        "sentiment_score": -0.40,
        "pop": 800,
        "lat": 12.9249,
        "lng": 80.1000,
        "loc": "Tambaram Sanatorium, Chennai",
        "pri_score": 48.0,
        "pri_level": "MEDIUM",
        "dept_idx": 5,
        "off_idx": 6,
        "sla_h": 48,
        "pred_h": 36.0,
        "risk": "LOW",
        "status": "RECEIVED",
        "created_delta_h": 8
    }
]

# Additional historical complaints across Chennai to populate realistic 35+ records
MORE_COMPLAINTS = [
    ("CIVIC-2026-0011", 0, "Water Supply", "Contaminated Water", "Muddy and foul smelling tap water in Tondiarpet Ward 12.", 13.1110, 80.2140, "HIGH", 78.0, "HIGH", "IN_PROGRESS", 0),
    ("CIVIC-2026-0012", 1, "Electricity", "Low Voltage", "Continuous low voltage tripping refrigerators in Anna Nagar.", 13.0860, 80.2110, "MEDIUM", 55.0, "MEDIUM", "RESOLVED", 1),
    ("CIVIC-2026-0013", 2, "Drainage", "Manhole Missing / Open", "Open storm manhole on Kolathur Main Road posing fatal risk to pedestrians.", 13.1260, 80.2210, "CRITICAL", 92.0, "CRITICAL", "RESOLVED", 4),
    ("CIVIC-2026-0014", 3, "Garbage / Sanitation", "Uncollected Waste", "Plastic waste uncollected for one week in T. Nagar Ranganathan Street.", 13.0425, 80.2335, "MEDIUM", 52.0, "MEDIUM", "RESOLVED", 3),
    ("CIVIC-2026-0015", 4, "Roads & Infrastructure", "Road Cave-in", "Road cave-in near Adyar bridge corner after metro water excavation.", 13.0020, 80.2570, "HIGH", 84.0, "CRITICAL", "ESCALATED", 2),
    ("CIVIC-2026-0016", 5, "Healthcare", "Dengue / Mosquito Fogging Request", "High mosquito density and 3 reported dengue cases in Velachery.", 12.9825, 80.2190, "HIGH", 81.0, "CRITICAL", "IN_PROGRESS", 6),
    ("CIVIC-2026-0017", 6, "Street Lighting", "Flashing / Defective Light", "High mast light blinking continuously in Mylapore junction.", 13.0375, 80.2685, "LOW", 38.0, "LOW", "RESOLVED", 8),
    ("CIVIC-2026-0018", 7, "Public Safety", "Illegal Encroachment", "Illegal vendor structures blocking fire hydrant access in Guindy.", 13.0075, 80.2035, "MEDIUM", 58.0, "MEDIUM", "DEPARTMENT_ASSIGNED", 7),
    ("CIVIC-2026-0019", 8, "Government Services", "Property Tax Assessment Error", "Erroneous commercial property tax calculation on residential house.", 12.9260, 80.1010, "LOW", 32.0, "LOW", "RESOLVED", 9),
    ("CIVIC-2026-0020", 9, "Water Supply", "Pipeline Burst", "Massive pipeline burst flooding Porur junction with clean drinking water.", 13.0382, 80.1565, "HIGH", 87.0, "CRITICAL", "IN_PROGRESS", 0),
    ("CIVIC-2026-0021", 0, "Water Supply", "Water Shortage", "Ward 12 4th street no water since Monday morning.", 13.1130, 80.2160, "HIGH", 85.0, "CRITICAL", "RECEIVED", 0),
    ("CIVIC-2026-0022", 1, "Electricity", "Power Outage", "Sudden power shutdown without notice in Anna Nagar sector 5.", 13.0840, 80.2090, "MEDIUM", 62.0, "HIGH", "RESOLVED", 1),
    ("CIVIC-2026-0023", 2, "Drainage", "Sewage Overflow", "Sewage backflow into residential ground floor in Kolathur.", 13.1240, 80.2195, "HIGH", 83.0, "CRITICAL", "IN_PROGRESS", 4),
    ("CIVIC-2026-0024", 3, "Roads & Infrastructure", "Broken Footpath", "Granite slabs broken on pedestrian footpath near Panagal Park.", 13.0410, 80.2320, "LOW", 42.0, "MEDIUM", "RESOLVED", 2),
    ("CIVIC-2026-0025", 4, "Street Lighting", "Street Light Not Working", "Complete dark stretch in Shastri Nagar Adyar.", 13.0005, 80.2550, "MEDIUM", 59.0, "MEDIUM", "RESOLVED", 8),
    ("CIVIC-2026-0026", 5, "Healthcare", "Stray Dog Menace", "Pack of aggressive stray dogs chasing two-wheelers in Baby Nagar Velachery.", 12.9805, 80.2170, "HIGH", 79.0, "HIGH", "OFFICER_ASSIGNED", 6),
    ("CIVIC-2026-0027", 6, "Garbage / Sanitation", "Commercial Waste Dumping", "Hotel dumping biological waste on roadside near Luz Church Road.", 13.0355, 80.2660, "MEDIUM", 65.0, "HIGH", "IN_PROGRESS", 3),
    ("CIVIC-2026-0028", 7, "Public Transport", "Bus Stop Shelter Damage", "Smashed glass roof on Guindy Kathipara bus shelter exposing waiting commuters.", 13.0055, 80.2010, "LOW", 39.0, "LOW", "RESOLVED", 5),
    ("CIVIC-2026-0029", 8, "Water Supply", "Low Pressure", "Water supply pressure too weak to reach sumps in Tambaram East.", 12.9235, 80.0985, "MEDIUM", 54.0, "MEDIUM", "RESOLVED", 0),
    ("CIVIC-2026-0030", 9, "Electricity", "Fallen Electric Wire", "Overhead low tension wire snapped and lying on Porur Link Road.", 13.0390, 80.1575, "CRITICAL", 98.0, "CRITICAL", "RESOLVED", 1),
    ("CIVIC-2026-0031", 0, "Water Supply", "Tanker Request", "Emergency drinking water tanker request for community hall Ward 12.", 13.1115, 80.2145, "MEDIUM", 60.0, "HIGH", "RESOLVED", 0),
    ("CIVIC-2026-0032", 1, "Drainage", "Blocked Storm Drain", "Storm drain choked with construction debris in Anna Nagar.", 13.0870, 80.2120, "MEDIUM", 58.0, "MEDIUM", "DEPARTMENT_ASSIGNED", 4),
    ("CIVIC-2026-0033", 2, "Public Safety", "Open Borewell Hazard", "Abandoned open borewell without cap spotted in vacant plot Kolathur.", 13.1270, 80.2220, "CRITICAL", 99.0, "CRITICAL", "RESOLVED", 7),
    ("CIVIC-2026-0034", 3, "Roads & Infrastructure", "Pothole", "Multiple sharp edge potholes on G.N. Chetty Road T. Nagar.", 13.0430, 80.2350, "MEDIUM", 63.0, "HIGH", "IN_PROGRESS", 2),
    ("CIVIC-2026-0035", 4, "Government Services", "Certificate Delay", "Birth certificate delivery pending for 45 days beyond citizen charter time.", 13.0030, 80.2580, "LOW", 29.0, "LOW", "RESOLVED", 9),
]

def seed_database(db: Session = None):
    """
    Initializes tables and seeds sample civic data.
    """
    Base.metadata.create_all(bind=engine)
    
    close_after = False
    if db is None:
        db = SessionLocal()
        close_after = True

    try:
        # Check if already seeded
        if db.query(Department).count() > 0:
            print("Database already seeded. Skipping initial seeding.")
            return

        print("Seeding database...")
        now = datetime.utcnow()

        # 1. Seed Departments
        dept_objs = []
        for d in DEPARTMENTS_SEED:
            dept = Department(
                name=d["name"],
                description=f"Authorized municipal authority handling {d['category']} civic services.",
                category=d["category"],
                sla_hours=d["sla_hours"],
                location=d["location"],
                created_at=now - timedelta(days=60)
            )
            db.add(dept)
            dept_objs.append(dept)
        db.commit()

        # 2. Seed Base Users
        for u in USERS_SEED:
            user = User(
                name=u["name"],
                email=u["email"],
                password_hash=hash_password("civicai123"),
                role=u["role"],
                department_id=u["dept_id"],
                created_at=now - timedelta(days=60)
            )
            db.add(user)
        db.commit()

        # 3. Seed Officers & their User accounts
        officer_objs = []
        for o in OFFICERS_SEED:
            user = User(
                name=o["name"],
                email=o["email"],
                password_hash=hash_password("civicai123"),
                role=UserRole.OFFICER.value,
                department_id=dept_objs[o["dept_idx"]].id,
                created_at=now - timedelta(days=60)
            )
            db.add(user)
            db.flush()

            officer = Officer(
                user_id=user.id,
                department_id=dept_objs[o["dept_idx"]].id,
                status=o["status"],
                active_cases=o["cases"],
                sla_compliance=o["sla"],
                location=o["loc"]
            )
            db.add(officer)
            officer_objs.append(officer)
        db.commit()

        # 4. Seed Citizens
        citizen_objs = []
        for c in CITIZENS_SEED:
            cit = Citizen(
                name=c["name"],
                phone=c["phone"],
                preferred_language=c["preferred_language"],
                location=c["location"],
                created_at=now - timedelta(days=45)
            )
            db.add(cit)
            citizen_objs.append(cit)
        db.commit()

        # 5. Seed Core Complaints
        complaint_objs = []
        for item in COMPLAINTS_SEED:
            created_at = now - timedelta(hours=item["created_delta_h"])
            resolved_at = now - timedelta(hours=item["created_delta_h"] - item.get("resolved_delta_h", 0)) if "resolved_delta_h" in item else None
            sla_deadline = created_at + timedelta(hours=item["sla_h"])

            dept_id = dept_objs[item["dept_idx"]].id
            off_id = officer_objs[item["off_idx"]].id if item.get("off_idx") is not None else None

            comp = Complaint(
                id=item["id"],
                citizen_id=citizen_objs[item["cit_idx"]].id,
                source=item["source"],
                language=item["lang"],
                transcript=item["transcript"],
                translation=item["translation"],
                summary=item["summary"],
                category=item["category"],
                subcategory=item["subcategory"],
                severity=item["severity"],
                urgency=item["urgency"],
                sentiment=item["sentiment"],
                sentiment_score=item["sentiment_score"],
                affected_population=item["pop"],
                latitude=item["lat"],
                longitude=item["lng"],
                location_name=item["loc"],
                priority_score=item["pri_score"],
                priority_level=item["pri_level"],
                department_id=dept_id,
                assigned_officer_id=off_id,
                sla_hours=item["sla_h"],
                sla_deadline=sla_deadline,
                predicted_resolution_hours=item["pred_h"],
                sla_risk=item["risk"],
                status=item["status"],
                created_at=created_at,
                updated_at=now,
                resolved_at=resolved_at
            )
            db.add(comp)
            complaint_objs.append(comp)
            db.flush()

            # Add AI Analysis record
            ai_rec = AIAnalysis(
                complaint_id=comp.id,
                model_name="CivicAI Multi-Engine Ensemble",
                model_version="1.0",
                classification_confidence=0.94,
                department_confidence=0.92,
                priority_reasoning=f"Calculated {item['pri_score']}/100 based on severity ({item['severity']}), urgency, and affected population ({item['pop']}).",
                department_reasoning=f"Matched statutory jurisdiction for {item['category']} in {item['loc']}.",
                duplicate_reasoning="Analyzed against spatial and semantic embedding catalog.",
                created_at=created_at
            )
            db.add(ai_rec)

            # Add Event History
            ev1 = ComplaintEvent(
                complaint_id=comp.id,
                event_type=EventType.STATUS_CHANGE.value,
                description=f"Complaint received via {item['source']}.",
                created_by="Call Ingestion Gateway",
                created_at=created_at
            )
            db.add(ev1)

            ev2 = ComplaintEvent(
                complaint_id=comp.id,
                event_type=EventType.AI_ANALYSIS.value,
                description=f"AI analyzed: Category '{item['category']}', Priority {item['pri_score']} ({item['pri_level']}), SLA Risk {item['risk']}.",
                created_by="CivicAI Orchestrator",
                created_at=created_at + timedelta(seconds=15)
            )
            db.add(ev2)

            if off_id:
                ev3 = ComplaintEvent(
                    complaint_id=comp.id,
                    event_type=EventType.ASSIGNMENT.value,
                    description=f"Assigned to {officer_objs[item['off_idx']].user.name} ({dept_objs[item['dept_idx']].name}).",
                    created_by="Admin / Auto-Router",
                    created_at=created_at + timedelta(minutes=5)
                )
                db.add(ev3)

            if comp.status == "RESOLVED":
                ev4 = ComplaintEvent(
                    complaint_id=comp.id,
                    event_type=EventType.RESOLUTION.value,
                    description="Field repair completed. Work verified by municipal inspector.",
                    created_by="Field Officer",
                    created_at=resolved_at
                )
                db.add(ev4)

        # 6. Seed Additional Historical Complaints
        for idx, item in enumerate(MORE_COMPLAINTS):
            c_id, cit_i, cat, subcat, text, lat, lng, sev, pri, pri_l, st, d_idx = item
            delta_h = 24 + (idx * 5)
            created_at = now - timedelta(hours=delta_h)
            sla_h = dept_objs[d_idx].sla_hours
            resolved_at = created_at + timedelta(hours=sla_h * 0.8) if st == "RESOLVED" else None

            comp = Complaint(
                id=c_id,
                citizen_id=citizen_objs[cit_i].id,
                source="VOICE_CALL" if idx % 2 == 0 else "WEB_PORTAL",
                language="English" if idx % 3 == 0 else "Tamil",
                transcript=text,
                translation=text,
                summary=text,
                category=cat,
                subcategory=subcat,
                severity=sev,
                urgency="HIGH" if sev in ["CRITICAL", "HIGH"] else "MEDIUM",
                sentiment="FRUSTRATED" if sev in ["CRITICAL", "HIGH"] else "NEUTRAL",
                sentiment_score=-0.6 if sev in ["CRITICAL", "HIGH"] else 0.0,
                affected_population=100 + (idx * 20),
                latitude=lat,
                longitude=lng,
                location_name=f"Ward {(idx%15)+1}, Chennai",
                priority_score=pri,
                priority_level=pri_l,
                department_id=dept_objs[d_idx].id,
                assigned_officer_id=officer_objs[d_idx].id,
                sla_hours=sla_h,
                sla_deadline=created_at + timedelta(hours=sla_h),
                predicted_resolution_hours=sla_h * 0.9,
                sla_risk="HIGH" if pri >= 85 else "LOW",
                status=st,
                created_at=created_at,
                updated_at=now,
                resolved_at=resolved_at
            )
            db.add(comp)
            db.flush()

            # Add event
            ev = ComplaintEvent(
                complaint_id=comp.id,
                event_type=EventType.STATUS_CHANGE.value,
                description=f"Complaint registered with status {st}.",
                created_by="System",
                created_at=created_at
            )
            db.add(ev)

        # 7. Seed Duplicate Relationships (e.g. CIVIC-2026-0002 is duplicate of CIVIC-2026-0001)
        dup1 = ComplaintDuplicate(
            complaint_id="CIVIC-2026-0002",
            related_complaint_id="CIVIC-2026-0001",
            similarity_score=0.92,
            created_at=now - timedelta(hours=2)
        )
        db.add(dup1)

        # 8. Seed Notifications
        notif1 = Notification(
            user_id=1,  # Admin
            complaint_id="CIVIC-2026-0001",
            type=NotificationType.CRITICAL_ALERT.value,
            title="Critical Water Shortage in Ward 12",
            message="Priority 91.2/100 detected. Multi-street outage reported with repeat complaint history.",
            read=False,
            created_at=now - timedelta(hours=4)
        )
        notif2 = Notification(
            user_id=2,  # Officer Selvakumar
            complaint_id="CIVIC-2026-0001",
            type=NotificationType.SLA_WARNING.value,
            title="High SLA Breach Risk",
            message="Estimated resolution time of 28.5h exceeds 24h statutory deadline.",
            read=False,
            created_at=now - timedelta(hours=3)
        )
        notif3 = Notification(
            user_id=1,
            complaint_id="CIVIC-2026-0002",
            type=NotificationType.DUPLICATE_DETECTED.value,
            title="Duplicate Complaint Flagged",
            message="Complaint CIVIC-2026-0002 matches CIVIC-2026-0001 with 92% semantic and geographic similarity.",
            read=False,
            created_at=now - timedelta(hours=2)
        )
        db.add(notif1)
        db.add(notif2)
        db.add(notif3)

        db.commit()
        print("Database seeding completed successfully with 35+ complaints, 10 departments, 10 officers, and notifications.")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        if close_after:
            db.close()

if __name__ == "__main__":
    seed_database()
