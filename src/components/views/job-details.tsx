'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import type { JobDetails as JobDetailsType, MatchScore } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft, MapPin, Briefcase, Clock, Building2, CheckCircle2, AlertTriangle, ExternalLink,
  Bookmark, BookmarkCheck, Flag, Share2, Calendar, IndianRupee, GraduationCap, Sparkles,
  Trophy, Bot, Loader2, ShieldCheck, RefreshCw, AlertCircle, Lightbulb, Check, X,
} from 'lucide-react'
import { formatSalary, formatStipend, timeAgo, daysUntil, freshnessLabel, employmentTypeLabel, remoteTypeLabel } from '@/lib/jobs'
import { toast } from 'sonner'

export function JobDetailsView() {
  const { selectedJobId, setView, openCompany, user, saveJob, unsaveJob, applyJob, openAuth, bumpSaved, bumpApplications } = useApp()
  const [job, setJob] = useState<JobDetailsType | null>(null)
  const [match, setMatch] = useState<MatchScore | null>(null)
  const [matchText, setMatchText] = useState<{ summary: string; strengths: string[]; gaps: string[]; warnings: string[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [applied, setApplied] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [matchLoading, setMatchLoading] = useState(false)

  useEffect(() => {
    if (!selectedJobId) return
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const j = await api.job(selectedJobId)
        if (!active) return
        setJob(j)
        setSaved(!!j.savedByMe)
        setApplied(!!j.appliedByMe)
      } catch (e: any) { if (active) toast.error(e.message) }
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [selectedJobId])

  // load match score for candidate
  useEffect(() => {
    if (!job || user?.role !== 'candidate' || match || matchLoading) return
    let active = true
    const load = async () => {
      setMatchLoading(true)
      try { const m = await api.jobMatch(job.id); if (active) setMatch(m) }
      catch { /* ignore */ }
      finally { if (active) setMatchLoading(false) }
    }
    load()
    return () => { active = false }
  }, [job, user])

  if (loading) {
    return (
      <div className="flex-1 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4"><Skeleton className="h-64" /><Skeleton className="h-96" /></div>
          <div className="space-y-4"><Skeleton className="h-80" /><Skeleton className="h-40" /></div>
        </div>
      </div>
    )
  }
  if (!job) return null

  const deadline = daysUntil(job.applicationDeadline)
  const handleSave = async () => {
    if (!user) { openAuth('login'); return }
    if (saved) { await unsaveJob(job.id); setSaved(false) }
    else { await saveJob(job.id); setSaved(true) }
  }
  const handleApply = async () => {
    if (!user) { openAuth('login'); return }
    await applyJob(job.id, job.sourceName ?? undefined)
    setApplied(true)
    window.open(job.sourceUrl ?? '#', '_blank', 'noopener,noreferrer')
    api.clickJob(job.id).catch(() => {})
  }

  const getMatchColor = (t: number) => t >= 85 ? 'text-emerald-600 dark:text-emerald-400' : t >= 70 ? 'text-primary' : t >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
  const getMatchProgress = (t: number) => t >= 85 ? 'bg-emerald-500' : t >= 70 ? 'bg-primary' : t >= 50 ? 'bg-amber-500' : 'bg-muted-foreground'

  return (
    <div className="flex-1 w-full">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
        <button onClick={() => history.length > 1 ? history.back() : setView('search')} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="size-4" /> Back to results
        </button>

        {job.isDemo && (
          <div className="mb-4 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span><strong>Demo data.</strong> This listing is illustrative seed data for demonstration only.</span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-5">
            {/* header card */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="size-14 rounded-xl border border-border bg-muted shrink-0">
                  <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-lg font-semibold">{job.companyName.split(' ').slice(0, 2).map((w) => w[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">{job.title}</h1>
                      <button onClick={() => openCompany(job.companyId ?? '')} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mt-1 transition-colors">
                        <Building2 className="size-4" /> {job.companyName}
                        {job.companyVerified && <ShieldCheck className="size-3.5 text-primary" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="size-9 rounded-full" onClick={() => {
                        const url = `${window.location.origin}/#job/${job.id}`
                        navigator.clipboard.writeText(url); toast.success('Link copied')
                      }}>
                        <Share2 className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className={`size-9 rounded-full ${saved ? 'text-primary' : ''}`} onClick={handleSave}>
                        {saved ? <BookmarkCheck className="size-4 fill-current" /> : <Bookmark className="size-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-sm text-muted-foreground">
                    {job.city && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{job.city}{job.state ? `, ${job.state}` : ''}</span>}
                    {job.remoteType && <span className="inline-flex items-center gap-1.5"><Briefcase className="size-4" />{remoteTypeLabel(job.remoteType)}</span>}
                    {job.employmentType && <span className="inline-flex items-center gap-1.5"><Briefcase className="size-4" />{employmentTypeLabel(job.employmentType)}</span>}
                    {typeof job.experienceMin === 'number' && <span className="inline-flex items-center gap-1.5"><Sparkles className="size-4" />{job.experienceMin === 0 && job.experienceMax === 0 ? 'Fresher' : job.experienceMin === job.experienceMax ? `${job.experienceMin}y exp` : `${job.experienceMin}–${job.experienceMax}y exp`}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {job.fresherFriendly && <Badge className="gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/15"><Sparkles className="size-3" />Fresher friendly</Badge>}
                    {job.ppoAvailable && <Badge className="gap-1 bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20"><Trophy className="size-3" />PPO available</Badge>}
                    {job.sourceName && <Badge variant="outline" className="gap-1">via {job.sourceName}</Badge>}
                  </div>
                </div>
              </div>
            </Card>

            {/* description */}
            <Card className="p-6">
              <h2 className="text-base font-semibold mb-3">Job overview</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{job.description}</p>
              {job.responsibilities && (
                <>
                  <Separator className="my-5" />
                  <h3 className="text-sm font-semibold mb-2">Responsibilities</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{job.responsibilities}</p>
                </>
              )}
              {job.requirements && (
                <>
                  <Separator className="my-5" />
                  <h3 className="text-sm font-semibold mb-2">Requirements</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{job.requirements}</p>
                </>
              )}
            </Card>

            {/* skills */}
            {job.skills.length > 0 && (
              <Card className="p-6">
                <h2 className="text-base font-semibold mb-3">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s) => <Badge key={s} variant="secondary" className="text-sm py-1 px-2.5 bg-muted">{s}</Badge>)}
                </div>
              </Card>
            )}

            {/* eligibility confidence */}
            <Card className="p-6">
              <h2 className="text-base font-semibold mb-1 flex items-center gap-2"><ShieldCheck className="size-4 text-primary" />Eligibility summary</h2>
              <p className="text-xs text-muted-foreground mb-4">Honest assessment — we never fabricate eligibility.</p>
              <div className="space-y-2">
                <EligRow ok label="Degree requirement" value={job.degree ? job.degree : 'Not specified'} />
                <EligRow ok={!!job.branch} label="Branch requirement" value={job.branch ?? 'Not specified'} />
                <EligRow ok label="Fresher policy" value={job.fresherFriendly ? 'Freshers welcome' : job.experienceMin === 0 ? 'No minimum experience' : `${job.experienceMin ?? 0}+ years required`} />
                <EligRow ok label="Location" value={job.city ? `${job.city}, ${job.country ?? 'India'}` : 'Not specified'} />
                <EligRow warn={job.backlogPolicy === 'not_specified'} ok={job.backlogPolicy !== 'not_allowed'} label="Backlog policy" value={job.backlogPolicy ? job.backlogPolicy.replace(/_/g, ' ') : 'Not specified'} />
                <EligRow warn={job.cgpaRequirement == null} ok={job.cgpaRequirement == null || job.cgpaRequirement > 0} label="CGPA requirement" value={job.cgpaRequirement != null ? `Min ${job.cgpaRequirement}` : 'Not specified'} />
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Apply card */}
            <Card className="p-5 sticky top-20">
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1">{job.isInternship ? 'Stipend' : 'Salary'}</p>
                {job.isInternship ? (
                  <p className="text-xl font-bold">{formatStipend(job.stipendMin, job.stipendMax, job.internshipPaid)}</p>
                ) : (
                  <p className="text-xl font-bold">{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod, job.salaryDisclosed)}</p>
                )}
                {job.isInternship && job.internshipDurationMonths && <p className="text-xs text-muted-foreground mt-0.5">{job.internshipDurationMonths} months duration</p>}
              </div>

              <div className="space-y-2.5 text-sm border-t border-border pt-3 mb-4">
                {job.applicationDeadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="size-3.5" /> Deadline</span>
                    <span className={`font-medium ${deadline != null && deadline <= 5 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                      {deadline != null ? deadline > 0 ? `in ${deadline} days` : 'closed' : 'Not specified'}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="size-3.5" /> Posted</span>
                  <span className="font-medium">{timeAgo(job.postedAt)}</span>
                </div>
                {job.lastVerifiedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5"><RefreshCw className="size-3.5" /> Verified</span>
                    <span className="font-medium">{freshnessLabel(job.postedAt, job.lastVerifiedAt)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Building2 className="size-3.5" /> Source</span>
                  <span className="font-medium">{job.sourceName ?? 'Direct'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><GraduationCap className="size-3.5" /> Education</span>
                  <span className="font-medium">{job.degree ?? 'Not specified'}</span>
                </div>
              </div>

              <Button className="w-full mb-2 gap-1.5" size="lg" onClick={handleApply}>
                {applied ? 'Applied ✓' : `Apply on ${job.sourceName ?? 'source'}`} <ExternalLink className="size-4" />
              </Button>
              <Button variant="outline" className="w-full gap-1.5" onClick={handleSave}>
                {saved ? <><BookmarkCheck className="size-4 fill-current" /> Saved</> : <><Bookmark className="size-4" /> Save job</>}
              </Button>
              <Button variant="ghost" size="sm" className="w-full mt-1 text-xs text-muted-foreground" onClick={() => setReportOpen(true)}>
                <Flag className="size-3 mr-1" /> Report this job
              </Button>
              <p className="text-[11px] text-muted-foreground/70 text-center mt-3 leading-relaxed">
                You will be redirected to the original source to complete your application.
              </p>
            </Card>

            {/* Match score */}
            {user?.role === 'candidate' && (
              <Card className="p-5">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3"><Bot className="size-4 text-primary" />Your match score</h3>
                {matchLoading ? (
                  <div className="flex items-center justify-center py-6"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
                ) : match ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`text-4xl font-bold ${getMatchColor(match.total)}`}>{match.total}%</div>
                      <div>
                        <Badge className={`${getMatchColor(match.total)} bg-transparent border-0 p-0 text-xs font-semibold`}>{match.label}</Badge>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Based on your profile</p>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { label: 'Education', v: match.breakdown.education },
                        { label: 'Skills', v: match.breakdown.skills },
                        { label: 'Experience', v: match.breakdown.experience },
                        { label: 'Location', v: match.breakdown.location },
                        { label: 'Salary', v: match.breakdown.salary },
                        { label: 'Career fit', v: match.breakdown.career },
                      ].map((b) => (
                        <div key={b.label}>
                          <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{b.label}</span><span className="font-medium">{b.v}%</span></div>
                          <Progress value={b.v} className={`h-1.5 [&>div]:${getMatchProgress(b.v)}`} />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-border space-y-1.5">
                      {match.eligibility?.map((e: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          {e.ok ? <Check className="size-3.5 text-emerald-500 shrink-0 mt-0.5" /> : e.warn ? <AlertTriangle className="size-3.5 text-amber-500 shrink-0 mt-0.5" /> : <X className="size-3.5 text-destructive shrink-0 mt-0.5" />}
                          <span className={e.ok ? 'text-muted-foreground' : e.warn ? 'text-amber-700 dark:text-amber-300' : 'text-destructive'}>{e.label}</span>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3 text-xs gap-1.5" onClick={async () => {
                      try { const r = await api.aiMatchScore(job.id); setMatchText({ summary: r.summary, strengths: r.strengths, gaps: r.gaps, warnings: r.eligibilityWarnings }); }
                      catch { toast.error('AI analysis unavailable') }
                    }}>
                      <Lightbulb className="size-3.5" /> Get AI explanation
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Sign in and complete your profile to see your match score.</p>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Report dialog */}
      <ReportDialog job={job} open={reportOpen} onOpenChange={setReportOpen} />

      {/* AI match text modal */}
      {matchText && (
        <Dialog open onOpenChange={() => setMatchText(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Lightbulb className="size-4 text-primary" />AI match explanation</DialogTitle>
              <DialogDescription>Honest assessment of how this job fits your profile.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm leading-relaxed">{matchText.summary}</p>
              {matchText.strengths.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">Strengths</p>
                  <ul className="space-y-1">{matchText.strengths.map((s, i) => <li key={i} className="text-sm flex items-start gap-2"><Check className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />{s}</li>)}</ul>
                </div>
              )}
              {matchText.gaps.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">Gaps</p>
                  <ul className="space-y-1">{matchText.gaps.map((s, i) => <li key={i} className="text-sm flex items-start gap-2"><AlertTriangle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />{s}</li>)}</ul>
                </div>
              )}
              {matchText.warnings.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-destructive mb-2">Eligibility warnings</p>
                  <ul className="space-y-1">{matchText.warnings.map((s, i) => <li key={i} className="text-sm flex items-start gap-2"><AlertCircle className="size-3.5 text-destructive shrink-0 mt-0.5" />{s}</li>)}</ul>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function EligRow({ label, value, ok = true, warn = false }: { label: string; value: string; ok?: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`flex items-center gap-1.5 font-medium ${warn ? 'text-amber-600 dark:text-amber-400' : ok ? 'text-foreground' : 'text-destructive'}`}>
        {warn ? <AlertTriangle className="size-3.5" /> : ok ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <X className="size-3.5" />}
        {value}
      </span>
    </div>
  )
}

function ReportDialog({ job, open, onOpenChange }: { job: JobDetailsType; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const reasons = ['Expired job', 'Fake / scam', 'Incorrect information', 'Wrong salary', 'Wrong eligibility', 'Duplicate', 'Broken application link', 'Suspicious']

  const submit = async () => {
    setSubmitting(true)
    try { await api.reportJob(job.id, { reason, details }); toast.success('Report submitted. Thank you.'); onOpenChange(false); setReason(''); setDetails('') }
    catch (e: any) { toast.error(e.message) }
    finally { setSubmitting(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this job</DialogTitle>
          <DialogDescription>Help us keep the platform accurate. Your report goes to our moderation team.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs mb-1.5">Reason</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {reasons.map((r) => (
                <button key={r} onClick={() => setReason(r)} className={`text-xs px-2.5 py-1.5 rounded-lg border text-left transition-colors ${reason === r ? 'border-primary bg-accent text-accent-foreground' : 'border-border hover:bg-accent/50'}`}>{r}</button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="rd" className="text-xs mb-1.5">Additional details (optional)</Label>
            <Textarea id="rd" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="What's wrong with this listing?" rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!reason || submitting}>{submitting ? <Loader2 className="size-4 animate-spin" /> : null} Submit report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
