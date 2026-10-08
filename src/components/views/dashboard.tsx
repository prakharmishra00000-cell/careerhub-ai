'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { JobCard } from '@/components/job-card'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Bookmark, ClipboardList, Bell, Gauge, ArrowRight,
  Clock, Sparkles, CheckCircle2, TrendingUp, Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { timeAgo } from '@/lib/jobs'
import type { JobCardData, ApplicationItem, NotificationItem } from '@/lib/types'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function dateLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

type AppStatusKey = 'applied' | 'assessment' | 'interview' | 'offer' | 'rejected' | 'withdrawn'

const APP_STATUSES: { key: AppStatusKey; label: string; color: string }[] = [
  { key: 'applied', label: 'Applied', color: 'bg-primary' },
  { key: 'assessment', label: 'Assessment', color: 'bg-blue-500' },
  { key: 'interview', label: 'Interview', color: 'bg-violet-500' },
  { key: 'offer', label: 'Offer', color: 'bg-emerald-500' },
  { key: 'rejected', label: 'Rejected', color: 'bg-destructive' },
  { key: 'withdrawn', label: 'Withdrawn', color: 'bg-muted-foreground/40' },
]

export function DashboardView() {
  const user = useApp((s) => s.user)
  const setView = useApp((s) => s.setView)
  const savedJobsVersion = useApp((s) => s.savedJobsVersion)
  const applicationsVersion = useApp((s) => s.applicationsVersion)
  const notificationsVersion = useApp((s) => s.notificationsVersion)

  const [loading, setLoading] = useState(true)
  const [recommended, setRecommended] = useState<JobCardData[]>([])
  const [newest, setNewest] = useState<JobCardData[]>([])
  const [apps, setApps] = useState<Record<string, ApplicationItem[]>>({})
  const [savedCount, setSavedCount] = useState(0)
  const [alertCount, setAlertCount] = useState(0)
  const [profileCompletion, setProfileCompletion] = useState<number | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      // Fetch profile first so we can personalize recommendations
      const profileRes = await api.getProfile().catch(() => null)
      const prof = profileRes as any
      if (!active) return
      if (prof) { setProfileCompletion(prof.completionPct); setProfile(prof) }

      // Build personalized filter from profile
      const recFilter: any = { sort: 'best_match', pageSize: 6 }
      if (prof?.branch) recFilter.branch = [prof.branch]
      if (prof?.degree) recFilter.degree = [prof.degree]
      if (prof?.fresherFriendly !== undefined && prof?.experienceKind === 'fresher') recFilter.fresherFriendly = true
      if (prof?.preferredLocations) {
        const locs = prof.preferredLocations.split(',').map((s: string) => s.trim()).filter(Boolean)
        if (locs.length) recFilter.location = locs[0]
      }
      if (prof?.remotePreference && prof.remotePreference !== 'any') recFilter.remoteType = [prof.remotePreference]

      const results = await Promise.allSettled([
        api.jobs(recFilter),
        api.jobs({ sort: 'newest', pageSize: 4 }),
        api.applications(),
        api.savedJobs(),
        api.alerts(),
        api.notifications(),
      ])
      if (!active) return
      const [rec, fresh, appsR, saved, alerts, notifs] = results
      if (rec.status === 'fulfilled') setRecommended(rec.value.jobs)
      if (fresh.status === 'fulfilled') setNewest(fresh.value.jobs)
      if (appsR.status === 'fulfilled') setApps(appsR.value)
      if (saved.status === 'fulfilled') setSavedCount(saved.value.length)
      if (alerts.status === 'fulfilled') setAlertCount(alerts.value.filter((a: any) => !a.paused).length)
      if (notifs.status === 'fulfilled') setNotifications(notifs.value)
      // surface a single soft toast only if everything failed
      const failed = results.filter((r) => r.status === 'rejected')
      if (failed.length === results.length) toast.error('Could not load dashboard. Please retry later.')
      if (active) setLoading(false)
    }
    load()
    return () => { active = false }
  }, [savedJobsVersion, applicationsVersion, notificationsVersion])

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  const totalApps = (apps.applied?.length ?? 0) +
    (apps.assessment?.length ?? 0) +
    (apps.interview?.length ?? 0) +
    (apps.offer?.length ?? 0) +
    (apps.rejected?.length ?? 0) +
    (apps.withdrawn?.length ?? 0)

  const statusCounts = APP_STATUSES.map((s) => ({ ...s, count: apps[s.key]?.length ?? 0 }))
  const maxCount = Math.max(1, ...statusCounts.map((s) => s.count))

  const goToSearch = (sort: 'best_match' | 'newest') => {
    setView('search')
    useApp.getState().setFilter({ sort, page: 1 }, { replace: true })
    useApp.getState().runSearch()
  }

  const handleNotifClick = async (n: NotificationItem) => {
    if (!n.read) {
      try {
        await api.markNotificationRead(n.id, true)
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
        useApp.setState({ notificationsVersion: Date.now() })
      } catch { /* ignore */ }
    }
  }

  return (
    <div className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Greeting */}
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {greeting()}, {firstName} <span className="inline-block">👋</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{dateLabel()}</p>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
        <StatCard label="Saved jobs" value={loading ? '—' : String(savedCount)} icon={Bookmark} onClick={() => setView('saved')} loading={loading} />
        <StatCard label="Applications" value={loading ? '—' : String(totalApps)} icon={ClipboardList} onClick={() => setView('applications')} loading={loading} />
        <StatCard label="Active alerts" value={loading ? '—' : String(alertCount)} icon={Bell} onClick={() => setView('alerts')} loading={loading} />
        <StatCard
          label="Profile strength"
          value={loading || profileCompletion == null ? '—' : `${profileCompletion}%`}
          icon={Gauge}
          onClick={() => setView('profile')}
          loading={loading || profileCompletion == null}
          progress={profileCompletion ?? 0}
        />
      </div>

      {/* Profile completion CTA */}
      {!loading && profileCompletion != null && profileCompletion < 80 && (
        <Card className="mb-6 p-0 overflow-hidden border-primary/20">
          <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5">
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
                <Sparkles className="size-6 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <h3 className="font-semibold text-sm">Complete your profile to get better matches</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Profiles at 80%+ get 3× more relevant recommendations</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold text-primary">{profileCompletion}%</div>
                    <div className="text-[10px] text-muted-foreground">complete</div>
                  </div>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3 mt-2">
                  <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-700" style={{ width: `${profileCompletion}%` }} />
                </div>
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setView('profile')}>
                  Build my profile <ArrowRight className="size-3" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main col */}
        <div className="lg:col-span-2 space-y-10">
          {/* Recommended */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="size-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Recommended for you</h2>
                  <p className="text-xs text-muted-foreground">
                    {profile?.branch ? <>Matched to <span className="font-medium text-foreground/80">{profile.branch}</span> · {profile?.preferredLocations?.split(',')[0]?.trim() ?? 'your area'}</> : 'Based on fresh listings'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => goToSearch('best_match')}>
                View all <ArrowRight className="size-3.5" />
              </Button>
            </div>
            {loading ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-44 rounded-xl" />
                ))}
              </div>
            ) : recommended.length === 0 ? (
              <EmptyState
                title="No recommendations yet"
                description="Complete your profile to unlock personalized job recommendations."
                cta={<Button size="sm" onClick={() => setView('profile')}>Build your profile</Button>}
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {recommended.slice(0, 6).map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </section>

          {/* New today */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="size-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">New today</h2>
                  <p className="text-xs text-muted-foreground">Fresh opportunities across every source</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => goToSearch('newest')}>
                View all <ArrowRight className="size-3.5" />
              </Button>
            </div>
            {loading ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-44 rounded-xl" />
                ))}
              </div>
            ) : newest.length === 0 ? (
              <EmptyState
                title="No new jobs today"
                description="Check back later — new listings are added throughout the day."
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {newest.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </section>

          {/* Recent searches */}
          <RecentSearches />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Applications summary */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Your applications</h3>
                <p className="text-xs text-muted-foreground">Pipeline snapshot</p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setView('applications')}>
                Open <ArrowRight className="size-3" />
              </Button>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 rounded-md" />
                ))}
              </div>
            ) : totalApps === 0 ? (
              <div className="text-center py-6">
                <ClipboardList className="size-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No applications yet.</p>
                <Button size="sm" onClick={() => setView('search')}>Browse jobs</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {statusCounts.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setView('applications')}
                    className="w-full text-left group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{s.label}</span>
                      <span className="text-xs font-semibold">{s.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${s.color} transition-all`}
                        style={{ width: `${(s.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Salary trends widget */}
          <SalaryTrendsWidget branch={profile?.branch} />

          {/* Notifications */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold">Recent activity</h3>
                <p className="text-xs text-muted-foreground">Latest notifications</p>
              </div>
            </div>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-md" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="size-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">You're all caught up.</p>
              </div>
            ) : (
              <div className="space-y-1 -mx-1">
                {notifications.slice(0, 5).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`w-full text-left flex items-start gap-2.5 p-2 rounded-md hover:bg-accent transition-colors ${!n.read ? 'bg-accent/40' : ''}`}
                  >
                    <span className={`size-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-transparent border border-border' : 'bg-primary'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium line-clamp-1">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label, value, icon: Icon, onClick, loading, progress,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  loading?: boolean
  progress?: number
}) {
  return (
    <button onClick={onClick} className="text-left group focus:outline-none">
      <Card className="p-4 card-hover border-border/70 group-hover:border-primary/30 h-full">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-2xl font-bold tracking-tight mt-1">{loading ? '—' : value}</p>
          </div>
          <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="size-4 text-primary" />
          </div>
        </div>
        {typeof progress === 'number' && !loading && (
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </Card>
    </button>
  )
}

function EmptyState({ title, description, cta }: { title: string; description: string; cta?: React.ReactNode }) {
  return (
    <Card className="p-8 border-dashed text-center bg-muted/20">
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm mx-auto">{description}</p>
      {cta}
    </Card>
  )
}

// ---------------- Salary trends widget ----------------
function SalaryTrendsWidget({ branch }: { branch?: string | null }) {
  const setView = useApp((s) => s.setView)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const d = await api.salaryInsights(branch ? { branch } : undefined)
        if (active) setData(d)
      } catch { /* ignore */ }
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [branch])

  const fmtLPA = (n: number) => `₹${(n / 100000).toFixed(1)}L`

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="size-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Salary trends</h3>
            <p className="text-[11px] text-muted-foreground">{branch ? `For ${branch}` : 'Across all branches'}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setView('salary-insights')}>
          Details <ArrowRight className="size-3" />
        </Button>
      </div>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      ) : data && data.total > 0 ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-muted/40">
              <p className="text-[10px] text-muted-foreground">Avg</p>
              <p className="text-sm font-bold text-primary">{fmtLPA(data.summary.avg)}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/40">
              <p className="text-[10px] text-muted-foreground">Median</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{fmtLPA(data.summary.median)}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/40">
              <p className="text-[10px] text-muted-foreground">75th %ile</p>
              <p className="text-sm font-bold text-violet-600 dark:text-violet-400">{fmtLPA(data.summary.p75)}</p>
            </div>
          </div>
          {/* Mini distribution bar */}
          <div>
            <div className="flex items-end gap-1 h-12 mb-1">
              {data.distribution.map((b: any, i: number) => {
                const max = Math.max(...data.distribution.map((x: any) => x.count), 1)
                const h = (b.count / max) * 100
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm transition-all hover:opacity-80"
                    style={{
                      height: `${Math.max(h, 4)}%`,
                      background: `oklch(0.45 0.18 264 / ${0.3 + (h / 100) * 0.7})`,
                    }}
                    title={`${b.label}: ${b.count} jobs`}
                  />
                )
              })}
            </div>
            <p className="text-[10px] text-muted-foreground text-center">Salary distribution · {data.total} jobs</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">No salary data available for your branch yet.</p>
        </div>
      )}
    </Card>
  )
}

// ---------------- Recent searches ----------------
function RecentSearches() {
  const setView = useApp((s) => s.setView)
  const setFilter = useApp((s) => s.setFilter)
  const runSearch = useApp((s) => s.runSearch)
  const [searches, setSearches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.searchHistory()
        if (active) setSearches(res.searches || [])
      } catch { /* ignore */ }
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [])

  const handleClick = (s: any) => {
    let filters: any = { q: s.query, page: 1 }
    try { if (s.filters) filters = { ...JSON.parse(s.filters), q: s.query, page: 1 } } catch {}
    setFilter(filters, { replace: true })
    setView('search')
    runSearch()
  }

  const handleClear = async () => {
    try { await api.clearSearchHistory(); setSearches([]) } catch {}
  }

  if (loading) return null
  if (searches.length === 0) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Clock className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Recent searches</h2>
            <p className="text-xs text-muted-foreground">Quickly re-run a previous search</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={handleClear}>
          Clear
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {searches.slice(0, 8).map((s) => (
          <button
            key={s.id}
            onClick={() => handleClick(s)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card hover:border-primary/40 hover:bg-accent transition-colors text-sm group"
          >
            <Search className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="font-medium">{s.query}</span>
            {s.resultsCount > 0 && <span className="text-xs text-muted-foreground">{s.resultsCount}</span>}
          </button>
        ))}
      </div>
    </section>
  )
}
