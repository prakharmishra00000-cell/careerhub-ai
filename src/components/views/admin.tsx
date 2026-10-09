'use client'

import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Shield, Users, Briefcase, Server, Building2, Flag, BarChart3, Search,
  Activity, AlertTriangle, CheckCircle2, XCircle, Loader2, ChevronLeft,
  ChevronRight, RefreshCw, Pencil, Database, TrendingUp, Eye, Inbox, Globe,
  Info, Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { timeAgo, employmentTypeLabel } from '@/lib/jobs'
import type { AdminMetrics, JobSourceHealth, Role, View } from '@/lib/types'

type AdminTab = 'overview' | 'users' | 'jobs' | 'sources' | 'companies' | 'reports' | 'analytics'

const viewToTab: Record<string, AdminTab> = {
  admin: 'overview',
  'admin-users': 'users',
  'admin-jobs': 'jobs',
  'admin-sources': 'sources',
  'admin-companies': 'companies',
  'admin-reports': 'reports',
  'admin-analytics': 'analytics',
}

const tabToView: Record<AdminTab, View> = {
  overview: 'admin',
  users: 'admin-users',
  jobs: 'admin-jobs',
  sources: 'admin-sources',
  companies: 'admin-companies',
  reports: 'admin-reports',
  analytics: 'admin-analytics',
}

// Normalize endpoints that return { key: [...] } despite wrapper declaring array
function unwrap<T>(res: any, key: string): T[] {
  if (Array.isArray(res)) return res as T[]
  if (res && Array.isArray(res[key])) return res[key] as T[]
  return []
}

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']
const PIE_COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#ec4899', '#10b981', '#8b5cf6', '#ef4444', '#84cc16']

const roleBadgeClass: Record<Role, string> = {
  candidate: 'bg-muted text-muted-foreground border-border',
  recruiter: 'bg-primary/10 text-primary border-primary/20',
  company_admin: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
  moderator: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
}

const statusBadgeClass: Record<string, string> = {
  healthy: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  degraded: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  down: 'bg-destructive/10 text-destructive border-destructive/20',
  unknown: 'bg-muted text-muted-foreground border-border',
}

const reportStatusClass: Record<string, string> = {
  open: 'bg-destructive/10 text-destructive border-destructive/20',
  reviewed: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
}

// ---------------- Main view ----------------
export function AdminView() {
  const view = useApp((s) => s.view)
  const setView = useApp((s) => s.setView)
  const user = useApp((s) => s.user)

  const tab = viewToTab[view] ?? 'overview'
  const setTab = (t: AdminTab) => setView(tabToView[t])

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <Card className="p-10 text-center">
          <Shield className="size-10 mx-auto text-muted-foreground/40 mb-3" />
          <h1 className="text-lg font-semibold">Admin access required</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-5">You need an admin account to view this dashboard.</p>
          <Button onClick={() => useApp.getState().openAuth('login')}>Sign in</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1">
      <Tabs value={tab} onValueChange={(v) => setTab(v as AdminTab)} className="gap-0">
        {/* Sticky sub-nav */}
        <div className="sticky top-16 z-30 bg-background/85 backdrop-blur-xl border-b border-border/70 supports-[backdrop-filter]:bg-background/70">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <Shield className="size-5 text-primary" /> Admin console
                </h1>
                <p className="text-xs text-muted-foreground">Platform metrics, sources, users, and moderation.</p>
              </div>
              <Badge variant="outline" className="hidden sm:inline-flex border-primary/30 text-primary">
                <Shield className="size-3 mr-1" /> {user.email}
              </Badge>
            </div>
            <TabsList className="w-full justify-start overflow-x-auto sm:w-fit">
              <TabsTrigger value="overview"><BarChart3 className="size-3.5" /> Overview</TabsTrigger>
              <TabsTrigger value="users"><Users className="size-3.5" /> Users</TabsTrigger>
              <TabsTrigger value="jobs"><Briefcase className="size-3.5" /> Jobs</TabsTrigger>
              <TabsTrigger value="sources"><Server className="size-3.5" /> Sources</TabsTrigger>
              <TabsTrigger value="companies"><Building2 className="size-3.5" /> Companies</TabsTrigger>
              <TabsTrigger value="reports"><Flag className="size-3.5" /> Reports</TabsTrigger>
              <TabsTrigger value="analytics"><TrendingUp className="size-3.5" /> Analytics</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="jobs"><JobsTab /></TabsContent>
          <TabsContent value="sources"><SourcesTab /></TabsContent>
          <TabsContent value="companies"><CompaniesTab /></TabsContent>
          <TabsContent value="reports"><ReportsTab /></TabsContent>
          <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

// ---------------- Overview tab ----------------
function useMetrics() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const m = await api.adminMetrics()
        if (active) setMetrics(m)
      } catch (e: any) {
        if (active) toast.error(e.message || 'Could not load metrics')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])
  return { loading, metrics }
}

