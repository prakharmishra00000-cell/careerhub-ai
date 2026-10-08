// CareerHub AI — client-side API wrapper
'use client'

import type {
  JobFilter, JobCardData, JobDetails, SessionUser, ProfileData,
  SavedJobItem, ApplicationItem, AlertItem, NotificationItem,
  CompanyListItem, CompanyDetails, JobSourceHealth, AdminMetrics,
  MatchScore, AIAssistantTurn,
} from '@/lib/types'

async function jfetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) },
    ...opts,
  })
  if (!res.ok) {
    let msg = `Request failed (${res.status})`
    try { const j = await res.json(); msg = j.error || msg } catch {}
    throw new Error(msg)
  }
  return res.json() as Promise<T>
}

export const api = {
  // auth
  register: (body: { email: string; password: string; name: string; role?: string }) =>
    jfetch<SessionUser & { profile?: any }>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    jfetch<SessionUser>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => jfetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  session: () => jfetch<SessionUser>('/api/auth/session'),

  // jobs
  jobs: (filter: JobFilter) => {
    const p = new URLSearchParams()
    const add = (k: string, v: any) => { if (v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)) p.set(k, Array.isArray(v) ? v.join(',') : String(v)) }
    add('q', filter.q); add('location', filter.location); add('city', filter.city)
    add('remoteType', filter.remoteType); add('employmentType', filter.employmentType)
    add('degree', filter.degree); add('branch', filter.branch)
    add('experience', filter.experience); add('fresherFriendly', filter.fresherFriendly ? 1 : '')
    add('isInternship', filter.isInternship === undefined ? '' : filter.isInternship ? 1 : 0)
    add('minSalary', filter.minSalary); add('maxSalary', filter.maxSalary)
    add('minStipend', filter.minStipend); add('stipendPaid', filter.stipendPaid)
    add('internshipDuration', filter.internshipDuration); add('ppoAvailable', filter.ppoAvailable ? 1 : '')
    add('source', filter.source); add('companyType', filter.companyType)
    add('companySize', filter.companySize); add('companyVerified', filter.companyVerified ? 1 : '')
    add('backlogPolicy', filter.backlogPolicy); add('minCgpa', filter.minCgpa)
    add('sort', filter.sort); add('page', filter.page ?? 1); add('pageSize', filter.pageSize ?? 20)
    return jfetch<{ jobs: JobCardData[]; total: number; page: number; pageSize: number; totalPages: number; facets: any }>(`/api/jobs?${p.toString()}`)
  },
  job: (id: string) => jfetch<JobDetails>(`/api/jobs/${id}`),
  jobMatch: (id: string) => jfetch<{ total: number; label: string; breakdown: any; eligibility: any }>(`/api/jobs/${id}/match`),
  saveJob: (id: string, body?: { folder?: string; notes?: string }) =>
    jfetch<{ ok: boolean; saved: boolean }>(`/api/jobs/${id}/save`, { method: 'POST', body: JSON.stringify(body || {}) }),
  unsaveJob: (id: string) => jfetch<{ ok: boolean; saved: boolean }>(`/api/jobs/${id}/save`, { method: 'DELETE' }),
  applyJob: (id: string, source?: string) => jfetch<{ ok: boolean }>(`/api/jobs/${id}/apply`, { method: 'POST', body: JSON.stringify({ source }) }),
  clickJob: (id: string) => jfetch<{ ok: boolean }>(`/api/jobs/${id}/click`, { method: 'POST' }),
  reportJob: (id: string, body: { reason: string; details?: string }) => jfetch<{ ok: boolean }>(`/api/jobs/${id}/report`, { method: 'POST', body: JSON.stringify(body) }),

  // profile
  getProfile: () => jfetch<ProfileData>('/api/profile'),
  updateProfile: (body: Partial<ProfileData>) => jfetch<ProfileData>('/api/profile', { method: 'PUT', body: JSON.stringify(body) }),

  // saved / applications / alerts / notifications
  savedJobs: () => jfetch<SavedJobItem[]>('/api/saved-jobs'),
  applications: () => jfetch<Record<string, ApplicationItem[]>>('/api/applications'),
  updateApplication: (id: string, body: any) => jfetch<any>(`/api/applications/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  alerts: () => jfetch<AlertItem[]>('/api/alerts'),
  createAlert: (body: any) => jfetch<AlertItem>('/api/alerts', { method: 'POST', body: JSON.stringify(body) }),
  updateAlert: (id: string, body: any) => jfetch<AlertItem>(`/api/alerts/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteAlert: (id: string) => jfetch<{ ok: boolean }>(`/api/alerts/${id}`, { method: 'DELETE' }),
  notifications: () => jfetch<NotificationItem[]>('/api/notifications'),
  markNotificationRead: (id: string, read = true) => jfetch<any>(`/api/notifications/${id}`, { method: 'PATCH', body: JSON.stringify({ read }) }),
  markAllNotificationsRead: () => jfetch<{ ok: boolean }>('/api/notifications/read-all', { method: 'POST' }),

  // companies
  companies: (params?: { q?: string; industry?: string; companyType?: string; companySize?: string; verified?: boolean; page?: number; pageSize?: number }) => {
    const p = new URLSearchParams()
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, String(v)) })
    return jfetch<{ companies: CompanyListItem[]; total: number }>(`/api/companies?${p.toString()}`)
  },
  company: (id: string) => jfetch<CompanyDetails>(`/api/companies/${id}`),

  // recruiter
  recruiterJobs: () => jfetch<any[]>('/api/recruiter/jobs'),
  recruiterCreateJob: (body: any) => jfetch<any>('/api/recruiter/jobs', { method: 'POST', body: JSON.stringify(body) }),
  recruiterUpdateJob: (id: string, body: any) => jfetch<any>(`/api/recruiter/jobs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  recruiterDeleteJob: (id: string) => jfetch<{ ok: boolean }>(`/api/recruiter/jobs/${id}`, { method: 'DELETE' }),
  recruiterApplications: () => jfetch<any[]>('/api/recruiter/applications'),
  recruiterUpdateApplication: (id: string, body: any) => jfetch<any>(`/api/recruiter/applications/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // admin
  adminMetrics: () => jfetch<AdminMetrics>('/api/admin/metrics'),
  adminUsers: (page = 1, q?: string) => jfetch<{ users: any[]; total: number }>(`/api/admin/users?page=${page}${q ? `&q=${q}` : ''}`),
  adminJobs: (page = 1, q?: string, status?: string) => jfetch<{ jobs: any[]; total: number }>(`/api/admin/jobs?page=${page}${q ? `&q=${q}` : ''}${status ? `&status=${status}` : ''}`),
  adminSources: () => jfetch<JobSourceHealth[]>('/api/admin/sources'),
  adminUpdateSource: (id: string, body: any) => jfetch<any>(`/api/admin/sources/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  adminCompanies: (page = 1, q?: string) => jfetch<{ companies: any[]; total: number }>(`/api/admin/companies?page=${page}${q ? `&q=${q}` : ''}`),
  adminReports: () => jfetch<any[]>('/api/admin/reports'),
  adminUpdateReport: (id: string, body: any) => jfetch<any>(`/api/admin/reports/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // AI
  aiAssistant: (message: string, history?: AIAssistantTurn[]) =>
    jfetch<{ reply: string; filters: Partial<JobFilter>; jobs: JobCardData[]; total: number }>('/api/ai/assistant', { method: 'POST', body: JSON.stringify({ message, history }) }),
  aiSearchSuggest: (q: string, kind?: string) =>
    jfetch<{ jobs: string[]; companies: { name: string; id: string }[]; skills: string[]; locations: string[] }>('/api/ai/search-suggest', { method: 'POST', body: JSON.stringify({ q, kind }) }),
  aiResumeAnalyze: (resumeText: string, targetRole?: string) =>
    jfetch<any>('/api/ai/resume-analyze', { method: 'POST', body: JSON.stringify({ resumeText, targetRole }) }),
  aiMatchScore: (jobId: string) =>
    jfetch<{ summary: string; strengths: string[]; gaps: string[]; eligibilityWarnings: string[]; job: JobCardData }>('/api/ai/match-score', { method: 'POST', body: JSON.stringify({ jobId }) }),

  // analytics
  salaryInsights: (params?: { branch?: string; city?: string; employmentType?: string; remoteType?: string }) => {
    const p = new URLSearchParams()
    if (params) Object.entries(params).forEach(([k, v]) => { if (v) p.set(k, v) })
    return jfetch<any>(`/api/analytics/salary?${p.toString()}`)
  },

  // search history
  searchHistory: () => jfetch<{ searches: any[] }>('/api/search-history'),
  recordSearch: (query: string, filters?: any, resultsCount?: number) =>
    jfetch<{ ok: boolean }>('/api/search-history', { method: 'POST', body: JSON.stringify({ query, filters, resultsCount }) }),
  clearSearchHistory: () => jfetch<{ ok: boolean }>('/api/search-history', { method: 'DELETE' }),
}
