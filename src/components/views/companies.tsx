'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Building2, Search, CheckCircle2, MapPin, Briefcase, ChevronLeft, ChevronRight,
  Building, ShieldCheck, Layers, Users, X, GitCompare,
} from 'lucide-react'
import { toast } from 'sonner'
import type { CompanyListItem } from '@/lib/types'

const INDUSTRIES = [
  'IT', 'Software', 'Finance', 'Healthcare', 'Manufacturing', 'Government',
  'Consulting', 'Design', 'Education', 'Research', 'Logistics', 'Agriculture',
  'Energy', 'Biotechnology',
]

const COMPANY_TYPES = [
  'startup', 'mnc', 'government', 'psu', 'ngo', 'consulting',
  'product', 'service', 'agency', 'research', 'university',
]

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+']

const PAGE_SIZE = 12

function labelize(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function CompaniesView() {
  const openCompany = useApp((s) => s.openCompany)

  const [q, setQ] = useState('')
  const [industry, setIndustry] = useState<string>('')
  const [companyType, setCompanyType] = useState<string>('')
  const [companySize, setCompanySize] = useState<string>('')
  const [verified, setVerified] = useState(false)
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [companies, setCompanies] = useState<CompanyListItem[]>([])
  const [total, setTotal] = useState(0)

  // Fetch with active-flag pattern; refetch when any filter changes
  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.companies({
          q: q || undefined,
          industry: industry || undefined,
          companyType: companyType || undefined,
          companySize: companySize || undefined,
          verified: verified || undefined,
          page,
          pageSize: PAGE_SIZE,
        })
        if (active) {
          setCompanies(res.companies)
          setTotal(res.total)
        }
      } catch (e: any) {
        if (active) toast.error(e?.message || 'Failed to load companies')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [q, industry, companyType, companySize, verified, page])

  // Reset to page 1 whenever any filter changes
  useEffect(() => { setPage(1) }, [q, industry, companyType, companySize, verified])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const activeFilterCount = [industry, companyType, companySize].filter(Boolean).length + (verified ? 1 : 0)

  const clearFilters = () => {
    setIndustry(''); setCompanyType(''); setCompanySize(''); setVerified(false)
  }

  return (
    <div className="flex-1 w-full">
      {/* Header */}
      <div className="border-b border-border bg-card/40 sticky top-16 z-30 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-sm ring-1 ring-primary/20 shrink-0">
              <Building2 className="size-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Companies</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Discover employers hiring across every industry — verified and ready.
              </p>
            </div>
          </div>

          {/* Filters row */}
          <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1 min-w-0">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by company name…"
                className="pl-9 h-10"
              />
              {q && (
                <button
                  onClick={() => setQ('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 size-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:flex gap-2.5">
              <Select value={industry || '_all'} onValueChange={(v) => setIndustry(v === '_all' ? '' : v)}>
                <SelectTrigger className="h-10 w-full sm:w-[150px] text-sm"><SelectValue placeholder="Industry" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All industries</SelectItem>
                  {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={companyType || '_all'} onValueChange={(v) => setCompanyType(v === '_all' ? '' : v)}>
                <SelectTrigger className="h-10 w-full sm:w-[140px] text-sm capitalize"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All types</SelectItem>
                  {COMPANY_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{labelize(t)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={companySize || '_all'} onValueChange={(v) => setCompanySize(v === '_all' ? '' : v)}>
                <SelectTrigger className="h-10 w-full sm:w-[140px] text-sm"><SelectValue placeholder="Size" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All sizes</SelectItem>
                  {COMPANY_SIZES.map((s) => <SelectItem key={s} value={s}>{s} employees</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="col-span-2 sm:flex items-center gap-2 px-3 h-10 rounded-md border border-border bg-card">
                <Switch checked={verified} onCheckedChange={setVerified} id="verified" className="data-[state=checked]:bg-primary" />
                <Label htmlFor="verified" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-primary" /> Verified only
                </Label>
              </div>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">{activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}</span>
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
              >
                <X className="size-3" /> Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 pb-20 lg:pb-12">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading companies…' : (
              <><span className="font-semibold text-foreground">{total.toLocaleString()}</span> {total === 1 ? 'company' : 'companies'} found</>
            )}
          </p>
        </div>

        {loading && companies.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
        ) : companies.length === 0 ? (
          <EmptyCompanies hasFilters={activeFilterCount > 0 || !!q} onClear={() => { clearFilters(); setQ('') }} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((c) => (
                <CompanyCard key={c.id} company={c} onOpen={() => openCompany(c.id)} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="size-4" /> Prev
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page <span className="font-medium text-foreground">{page}</span> of {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Next <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function CompanyCard({ company, onOpen }: { company: CompanyListItem; onOpen: () => void }) {
  const { toggleCompanyCompare, companyCompareIds } = useApp()
  const comparing = companyCompareIds.includes(company.id)
  const initials = company.name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')
  return (
    <Card
      className={`card-hover p-0 overflow-hidden cursor-pointer group border-border/70 hover:border-primary/30 ${comparing ? 'ring-2 ring-violet-500/30 border-violet-500/30' : ''}`}
      onClick={onOpen}
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="size-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-base shrink-0">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="size-full object-cover rounded-xl" />
            ) : initials || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-[15px] leading-snug tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                {company.name}
              </h3>
              <div className="flex items-center gap-0.5 shrink-0">
                {company.verified && <CheckCircle2 className="size-4 text-primary shrink-0" />}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleCompanyCompare(company.id) }}
                  className={`size-7 inline-flex items-center justify-center rounded-full hover:bg-accent transition-colors ${comparing ? 'text-violet-500 bg-accent' : 'text-muted-foreground'}`}
                  title={comparing ? 'Remove from comparison' : 'Add to comparison'}
                  aria-label={comparing ? 'Remove from comparison' : 'Add to comparison'}
                >
                  <GitCompare className="size-3.5" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-muted-foreground">
              {company.industry && <span className="inline-flex items-center gap-1"><Layers className="size-3" /> {company.industry}</span>}
              {company.companySize && <><span className="text-border">·</span><span className="inline-flex items-center gap-1"><Users className="size-3" /> {company.companySize}</span></>}
            </div>
          </div>
        </div>

        {company.description && (
          <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
            {company.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {company.companyType && (
            <Badge variant="secondary" className="text-[11px] bg-accent/60 text-accent-foreground border border-border/60 capitalize px-2 py-0.5">
              {labelize(company.companyType)}
            </Badge>
          )}
          {company.headquarters && (
            <Badge variant="outline" className="text-[11px] px-2 py-0.5">
              <MapPin className="size-3 mr-0.5" /> {company.headquarters}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60">
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <Briefcase className="size-3.5 text-primary" />
            <span className="font-semibold text-foreground">{company.openJobs}</span> open {company.openJobs === 1 ? 'role' : 'roles'}
          </span>
          <span className="text-xs font-medium text-primary group-hover:underline">View →</span>
        </div>
      </div>
    </Card>
  )
}

function EmptyCompanies({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="text-center py-20 px-4">
      <div className="size-14 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
        <Building className="size-7 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-1.5">No companies match</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
        {hasFilters
          ? 'Try removing one or more filters, or broaden your search.'
          : 'No companies are available right now. Please check back soon.'}
      </p>
      {hasFilters && (
        <Button variant="outline" onClick={onClear}>
          <X className="size-4 mr-1.5" /> Clear all filters
        </Button>
      )}
    </div>
  )
}