function OverviewTab() {
  const { loading, metrics } = useMetrics()

  if (loading) return <MetricsSkeleton />
  if (!metrics) return <EmptyBlock title="No metrics available" description="Try refreshing the page." />

  const stats: { label: string; value: number; icon: any; accent?: string }[] = [
    { label: 'Total users', value: metrics.totalUsers, icon: Users },
    { label: 'Active users', value: metrics.activeUsers, icon: Activity, accent: 'emerald' },
    { label: 'Jobs indexed', value: metrics.jobsIndexed, icon: Briefcase },
    { label: 'Jobs today', value: metrics.jobsToday, icon: TrendingUp, accent: 'violet' },
    { label: 'Sources active', value: metrics.sourcesActive, icon: Server },
    { label: 'Source failures', value: metrics.sourceFailures, icon: AlertTriangle, accent: 'amber' },
    { label: 'Applications', value: metrics.applications, icon: Inbox },
    { label: 'Saved jobs', value: metrics.savedJobs, icon: Eye },
    { label: 'Reported jobs', value: metrics.reportedJobs, icon: Flag, accent: 'destructive' },
    { label: 'Duplicate jobs', value: metrics.duplicateJobs, icon: AlertTriangle, accent: 'amber' },
  ]

  const sourceData = Object.entries(metrics.bySource).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10)
  const cityData = Object.entries(metrics.byCity).map(([name, value]) => ({ name: name === 'null' ? 'Unspecified' : name, value })).sort((a, b) => b.value - a.value).slice(0, 8)
  const empData = Object.entries(metrics.byEmploymentType).map(([name, value]) => ({ name: employmentTypeLabel(name) || 'Unspecified', value })).filter((d) => d.value > 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} accent={s.accent as any} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="size-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Jobs posted timeline</h2>
                <p className="text-xs text-muted-foreground">Last 14 days</p>
              </div>
            </div>
          </div>
          <div className="h-[260px] -ml-2">
            <TimelineChart data={metrics.jobsTimeline} />
          </div>
        </Card>

        {/* System health */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">System health</h2>
              <p className="text-xs text-muted-foreground">Source & freshness signals</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <HealthRow label="Sources active" value={metrics.sourcesActive} icon={Server} tone="ok" />
            <HealthRow label="Source failures" value={metrics.sourceFailures} icon={AlertTriangle} tone={metrics.sourceFailures > 0 ? 'warn' : 'ok'} />
            <HealthRow label="Jobs added today" value={metrics.jobsToday} icon={TrendingUp} tone="ok" />
            <HealthRow label="Jobs updated (24h)" value={metrics.jobsUpdated} icon={RefreshCw} tone="ok" />
            <HealthRow label="Jobs expired" value={metrics.jobsExpired} icon={XCircle} tone={metrics.jobsExpired > 0 ? 'warn' : 'ok'} />
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Data freshness</p>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span className="text-sm font-medium">Live — synced within the last hour</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* By source */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Server className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Jobs by source</h2>
              <p className="text-xs text-muted-foreground">Top 10 sources</p>
            </div>
          </div>
          {sourceData.length === 0 ? <EmptyMini /> : (
            <div className="h-[260px]">
              <SourceBarChart data={sourceData} />
            </div>
          )}
        </Card>

        {/* By employment type */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Briefcase className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">By employment type</h2>
              <p className="text-xs text-muted-foreground">Distribution</p>
            </div>
          </div>
          {empData.length === 0 ? <EmptyMini /> : (
            <div className="h-[260px]">
              <EmploymentPieChart data={empData} />
            </div>
          )}
        </Card>
      </div>

      {/* By city */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Top cities</h2>
            <p className="text-xs text-muted-foreground">Top 8 by job count</p>
          </div>
        </div>
        {cityData.length === 0 ? <EmptyMini /> : (
          <div className="h-[260px]">
            <CityBarChart data={cityData} />
          </div>
        )}
      </Card>
    </div>
  )
}

// ---------------- Users tab ----------------
function UsersTab() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const pageSize = 20

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.adminUsers(page, q || undefined)
        if (active) {
          setUsers(res.users ?? [])
          setTotal(res.total ?? 0)
        }
      } catch (e: any) {
        if (active) toast.error(e.message || 'Could not load users')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [page, q])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setQ(searchInput.trim())
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submitSearch} className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by name or email…" className="pl-9" />
        </div>
        <Button type="submit" size="sm">Search</Button>
        {q && <Button type="button" variant="ghost" size="sm" onClick={() => { setQ(''); setSearchInput(''); setPage(1) }}>Clear</Button>}
      </form>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-md" />)}
        </div>
      ) : users.length === 0 ? (
        <EmptyBlock title="No users found" description={q ? 'Try a different search term.' : 'No users in the system yet.'} />
      ) : (
        <>
          <Card className="hidden md:block p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3">User</th>
                  <th className="text-left font-medium px-4 py-3">Role</th>
                  <th className="text-left font-medium px-4 py-3">Joined</th>
                  <th className="text-left font-medium px-4 py-3">Last login</th>
                  <th className="text-right font-medium px-4 py-3">Activity</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-border/70 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8 rounded-full border border-border">
                          <AvatarFallback className="rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {(u.name ?? '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={roleBadgeClass[u.role as Role] ?? roleBadgeClass.candidate}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{u.createdAt ? timeAgo(u.createdAt) : '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'Never'}</td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      <span className="inline-flex flex-wrap gap-2 justify-end">
                        <span>{u.postedJobs ?? 0} jobs</span>
                        <span>{u.applicationCount ?? 0} apps</span>
                        <span>{u.savedCount ?? 0} saved</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2.5">
            {users.map((u) => (
              <Card key={u.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-9 rounded-full border border-border shrink-0">
                      <AvatarFallback className="rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {(u.name ?? '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={roleBadgeClass[u.role as Role] ?? roleBadgeClass.candidate}>{u.role}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                  <div><span className="font-medium text-foreground">{u.postedJobs ?? 0}</span> jobs</div>
                  <div><span className="font-medium text-foreground">{u.applicationCount ?? 0}</span> apps</div>
                  <div><span className="font-medium text-foreground">{u.savedCount ?? 0}</span> saved</div>
                </div>
              </Card>
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} loading={loading} />
        </>
      )}
    </div>
  )
}

