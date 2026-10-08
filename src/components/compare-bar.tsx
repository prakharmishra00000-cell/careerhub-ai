'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import type { JobCardData } from '@/lib/types'
import {
  Dialog, DialogContent, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  GitCompare, X, ExternalLink, Check, Minus, AlertTriangle, CheckCircle2,
  MapPin, Briefcase, GraduationCap, Clock, IndianRupee, Sparkles, Trophy, Building2, ShieldCheck, Award,
} from 'lucide-react'
import { formatSalary, formatStipend, timeAgo, daysUntil, freshnessLabel, employmentTypeLabel, remoteTypeLabel } from '@/lib/jobs'

export function CompareBar() {
  const { compareIds, compareOpen, openCompare, clearCompare, toggleCompare } = useApp()

  if (compareIds.length === 0) return null

  return (
    <>
      {/* Floating bar */}
      <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl slide-in-right">
        <div className="glass-card rounded-2xl shadow-2xl border border-border p-3 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <GitCompare className="size-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">{compareIds.length} job{compareIds.length > 1 ? 's' : ''} selected</p>
            <p className="text-xs text-muted-foreground">Compare up to 3 side-by-side</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {compareIds.length >= 2 && (
              <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openCompare}>
                <GitCompare className="size-3.5" /> Compare
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={clearCompare} aria-label="Clear comparison">
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Comparison dialog */}
      {compareOpen && <CompareDialog />}
    </>
  )
}

