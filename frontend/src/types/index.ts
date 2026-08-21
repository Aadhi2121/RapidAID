export type UserRole = 'ADMIN' | 'OFFICER' | 'CALL_OPERATOR' | 'CITIZEN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department_id?: number | null;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  category: string;
  sla_hours: number;
  location: string;
}

export interface Officer {
  id: number;
  user_id: number;
  name?: string;
  email?: string;
  department_id: number;
  department_name?: string;
  status: 'AVAILABLE' | 'ON_FIELD' | 'BUSY' | 'OFFLINE';
  active_cases: number;
  sla_compliance: number;
  location: string;
}

export type ComplaintStatus =
  | 'RECEIVED'
  | 'AI_ANALYZED'
  | 'CLASSIFIED'
  | 'DEPARTMENT_ASSIGNED'
  | 'OFFICER_ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CITIZEN_CONFIRMED'
  | 'CLOSED'
  | 'ESCALATED';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SLARiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type SentimentType = 'POSITIVE' | 'NEUTRAL' | 'FRUSTRATED' | 'ANGRY' | 'DISTRESSED';

export interface ComplaintEvent {
  id: number;
  complaint_id: string;
  event_type: string;
  description: string;
  created_by: string;
  created_at: string;
}

export interface ComplaintDuplicate {
  id: number;
  complaint_id: string;
  related_complaint_id: string;
  similarity_score: number;
  created_at: string;
}

export interface AIAnalysisRecord {
  id: number;
  model_name: string;
  model_version: string;
  classification_confidence: number;
  department_confidence: number;
  priority_reasoning?: string;
  department_reasoning?: string;
  duplicate_reasoning?: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  citizen_id?: number;
  citizen_name?: string;
  citizen_phone?: string;
  source: string;
  language: string;
  transcript: string;
  translation?: string;
  summary?: string;
  category?: string;
  subcategory?: string;
  severity: string;
  urgency: string;
  sentiment: SentimentType;
  sentiment_score: number;
  affected_population: number;
  latitude: number;
  longitude: number;
  location_name: string;
  priority_score: number;
  priority_level: PriorityLevel;
  department_id?: number;
  department_name?: string;
  assigned_officer_id?: number;
  assigned_officer_name?: string;
  sla_hours: number;
  sla_deadline?: string;
  predicted_resolution_hours: number;
  sla_risk: SLARiskLevel;
  status: ComplaintStatus;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  events?: ComplaintEvent[];
  duplicates?: ComplaintDuplicate[];
  ai_analyses?: AIAnalysisRecord[];
}

export interface DuplicateMatch {
  complaint_id: string;
  summary?: string;
  category?: string;
  similarity_score: number;
  distance_km?: number;
  reason: string;
}

export interface AIAnalysisResult {
  original_transcript: string;
  language: string;
  language_confidence: number;
  translated_transcript: string;
  summary: string;
  category: string;
  subcategory: string;
  classification_confidence: number;
  severity: string;
  urgency: string;
  sentiment: SentimentType;
  sentiment_score: number;
  affected_population: number;
  entities: {
    location_name: string;
    ward: string;
    latitude: number;
    longitude: number;
    duration: string;
    affected_population: number;
    infrastructure_type: string;
    urgency_indicators: string[];
    has_recurrence_claim: boolean;
  };
  duplicates: DuplicateMatch[];
  recommended_department: {
    department_id: number;
    department_name: string;
    confidence: number;
    reasoning: string;
  };
  priority: {
    priority_score: number;
    priority_level: PriorityLevel;
    breakdown: {
      severity_component: number;
      urgency_component: number;
      sla_risk_component: number;
      population_component: number;
      recurrence_component: number;
      sentiment_adjustment: number;
    };
    reasoning: string;
  };
  sla: {
    predicted_resolution_hours: number;
    department_sla_hours: number;
    sla_risk: SLARiskLevel;
    reasoning: string;
  };
  recommended_officer: {
    officer_id: number;
    officer_name: string;
    confidence: number;
    reasoning: string;
  };
}

export interface TranscribeResponse {
  transcript: string;
  language: string;
  confidence: number;
  detected_language_name: string;
  engine_used: string;
  file_name?: string;
  duration_seconds?: number;
}


