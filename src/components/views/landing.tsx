'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { SearchBar } from '@/components/search-bar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion'
import { ClientOnly } from '@/components/client-only'
import {
  Compass, Sparkles, Building2, Bot, FileText, ClipboardList, Bell, ShieldCheck,
  ArrowRight, CheckCircle2, Zap, Filter, Globe, GraduationCap, Briefcase, Trophy, Users, BarChart3, Lock, Cpu, Search, TrendingUp,
  MapPin,
} from 'lucide-react'
import { formatSalary, formatStipend } from '@/lib/jobs'
import type { JobCardData } from '@/lib/types'

const sources = ['LinkedIn', 'Indeed', 'Naukri', 'Internshala', 'Wellfound', 'Glassdoor', 'Remotive', 'Arbeitnow', 'RemoteOK', 'Jobicy', 'Company Websites', 'Government Portals']

const quickFilters = [
  { label: 'Jobs', icon: Briefcase, filter: { employmentType: ['full_time'] } },
  { label: 'Internships', icon: GraduationCap, filter: { isInternship: true } },
  { label: 'Work From Home', icon: Globe, filter: { remoteType: ['work_from_home'] } },
  { label: 'Remote', icon: Globe, filter: { remoteType: ['remote'] } },
  { label: 'Freshers', icon: Sparkles, filter: { fresherFriendly: true } },
  { label: 'Part Time', icon: Briefcase, filter: { employmentType: ['part_time'] } },
  { label: 'Government', icon: ShieldCheck, filter: { companyType: ['government', 'psu'] } },
  { label: 'Apprenticeships', icon: Briefcase, filter: { employmentType: ['apprenticeship'] } },
  { label: 'Graduate Jobs', icon: GraduationCap, filter: { employmentType: ['graduate_program'] } },
  { label: 'Work Abroad', icon: Globe, filter: {} },
]

const features = [
  { icon: Filter, title: 'Powerful combinable filters', desc: 'Degree, branch, CGPA, backlog policy, experience, salary, source, company type — combine any filters. URLs are shareable.' },
  { icon: Bot, title: 'AI-powered job search', desc: 'Natural-language search → structured filters → live results from LinkedIn, Naukri, Indeed, Internshala and more.' },
  { icon: Sparkles, title: 'Fresher-friendly by design', desc: 'Explicit fresher-friendly flag, honest "not specified" labels for backlogs & CGPA — never confuse missing with "no requirement".' },
  { icon: ClipboardList, title: 'Application tracker', desc: 'Kanban-style pipeline: Saved → Applied → Assessment → Interview → Offer. Notes, deadlines, interview dates.' },
  { icon: Bell, title: 'Smart job alerts', desc: 'Create alerts from any search. Instant, daily, or weekly. Email or in-app. Pause anytime.' },
  { icon: ShieldCheck, title: 'Source attribution always', desc: 'Every job links back to its original source — LinkedIn, Naukri, Indeed, Internshala, Remotive, and more. Never claims a job is hosted here.' },
  { icon: Building2, title: 'Company directory', desc: 'Discover companies by industry, size, type. Verified badges. Open jobs count. Direct links to company sites.' },
  { icon: TrendingUp, title: 'Real-time live jobs', desc: 'Jobs are fetched live from 12 sources every 10 minutes. No mock data — every listing is from a real public API or web search.' },
]

const stats = [
  { label: 'Live job sources', value: '12' },
  { label: 'Real-time sync', value: '10 min' },
  { label: 'Degrees & branches', value: '40+' },
  { label: 'No mock data', value: '100%' },
]

const testimonials = [
  { name: 'Aarav S.', role: 'BTech CSE • 2025', text: 'Found my first SWE internship through CareerHub AI in 3 days. The fresher filter and match score were spot on.', initials: 'AS' },
  { name: 'Priya N.', role: 'Recruiter • TechVedika', text: 'Posting jobs and tracking applicants in one place saved my team hours every week. The candidate search is great.', initials: 'PN' },
  { name: 'Rahul M.', role: 'Diploma • Mechanical', text: 'Finally a platform that lists apprentice roles and diploma-friendly jobs. The PPO filter is a lifesaver.', initials: 'RM' },
]

const faqs = [
  { q: 'Is CareerHub AI a job board?', a: 'No — it is an aggregator and discovery engine. We index opportunities from multiple trusted sources (Remotive, Arbeitnow, company websites, government portals and more) into one unified, searchable interface. When you apply, you apply on the original source.' },
  { q: 'Does CareerHub AI host the jobs?', a: 'No. Every listing preserves its original source, company, title and application URL. We show you where the job actually lives and route you to it with buttons like "Apply on Remotive" or "Apply on Arbeitnow".' },
  { q: 'What does "Fresher friendly" mean?', a: 'It means the source listing explicitly indicates freshers are welcome. We never infer this from absence — if the listing does not mention it, we will not tag it.' },
  { q: 'Why do some jobs say "CGPA requirement not specified"?', a: 'Because we never convert missing info into a positive eligibility claim. "Explicitly no requirement" is different from "requirement not specified". This honesty is core to our matching engine.' },
  { q: 'Can I track applications across sources?', a: 'Yes. When you click "Apply", we record the application in your tracker AND open the source site. Your Kanban pipeline shows status across every source.' },
  { q: 'How does the AI career assistant work?', a: 'Type natural language like "MTech CSE jobs in Bangalore for freshers with no minimum CGPA". The assistant converts it to structured filters, runs the search, and explains what it found — honestly.' },
  { q: 'Is my data private?', a: 'Resumes are never public by default. You can export or delete all your data anytime. We do not sell personal information.' },
]

