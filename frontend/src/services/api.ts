import axios from 'axios';
import {
  User,
  Complaint,
  Department,
  Officer,
  AIAnalysisResult,
  TranscribeResponse,
  AnalyticsOverview,
  AnalyticsTrends,
  AnalyticsHotspots,
  NotificationItem,
  EmergencyMode,
  EmergencyModeResponse,
  EmergencyIncident,
  EmergencyResource,
  Hospital,
  HospitalCapacityOverview,
  PatientEmergencyRecord,
  ResourceDispatch,
  GlobalAllocationResult,
  EmergencyAnalytics,
  PriorityLevel,
} from '../types';


const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('civicai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (email: string, password: string = 'civicai123') => {
    const res = await api.post<{ access_token: string; token_type: string; user: User }>('/auth/login', {
      email,
      password,
    });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
};

export const callsApi = {
  transcribe: async (audioFile?: File | Blob, language?: string) => {
    const formData = new FormData();
    if (audioFile) {
      const fileName = (audioFile as File).name || 'custom_audio.wav';
      formData.append('audio', audioFile, fileName);
    }
    if (language && language !== 'auto') {
      formData.append('language', language);
    }
    // Use api instance (with JWT auth) and let browser set multipart/form-data with boundary
    const res = await api.post<TranscribeResponse>('/calls/transcribe', formData);
    return res.data;
  },
  analyze: async (data: { text: string; language?: string; location?: string; caller_name?: string; caller_phone?: string }) => {
    const res = await api.post<AIAnalysisResult>('/calls/analyze', data);
    return res.data;
  },
};


