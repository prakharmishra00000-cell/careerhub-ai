'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { JobCard } from '@/components/job-card'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  ArrowLeft, CheckCircle2, MapPin, Layers, Users, Building, Globe,
  Building2, Briefcase, ExternalLink, Sparkles, ShieldCheck, Info,
  Star, Plus, ThumbsUp, ThumbsDown, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { timeAgo } from '@/lib/jobs'
import type { CompanyDetails } from '@/lib/types'

function labelize(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function CompanyDetailsView() {
  const companyId = useApp((s) => s.selectedCompanyId)
  const setView = useApp((s) => s.setView)

  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<CompanyDetails | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!companyId) {
        if (active) { setLoading(false); setError('No company selected'); return }
      }
      setLoading(true)
      setError(null)
      try {
        const c = await api.company(companyId as string)
        if (active) setCompany(c)
      } catch (e: any) {
        if (active) {
          setError(e?.message || 'Failed to load company')
          toast.error(e?.message || 'Failed to load company')
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [companyId])

  if (loading) return <CompanySkeleton />
  if (error || !company) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <Button variant="ghost" size="sm" onClick={() => setView('companies')} className="mb-4">
          <ArrowLeft className="size-4 mr-1.5" /> Back to companies
        </Button>
        <div className="text-center py-16">
          <div className="size-14 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
            <Info className="size-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1.5">Company not available</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
            {error || 'We couldn\'t load this company profile. It may have been removed.'}
          </p>
          <Button variant="outline" onClick={() => setView('companies')}>Browse all companies</Button>
        </div>
      </div>
    )
  }

  const initials = company.name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')

  return (
    <div className="flex-1 w-full pb-20 lg:pb-12">
      {/* Sticky back bar */}
      <div className="border-b border-border bg-card/40 sticky top-16 z-30 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <Button variant="ghost" size="sm" onClick={() => setView('companies')} className="-ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4 mr-1.5" /> Back to companies
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header card */}
            <Card className="p-5 sm:p-6 fade-in">
              <div className="flex items-start gap-4">
                <div className="size-16 sm:size-20 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-xl sm:text-2xl shrink-0">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt={company.name} className="size-full object-cover rounded-2xl" />
                  ) : initials || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{company.name}</h1>
                    {company.verified && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 gap-1 px-2 py-0.5 text-[11px] font-medium">
                        <CheckCircle2 className="size-3" /> Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                    {company.industry && <span className="inline-flex items-center gap-1"><Layers className="size-3.5" /> {company.industry}</span>}
                    {company.companySize && <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {company.companySize} employees</span>}
                    {company.companyType && <span className="inline-flex items-center gap-1 capitalize"><Building className="size-3.5" /> {labelize(company.companyType)}</span>}
                    {company.headquarters && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {company.headquarters}</span>}
                  </div>
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mt-3"
                    >
                      <Globe className="size-4" /> Visit website
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>
            </Card>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon={Briefcase} label="Open jobs" value={company.openJobs} accent="text-primary" />
              <StatCard icon={Layers} label="Industry" value={company.industry || '—'} />
              <StatCard icon={Users} label="Size" value={company.companySize || '—'} />
              <StatCard icon={Building} label="Type" value={company.companyType ? labelize(company.companyType) : '—'} />
            </div>

            {/* About section */}
            <Card className="p-5 sm:p-6">
              <h2 className="text-base font-semibold tracking-tight flex items-center gap-2 mb-3">
                <Info className="size-4 text-primary" /> About {company.name}
              </h2>
              {company.description ? (
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                  {company.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No company description has been published yet.
                </p>
              )}
            </Card>

            {/* Open jobs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold tracking-tight flex items-center gap-2">
                  <Briefcase className="size-4 text-primary" /> Open jobs at {company.name}
                </h2>
                <Badge variant="secondary" className="text-xs bg-muted text-foreground border border-border">{company.openJobs}</Badge>
              </div>
              {company.jobs.length === 0 ? (
                <Card className="p-10 text-center">
                  <div className="size-12 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
                    <Briefcase className="size-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">No open roles right now</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    {company.name} doesn&apos;t have any active job listings at the moment. Check back soon or save an alert to be notified.
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {company.jobs.map((j) => <JobCard key={j.id} job={j} />)}
                </div>
              )}
            </div>

            {/* Reviews section */}
            <CompanyReviews companyId={company.id} companyName={company.name} />
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-32 space-y-4">
              <Card className="p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="size-4 text-primary" /> Quick facts
                </h3>
                <dl className="space-y-3">
                  <FactRow label="Industry" value={company.industry} icon={Layers} />
                  <FactRow label="Company size" value={company.companySize} icon={Users} />
                  <FactRow label="Type" value={company.companyType ? labelize(company.companyType) : null} icon={Building} />
                  <FactRow label="Headquarters" value={company.headquarters} icon={MapPin} />
                  <FactRow label="Website" value={company.website} icon={Globe} href={company.website ?? undefined} />
                  <FactRow label="Open jobs" value={String(company.openJobs)} icon={Briefcase} />
                </dl>
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" /> Verification status
                </h3>
                {company.verified ? (
                  <div className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Verified employer</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        This company has been verified by CareerHub AI. Job listings from verified employers are reviewed for legitimacy.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 text-sm">
                    <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Not verified</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        This company hasn&apos;t completed verification. Always research the employer before applying.
                      </p>
                    </div>
                  </div>
                )}
              </Card>

              {company.openJobs > 0 && (
                <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/30 p-5">
                  <Sparkles className="size-5 text-primary mb-2" />
                  <p className="text-sm font-medium">{company.openJobs} {company.openJobs === 1 ? 'role' : 'roles'} open at {company.name}.</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">
                    Browse the full list of active openings and apply directly.
                  </p>
                  <Button size="sm" className="w-full" onClick={() => useApp.getState().setView('search')}>
                    <Briefcase className="size-3.5 mr-1.5" /> Explore more jobs
                  </Button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode; accent?: string }) {
  return (
    <Card className="p-3.5">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
        <Icon className={`size-3.5 ${accent ?? 'text-muted-foreground'}`} /> {label}
      </div>
      <p className="text-base font-semibold mt-1 truncate">{value}</p>
    </Card>
  )
}

function FactRow({ label, value, icon: Icon, href }: { label: string; value: string | null; icon: React.ComponentType<{ className?: string }>; href?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
        <Icon className="size-3.5" /> {label}
      </dt>
      <dd className="text-xs font-medium text-right min-w-0">
        {value ? (
          href ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all inline-flex items-center gap-1">
              {value} <ExternalLink className="size-3 shrink-0" />
            </a>
          ) : (
            <span className="text-foreground truncate block">{value}</span>
          )
        ) : (
          <span className="text-muted-foreground italic">Not specified</span>
        )}
      </dd>
    </div>
  )
}

function CompanySkeleton() {
  return (
    <div className="flex-1 w-full">
      <div className="border-b border-border bg-card/40 sticky top-16 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <Skeleton className="h-7 w-40" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32 rounded-xl" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
            <Skeleton className="h-48 rounded-xl" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
            </div>
          </div>
          <div className="lg:col-span-1 space-y-4">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------- Company Reviews Section ----------------
function CompanyReviews({ companyId, companyName }: { companyId: string; companyName: string }) {
  const { user, openAuth } = useApp()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('recent')
  const [showForm, setShowForm] = useState(false)
  const [helpfulIds, setHelpfulIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.companyReviews(companyId, sort)
        if (active) setData(res)
      } catch (e: any) { if (active) toast.error(e.message) }
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [companyId, sort])

  const handleHelpful = async (reviewId: string) => {
    if (helpfulIds.has(reviewId)) return
    setHelpfulIds((prev) => new Set(prev).add(reviewId))
    setData((prev: any) => prev ? {
      ...prev,
      reviews: prev.reviews.map((r: any) => r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r),
    } : prev)
    try { await api.markReviewHelpful(companyId, reviewId) } catch {}
  }

  const avg = data?.avgRating ?? 0
  const totalRatings = data?.totalRatings ?? 0
  const distribution = data?.distribution ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold tracking-tight flex items-center gap-2">
          <Star className="size-4 text-primary" /> Reviews
        </h2>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs gap-1.5"
          onClick={() => { if (!user) { openAuth('login'); return } setShowForm(true) }}
        >
          <Plus className="size-3.5" /> Write a review
        </Button>
      </div>

      {/* Rating summary */}
      {loading ? (
        <Card className="p-5"><Skeleton className="h-24" /></Card>
      ) : totalRatings > 0 ? (
        <Card className="p-5 mb-4">
          <div className="flex items-center gap-6">
            {/* Big rating */}
            <div className="text-center shrink-0">
              <div className="text-4xl font-bold text-primary">{avg.toFixed(1)}</div>
              <div className="flex items-center gap-0.5 justify-center mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`size-3.5 ${s <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{totalRatings} review{totalRatings !== 1 ? 's' : ''}</p>
            </div>
            {/* Distribution bars */}
            <div className="flex-1 space-y-1">
              {distribution.map((d: any) => (
                <div key={d.star} className="flex items-center gap-2 text-xs">
                  <span className="w-6 text-muted-foreground flex items-center gap-0.5">{d.star}<Star className="size-2.5 fill-amber-400 text-amber-400" /></span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${totalRatings > 0 ? (d.count / totalRatings) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-6 text-muted-foreground text-right tabular-nums">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      {/* Sort tabs */}
      {totalRatings > 0 && (
        <div className="flex items-center gap-1 mb-3">
          {[
            { key: 'recent', label: 'Most recent' },
            { key: 'helpful', label: 'Most helpful' },
            { key: 'high', label: 'Highest rated' },
            { key: 'low', label: 'Lowest rated' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${sort === s.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : totalRatings === 0 ? (
        <Card className="p-8 text-center dot-pattern">
          <Star className="size-10 mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="font-medium mb-1">No reviews yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
            Be the first to share your experience working at {companyName}.
          </p>
          <Button size="sm" variant="outline" onClick={() => { if (!user) { openAuth('login'); return } setShowForm(true) }}>
            <Plus className="size-3.5 mr-1.5" /> Write the first review
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.reviews.map((r: any) => (
            <Card key={r.id} className="p-4 hover-lift">
              <div className="flex items-start gap-3">
                <Avatar className="size-9 rounded-full border border-border shrink-0">
                  <AvatarFallback className="rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {r.userName === 'Anonymous' ? 'A' : r.userName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{r.userName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`size-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{r.jobTitle ?? r.userRole}</span>
                        {r.employmentStatus && (
                          <>
                            <span className="text-xs text-muted-foreground">·</span>
                            <Badge variant="outline" className="text-[10px] px-1 py-0 capitalize">{r.employmentStatus}</Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{timeAgo(r.createdAt)}</span>
                  </div>
                  <p className="text-sm font-medium mt-2">{r.title}</p>
                  {r.pros && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs">
                      <ThumbsUp className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{r.pros}</span>
                    </div>
                  )}
                  {r.cons && (
                    <div className="mt-1.5 flex items-start gap-1.5 text-xs">
                      <ThumbsDown className="size-3.5 text-destructive shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{r.cons}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border/50">
                    <button
                      onClick={() => handleHelpful(r.id)}
                      disabled={helpfulIds.has(r.id)}
                      className={`inline-flex items-center gap-1 text-xs transition-colors ${helpfulIds.has(r.id) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <ThumbsUp className="size-3" /> Helpful ({r.helpful})
                    </button>
                    {r.workDuration && (
                      <span className="text-xs text-muted-foreground">· {r.workDuration}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Write review dialog */}
      {showForm && (
        <ReviewFormDialog
          companyId={companyId}
          companyName={companyName}
          onClose={() => setShowForm(false)}
          onSubmitted={() => { setShowForm(false); setSort('recent') }}
        />
      )}
    </div>
  )
}

// ---------------- Review Form Dialog ----------------
function ReviewFormDialog({ companyId, companyName, onClose, onSubmitted }: {
  companyId: string
  companyName: string
  onClose: () => void
  onSubmitted: () => void
}) {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [pros, setPros] = useState('')
  const [cons, setCons] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [employmentStatus, setEmploymentStatus] = useState('current')
  const [workDuration, setWorkDuration] = useState('')
  const [userRole, setUserRole] = useState('employee')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!title.trim()) { toast.error('Please add a review title'); return }
    setSubmitting(true)
    try {
      await api.createCompanyReview(companyId, {
        rating, title: title.trim(), pros: pros.trim() || undefined, cons: cons.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined, employmentStatus, workDuration: workDuration.trim() || undefined,
        userRole, isAnonymous,
      })
      toast.success('Review submitted — thank you for sharing!')
      onSubmitted()
    } catch (e: any) { toast.error(e.message) }
    finally { setSubmitting(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Star className="size-4 text-primary" /> Review {companyName}</DialogTitle>
          <DialogDescription>Share your experience working at {companyName}. Your review helps others make career decisions.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Star rating */}
          <div>
            <Label className="text-xs mb-1.5">Your rating</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star className={`size-7 ${(hoverRating || rating) >= s ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} />
                </button>
              ))}
              <span className="ml-2 text-sm font-medium">{rating}/5</span>
            </div>
          </div>
          {/* Title */}
          <div>
            <Label className="text-xs mb-1.5">Review title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summarize your experience" maxLength={200} />
          </div>
          {/* Job title */}
          <div>
            <Label className="text-xs mb-1.5">Your job title (optional)</Label>
            <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Software Engineer" />
          </div>
          {/* Employment status + duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5">Employment status</Label>
              <Select value={employmentStatus} onValueChange={setEmploymentStatus}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Currently working here</SelectItem>
                  <SelectItem value="former">Former employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1.5">Work duration</Label>
              <Input value={workDuration} onChange={(e) => setWorkDuration(e.target.value)} placeholder="e.g. 2 years" />
            </div>
          </div>
          {/* Pros */}
          <div>
            <Label className="text-xs mb-1.5 flex items-center gap-1"><ThumbsUp className="size-3 text-emerald-500" /> Pros</Label>
            <Textarea value={pros} onChange={(e) => setPros(e.target.value)} placeholder="What did you like about working here?" rows={2} />
          </div>
          {/* Cons */}
          <div>
            <Label className="text-xs mb-1.5 flex items-center gap-1"><ThumbsDown className="size-3 text-destructive" /> Cons</Label>
            <Textarea value={cons} onChange={(e) => setCons(e.target.value)} placeholder="What could be improved?" rows={2} />
          </div>
          {/* Anonymous toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <Label className="text-sm font-medium">Post anonymously</Label>
              <p className="text-xs text-muted-foreground">Your name will show as "Anonymous"</p>
            </div>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !title.trim()}>
            {submitting ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Star className="size-4 mr-1.5" />}
            Submit review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