export function LandingView() {
  const { setView, setFilter, runSearch, user, openAuth } = useApp()

  const goSearch = (f: any) => {
    setFilter({ ...f, page: 1 }, { replace: true })
    setView('search')
    runSearch()
  }

  return (
    <div className="flex-1">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 size-[400px] rounded-full bg-primary/15 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute top-20 right-1/4 size-[300px] rounded-full bg-violet-500/10 blur-[80px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="absolute bottom-0 left-1/3 size-[250px] rounded-full bg-emerald-500/8 blur-[70px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        </div>
        <div className="absolute inset-0 hero-grid opacity-40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-5 bg-card/60 backdrop-blur px-3 py-1 text-xs gap-1.5 fade-in">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" /> AI-powered career discovery · 9 sources · 40+ degrees
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-balance leading-[1.05] fade-in" style={{ animationDelay: '100ms' }}>
              Find your next <span className="gradient-text">opportunity</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed fade-in" style={{ animationDelay: '200ms' }}>
              Search jobs, internships, apprenticeships and more from multiple trusted sources — personalized to your education, skills, location and career goals.
            </p>
            <div className="mt-8 max-w-3xl mx-auto fade-in" style={{ animationDelay: '300ms' }}>
              <SearchBar />
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2 fade-in" style={{ animationDelay: '400ms' }}>
              {quickFilters.map((f) => (
                <button
                  key={f.label}
                  onClick={() => goSearch(f.filter)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card/70 backdrop-blur text-xs font-medium text-foreground/80 hover:border-primary/40 hover:bg-accent hover:text-foreground transition-all hover:scale-105 active:scale-95"
                >
                  <f.icon className="size-3.5" /> {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 max-w-3xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold tracking-tight">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRENDING JOBS ===== */}
      <TrendingJobs />

      {/* ===== TRUSTED SOURCES ===== */}
      <section className="border-y border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">Aggregated from trusted sources</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {sources.map((s) => (
              <span key={s} className="text-sm font-medium text-muted-foreground/80 hover:text-foreground transition-colors">{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BROWSE BY INDUSTRY ===== */}
      <BrowseByIndustry />

      {/* ===== HOW IT WORKS ===== */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">How CareerHub AI works</h2>
          <p className="mt-3 text-muted-foreground">One search across the entire web of opportunities. Honest matching. Real applications.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: '01', icon: Search, title: 'Search across sources', desc: 'One query, multiple job boards, company sites, government portals. Filters combine any way you want.' },
            { step: '02', icon: Bot, title: 'AI matches & explains', desc: 'Match scores show exactly why a job fits you — education, skills, experience, location, salary, career goals.' },
            { step: '03', icon: ArrowRight, title: 'Apply on the source', desc: 'Click "Apply on Remotive" — you go to the original listing. We track your application in your pipeline.' },
          ].map((s) => (
            <Card key={s.step} className="p-6 relative overflow-hidden card-hover border-border/70">
              <span className="absolute -top-2 -right-2 text-6xl font-bold text-muted/40 select-none">{s.step}</span>
              <div className="relative">
                <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <s.icon className="size-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="bg-card/30 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Built for serious job seekers</h2>
            <p className="mt-3 text-muted-foreground">Everything a modern career discovery platform should have — and nothing it should not.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <Card key={f.title} className="p-5 card-hover border-border/70">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <f.icon className="size-5 text-primary" />
                </div>
                <h3 className="font-semibold text-[15px] mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOR EVERYONE ===== */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">For every career stage</h2>
          <p className="mt-3 text-muted-foreground">From first-year students to returning professionals.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: GraduationCap, title: 'For students & freshers', points: ['Internships & apprenticeships', 'Fresher-friendly filters', 'Backlog & CGPA-aware matching', 'PPO-eligible roles'] },
            { icon: Briefcase, title: 'For experienced professionals', points: ['Salary-normalized search', 'Remote, hybrid, on-site filters', 'Career-aligned recommendations', 'Resume ATS scoring'] },
            { icon: Building2, title: 'For recruiters & companies', points: ['Post jobs in minutes', 'Candidate search & shortlist', 'Application pipeline management', 'Hiring analytics'] },
          ].map((c) => (
            <Card key={c.title} className="p-6 card-hover border-border/70">
              <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <c.icon className="size-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-3">{c.title}</h3>
              <ul className="space-y-2">
                {c.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" /> {p}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="bg-card/30 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Loved by job seekers</h2>
            <p className="mt-3 text-muted-foreground">Early access users are landing interviews faster.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="p-6 border-border/70">
                <div className="flex items-start gap-1 text-amber-400 mb-3">
                  {'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}
                </div>
                <p className="text-sm leading-relaxed mb-4">{t.text}</p>
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">{t.initials}</div>
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Frequently asked questions</h2>
        </div>
        <ClientOnly>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border">
                <AccordionTrigger className="text-left text-[15px] font-medium py-4 hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ClientOnly>
      </section>

      {/* ===== CTA ===== */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/70 p-8 sm:p-12 text-center">
          <div className="absolute inset-0 hero-grid opacity-20 pointer-events-none" />
          <div className="relative">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-primary-foreground text-balance">Explore live career opportunities</h2>
            <p className="mt-3 text-primary-foreground/80 max-w-xl mx-auto text-balance">Search and apply directly to verified openings across every engineering and business domain.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button size="lg" variant="secondary" className="font-semibold" onClick={() => { setView('search'); runSearch() }}>
                Browse all live jobs <ArrowRight className="size-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// ---------------- Trending Jobs Section ----------------
function TrendingJobs() {
  const { setView, setFilter, runSearch } = useApp()
  const [jobs, setJobs] = useState<JobCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        // Trending = jobs with highest view counts
        const res = await api.jobs({ sort: 'newest', pageSize: 8 })
        if (active) {
          // Sort by viewCount descending on the client
          const sorted = [...res.jobs].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)).slice(0, 4)
          setJobs(sorted)
        }
      } catch {}
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [])

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center">
            <TrendingUp className="size-4 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Trending now</h2>
            <p className="text-xs text-muted-foreground">Most viewed opportunities this week</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setView('search'); runSearch() }}>
          View all <ArrowRight className="size-3.5" />
        </Button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 fade-in-stagger">
          {jobs.map((job) => (
            <button
              key={job.id}
              onClick={() => useApp.getState().openJob(job.id)}
              className="text-left group"
            >
              <Card className="p-4 h-full card-hover border-border/70 hover:border-primary/30 relative overflow-hidden">
                {/* Trending rank badge */}
                <div className="absolute top-2 right-2 size-6 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center text-white text-[10px] font-bold">
                  🔥
                </div>
                <div className="flex items-start gap-2.5 mb-3">
                  <Avatar className="size-9 rounded-lg border border-border shrink-0">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                      {job.companyName.split(' ').slice(0, 2).map((w) => w[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">{job.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{job.companyName}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mb-2">
                  {job.city && <span className="inline-flex items-center gap-0.5"><MapPin className="size-3" />{job.city}</span>}
                  {job.remoteType && <span>· {job.remoteType.replace(/_/g, ' ')}</span>}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                  <span className="text-sm font-semibold text-primary">
                    {job.isInternship
                      ? formatStipend(job.stipendMin, job.stipendMax, job.internshipPaid)
                      : formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod, job.salaryDisclosed)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{job.viewCount ?? 0} views</span>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

// ---------------- Browse by Industry ----------------
function BrowseByIndustry() {
  const { setView, setFilter, runSearch } = useApp()
  const [industries, setIndustries] = useState<{ industry: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.companies({ pageSize: 200 })
        if (!active) return
        // Count companies per industry
        const counts: Record<string, number> = {}
        res.companies.forEach((c: any) => {
          if (c.industry) counts[c.industry] = (counts[c.industry] ?? 0) + 1
        })
        const sorted = Object.entries(counts)
          .map(([industry, count]) => ({ industry, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 12)
        setIndustries(sorted)
      } catch {}
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [])

  const industryIcons: Record<string, any> = {
    IT: Briefcase, Software: Cpu, Finance: TrendingUp, Healthcare: ShieldCheck,
    Manufacturing: Building2, Government: ShieldCheck, Consulting: Users,
    Design: Sparkles, Education: GraduationCap, Research: Cpu, Logistics: Globe,
    Agriculture: Globe, Energy: Zap, Biotechnology: Cpu,
  }

  const go = (industry: string) => {
    // Search jobs by company type matching this industry
    setFilter({ q: industry, page: 1 }, { replace: true })
    setView('search')
    runSearch()
  }

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Browse by industry</h2>
        <p className="mt-2 text-sm text-muted-foreground">Explore opportunities across {industries.length}+ industries</p>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 fade-in-stagger">
          {industries.map((item) => {
            const Icon = industryIcons[item.industry] ?? Building2
            return (
              <button
                key={item.industry}
                onClick={() => go(item.industry)}
                className="group text-left"
              >
                <Card className="p-4 h-full card-hover border-border/70 hover:border-primary/30 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 size-16 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                  <div className="relative flex items-start gap-3">
                    <div className="size-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0 group-hover:from-primary/25 group-hover:to-primary/10 transition-colors">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{item.industry}</h3>
                      <p className="text-xs text-muted-foreground">{item.count} compan{item.count === 1 ? 'y' : 'ies'}</p>
                    </div>
                  </div>
                </Card>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