export interface NotificationItem {
  id: number;
  user_id?: number;
  complaint_id?: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface AnalyticsOverview {
  total_complaints: number;
  active_complaints: number;
  critical_complaints: number;
  resolved_complaints: number;
  sla_compliance_rate: number;
  avg_resolution_hours: number;
  duplicate_count: number;
  high_sla_risk_count: number;
  department_distribution: { name: string; value: number }[];
  category_distribution: { name: string; value: number }[];
  sentiment_distribution: { name: string; value: number }[];
  priority_distribution: { name: string; value: number }[];
  insights: {
    id: string;
    type: string;
    severity: string;
    title: string;
    description: string;
    action: string;
  }[];
}

export interface AnalyticsTrends {
  daily_trends: { date: string; total: number; resolved: number; critical: number }[];
  category_growth: { category: string; thisWeek: number; lastWeek: number; growth: string; status: string }[];
}

export interface HotspotPoint {
  id: string;
  location_name: string;
  ward: string;
  latitude: number;
  longitude: number;
  category: string;
  priority_level: PriorityLevel;
  status: string;
  complaint_count: number;
  risk_level: string;
  summary: string;
}

export interface AnalyticsHotspots {
  hotspots: HotspotPoint[];
  critical_zones: { zone: string; cluster_size: number; primary_issue: string; risk: string }[];
}

// ============================================================================
// rapidAID EMERGENCY MODULE TYPES
// ============================================================================

export type EmergencyMode = 'NORMAL' | 'ELEVATED' | 'HIGH_ALERT' | 'DISASTER';

export type EmergencyType =
  | 'ROAD_ACCIDENT'
  | 'BUILDING_COLLAPSE'
  | 'FIRE'
  | 'INDUSTRIAL_ACCIDENT'
  | 'FLOOD'
  | 'CYCLONE'
  | 'HAZMAT'
  | 'MASS_CASUALTY'
  | 'OTHER';

export type ResourceCategory = 'AMBULANCE' | 'FIRE_RESCUE' | 'SPECIALIZED' | 'MEDICAL_TEAM';

export type ResourceType =
  | 'BLS_AMBULANCE'
  | 'ALS_AMBULANCE'
  | 'VENTILATOR_AMBULANCE'
  | 'FIRE_ENGINE'
  | 'LADDER_TRUCK'
  | 'HAZMAT_UNIT'
  | 'RESCUE_VEHICLE'
  | 'HEAVY_RESCUE_TEAM';

export type ResourceStatus =
  | 'AVAILABLE'
  | 'DISPATCHED'
  | 'EN_ROUTE'
  | 'ON_SCENE'
  | 'RETURNING'
  | 'MAINTENANCE';

export type HospitalStatus = 'ACCEPTING' | 'LIMITED' | 'NEAR_CAPACITY' | 'FULL';

export type PatientTriageStatus = 'CRITICAL' | 'MODERATE' | 'MINOR' | 'DECEASED' | 'PENDING';

export type PatientRescueStatus = 'TRAPPED' | 'BEING_RESCUED' | 'RESCUED' | 'TRANSPORTING' | 'HOSPITALIZED';

export type LocationSource =
  | 'CALLER_GPS'
  | 'DEVICE_GPS'
  | 'INCIDENT_LOCATION'
  | 'AMBULANCE_GPS'
  | 'HOSPITAL_LOCATION'
  | 'ESTIMATED'
  | 'MANUAL';

export type LocationConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export type DispatchStatus =
  | 'RECOMMENDED'
  | 'DISPATCHED'
  | 'EN_ROUTE'
  | 'ON_SCENE'
  | 'TRANSPORTING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface EmergencyModeResponse {
  current_mode: EmergencyMode;
  updated_at: string;
  history?: {
    id: number;
    previous_mode: string;
    new_mode: string;
    changed_by: string;
    reason: string;
    timestamp: string;
  }[];
}

export interface PatientEmergencyRecord {
  id: string; // e.g. PAT-1001
  emergency_id: string;
  triage_status: PatientTriageStatus;
  rescue_status: PatientRescueStatus;
  incident_location?: string;
  current_latitude?: number;
  current_longitude?: number;
  location_source: LocationSource;
  location_confidence: LocationConfidence;
  assigned_ambulance?: string;
  destination_hospital?: string;
  ventilator_requirement: boolean;
  notes?: string;
  last_updated: string;
  created_at: string;
}

