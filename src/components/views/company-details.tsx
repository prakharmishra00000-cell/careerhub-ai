'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { JobCard } from '@/components/job-card'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft, CheckCircle2, MapPin, Layers, Users, Building, Globe,
  Building2, Briefcase, ExternalLink, Sparkles, ShieldCheck, Info,
} from 'lucide-react'
import { toast } from 'sonner'
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