export const complaintsApi = {
  getAll: async (params?: {
    category?: string;
    priority_level?: string;
    status?: string;
    department_id?: number;
    assigned_officer_id?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const res = await api.get<Complaint[]>('/complaints', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<Complaint>(`/complaints/${id}`);
    return res.data;
  },
  create: async (data: {
    transcript: string;
    source?: string;
    language?: string;
    citizen_name?: string;
    citizen_phone?: string;
    location_name?: string;
    latitude?: number;
    longitude?: number;
  }) => {
    const res = await api.post<Complaint>('/complaints', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Complaint> & { notes?: string }) => {
    const res = await api.patch<Complaint>(`/complaints/${id}`, data);
    return res.data;
  },
  assign: async (id: string, officerId: number, notes?: string) => {
    const res = await api.post<Complaint>(`/complaints/${id}/assign`, {
      officer_id: officerId,
      notes,
    });
    return res.data;
  },
  escalate: async (id: string, reason: string, departmentId?: number) => {
    const res = await api.post<Complaint>(`/complaints/${id}/escalate`, {
      reason,
      escalated_to_department_id: departmentId,
    });
    return res.data;
  },
  resolve: async (id: string, resolutionNotes: string, resolvedBy?: string) => {
    const res = await api.post<Complaint>(`/complaints/${id}/resolve`, {
      resolution_notes: resolutionNotes,
      resolved_by: resolvedBy,
    });
    return res.data;
  },
  merge: async (sourceId: string, targetId: string, reason: string) => {
    const res = await api.post<Complaint>(`/complaints/${sourceId}/merge`, {
      target_complaint_id: targetId,
      reason,
    });
    return res.data;
  },
};

export const departmentsApi = {
  getAll: async () => {
    const res = await api.get<Department[]>('/departments');
    return res.data;
  },
  recommend: async (params: { category: string; location?: string; ward?: string; text?: string }) => {
    const res = await api.get<{
      department_id: number;
      department_name: string;
      confidence: number;
      reasoning: string;
    }>('/departments/recommend', { params });
    return res.data;
  },
};

export const officersApi = {
  getAll: async (departmentId?: number) => {
    const res = await api.get<Officer[]>('/officers', {
      params: departmentId ? { department_id: departmentId } : undefined,
    });
    return res.data;
  },
  recommend: async (params: { department_id?: number; location?: string; ward?: string }) => {
    const res = await api.get<{
      officer_id: number;
      officer_name: string;
      confidence: number;
      reasoning: string;
    }>('/officers/recommend', { params });
    return res.data;
  },
};

export const analyticsApi = {
  getOverview: async () => {
    const res = await api.get<AnalyticsOverview>('/analytics/overview');
    return res.data;
  },
  getTrends: async () => {
    const res = await api.get<AnalyticsTrends>('/analytics/trends');
    return res.data;
  },
  getHotspots: async () => {
    const res = await api.get<AnalyticsHotspots>('/analytics/hotspots');
    return res.data;
  },
};

export const notificationsApi = {
  getAll: async () => {
    const res = await api.get<NotificationItem[]>('/notifications');
    return res.data;
  },
  markRead: async (id: number) => {
    const res = await api.patch<NotificationItem>(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.post<{ message: string }>('/notifications/mark-all-read');
    return res.data;
  },
};

export const emergencyApi = {
  getMode: async () => {
    const res = await api.get<EmergencyModeResponse>('/emergency/mode');
    return res.data;
  },
  setMode: async (mode: string, reason?: string, changedBy: string = 'Admin Commissioner') => {
    const res = await api.post<EmergencyModeResponse>(
      `/emergency/mode?changed_by=${encodeURIComponent(changedBy)}`,
      { mode, reason }
    );
    return res.data;
  },
  getIncidents: async (status?: string, type?: string) => {
    const res = await api.get<EmergencyIncident[]>('/emergency/incidents', {
      params: { status, type },
    });
    return res.data;
  },
  getIncidentDetail: async (id: string) => {
    const res = await api.get<EmergencyIncident>(`/emergency/incidents/${id}`);
    return res.data;
  },
  createIncident: async (data: Partial<EmergencyIncident>) => {
    const res = await api.post<EmergencyIncident>('/emergency/incidents', data);
    return res.data;
  },
  updateIncident: async (id: string, data: Partial<EmergencyIncident>) => {
    const res = await api.patch<EmergencyIncident>(`/emergency/incidents/${id}`, data);
    return res.data;
  },
  getPriorityQueue: async () => {
    const res = await api.get<{
      emergency_mode: EmergencyMode;
      queue: {
        incident_id: string;
        type: string;
        title: string;
        location_name: string;
        latitude: number;
        longitude: number;
        critical_count: number;
        injured_count: number;
        trapped_count: number;
        priority_score: number;
        priority_level: PriorityLevel;
        breakdown: any;
        created_at: string;
      }[];
    }>('/emergency/priority-queue');
    return res.data;
  },
  getResources: async () => {
    const res = await api.get<EmergencyResource[]>('/emergency/resources');
    return res.data;
  },
  getAmbulances: async () => {
    const res = await api.get<EmergencyResource[]>('/emergency/ambulances');
    return res.data;
  },
  getFireUnits: async () => {
    const res = await api.get<EmergencyResource[]>('/emergency/fire-units');
    return res.data;
  },
  getHospitals: async () => {
    const res = await api.get<Hospital[]>('/emergency/hospitals');
    return res.data;
  },
  getHospitalsCapacity: async () => {
    const res = await api.get<HospitalCapacityOverview>('/emergency/hospitals/capacity');
    return res.data;
  },
  getPatients: async (emergencyId?: string, triageStatus?: string) => {
    const res = await api.get<PatientEmergencyRecord[]>('/emergency/patients', {
      params: { emergency_id: emergencyId, triage_status: triageStatus },
    });
    return res.data;
  },
  getPatientLocation: async (id: string) => {
    const res = await api.get<{
      patient_id: string;
      emergency_id: string;
      current_latitude: number;
      current_longitude: number;
      location_source: string;
      location_confidence: string;
      last_updated: string;
      assigned_ambulance?: string;
      destination_hospital?: string;
      simulation_disclaimer: string;
    }>(`/emergency/patients/${id}/location`);
    return res.data;
  },
  updatePatientLocation: async (
    id: string,
    data: {
      current_latitude?: number;
      current_longitude?: number;
      location_source?: string;
      location_confidence?: string;
      assigned_ambulance?: string;
      destination_hospital?: string;
      triage_status?: string;
      rescue_status?: string;
      notes?: string;
    }
  ) => {
    const res = await api.patch<PatientEmergencyRecord>(`/emergency/patients/${id}/location`, data);
    return res.data;
  },
  getDispatches: async (status?: string, incidentId?: string) => {
    const res = await api.get<ResourceDispatch[]>('/emergency/dispatches', {
      params: { status, incident_id: incidentId },
    });
    return res.data;
  },
  allocate: async () => {
    const res = await api.post<GlobalAllocationResult>('/emergency/allocate');
    return res.data;
  },
  confirmDispatch: async (
    data: {
      incident_id: string;
      resource_id: string;
      status?: string;
      reasoning?: string;
      eta_minutes?: number;
    },
    operator: string = 'Admin Commissioner'
  ) => {
    const res = await api.post<ResourceDispatch>(
      `/emergency/dispatch?operator=${encodeURIComponent(operator)}`,
      data
    );
    return res.data;
  },
  updateDispatchStatus: async (dispatchId: string, status: string) => {
    const res = await api.patch<ResourceDispatch>(`/emergency/dispatches/${dispatchId}/status`, {
      status,
    });
    return res.data;
  },
  getAnalytics: async () => {
    const res = await api.get<EmergencyAnalytics>('/emergency/analytics');
    return res.data;
  },
  resetScenario: async () => {
    const res = await api.post<{
      status: string;
      message: string;
      emergency_mode: EmergencyMode;
      active_incidents_count: number;
      total_patients_seeded: number;
      allocation_result: GlobalAllocationResult;
      disclaimer: string;
    }>('/emergency/demo/reset-scenario');
    return res.data;
  },
};

export default api;