export interface ResourceDispatch {
  id: string;
  incident_id: string;
  resource_id: string;
  resource_name?: string;
  resource_type?: string;
  status: DispatchStatus;
  eta_minutes: number;
  reasoning?: string;
  recommended_at: string;
  dispatched_at?: string;
  confirmed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EmergencyIncident {
  id: string;
  type: EmergencyType;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  location_name: string;
  injured_count: number;
  critical_count: number;
  trapped_count: number;
  vulnerable_count: number;
  fire_severity: string;
  fire_spread_risk: string;
  collapse_risk: string;
  hazmat_risk: string;
  road_accessibility: string;
  traffic_level: string;
  population_density: string;
  required_capabilities?: string[];
  priority_score: number;
  priority_level: PriorityLevel;
  status: 'ACTIVE' | 'CONTAINED' | 'RESOLVED';
  created_at: string;
  updated_at: string;
  patients?: PatientEmergencyRecord[];
  dispatches?: ResourceDispatch[];
}

export interface EmergencyResource {
  id: string;
  name: string;
  resource_type: ResourceType;
  category: ResourceCategory;
  latitude: number;
  longitude: number;
  location: string;
  availability: boolean;
  status: ResourceStatus;
  capacity: number;
  equipment?: string[];
  capabilities?: string[];
  oxygen_capability: boolean;
  ventilator_capability: boolean;
  paramedic_capability: boolean;
  ladder_capability: boolean;
  hazmat_capability: boolean;
  heavy_rescue_capability: boolean;
  current_assignment?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Hospital {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  total_beds: number;
  available_beds: number;
  emergency_beds: number;
  available_emergency_beds: number;
  icu_beds: number;
  available_icu_beds: number;
  ventilators: number;
  available_ventilators: number;
  trauma_capability: boolean;
  operating_theatre_availability: number;
  emergency_department_occupancy: number;
  incoming_patient_count: number;
  status: HospitalStatus;
  created_at: string;
  updated_at: string;
}

export interface HospitalCapacityOverview {
  total_hospitals: number;
  total_icu_beds: number;
  available_icu_beds: number;
  total_er_beds: number;
  available_er_beds: number;
  total_ventilators: number;
  available_ventilators: number;
  avg_occupancy: number;
  hospitals: Hospital[];
}

export interface BypassedHospital {
  hospital_name: string;
  eta_minutes: number;
  reason: string;
}

export interface HospitalRoutingDecision {
  recommended_hospital?: Hospital;
  hospital_score: number;
  eta_minutes: number;
  reasons: string[];
  bypassed_hospitals: BypassedHospital[];
}

export interface AllocatedDispatchItem {
  incident_id: string;
  incident_title: string;
  resource_id: string;
  resource_name: string;
  resource_type: string;
  eta_minutes: number;
  suitability_score: number;
  reasoning: string;
  status: DispatchStatus;
}

export interface ResourceConflictAlert {
  resource_id: string;
  resource_type: string;
  contending_incidents: string[];
  awarded_to_incident_id: string;
  reason: string;
}

export interface ResourceShortageAlert {
  capability: string;
  required_count: number;
  available_count: number;
  deficit: number;
  severity: string;
  message: string;
}

export interface GlobalAllocationResult {
  emergency_mode: EmergencyMode;
  active_incidents_count: number;
  allocated_dispatches: AllocatedDispatchItem[];
  conflicts: ResourceConflictAlert[];
  shortages: ResourceShortageAlert[];
  mitigations: string[];
  hospital_routings: Record<string, HospitalRoutingDecision>;
}

export interface EmergencyAnalytics {
  emergency_mode: EmergencyMode;
  active_incidents: number;
  total_casualties: number;
  critical_casualties: number;
  trapped_victims: number;
  available_ambulances: number;
  total_ambulances: number;
  available_fire_units: number;
  total_fire_units: number;
  total_icu_beds: number;
  available_icu_beds: number;
  total_er_beds: number;
  available_er_beds: number;
  avg_hospital_occupancy: number;
  avg_dispatch_time_minutes: number;
  avg_response_time_minutes: number;
  ambulance_utilization_rate: number;
  fire_rescue_utilization_rate: number;
  icu_utilization_rate: number;
  resource_conflicts_detected: number;
  resource_shortages_detected: number;
  emergency_hotspots: {
    incident_id: string;
    title: string;
    location_name: string;
    latitude: number;
    longitude: number;
    priority_score: number;
    critical_count: number;
    status: string;
  }[];
  predictive_insights: {
    type: string;
    title: string;
    description: string;
    confidence: number;
    recommended_action: string;
  }[];
}

