// CareerHub AI — global client state (Zustand)
'use client'

import { create } from 'zustand'
import type { JobFilter, SessionUser, View, AIAssistantTurn, JobCardData } from '@/lib/types'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface AppState {
  // routing
  view: View
  selectedJobId: string | null
  selectedCompanyId: string | null
  // auth
  user: SessionUser | null
  authLoading: boolean
  authModalOpen: boolean
  authMode: 'login' | 'register'
  // filters
  filter: JobFilter
  // search results cache
  searchResults: { jobs: JobCardData[]; total: number; page: number; totalPages: number; facets: any } | null
  searchLoading: boolean
  // saved/applications caches
  savedJobsVersion: number   // bump to trigger refetch
  applicationsVersion: number
  // notifications
  notifications: any[]
  notificationsVersion: number
  // AI assistant
  assistantTurns: AIAssistantTurn[]
  // job comparison
  compareIds: string[]
  compareOpen: boolean
  // theme is handled by next-themes

  // actions
  setView: (v: View) => void
  openJob: (id: string) => void
  openCompany: (id: string) => void
  setFilter: (f: Partial<JobFilter>, opts?: { replace?: boolean }) => void
  resetFilter: () => void
  runSearch: () => Promise<void>
  refreshUser: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, role?: string) => Promise<void>
  logout: () => Promise<void>
  openAuth: (mode: 'login' | 'register') => void
  closeAuth: () => void
  saveJob: (id: string, folder?: string) => Promise<boolean>
  unsaveJob: (id: string) => Promise<boolean>
  applyJob: (id: string, source?: string) => Promise<boolean>
  bumpSaved: () => void
  bumpApplications: () => void
  refreshNotifications: () => Promise<void>
  toggleCompare: (id: string) => void
  clearCompare: () => void
  openCompare: () => void
  closeCompare: () => void
  addAssistantTurn: (t: AIAssistantTurn) => void
  clearAssistant: () => void
}

const defaultFilter: JobFilter = { sort: 'newest', page: 1, pageSize: 20 }

export const useApp = create<AppState>((set, get) => ({
  view: 'landing',
  selectedJobId: null,
  selectedCompanyId: null,
  user: null,
  authLoading: true,
  authModalOpen: false,
  authMode: 'login',
  filter: { ...defaultFilter },
  searchResults: null,
  searchLoading: false,
  savedJobsVersion: 0,
  applicationsVersion: 0,
  notifications: [],
  notificationsVersion: 0,
  assistantTurns: [],
  compareIds: [],
  compareOpen: false,

  setView: (v) => { set({ view: v }); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }) },
  openJob: (id) => { set({ selectedJobId: id, view: 'job' }); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }) },
  openCompany: (id) => { set({ selectedCompanyId: id, view: 'company' }); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }) },

  setFilter: (f, opts) => {
    const cur = get().filter
    const next: JobFilter = opts?.replace ? { ...defaultFilter, ...f } : { ...cur, ...f, page: f.page ?? 1 }
    set({ filter: next })
  },
  resetFilter: () => set({ filter: { ...defaultFilter } }),

  runSearch: async () => {
    set({ searchLoading: true })
    try {
      const res = await api.jobs(get().filter)
      set({ searchResults: res, searchLoading: false })
    } catch (e: any) {
      set({ searchLoading: false })
      toast.error(e.message || 'Search failed')
    }
  },

  refreshUser: async () => {
    set({ authLoading: true })
    try {
      const u = await api.session()
      set({ user: u, authLoading: false })
    } catch {
      set({ user: null, authLoading: false })
    }
  },

  login: async (email, password) => {
    const u = await api.login({ email, password })
    set({ user: u, authModalOpen: false })
    toast.success(`Welcome back, ${u.name.split(' ')[0]}!`)
    // refresh notifications
    get().refreshNotifications()
  },

  register: async (email, password, name, role) => {
    const u = await api.register({ email, password, name, role: role || 'candidate' })
    set({ user: u as SessionUser, authModalOpen: false })
    toast.success(`Welcome to CareerHub AI, ${u.name.split(' ')[0]}!`)
    get().refreshNotifications()
  },

  logout: async () => {
    await api.logout()
    set({ user: null, view: 'landing' })
    toast.success('Signed out')
  },

  openAuth: (mode) => set({ authModalOpen: true, authMode: mode }),
  closeAuth: () => set({ authModalOpen: false }),

  saveJob: async (id, folder) => {
    if (!get().user) { get().openAuth('login'); return false }
    try {
      await api.saveJob(id, { folder })
      get().bumpSaved()
      toast.success('Saved to your list')
      return true
    } catch (e: any) { toast.error(e.message); return false }
  },
  unsaveJob: async (id) => {
    try {
      await api.unsaveJob(id)
      get().bumpSaved()
      toast.success('Removed from saved')
      return true
    } catch (e: any) { toast.error(e.message); return false }
  },
  applyJob: async (id, source) => {
    if (!get().user) { get().openAuth('login'); return false }
    try {
      await api.applyJob(id, source)
      get().bumpApplications()
      toast.success('Application tracked — now finish on the source site')
      return true
    } catch (e: any) { toast.error(e.message); return false }
  },

  bumpSaved: () => set((s) => ({ savedJobsVersion: s.savedJobsVersion + 1 })),
  bumpApplications: () => set((s) => ({ applicationsVersion: s.applicationsVersion + 1 })),
  refreshNotifications: async () => {
    if (!get().user) return
    try { const n = await api.notifications(); set({ notifications: n }) } catch {}
  },

  addAssistantTurn: (t) => set((s) => ({ assistantTurns: [...s.assistantTurns, t] })),
  clearAssistant: () => set({ assistantTurns: [] }),

  toggleCompare: (id) => set((s) => {
    const exists = s.compareIds.includes(id)
    if (exists) return { compareIds: s.compareIds.filter((x) => x !== id) }
    if (s.compareIds.length >= 3) { toast.warning('You can compare up to 3 jobs at a time'); return {} }
    return { compareIds: [...s.compareIds, id] }
  }),
  clearCompare: () => set({ compareIds: [] }),
  openCompare: () => set({ compareOpen: true }),
  closeCompare: () => set({ compareOpen: false }),
}))
