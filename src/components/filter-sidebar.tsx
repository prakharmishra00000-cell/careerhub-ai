'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import type { JobFilter } from '@/lib/types'
import {
  DEGREES, BRANCHES, EMPLOYMENT_TYPES, REMOTE_TYPES, COMPANY_TYPES, COMPANY_SIZES, BACKLOG_POLICIES, SORT_OPTIONS,
} from '@/lib/jobs'
import { employmentTypeLabel, remoteTypeLabel } from '@/lib/jobs'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, Filter, X, RotateCcw, Sparkles } from 'lucide-react'

interface Props {
  facets?: any
  onMobileClose?: () => void
}

export function FilterSidebar({ facets, onMobileClose }: Props) {
  const { filter, setFilter, resetFilter, runSearch } = useApp()

  const toggleArray = <K extends keyof JobFilter>(key: K, value: string) => {
    const cur = filter[key] as string[] | undefined
    let next: string[] | undefined
    if (!cur) next = [value]
    else if (cur.includes(value)) next = cur.filter((v) => v !== value)
    else next = [...cur, value]
    setFilter({ [key]: next.length ? next : undefined } as any)
  }

  const isOn = (key: keyof JobFilter, value: string) => {
    const cur = filter[key] as string[] | undefined
    return !!cur?.includes(value)
  }

  const activeCount = [
    filter.remoteType, filter.employmentType, filter.degree, filter.branch,
    filter.source, filter.companyType, filter.companySize, filter.backlogPolicy,
  ].filter((a) => a && a.length).length + (filter.fresherFriendly ? 1 : 0) +
    (typeof filter.isInternship === 'boolean' ? 1 : 0) + (filter.minSalary ? 1 : 0) + (filter.maxSalary ? 1 : 0) +
    (filter.minStipend ? 1 : 0) + (filter.ppoAvailable ? 1 : 0) + (filter.minCgpa ? 1 : 0) + (filter.companyVerified ? 1 : 0)

  return (
    <div className="flex flex-col gap-1 text-sm">
      <div className="flex items-center justify-between px-1 py-2 sticky top-0 bg-background/95 backdrop-blur z-10 -mx-1 px-3 mb-1">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <span className="font-semibold">Filters</span>
          {activeCount > 0 && <Badge className="text-[10px] h-5 px-1.5">{activeCount}</Badge>}
        </div>
        <div className="flex items-center gap-1">
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-muted-foreground" onClick={() => { resetFilter(); runSearch() }}>
              <RotateCcw className="size-3 mr-1" /> Reset
            </Button>
          )}
          {onMobileClose && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 lg:hidden" onClick={onMobileClose}><X className="size-4" /></Button>
          )}
        </div>
      </div>

      <FilterSection title="Employment type" defaultOpen>
        <div className="space-y-2">
          {EMPLOYMENT_TYPES.map((t) => (
            <CheckRow key={t} checked={isOn('employmentType', t)} onChange={() => toggleArray('employmentType', t)} label={employmentTypeLabel(t)} count={facets?.employmentTypes?.[t]} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Work mode" defaultOpen>
        <div className="space-y-2">
          {REMOTE_TYPES.map((t) => (
            <CheckRow key={t} checked={isOn('remoteType', t)} onChange={() => toggleArray('remoteType', t)} label={remoteTypeLabel(t)} count={facets?.remoteTypes?.[t]} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Experience">
        <div className="space-y-2">
          {['fresher', '0-1', '1-2', '2-3', '3-5', '5-10', '10+'].map((e) => (
            <button
              key={e}
              onClick={() => setFilter({ experience: filter.experience === e ? undefined : e })}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-sm transition-colors ${filter.experience === e ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50 text-muted-foreground'}`}
            >
              {e === 'fresher' ? 'Fresher (0 yrs)' : e === '10+' ? '10+ years' : `${e} years`}
            </button>
          ))}
          <div className="flex items-center gap-2 pt-1.5">
            <Checkbox id="ff" checked={!!filter.fresherFriendly} onCheckedChange={(c) => setFilter({ fresherFriendly: c === true ? true : undefined })} />
            <Label htmlFor="ff" className="text-sm cursor-pointer flex items-center gap-1.5"><Sparkles className="size-3.5 text-emerald-500" /> Fresher friendly only</Label>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Degree">
        <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto scroll-thin pr-1">
          {DEGREES.map((d) => (
            <CheckRow key={d} checked={isOn('degree', d)} onChange={() => toggleArray('degree', d)} label={d} compact count={facets?.degrees?.[d]} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Branch / Stream">
        <div className="max-h-48 overflow-y-auto scroll-thin pr-1 space-y-2">
          {BRANCHES.map((b) => (
            <CheckRow key={b} checked={isOn('branch', b)} onChange={() => toggleArray('branch', b)} label={b} count={facets?.branches?.[b]} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Salary (annual INR)">
        <div className="space-y-3 px-1">
          <div>
            <Label className="text-xs text-muted-foreground">Min: {filter.minSalary ? `${(filter.minSalary / 100000).toFixed(0)} LPA` : 'Any'}</Label>
            <Slider value={[filter.minSalary ?? 0]} min={0} max={5000000} step={100000} onValueChange={(v) => setFilter({ minSalary: v[0] || undefined })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Max: {filter.maxSalary ? `${(filter.maxSalary / 100000).toFixed(0)} LPA` : 'Any'}</Label>
            <Slider value={[filter.maxSalary ?? 5000000]} min={0} max={5000000} step={100000} onValueChange={(v) => setFilter({ maxSalary: v[0] === 5000000 ? undefined : v[0] })} className="mt-1" />
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Source">
        <div className="space-y-2">
          {['Remotive', 'Arbeitnow', 'Company Website', 'Government Portal'].map((s) => (
            <CheckRow key={s} checked={isOn('source', s)} onChange={() => toggleArray('source', s)} label={s} count={facets?.sources?.[s]} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Company type">
        <div className="space-y-2">
          {COMPANY_TYPES.map((t) => (
            <CheckRow key={t} checked={isOn('companyType', t)} onChange={() => toggleArray('companyType', t)} label={t.charAt(0).toUpperCase() + t.slice(1)} count={facets?.companyTypes?.[t]} />
          ))}
          <div className="flex items-center gap-2 pt-1.5">
            <Checkbox id="cv" checked={!!filter.companyVerified} onCheckedChange={(c) => setFilter({ companyVerified: c === true ? true : undefined })} />
            <Label htmlFor="cv" className="text-sm cursor-pointer">Verified only</Label>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Backlog policy">
        <div className="space-y-2">
          {BACKLOG_POLICIES.map((p) => (
            <CheckRow key={p} checked={isOn('backlogPolicy', p)} onChange={() => toggleArray('backlogPolicy', p)} label={p.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Internship specifics">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Checkbox id="ii" checked={filter.isInternship === true} onCheckedChange={(c) => setFilter({ isInternship: c === true ? true : (c === false ? false : undefined) })} />
            <Label htmlFor="ii" className="text-sm cursor-pointer">Internships only</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="pp" checked={!!filter.ppoAvailable} onCheckedChange={(c) => setFilter({ ppoAvailable: c === true ? true : undefined })} />
            <Label htmlFor="pp" className="text-sm cursor-pointer">PPO available</Label>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Min stipend: {filter.minStipend ? `₹${filter.minStipend}/mo` : 'Any'}</Label>
            <Slider value={[filter.minStipend ?? 0]} min={0} max={50000} step={1000} onValueChange={(v) => setFilter({ minStipend: v[0] || undefined })} className="mt-1" />
          </div>
        </div>
      </FilterSection>

      <FilterSection title="CGPA">
        <div className="space-y-2">
          <div>
            <Label className="text-xs text-muted-foreground">Min CGPA: {filter.minCgpa ?? 'Any'}</Label>
            <Slider value={[filter.minCgpa ?? 0]} min={0} max={10} step={0.5} onValueChange={(v) => setFilter({ minCgpa: v[0] || undefined })} className="mt-1" />
          </div>
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed pt-1">Jobs with no CGPA requirement are always included.</p>
        </div>
      </FilterSection>

      <div className="p-2">
        <Button className="w-full" onClick={() => { runSearch(); onMobileClose?.() }}>Apply filters</Button>
      </div>
    </div>
  )
}

function FilterSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b border-border/60">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-3 hover:bg-accent/30 rounded-md transition-colors">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-3 px-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}

function CheckRow({ checked, onChange, label, count, compact }: { checked: boolean; onChange: () => void; label: string; count?: number; compact?: boolean }) {
  return (
    <label className={`flex items-center justify-between gap-2 ${compact ? '' : 'py-0.5'} cursor-pointer group`}>
      <div className="flex items-center gap-2 min-w-0">
        <Checkbox checked={checked} onCheckedChange={() => onChange()} id={`r-${label}`} />
        <span className={`text-sm truncate group-hover:text-foreground transition-colors ${checked ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{label}</span>
      </div>
      {count != null && count > 0 && <span className="text-[10px] text-muted-foreground/60 tabular-nums shrink-0">{count}</span>}
    </label>
  )
}