function CompareDialog() {
  const { compareIds, closeCompare, toggleCompare, openJob } = useApp()
  const [jobs, setJobs] = useState<JobCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const results = await Promise.all(compareIds.map((id) => api.job(id).catch(() => null)))
        if (active) setJobs(results.filter(Boolean) as JobCardData[])
      } catch { /* ignore */ }
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [compareIds])

  const rows: CompareRow[] = [
    { label: 'Company', icon: Building2, get: (j) => j.companyName },
    { label: 'Location', icon: MapPin, get: (j) => [j.city, j.state].filter(Boolean).join(', ') || '—' },
    { label: 'Work mode', icon: Briefcase, get: (j) => j.remoteType ? remoteTypeLabel(j.remoteType) : '—' },
    { label: 'Employment type', icon: Briefcase, get: (j) => j.employmentType ? employmentTypeLabel(j.employmentType) : '—' },
    { label: 'Experience', icon: Clock, get: (j) => {
      if (j.experienceMin == null && j.experienceMax == null) return 'Not specified'
      if (j.experienceMin === 0 && j.experienceMax === 0) return 'Fresher'
      if (j.experienceMin === j.experienceMax) return `${j.experienceMin} year(s)`
      return `${j.experienceMin}–${j.experienceMax} years`
    } },
    { label: 'Salary', icon: IndianRupee, get: (j) => j.isInternship ? formatStipend(j.stipendMin, j.stipendMax, j.internshipPaid) : formatSalary(j.salaryMin, j.salaryMax, j.salaryCurrency, j.salaryPeriod, j.salaryDisclosed), highlight: true },
    { label: 'Degree', icon: GraduationCap, get: (j) => j.degree || 'Not specified' },
    { label: 'Branch', icon: GraduationCap, get: (j) => j.branch || 'Not specified' },
    { label: 'Fresher friendly', icon: Sparkles, get: (j) => j.fresherFriendly ? 'Yes' : 'No', boolean: true },
    { label: 'PPO available', icon: Trophy, get: (j) => j.ppoAvailable ? 'Yes' : 'No', boolean: true },
    { label: 'Posted', icon: Clock, get: (j) => timeAgo(j.postedAt) },
    { label: 'Deadline', icon: AlertTriangle, get: (j) => {
      const d = daysUntil(j.applicationDeadline)
      if (d == null) return 'Not specified'
      if (d < 0) return 'Closed'
      return `in ${d} days`
    } },
    { label: 'Source', icon: ShieldCheck, get: (j) => j.sourceName || 'Direct' },
  ]

  return (
    <Dialog open onOpenChange={(o) => { if (!o) closeCompare() }}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <GitCompare className="size-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">Job comparison</DialogTitle>
              <p className="text-xs text-muted-foreground">{jobs.length} jobs side-by-side</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={closeCompare}><X className="size-4" /></Button>
        </div>

        <ScrollArea className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : jobs.length < 2 ? (
            <div className="p-12 text-center">
              <GitCompare className="size-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Select at least 2 jobs to compare.</p>
            </div>
          ) : (
            <div className="p-5">
              {/* Header row with job titles + remove buttons */}
              <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: `140px repeat(${jobs.length}, minmax(0, 1fr))` }}>
                <div></div>
                {jobs.map((j) => (
                  <div key={j.id} className="relative rounded-xl border border-border p-3 bg-card">
                    <button
                      onClick={() => toggleCompare(j.id)}
                      className="absolute top-1.5 right-1.5 size-6 rounded-full hover:bg-accent flex items-center justify-center text-muted-foreground"
                      aria-label="Remove from comparison"
                    >
                      <X className="size-3.5" />
                    </button>
                    <Avatar className="size-9 rounded-lg border border-border mb-2">
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-semibold">{j.companyName.split(' ').slice(0, 2).map((w) => w[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-sm font-semibold leading-tight pr-5 line-clamp-2 mb-1">{j.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{j.companyName}</p>
                    {j.companyVerified && <Badge variant="outline" className="mt-1 text-[10px] gap-0.5"><CheckCircle2 className="size-2.5" />Verified</Badge>}
                  </div>
                ))}
              </div>

              {/* Comparison rows */}
              <div className="space-y-1">
                {rows.map((row, idx) => (
                  <div key={idx} className={`grid gap-3 items-center rounded-lg ${row.highlight ? 'bg-accent/40' : ''}`} style={{ gridTemplateColumns: `140px repeat(${jobs.length}, minmax(0, 1fr))` }}>
                    <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <row.icon className="size-3.5" /> {row.label}
                    </div>
                    {jobs.map((j) => {
                      const val = row.get(j)
                      const isBool = row.boolean
                      const isTrue = isBool && val === 'Yes'
                      const isFalse = isBool && val === 'No'
                      return (
                        <div key={j.id} className="px-3 py-2 text-sm">
                          {isBool ? (
                            <span className={`inline-flex items-center gap-1 ${isTrue ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                              {isTrue ? <Check className="size-3.5" /> : <Minus className="size-3.5" />}
                              {val}
                            </span>
                          ) : row.highlight ? (
                            <span className="font-semibold text-foreground">{val}</span>
                          ) : (
                            <span className="text-foreground/80">{val}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Skills row */}
              <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: `140px repeat(${jobs.length}, minmax(0, 1fr))` }}>
                <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <Award className="size-3.5" /> Skills
                </div>
                {jobs.map((j) => (
                  <div key={j.id} className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {j.skills.slice(0, 6).map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px] py-0">{s}</Badge>
                      ))}
                      {j.skills.length === 0 && <span className="text-xs text-muted-foreground">Not specified</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Apply buttons */}
              <div className="mt-5 grid gap-3" style={{ gridTemplateColumns: `140px repeat(${jobs.length}, minmax(0, 1fr))` }}>
                <div></div>
                {jobs.map((j) => (
                  <div key={j.id} className="px-3 space-y-2">
                    <Button
                      size="sm"
                      className="w-full text-xs gap-1.5"
                      onClick={() => { openJob(j.id); closeCompare() }}
                    >
                      View details <ExternalLink className="size-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs gap-1.5"
                      onClick={() => {
                        if (j.sourceUrl) window.open(j.sourceUrl, '_blank', 'noopener,noreferrer')
                      }}
                    >
                      Apply on {j.sourceName || 'source'} <ExternalLink className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

interface CompareRow {
  label: string
  icon: any
  get: (j: JobCardData) => string
  boolean?: boolean
  highlight?: boolean
}
