'use client'

import { useEffect, useRef, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { FilterSidebar } from '@/components/filter-sidebar'
import { JobCard } from '@/components/job-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SearchBar } from '@/components/search-bar'
import { SORT_OPTIONS } from '@/lib/jobs'
import type { View } from '@/lib/types'
import { toast } from 'sonner'
import { SlidersHorizontal, SearchX, Loader2, Sparkles, Filter, ChevronLeft, ChevronRight, BellPlus, X } from 'lucide-react'

const presetFilters: Record<string, Partial<any>> = {
  internships: { isInternship: true, employmentType: ['internship'] },
  'remote-jobs': { remoteType: ['remote', 'work_from_home'] },
  freshers: { fresherFriendly: true },
  'government-jobs': { companyType: ['government', 'psu'] },
  search: {},
}

const presetTitles: Record<string, { title: string; subtitle: string }> = {
  internships: { title: 'Internships', subtitle: 'Paid & unpaid internships across industries' },
  'remote-jobs': { title: 'Remote jobs', subtitle: 'Work from home and remote-anywhere roles' },
  freshers: { title: 'Fresher jobs', subtitle: 'Roles explicitly open to freshers' },
  'government-jobs': { title: 'Government jobs', subtitle: 'PSU & government recruitment' },
  search: { title: 'All jobs', subtitle: 'Search across every source' },
}

export function SearchView({ preset }: { preset: View }) {
  const { filter, setFilter, runSearch, searchResults, searchLoading, setView, user, openAuth } = useApp()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [alertDialogOpen, setAlertDialogOpen] = useState(false)
  const [alertName, setAlertName] = useState('')
  const [alertFreq, setAlertFreq] = useState('daily')
  const [savingAlert, setSavingAlert] = useState(false)
  const skipDebounceRef = useRef(true)
  const lastPresetRef = useRef<string | null>(null)

  // apply preset filter on mount or preset change
  useEffect(() => {
    if (lastPresetRef.current === preset) return
    lastPresetRef.current = preset
    const pf = presetFilters[preset] || {}
    skipDebounceRef.current = true
    setFilter({ ...pf, page: 1 }, { replace: true })
    // run after a tick so the filter is set
    setTimeout(() => runSearch(), 0)
  }, [preset, setFilter, runSearch])

  // run search whenever filter changes (debounced) — skip the run triggered by preset apply
  useEffect(() => {
    if (skipDebounceRef.current) { skipDebounceRef.current = false; return }
    const t = setTimeout(() => runSearch(), 250)
    return () => clearTimeout(t)
  }, [filter, runSearch])

  // Record search to history when results change and there's a keyword
  useEffect(() => {
    if (!searchResults || searchLoading) return
    const q = filter.q?.trim()
    if (!q) return
    // Debounce recording — only record after results settle
    const t = setTimeout(() => {
      api.recordSearch(q, filter, searchResults.total).catch(() => {})
    }, 1500)
    return () => clearTimeout(t)
  }, [searchResults, searchLoading])

  const meta = presetTitles[preset] || presetTitles.search
  const jobs = searchResults?.jobs ?? []
  const total = searchResults?.total ?? 0
  const page = searchResults?.page ?? 1
  const totalPages = searchResults?.totalPages ?? 1
  const facets = searchResults?.facets

  const sortLabel: Record<string, string> = {
    relevance: 'Relevance', newest: 'Newest', salary_high: 'Salary: high to low',
    salary_low: 'Salary: low to high', best_match: 'Best match', closing_soon: 'Closing soon', recently_updated: 'Recently updated',
  }

  return (
    <div className="flex-1 w-full">
      {/* compact header */}
      <div className="border-b border-border bg-card/40 sticky top-16 z-30 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold tracking-tight truncate">{meta.title}</h1>
              <p className="text-xs text-muted-foreground truncate">{meta.subtitle}</p>
            </div>
            <div className="hidden md:block flex-1 max-w-md">
              <SearchBar size="md" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Select value={filter.sort ?? 'newest'} onValueChange={(v) => setFilter({ sort: v as any, page: 1 })}>
                <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((s) => <SelectItem key={s} value={s} className="text-xs">{sortLabel[s]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden h-9">
                    <SlidersHorizontal className="size-4 mr-1" /> Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[340px] p-0 overflow-y-auto">
                  <div className="p-3">
                    <FilterSidebar facets={facets} onMobileClose={() => setMobileFiltersOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Filters sidebar — desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto scroll-thin pr-1">
              <FilterSidebar facets={facets} />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3 gap-2">
              <p className="text-sm text-muted-foreground">
                {searchLoading ? 'Searching…' : <><span className="font-semibold text-foreground">{total.toLocaleString()}</span> opportunities found</>}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 shrink-0"
                onClick={() => {
                  if (!user) { openAuth('login'); return }
                  setAlertName(buildAlertName(filter, meta.title))
                  setAlertDialogOpen(true)
                }}
              >
                <BellPlus className="size-3.5" /> <span className="hidden sm:inline">Save as alert</span><span className="sm:hidden">Alert</span>
              </Button>
            </div>

            {/* Active filter chips */}
            <ActiveFilterChips filter={filter} onRemove={(key, value) => {
              if (value !== undefined && Array.isArray((filter as any)[key])) {
                setFilter({ [key]: (filter as any)[key].filter((v: string) => v !== value) } as any)
              } else {
                setFilter({ [key]: undefined } as any)
              }
            }} onClearAll={() => { useApp.getState().resetFilter(); runSearch() }} />

            {searchLoading && jobs.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-44 rounded-xl" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-20 px-4">
                <div className="size-14 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                  <SearchX className="size-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-1.5">No jobs found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">Try removing one or more filters, or broadening your search.</p>
                <Button variant="outline" onClick={() => { useApp.getState().resetFilter(); runSearch() }}>Reset all filters</Button>
              </div>
            ) : (
              <>
                <div className="space-y-3 fade-in-stagger">
                  {jobs.map((job) => <JobCard key={job.id} job={job} />)}
                </div>

                {/* pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setFilter({ page: page - 1 })}>
                      <ChevronLeft className="size-4" /> Prev
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">Page <span className="font-medium text-foreground">{page}</span> of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setFilter({ page: page + 1 })}>
                      Next <ChevronRight className="size-4" />
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* demo data notice */}
            {jobs.length > 0 && (
              <p className="text-center text-xs text-muted-foreground/60 mt-8">
                <Badge variant="outline" className="text-[10px] mr-1.5">DEMO DATA</Badge>
                Listings shown are illustrative seed data for demonstration purposes.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Save as alert dialog */}
      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BellPlus className="size-4 text-primary" /> Save this search as an alert</DialogTitle>
            <DialogDescription>Get notified when new jobs match your current filters.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="alert-name" className="text-xs mb-1.5">Alert name</Label>
              <Input id="alert-name" value={alertName} onChange={(e) => setAlertName(e.target.value)} placeholder="e.g. Fresher CSE jobs in Bangalore" />
            </div>
            <div>
              <Label className="text-xs mb-1.5">Frequency</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['instant', 'daily', 'weekly'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setAlertFreq(f)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${alertFreq === f ? 'border-primary bg-accent text-accent-foreground' : 'border-border hover:bg-accent/50'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Current filters:</p>
              <FilterSummary filter={filter} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlertDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!alertName.trim() || savingAlert}
              onClick={async () => {
                setSavingAlert(true)
                try {
                  await api.createAlert({ name: alertName.trim(), query: JSON.stringify(filter), frequency: alertFreq, channels: 'in_app,email' })
                  toast.success('Alert created — you\'ll be notified of new matches')
                  setAlertDialogOpen(false)
                } catch (e: any) { toast.error(e.message) }
                finally { setSavingAlert(false) }
              }}
            >
              {savingAlert ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <BellPlus className="size-4 mr-1.5" />}
              Create alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function buildAlertName(filter: any, fallback: string): string {
  const parts: string[] = []
  if (filter.q) parts.push(filter.q)
  if (filter.degree?.length) parts.push(filter.degree.join('/'))
  if (filter.branch?.length) parts.push(filter.branch.join('/'))
  if (filter.fresherFriendly) parts.push('Fresher')
  if (filter.isInternship) parts.push('Internship')
  if (filter.location) parts.push(filter.location)
  if (filter.remoteType?.length) parts.push(filter.remoteType.join('/'))
  if (filter.minSalary) parts.push(`≥${(filter.minSalary / 100000).toFixed(0)}LPA`)
  return parts.length ? parts.slice(0, 5).join(' • ') : fallback
}

function FilterSummary({ filter }: { filter: any }) {
  const chips: string[] = []
  if (filter.q) chips.push(`Keyword: ${filter.q}`)
  if (filter.location) chips.push(`Location: ${filter.location}`)
  if (filter.degree?.length) chips.push(`Degree: ${filter.degree.join(', ')}`)
  if (filter.branch?.length) chips.push(`Branch: ${filter.branch.join(', ')}`)
  if (filter.employmentType?.length) chips.push(`Type: ${filter.employmentType.join(', ')}`)
  if (filter.remoteType?.length) chips.push(`Work: ${filter.remoteType.join(', ')}`)
  if (filter.fresherFriendly) chips.push('Fresher friendly')
  if (filter.isInternship) chips.push('Internship only')
  if (filter.minSalary) chips.push(`Min ₹${(filter.minSalary / 100000).toFixed(0)} LPA`)
  if (filter.minStipend) chips.push(`Min ₹${filter.minStipend}/mo stipend`)
  if (filter.ppoAvailable) chips.push('PPO available')
  if (filter.source?.length) chips.push(`Sources: ${filter.source.join(', ')}`)
  if (filter.companyType?.length) chips.push(`Company: ${filter.companyType.join(', ')}`)
  if (filter.backlogPolicy?.length) chips.push(`Backlog: ${filter.backlogPolicy.join(', ')}`)
  if (filter.minCgpa) chips.push(`Min CGPA: ${filter.minCgpa}`)
  if (chips.length === 0) return <span className="text-muted-foreground">No active filters</span>
  return (
    <div className="flex flex-wrap gap-1">
      {chips.map((c, i) => (
        <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-background border border-border">{c}</span>
      ))}
    </div>
  )
}

function ActiveFilterChips({ filter, onRemove, onClearAll }: {
  filter: any
  onRemove: (key: string, value?: string) => void
  onClearAll: () => void
}) {
  const chips: { key: string; value?: string; label: string }[] = []
  if (filter.q) chips.push({ key: 'q', label: `"${filter.q}"` })
  if (filter.location) chips.push({ key: 'location', label: filter.location })
  if (filter.degree?.length) filter.degree.forEach((d: string) => chips.push({ key: 'degree', value: d, label: d }))
  if (filter.branch?.length) filter.branch.forEach((b: string) => chips.push({ key: 'branch', value: b, label: b }))
  if (filter.employmentType?.length) filter.employmentType.forEach((t: string) => chips.push({ key: 'employmentType', value: t, label: t.replace(/_/g, ' ') }))
  if (filter.remoteType?.length) filter.remoteType.forEach((r: string) => chips.push({ key: 'remoteType', value: r, label: r.replace(/_/g, ' ') }))
  if (filter.fresherFriendly) chips.push({ key: 'fresherFriendly', label: 'Fresher friendly' })
  if (filter.isInternship === true) chips.push({ key: 'isInternship', label: 'Internship' })
  if (filter.minSalary) chips.push({ key: 'minSalary', label: `≥₹${(filter.minSalary / 100000).toFixed(0)} LPA` })
  if (filter.maxSalary) chips.push({ key: 'maxSalary', label: `≤₹${(filter.maxSalary / 100000).toFixed(0)} LPA` })
  if (filter.minStipend) chips.push({ key: 'minStipend', label: `≥₹${filter.minStipend}/mo` })
  if (filter.ppoAvailable) chips.push({ key: 'ppoAvailable', label: 'PPO' })
  if (filter.source?.length) filter.source.forEach((s: string) => chips.push({ key: 'source', value: s, label: s }))
  if (filter.companyType?.length) filter.companyType.forEach((c: string) => chips.push({ key: 'companyType', value: c, label: c }))
  if (filter.companySize?.length) filter.companySize.forEach((c: string) => chips.push({ key: 'companySize', value: c, label: c }))
  if (filter.companyVerified) chips.push({ key: 'companyVerified', label: 'Verified' })
  if (filter.backlogPolicy?.length) filter.backlogPolicy.forEach((b: string) => chips.push({ key: 'backlogPolicy', value: b, label: b.replace(/_/g, ' ') }))
  if (filter.minCgpa) chips.push({ key: 'minCgpa', label: `CGPA≥${filter.minCgpa}` })
  if (filter.experience) chips.push({ key: 'experience', label: `Exp: ${filter.experience}` })

  if (chips.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-4 pb-3 border-b border-border/60">
      {chips.map((c, i) => (
        <button
          key={`${c.key}-${c.value ?? i}`}
          onClick={() => onRemove(c.key, c.value)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium hover:bg-primary/15 transition-colors group"
        >
          {c.label}
          <X className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      ))}
      <button onClick={onClearAll} className="text-xs text-muted-foreground hover:text-destructive transition-colors ml-1 underline">
        Clear all
      </button>
    </div>
  )
}
