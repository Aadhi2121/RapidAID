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
  NotificationItem
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

export default api;
