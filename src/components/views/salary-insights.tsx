'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, PieChart, Pie, Legend,
} from 'recharts'
import { BRANCHES, EMPLOYMENT_TYPES, REMOTE_TYPES } from '@/lib/jobs'
import { employmentTypeLabel, remoteTypeLabel } from '@/lib/jobs'
import {
  TrendingUp, IndianRupee, Users, MapPin, GraduationCap, Briefcase, BarChart3, PieChart as PieIcon,
  ArrowDown, ArrowUp, Filter, DollarSign, Award, Building2, Globe,
} from 'lucide-react'
import { toast } from 'sonner'

const fmtLPA = (n: number) => `₹${(n / 100000).toFixed(1)} LPA`
const fmtLPAShort = (n: number) => `${(n / 100000).toFixed(1)}L`

export function SalaryInsightsView() {
  const { setView } = useApp()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ branch: '', city: '', employmentType: '', remoteType: '' })

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const params: any = {}
        if (filters.branch) params.branch = filters.branch
        if (filters.city) params.city = filters.city
        if (filters.employmentType) params.employmentType = filters.employmentType
        if (filters.remoteType) params.remoteType = filters.remoteType
        const d = await api.salaryInsights(params)
        if (active) setData(d)
      } catch (e: any) { if (active) toast.error(e.message) }
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [filters])

  const summary = data?.summary
  const distribution = data?.distribution ?? []
  const byBranch = (data?.byBranch ?? []).slice(0, 8)
  const byCity = (data?.byCity ?? []).slice(0, 8)
  const byExperience = data?.byExperience ?? []
  const byType = data?.byType ?? []

  const PIE_COLORS = ['oklch(0.45 0.18 264)', 'oklch(0.6 0.14 184)', 'oklch(0.7 0.18 84)', 'oklch(0.55 0.22 330)', 'oklch(0.65 0.2 160)', 'oklch(0.5 0.15 220)']

  return (
    <div className="flex-1 w-full">
      {/* Header */}
      <div className="border-b border-border bg-card/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <TrendingUp className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Salary Insights</h1>
              <p className="text-xs text-muted-foreground">Real-time salary analytics from indexed opportunities</p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Branch</Label>
              <Select value={filters.branch || 'all'} onValueChange={(v) => setFilters((f) => ({ ...f, branch: v === 'all' ? '' : v }))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All branches" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All branches</SelectItem>
                  {BRANCHES.map((b) => <SelectItem key={b} value={b} className="text-xs">{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">City</Label>
              <Input value={filters.city} onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))} placeholder="Any city" className="h-9 text-xs" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Employment</Label>
              <Select value={filters.employmentType || 'all'} onValueChange={(v) => setFilters((f) => ({ ...f, employmentType: v === 'all' ? '' : v }))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All types</SelectItem>
                  {EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t} className="text-xs">{employmentTypeLabel(t)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Work mode</Label>
              <Select value={filters.remoteType || 'all'} onValueChange={(v) => setFilters((f) => ({ ...f, remoteType: v === 'all' ? '' : v }))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All modes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All modes</SelectItem>
                  {REMOTE_TYPES.map((t) => <SelectItem key={t} value={t} className="text-xs">{remoteTypeLabel(t)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        ) : !data || data.total === 0 ? (
          <div className="text-center py-20">
            <TrendingUp className="size-12 mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="font-semibold text-lg mb-1">No salary data for these filters</h3>
            <p className="text-sm text-muted-foreground mb-4">Try removing filters or broadening your criteria.</p>
            <Button variant="outline" onClick={() => setFilters({ branch: '', city: '', employmentType: '', remoteType: '' })}>Reset filters</Button>
          </div>
        ) : (
          <>
            {/* Summary stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <StatCard icon={IndianRupee} label="Average" value={fmtLPA(summary.avg)} sub={`${data.total} jobs`} color="primary" />
              <StatCard icon={TrendingUp} label="Median" value={fmtLPA(summary.median)} sub="50th percentile" color="emerald" />
              <StatCard icon={ArrowDown} label="25th percentile" value={fmtLPA(summary.p25)} sub="Lower quartile" color="amber" />
              <StatCard icon={ArrowUp} label="75th percentile" value={fmtLPA(summary.p75)} sub="Upper quartile" color="violet" />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Distribution histogram */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="size-4 text-primary" />
                  <h3 className="font-semibold text-sm">Salary distribution</h3>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} angle={-15} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                    <Tooltip
                      contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                      labelStyle={{ color: 'var(--foreground)' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {distribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Salary by employment type */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="size-4 text-primary" />
                  <h3 className="font-semibold text-sm">Average by employment type</h3>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={byType.map((t: any) => ({ ...t, avgL: t.avg / 100000, label: employmentTypeLabel(t.type) }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => `${v}L`} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} width={90} />
                    <Tooltip
                      contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(v: any) => [fmtLPA(v * 100000), 'Avg salary']}
                    />
                    <Bar dataKey="avgL" radius={[0, 4, 4, 0]} fill="oklch(0.45 0.18 264)" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Salary by branch */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="size-4 text-primary" />
                  <h3 className="font-semibold text-sm">Top branches by salary</h3>
                </div>
                <div className="space-y-2.5">
                  {byBranch.map((b: any, i: number) => (
                    <div key={b.branch} className="flex items-center gap-3">
                      <div className="w-24 text-xs font-medium truncate shrink-0">{b.branch}</div>
                      <div className="flex-1 relative h-7 bg-muted/50 rounded-lg overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-lg flex items-center justify-end px-2"
                          style={{ width: `${(b.avg / byBranch[0].avg) * 100}%`, background: `oklch(0.45 0.18 264 / ${0.15 + (0.5 * (byBranch.length - i) / byBranch.length)})` }}
                        >
                          <span className="text-[10px] font-semibold text-primary">{fmtLPAShort(b.avg)}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground w-12 text-right shrink-0">{b.count} jobs</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Salary by city */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="size-4 text-primary" />
                  <h3 className="font-semibold text-sm">Top cities by salary</h3>
                </div>
                <div className="space-y-2.5">
                  {byCity.map((c: any, i: number) => (
                    <div key={c.city} className="flex items-center gap-3">
                      <div className="w-24 text-xs font-medium truncate shrink-0">{c.city}</div>
                      <div className="flex-1 relative h-7 bg-muted/50 rounded-lg overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-lg flex items-center justify-end px-2"
                          style={{ width: `${(c.avg / byCity[0].avg) * 100}%`, background: `oklch(0.6 0.14 184 / ${0.15 + (0.5 * (byCity.length - i) / byCity.length)})` }}
                        >
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{fmtLPAShort(c.avg)}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground w-12 text-right shrink-0">{c.count} jobs</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Salary by experience level */}
            <Card className="p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="size-4 text-primary" />
                <h3 className="font-semibold text-sm">Salary by experience level</h3>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={byExperience.map((e: any) => ({ ...e, avgL: e.avg / 100000 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="level" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => `${v}L`} />
                  <Tooltip
                    contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: any) => [fmtLPA(v * 100000), 'Avg salary']}
                  />
                  <Line type="monotone" dataKey="avgL" stroke="oklch(0.45 0.18 264)" strokeWidth={2} dot={{ fill: 'oklch(0.45 0.18 264)', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Range summary */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="size-4 text-primary" />
                <h3 className="font-semibold text-sm">Salary range summary</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <RangeStat label="Minimum" value={fmtLPA(summary.min)} icon={ArrowDown} />
                <RangeStat label="Maximum" value={fmtLPA(summary.max)} icon={ArrowUp} />
                <RangeStat label="Range" value={`${fmtLPAShort(summary.min)}–${fmtLPAShort(summary.max)}`} icon={TrendingUp} />
                <RangeStat label="Jobs analyzed" value={String(data.total)} icon={Users} />
              </div>
              <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5"><Award className="size-3.5 text-primary" /> Based on {data.total} jobs with disclosed salaries. Estimates only — actual offers vary by company, location, negotiation, and individual profile.</p>
              </div>
            </Card>

            <div className="mt-6 text-center">
              <Button onClick={() => setView('search')}>
                Browse all jobs <Briefcase className="size-4 ml-1.5" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  }
  return (
    <Card className="p-4 card-hover">
      <div className={`size-8 rounded-lg flex items-center justify-center mb-2 ${colorMap[color]}`}>
        <Icon className="size-4" />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold tracking-tight">{value}</p>
      <p className="text-[10px] text-muted-foreground/70">{sub}</p>
    </Card>
  )
}

function RangeStat({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="text-center p-3 rounded-lg bg-muted/30">
      <Icon className="size-4 mx-auto text-muted-foreground mb-1" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  )
}
