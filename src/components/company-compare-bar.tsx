'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import type { CompanyListItem } from '@/lib/types'
import {
  Dialog, DialogContent, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  GitCompare, X, ExternalLink, Check, Minus, Building2, Users, Globe,
  ShieldCheck, Briefcase, MapPin, Star, TrendingUp,
} from 'lucide-react'

export function CompanyCompareBar() {
  const { companyCompareIds, companyCompareOpen, openCompanyCompare, clearCompanyCompare, toggleCompanyCompare } = useApp()
  if (companyCompareIds.length === 0) return null

  return (
    <>
      {/* Floating bar */}
      <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl slide-in-right">
        <div className="glass-card rounded-2xl shadow-2xl border border-border p-3 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <GitCompare className="size-4 text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">{companyCompareIds.length} compan{companyCompareIds.length > 1 ? 'ies' : 'y'} selected</p>
            <p className="text-xs text-muted-foreground">Compare up to 3 side-by-side</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {companyCompareIds.length >= 2 && (
              <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openCompanyCompare}>
                <GitCompare className="size-3.5" /> Compare
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={clearCompanyCompare} aria-label="Clear comparison">
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      {companyCompareOpen && <CompanyCompareDialog />}
    </>
  )
}

function CompanyCompareDialog() {
  const { companyCompareIds, closeCompanyCompare, toggleCompanyCompare, openCompany } = useApp()
  const [companies, setCompanies] = useState<(CompanyListItem & { website?: string; description?: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const results = await Promise.all(companyCompareIds.map((id) => api.company(id).catch(() => null)))
        if (active) setCompanies(results.filter(Boolean) as any)
      } catch {}
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [companyCompareIds])

  const rows: { label: string; icon: any; get: (c: any) => string; highlight?: boolean }[] = [
    { label: 'Industry', icon: Building2, get: (c) => c.industry || 'Not specified' },
    { label: 'Company size', icon: Users, get: (c) => c.companySize || 'Not specified' },
    { label: 'Type', icon: Building2, get: (c) => c.companyType ? c.companyType.replace(/_/g, ' ') : 'Not specified' },
    { label: 'Headquarters', icon: MapPin, get: (c) => c.headquarters || 'Not specified' },
    { label: 'Verified', icon: ShieldCheck, get: (c) => c.verified ? 'Yes' : 'No' },
    { label: 'Open jobs', icon: Briefcase, get: (c) => String(c.openJobs ?? 0), highlight: true },
    { label: 'Website', icon: Globe, get: (c) => c.website ? 'Available' : 'Not specified' },
  ]

  return (
    <Dialog open onOpenChange={(o) => { if (!o) closeCompanyCompare() }}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-gradient-to-r from-violet-500/5 to-transparent">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <GitCompare className="size-4 text-violet-500" />
            </div>
            <div>
              <DialogTitle className="text-base">Company comparison</DialogTitle>
              <p className="text-xs text-muted-foreground">{companies.length} companies side-by-side</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={closeCompanyCompare}><X className="size-4" /></Button>
        </div>

        <ScrollArea className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : companies.length < 2 ? (
            <div className="p-12 text-center">
              <GitCompare className="size-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Select at least 2 companies to compare.</p>
            </div>
          ) : (
            <div className="p-5">
              {/* Header row */}
              <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: `140px repeat(${companies.length}, minmax(0, 1fr))` }}>
                <div></div>
                {companies.map((c) => (
                  <div key={c.id} className="relative rounded-xl border border-border p-3 bg-card">
                    <button onClick={() => toggleCompanyCompare(c.id)} className="absolute top-1.5 right-1.5 size-6 rounded-full hover:bg-accent flex items-center justify-center text-muted-foreground" aria-label="Remove from comparison">
                      <X className="size-3.5" />
                    </button>
                    <Avatar className="size-9 rounded-lg border border-border mb-2">
                      <AvatarFallback className="rounded-lg bg-violet-500/10 text-violet-500 text-xs font-semibold">{c.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-sm font-semibold leading-tight pr-5 line-clamp-2 mb-1">{c.name}</h3>
                    {c.verified && <Badge variant="outline" className="text-[10px] gap-0.5"><ShieldCheck className="size-2.5" />Verified</Badge>}
                  </div>
                ))}
              </div>

              {/* Comparison rows */}
              <div className="space-y-1">
                {rows.map((row, idx) => (
                  <div key={idx} className={`grid gap-3 items-center rounded-lg ${row.highlight ? 'bg-accent/40' : ''}`} style={{ gridTemplateColumns: `140px repeat(${companies.length}, minmax(0, 1fr))` }}>
                    <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <row.icon className="size-3.5" /> {row.label}
                    </div>
                    {companies.map((c) => (
                      <div key={c.id} className="px-3 py-2 text-sm">
                        <span className={row.highlight ? 'font-semibold text-foreground' : 'text-foreground/80'}>{row.get(c)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Description row */}
              <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: `140px repeat(${companies.length}, minmax(0, 1fr))` }}>
                <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <Building2 className="size-3.5" /> About
                </div>
                {companies.map((c) => (
                  <div key={c.id} className="px-3 py-2 text-xs text-muted-foreground leading-relaxed line-clamp-4">
                    {c.description || 'No description available'}
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="mt-5 grid gap-3" style={{ gridTemplateColumns: `140px repeat(${companies.length}, minmax(0, 1fr))` }}>
                <div></div>
                {companies.map((c) => (
                  <div key={c.id} className="px-3">
                    <Button
                      size="sm"
                      className="w-full text-xs gap-1.5"
                      onClick={() => { openCompany(c.id); closeCompanyCompare() }}
                    >
                      View details <ExternalLink className="size-3" />
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
