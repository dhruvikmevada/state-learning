import type {
  AuthUser, Lesson, AuditEntry, PaginatedResponse,
  KPIs, Breakdowns, Watchouts, TopDrivers,
  FilterOptions, DashboardFilters, LessonFormData,
} from '../types';

const BASE = '';

let authToken: string | null = localStorage.getItem('token');

function headers(): HeadersInit {
  const h: HeadersInit = { 'Content-Type': 'application/json' };
  if (authToken) h['Authorization'] = `Bearer ${authToken}`;
  return h;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, { ...options, headers: { ...headers(), ...options?.headers } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed: ${res.status}`);
    (err as any).status = res.status;
    (err as any).details = body.details;
    throw err;
  }
  return res.json();
}

// Auth
export const api = {
  auth: {
    login: async (email: string): Promise<{ user: AuthUser; token: string }> => {
      const data = await request<{ user: AuthUser; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      authToken = data.token;
      localStorage.setItem('token', data.token);
      return data;
    },
    me: () => request<{ user: AuthUser }>('/auth/me'),
    logout: async () => {
      await request<{ message: string }>('/auth/logout', { method: 'POST' });
      authToken = null;
      localStorage.removeItem('token');
    },
    getUsers: () => request<Array<{ id: string; displayName: string; email: string; role: string; department: string }>>('/auth/users'),
  },

  lessons: {
    list: (params?: Record<string, string | number>) => {
      const qs = params ? '?' + new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== '' && v !== undefined).map(([k, v]) => [k, String(v)])
      ).toString() : '';
      return request<PaginatedResponse<Lesson>>(`/api/lessons${qs}`);
    },
    get: (id: string) => request<Lesson>(`/api/lessons/${id}`),
    create: (data: LessonFormData) =>
      request<Lesson>('/api/lessons', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<LessonFormData>) =>
      request<Lesson>(`/api/lessons/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    getAudit: (id: string) => request<AuditEntry[]>(`/api/lessons/${id}/audit`),
    filters: () => request<FilterOptions>('/api/lessons/filters'),

    approvePM: (id: string, status: 'APPROVED' | 'REJECTED', notes?: string) =>
      request<Lesson>(`/api/lessons/${id}/approve/pm`, {
        method: 'POST',
        body: JSON.stringify({ status, notes }),
      }),
    approvePMO: (id: string, status: 'APPROVED' | 'REJECTED', notes?: string) =>
      request<Lesson>(`/api/lessons/${id}/approve/pmo`, {
        method: 'POST',
        body: JSON.stringify({ status, notes }),
      }),
    approveDepartment: (id: string, status: 'APPROVED' | 'REJECTED', notes?: string) =>
      request<Lesson>(`/api/lessons/${id}/approve/department`, {
        method: 'POST',
        body: JSON.stringify({ status, notes }),
      }),
  },

  dashboard: {
    kpis: (filters?: DashboardFilters) => {
      const qs = filters ? '?' + new URLSearchParams(
        Object.entries(filters).filter(([, v]) => v).map(([k, v]) => [k, v!])
      ).toString() : '';
      return request<KPIs>(`/api/dashboard/kpis${qs}`);
    },
    breakdowns: (filters?: DashboardFilters) => {
      const qs = filters ? '?' + new URLSearchParams(
        Object.entries(filters).filter(([, v]) => v).map(([k, v]) => [k, v!])
      ).toString() : '';
      return request<Breakdowns>(`/api/dashboard/breakdowns${qs}`);
    },
    watchouts: (filters?: DashboardFilters) => {
      const qs = filters ? '?' + new URLSearchParams(
        Object.entries(filters).filter(([, v]) => v).map(([k, v]) => [k, v!])
      ).toString() : '';
      return request<Watchouts>(`/api/dashboard/watchouts${qs}`);
    },
    topDrivers: (filters?: DashboardFilters) => {
      const qs = filters ? '?' + new URLSearchParams(
        Object.entries(filters).filter(([, v]) => v).map(([k, v]) => [k, v!])
      ).toString() : '';
      return request<TopDrivers>(`/api/dashboard/top-drivers${qs}`);
    },
  },

  config: {
    getThresholds: () => request<Array<{ id: string; key: string; value: string; description: string }>>('/api/config/thresholds'),
  },
};

export function setToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}