// ---------------- Jobs tab ----------------
function JobsTab() {
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState<string>('')
  const pageSize = 20

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.adminJobs(page, q || undefined, status || undefined)
        if (active) {
          setJobs(res.jobs ?? [])
          setTotal(res.total ?? 0)
        }
      } catch (e: any) {
        if (active) toast.error(e.message || 'Could not load jobs')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [page, q, status])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setQ(searchInput.trim())
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search jobs…" className="pl-9" />
        </div>
        <Button type="submit" size="sm">Search</Button>
        <Select value={status || 'all'} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </form>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-md" />)}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyBlock title="No jobs found" description={q || status ? 'Try different filters.' : 'No jobs in the system.'} />
      ) : (
        <>
          <Card className="hidden md:block p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Title</th>
                  <th className="text-left font-medium px-4 py-3">Company</th>
                  <th className="text-left font-medium px-4 py-3">Source</th>
                  <th className="text-left font-medium px-4 py-3">Location</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3">Posted</th>
                  <th className="text-right font-medium px-4 py-3">Views / Apps</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr
                    key={j.id}
                    className="border-t border-border/70 hover:bg-accent/30 transition-colors cursor-pointer"
                    onClick={() => useApp.getState().openJob(j.id)}
                  >
                    <td className="px-4 py-3 font-medium truncate max-w-[200px]">{j.title}</td>
                    <td className="px-4 py-3 truncate max-w-[140px]">{j.companyName}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{j.sourceName ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[120px]">{j.city ?? j.state ?? '—'}</td>
                    <td className="px-4 py-3"><JobStatusBadge status={j.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{timeAgo(j.postedAt)}</td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{j.viewCount ?? 0}</span> / <span className="font-medium text-foreground">{j.applicationCount ?? 0}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="md:hidden space-y-2.5">
            {jobs.map((j) => (
              <Card key={j.id} className="p-4" onClick={() => useApp.getState().openJob(j.id)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{j.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{j.companyName}</p>
                  </div>
                  <JobStatusBadge status={j.status} />
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                  {j.city && <span>{j.city}</span>}
                  {j.sourceName && <span>· {j.sourceName}</span>}
                  <span>· {timeAgo(j.postedAt)}</span>
                </div>
              </Card>
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} loading={loading} />
        </>
      )}
    </div>
  )
}

// ---------------- Sources tab ----------------
function SourcesTab() {
  const [loading, setLoading] = useState(true)
  const [sources, setSources] = useState<JobSourceHealth[]>([])
  const [editing, setEditing] = useState<JobSourceHealth | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.adminSources()
      setSources(unwrap<JobSourceHealth>(res, 'sources'))
    } catch (e: any) {
      toast.error(e.message || 'Could not load sources')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    const loadActive = async () => {
      setLoading(true)
      try {
        const res = await api.adminSources()
        if (active) setSources(unwrap<JobSourceHealth>(res, 'sources'))
      } catch (e: any) {
        if (active) toast.error(e.message || 'Could not load sources')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadActive()
    return () => { active = false }
  }, [])

  const toggleEnabled = async (s: JobSourceHealth) => {
    setBusy(s.id)
    try {
      await api.adminUpdateSource(s.id, { enabled: !s.enabled })
      setSources((prev) => prev.map((x) => (x.id === s.id ? { ...x, enabled: !s.enabled, status: !s.enabled ? 'unknown' : 'down' } : x)))
      toast.success(`${s.name} ${s.enabled ? 'disabled' : 'enabled'}`)
    } catch (e: any) {
      toast.error(e.message || 'Update failed')
    } finally {
      setBusy(null)
    }
  }

  const syncRealJobs = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const result = await api.syncSources('all')
      setSyncResult(result)
      const totalIns = result.totalInserted || 0
      if (totalIns > 0) {
        toast.success(`Synced ${totalIns} real jobs from live APIs!`)
      } else {
        toast.info('Sync complete — all jobs were already in the database')
      }
      load() // refresh source list
    } catch (e: any) {
      toast.error(e.message || 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Real job sync banner */}
      <Card className="p-4 border-emerald-500/30 bg-emerald-500/5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
              <Zap className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Fetch Real Jobs</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Fetches live job listings from <strong>Remotive</strong> (remote jobs worldwide) and <strong>Arbeitnow</strong> (EU jobs).
                No API keys required. Jobs are stored with <code className="text-[10px] bg-muted px-1 rounded">isDemo=false</code>.
              </p>
              {syncResult && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {syncResult.sources?.map((s: any) => (
                    <Badge key={s.name} variant="outline" className={`text-[10px] ${s.error ? 'border-destructive/30 text-destructive' : 'border-emerald-500/30 text-emerald-700 dark:text-emerald-300'}`}>
                      {s.name}: {s.error ? `error` : `${s.inserted} new, ${s.skipped} existing`}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Button size="sm" onClick={syncRealJobs} disabled={syncing} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
            {syncing ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Zap className="size-3.5 mr-1.5" />}
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Monitor and tune every job source connector.</p>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : sources.length === 0 ? (
        <EmptyBlock title="No sources configured" description="Add job sources via the database to begin aggregating." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {sources.map((s) => (
            <Card key={s.id} className={`p-4 ${!s.enabled ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{s.name}</h3>
                    <Badge variant="outline" className="text-[10px]">{s.kind}</Badge>
                  </div>
                  <Badge variant="outline" className={`mt-1.5 ${statusBadgeClass[s.status] ?? statusBadgeClass.unknown}`}>
                    {s.status === 'healthy' && <CheckCircle2 className="size-2.5 mr-1" />}
                    {s.status === 'degraded' && <AlertTriangle className="size-2.5 mr-1" />}
                    {s.status === 'down' && <XCircle className="size-2.5 mr-1" />}
                    {s.status}
                  </Badge>
                </div>
                <Switch checked={s.enabled} onCheckedChange={() => toggleEnabled(s)} disabled={busy === s.id} />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                <Stat label="Fetched" value={s.jobsFetched} />
                <Stat label="Updated" value={s.jobsUpdated} />
                <Stat label="Failed" value={s.jobsFailed} tone={s.jobsFailed > 0 ? 'warn' : 'default'} />
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                <div className="flex items-center justify-between">
                  <span>Last sync</span>
                  <span className="text-foreground">{s.lastSyncAt ? timeAgo(s.lastSyncAt) : 'Never'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last success</span>
                  <span className="text-foreground">{s.lastSuccessAt ? timeAgo(s.lastSuccessAt) : 'Never'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sync frequency</span>
                  <span className="text-foreground">{s.syncFrequency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Parser</span>
                  <span className="text-foreground font-mono">{s.parserVersion}</span>
                </div>
              </div>

              {/* Quota */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Quota</span>
                  <span className="font-medium">{s.quotaUsed.toLocaleString()} / {s.quotaLimit.toLocaleString()}</span>
                </div>
                <Progress value={s.quotaLimit > 0 ? (s.quotaUsed / s.quotaLimit) * 100 : 0} className="h-1.5" />
              </div>

              {/* Error rate */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Error rate</span>
                  <span className={`font-medium ${s.errorRate > 0.05 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {(s.errorRate * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={s.errorRate * 100} className="h-1.5" />
              </div>

              {s.lastErrorMessage && (
                <div className="text-[11px] text-destructive/80 bg-destructive/5 border border-destructive/20 rounded-md p-2 mb-3 line-clamp-2">
                  {s.lastErrorMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(s)}>
                  <Pencil className="size-3.5" /> Edit config
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <EditSourceDialog
        source={editing}
        onClose={() => setEditing(null)}
        onSaved={(id, body) => {
          setSources((prev) => prev.map((x) => (x.id === id ? { ...x, ...body } : x)))
        }}
      />
    </div>
  )
}

function EditSourceDialog({
  source, onClose, onSaved,
}: {
  source: JobSourceHealth | null
  onClose: () => void
  onSaved: (id: string, body: any) => void
}) {
  const [syncFreq, setSyncFreq] = useState('')
  const [parserVer, setParserVer] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
     
    if (source) {
      setSyncFreq(source.syncFrequency)
      setParserVer(source.parserVersion)
    }
  }, [source])

  const save = async () => {
    if (!source) return
    setSaving(true)
    try {
      await api.adminUpdateSource(source.id, { syncFrequency: syncFreq, parserVersion: parserVer })
      onSaved(source.id, { syncFrequency: syncFreq, parserVersion: parserVer })
      toast.success(`${source.name} updated`)
      onClose()
    } catch (e: any) {
      toast.error(e.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!source} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit source config</DialogTitle>
          <DialogDescription>Tune sync frequency and parser version. Credentials are managed server-side only.</DialogDescription>
        </DialogHeader>
        {source && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Source name</Label>
              <Input value={source.name} readOnly disabled className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Sync frequency (cron or label)</Label>
              <Input value={syncFreq} onChange={(e) => setSyncFreq(e.target.value)} placeholder="e.g. hourly, 0 */6 * * *" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Parser version</Label>
              <Input value={parserVer} onChange={(e) => setParserVer(e.target.value)} placeholder="e.g. v2.1.0" />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------- Companies tab ----------------
function CompaniesTab() {
  const [loading, setLoading] = useState(true)
  const [companies, setCompanies] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const pageSize = 20

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.adminCompanies(page, q || undefined)
        if (active) {
          setCompanies(res.companies ?? [])
          setTotal(res.total ?? 0)
        }
      } catch (e: any) {
        if (active) toast.error(e.message || 'Could not load companies')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [page, q])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setQ(searchInput.trim())
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submitSearch} className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search companies…" className="pl-9" />
        </div>
        <Button type="submit" size="sm">Search</Button>
        {q && <Button type="button" variant="ghost" size="sm" onClick={() => { setQ(''); setSearchInput(''); setPage(1) }}>Clear</Button>}
      </form>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-md" />)}
        </div>
      ) : companies.length === 0 ? (
        <EmptyBlock title="No companies found" description={q ? 'Try a different search term.' : 'No companies in the system.'} />
      ) : (
        <>
          <Card className="hidden md:block p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Company</th>
                  <th className="text-left font-medium px-4 py-3">Industry</th>
                  <th className="text-left font-medium px-4 py-3">Size</th>
                  <th className="text-left font-medium px-4 py-3">Type</th>
                  <th className="text-left font-medium px-4 py-3">Verified</th>
                  <th className="text-right font-medium px-4 py-3">Open jobs</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id} className="border-t border-border/70 hover:bg-accent/30 transition-colors cursor-pointer" onClick={() => useApp.getState().openCompany(c.id)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8 rounded-lg border border-border">
                          <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-medium">
                            {(c.name ?? '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium truncate max-w-[180px]">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.industry ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.companySize ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.companyType ?? '—'}</td>
                    <td className="px-4 py-3">
                      {c.verified ? (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Verified</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Unverified</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{c.openJobs ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="md:hidden space-y-2.5">
            {companies.map((c) => (
              <Card key={c.id} className="p-4" onClick={() => useApp.getState().openCompany(c.id)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="size-9 rounded-lg border border-border shrink-0">
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-medium">
                        {(c.name ?? '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.industry ?? '—'} · {c.companySize ?? '—'}</p>
                    </div>
                  </div>
                  {c.verified && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 shrink-0">Verified</Badge>}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                  <span>{c.companyType ?? '—'}</span>
                  <span><span className="font-medium text-foreground">{c.openJobs ?? 0}</span> open jobs</span>
                </div>
              </Card>
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} loading={loading} />
        </>
      )}
    </div>
  )
}

// ---------------- Reports tab ----------------
function ReportsTab() {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'open' | 'reviewed' | 'resolved'>('all')
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.adminReports()
        if (active) setReports(unwrap<any>(res, 'reports'))
      } catch (e: any) {
        if (active) toast.error(e.message || 'Could not load reports')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const filtered = filter === 'all' ? reports : reports.filter((r) => r.status === filter)

  const updateStatus = async (r: any, status: string) => {
    setBusy(r.id)
    try {
      await api.adminUpdateReport(r.id, { status })
      setReports((prev) => prev.map((x) => (x.id === r.id ? { ...x, status } : x)))
      toast.success(`Report marked ${status}`)
    } catch (e: any) {
      toast.error(e.message || 'Update failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">Reported jobs awaiting review.</p>
        <div className="flex items-center gap-1">
          {(['all', 'open', 'reviewed', 'resolved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-md" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyBlock title="No reports" description={filter !== 'all' ? `No ${filter} reports.` : 'No jobs reported.'} />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
                      {r.reason}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] ${reportStatusClass[r.status] ?? reportStatusClass.open}`}>
                      {r.status}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">{timeAgo(r.createdAt)}</span>
                  </div>
                  <p className="font-medium truncate">{r.job?.title ?? 'Job removed'}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.job?.companyName ?? ''}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Reported by <span className="font-medium text-foreground">{r.user?.name ?? 'Unknown'}</span> · {r.user?.email}
                  </p>
                  {r.details && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2 italic">“{r.details}”</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.job && (
                    <Button size="sm" variant="outline" onClick={() => useApp.getState().openJob(r.job.id)}>
                      <Eye className="size-3.5" /> View job
                    </Button>
                  )}
                  <Select value={r.status} onValueChange={(v) => updateStatus(r, v)} disabled={busy === r.id}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------- Analytics tab ----------------
function AnalyticsTab() {
  const { loading, metrics } = useMetrics()

  if (loading) return <MetricsSkeleton />
  if (!metrics) return <EmptyBlock title="No analytics available" description="Try refreshing the page." />

  const branchData = Object.entries(metrics.byBranch)
    .filter(([k]) => k !== 'null' && k !== 'unspecified')
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  const cityData = Object.entries(metrics.byCity)
    .filter(([k]) => k !== 'null' && k !== 'unspecified')
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const sourceData = Object.entries(metrics.bySource)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const roleData = Object.entries(metrics.byRole)
    .map(([name, value]) => ({ name: name === 'null' || !name ? 'unknown' : name, value: value as number }))

  const insights: { text: string; tone: 'pos' | 'neg' | 'neutral' }[] = []
  if (metrics.jobsToday > 0) insights.push({ text: `${metrics.jobsToday} new jobs added in the last 24h.`, tone: 'pos' })
  if (metrics.sourceFailures > 0) insights.push({ text: `${metrics.sourceFailures} source${metrics.sourceFailures === 1 ? '' : 's'} currently failing — investigate the Sources tab.`, tone: 'neg' })
  if (metrics.duplicateJobs > 0) insights.push({ text: `${metrics.duplicateJobs} potential duplicate job${metrics.duplicateJobs === 1 ? '' : 's'} detected by title+company match.`, tone: 'neg' })
  if (metrics.reportedJobs > 0) insights.push({ text: `${metrics.reportedJobs} job report${metrics.reportedJobs === 1 ? '' : 's'} awaiting moderator review.`, tone: 'neg' })
  if (metrics.applications > 0) insights.push({ text: `${metrics.applications} total applications tracked across all sources.`, tone: 'neutral' })
  if (insights.length === 0) insights.push({ text: 'Platform is healthy. No signals requiring attention.', tone: 'pos' })

  return (
    <div className="space-y-6">
      {/* Insights */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Info className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Derived insights</h2>
            <p className="text-xs text-muted-foreground">Auto-generated from live metrics</p>
          </div>
        </div>
        <ul className="space-y-1.5 text-sm">
          {insights.map((i, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className={`size-1.5 rounded-full mt-1.5 shrink-0 ${i.tone === 'pos' ? 'bg-emerald-500' : i.tone === 'neg' ? 'bg-amber-500' : 'bg-muted-foreground/50'}`} />
              <span className="text-muted-foreground">{i.text}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Jobs posted (14 days)</h2>
              <p className="text-xs text-muted-foreground">Daily volume</p>
            </div>
          </div>
          <div className="h-[260px] -ml-2">
            <TimelineChart data={metrics.jobsTimeline} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Server className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">By source (pie)</h2>
              <p className="text-xs text-muted-foreground">All sources</p>
            </div>
          </div>
          {sourceData.length === 0 ? <EmptyMini /> : (
            <div className="h-[260px]">
              <SourcePieChart data={sourceData} />
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">By branch</h2>
              <p className="text-xs text-muted-foreground">Top 10 branches</p>
            </div>
          </div>
          {branchData.length === 0 ? <EmptyMini /> : (
            <div className="h-[260px]">
              <BranchBarChart data={branchData} />
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">By city</h2>
              <p className="text-xs text-muted-foreground">Top 8 cities</p>
            </div>
          </div>
          {cityData.length === 0 ? <EmptyMini /> : (
            <div className="h-[260px]">
              <CityBarChart data={cityData} />
            </div>
          )}
        </Card>
      </div>

      {/* Top searches */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Search className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Top searches</h2>
            <p className="text-xs text-muted-foreground">Most popular queries (demo placeholder data)</p>
          </div>
        </div>
        <div className="space-y-2">
          {metrics.topSearches.length === 0 ? <EmptyMini /> : (
            metrics.topSearches.map((s, i) => (
              <div key={s.term} className="flex items-center gap-3">
                <span className="size-6 inline-flex items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground shrink-0">{i + 1}</span>
                <span className="text-sm flex-1">{s.term}</span>
                <span className="text-xs text-muted-foreground">{s.count} searches</span>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* By role */}
      {roleData.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Users by role</h2>
              <p className="text-xs text-muted-foreground">Distribution</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {roleData.map((r) => (
              <div key={r.name} className="p-3 rounded-lg border border-border/70 text-center">
                <p className="text-2xl font-bold">{r.value}</p>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">{r.name}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ---------------- Charts ----------------
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

function TimelineChart({ data }: { data: { date: string; count: number }[] }) {
  const formatted = data.map((d) => ({ ...d, label: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }))
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={formatted} margin={{ top: 6, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: 'var(--foreground)' }}
        />
        <Line type="monotone" dataKey="count" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function SourceBarChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function CityBarChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 6, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="value" fill="var(--chart-2)" radius={[4, 4, 0, 0]} barSize={28} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function BranchBarChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 6, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="value" fill="var(--chart-4)" radius={[4, 4, 0, 0]} barSize={22} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function EmploymentPieChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

function SourcePieChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ---------------- Small components ----------------
function StatCard({
  label, value, icon: Icon, accent,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  accent?: 'emerald' | 'violet' | 'amber' | 'destructive'
}) {
  const accentClass = accent === 'emerald'
    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    : accent === 'violet'
    ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
    : accent === 'amber'
    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    : accent === 'destructive'
    ? 'bg-destructive/10 text-destructive'
    : 'bg-primary/10 text-primary'
  return (
    <Card className="p-4 border-border/70">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-2xl font-bold tracking-tight mt-1">{value.toLocaleString()}</p>
        </div>
        <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${accentClass}`}>
          <Icon className="size-4" />
        </div>
      </div>
    </Card>
  )
}

function HealthRow({
  label, value, icon: Icon, tone,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  tone: 'ok' | 'warn'
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className={`size-3.5 ${tone === 'warn' ? 'text-amber-500' : 'text-muted-foreground/70'}`} />
        {label}
      </span>
      <span className={`font-medium ${tone === 'warn' && value > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
        {value.toLocaleString()}
      </span>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'warn' | 'default' }) {
  return (
    <div className="rounded-md bg-muted/40 p-2 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${tone === 'warn' && value > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
        {value.toLocaleString()}
      </p>
    </div>
  )
}

function JobStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    closed: 'bg-muted text-muted-foreground border-border',
    expired: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    draft: 'bg-muted text-muted-foreground border-border',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${map[status] ?? map.closed}`}>{status}</span>
}

function Pagination({
  page, totalPages, total, onChange, loading,
}: {
  page: number
  totalPages: number
  total: number
  onChange: (p: number) => void
  loading: boolean
}) {
  const from = total === 0 ? 0 : (page - 1) * 20 + 1
  const to = Math.min(page * 20, total)
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <p className="text-xs text-muted-foreground">
        {loading ? 'Loading…' : `Showing ${from}–${to} of ${total.toLocaleString()}`}
      </p>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" disabled={page <= 1 || loading} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="size-3.5" /> Prev
        </Button>
        <span className="text-xs text-muted-foreground px-2">{page} / {totalPages}</span>
        <Button size="sm" variant="outline" disabled={page >= totalPages || loading} onClick={() => onChange(page + 1)}>
          Next <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

function EmptyBlock({ title, description }: { title: string; description: string }) {
  return (
    <Card className="p-10 border-dashed text-center bg-muted/20">
      <Inbox className="size-9 mx-auto text-muted-foreground/40 mb-3" />
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{description}</p>
    </Card>
  )
}

function EmptyMini() {
  return (
    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
      No data to display
    </div>
  )
}

function MetricsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Skeleton className="h-[320px] rounded-xl lg:col-span-2" />
        <Skeleton className="h-[320px] rounded-xl" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Skeleton className="h-[320px] rounded-xl" />
        <Skeleton className="h-[320px] rounded-xl" />
      </div>
    </div>
  )
}
