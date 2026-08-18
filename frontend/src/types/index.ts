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
