'use client'

import { useEffect, useRef, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sparkles, FileText, Wand2, Loader2, Upload, CheckCircle2, AlertTriangle,
  Plus, Trash2, Save, Info, GraduationCap, Briefcase, FolderGit2,
  Award, BookOpen, Star, Languages, ShieldCheck, Printer, Pencil,
} from 'lucide-react'
import { toast } from 'sonner'

/* ---------------- Shared types ---------------- */

interface ResumeAnalysis {
  score: number
  atsCompatibility: number
  skillsDetected: string[]
  missingKeywords: string[]
  formatting: { score: number; notes: string }
  experience: { score: number; notes: string }
  achievements: { score: number; notes: string }
  impact: { score: number; notes: string }
  roleAlignment: { score: number; notes: string }
  suggestions: string[]
  resumeId?: string
}

interface EducationRow {
  id: string
  degree: string
  institution: string
  startYear: string
  endYear: string
  grade: string
}
interface ExperienceRow {
  id: string
  role: string
  company: string
  start: string
  end: string
  description: string
}
interface ProjectRow {
  id: string
  name: string
  link: string
  description: string
}

interface ResumeForm {
  name: string
  email: string
  phone: string
  location: string
  summary: string
  education: EducationRow[]
  experience: ExperienceRow[]
  projects: ProjectRow[]
  skills: string
  certifications: string
  achievements: string
  positions: string
  publications: string
  languages: string
}

const STORAGE_KEY = 'careerhub.resume.builder.v1'

const EMPTY_FORM: ResumeForm = {
  name: '', email: '', phone: '', location: '',
  summary: '',
  education: [], experience: [], projects: [],
  skills: '', certifications: '', achievements: '',
  positions: '', publications: '', languages: '',
}

const TEMPLATES = [
  { id: 'ats', name: 'ATS Minimal', desc: 'Plain text-first. Passes any ATS scanner.', accent: 'bg-muted-foreground' },
  { id: 'modern', name: 'Modern', desc: 'Indigo accents. Clean and confident.', accent: 'bg-primary' },
  { id: 'engineering', name: 'Engineering', desc: 'Technical emphasis, blue accent.', accent: 'bg-blue-500' },
  { id: 'business', name: 'Business', desc: 'Conservative navy, executive polish.', accent: 'bg-slate-700' },
  { id: 'academic', name: 'Academic', desc: 'Serif typography, formal layout.', accent: 'bg-amber-700' },
  { id: 'fresher', name: 'Fresher', desc: 'Education-led, friendly accent.', accent: 'bg-emerald-600' },
  { id: 'developer', name: 'Developer', desc: 'Mono accents, projects-first.', accent: 'bg-violet-600' },
] as const

type TemplateId = typeof TEMPLATES[number]['id']

/* ---------------- Main view ---------------- */

export function ResumeView() {
  const [tab, setTab] = useState<'analyzer' | 'builder'>('analyzer')

  return (
    <div className="flex-1 w-full">
      {/* sticky header */}
      <div className="border-b border-border bg-card/40 sticky top-16 z-30 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                Resume tools
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Analyze your resume against ATS scanners or build a polished new one from a template.
              </p>
            </div>
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-fit">
              <TabsList className="grid grid-cols-2 w-full sm:w-auto">
                <TabsTrigger value="analyzer" className="gap-1.5 px-3">
                  <Wand2 className="size-3.5" /> Analyzer
                </TabsTrigger>
                <TabsTrigger value="builder" className="gap-1.5 px-3">
                  <Pencil className="size-3.5" /> Builder
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 pb-20 lg:pb-12">
        {tab === 'analyzer' ? <Analyzer /> : <Builder />}
      </div>
    </div>
  )
}

/* ---------------- Analyzer ---------------- */

function Analyzer() {
  const user = useApp((s) => s.user)
  const openAuth = useApp((s) => s.openAuth)

  const [resumeText, setResumeText] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResumeAnalysis | null>(null)
  const [profileDefaultRole, setProfileDefaultRole] = useState<string | null>(null)

  // Prefill target role from profile (if candidate)
  useEffect(() => {
    let active = true
    const load = async () => {
      if (!user || user.role !== 'candidate') return
      try {
        const p = await api.getProfile()
        if (active && p?.desiredJobTitle) setProfileDefaultRole(p.desiredJobTitle)
      } catch {
        // ignore — prefill is best-effort
      }
    }
    load()
    return () => { active = false }
  }, [user])

  const analyze = async () => {
    if (!user) { openAuth('login'); return }
    if (resumeText.trim().length < 20) {
      toast.error('Paste at least 20 characters of your resume text.')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res: any = await api.aiResumeAnalyze(resumeText, targetRole.trim() || undefined)
      setResult(res as ResumeAnalysis)
      toast.success('Analysis ready — saved to your history.')
    } catch (e: any) {
      toast.error(e?.message || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Input column */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-5">
          <Label className="text-sm font-medium">Paste your resume text</Label>
          <Textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste the full text of your resume here. The analyzer reads plain text best — copy from your PDF or DOCX."
            className="mt-2 min-h-[260px] resize-y text-[13px] leading-relaxed"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1.5">
            <span>{resumeText.length.toLocaleString()} characters</span>
            <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors">
              <Upload className="size-3.5" />
              <input
                type="file"
                accept=".txt,.md"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  const txt = await f.text()
                  setResumeText(txt)
                  toast.success(`Loaded ${f.name}`)
                }}
              />
              Upload .txt
            </label>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div>
            <Label htmlFor="targetRole" className="text-sm font-medium">Target role (optional)</Label>
            <Input
              id="targetRole"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder={profileDefaultRole ?? 'e.g. Backend Engineer, Data Analyst'}
              className="mt-1.5"
            />
            {profileDefaultRole && !targetRole && (
              <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                <Info className="size-3" /> Defaults to your profile&apos;s desired role: <span className="font-medium text-foreground">{profileDefaultRole}</span>
              </p>
            )}
          </div>
          <Button onClick={analyze} disabled={loading} className="w-full">
            {loading ? <><Loader2 className="size-4 animate-spin mr-2" /> Analyzing…</> : <><Wand2 className="size-4 mr-2" /> Analyze resume</>}
          </Button>
          {!user && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="size-3.5" /> Sign in as a candidate to run analysis and save results to your history.
            </p>
          )}
        </Card>

        <div className="rounded-xl border border-border bg-accent/30 p-4 text-xs text-muted-foreground leading-relaxed">
          <p className="flex items-start gap-1.5">
            <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
            <span>
              <span className="font-medium text-foreground">Honest note:</span> We never fabricate experience. This analysis is based solely on the text you provide.
            </span>
          </p>
        </div>
      </div>

      {/* Results column */}
      <div className="lg:col-span-3">
        {loading ? (
          <AnalyzerSkeleton />
        ) : result ? (
          <AnalyzerResults result={result} />
        ) : (
          <EmptyAnalysis />
        )}
      </div>
    </div>
  )
}

function AnalyzerSkeleton() {
  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center gap-5">
        <Skeleton className="size-24 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2 w-56" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </Card>
  )
}

function EmptyAnalysis() {
  return (
    <Card className="p-10 text-center flex flex-col items-center">
      <div className="size-14 rounded-full bg-accent flex items-center justify-center mb-4">
        <Wand2 className="size-7 text-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-1.5">No analysis yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Paste your resume text on the left, optionally enter a target role, then hit <span className="font-medium text-foreground">Analyze resume</span> to see your ATS score, skills, gaps, and concrete suggestions.
      </p>
    </Card>
  )
}

function scoreColor(score: number): { ring: string; text: string; bg: string; label: string } {
  if (score >= 80) return { ring: 'text-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500', label: 'Excellent' }
  if (score >= 60) return { ring: 'text-primary', text: 'text-primary', bg: 'bg-primary', label: 'Good' }
  if (score >= 40) return { ring: 'text-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500', label: 'Fair' }
  return { ring: 'text-destructive', text: 'text-destructive', bg: 'bg-destructive', label: 'Needs work' }
}

function ScoreRing({ score, size = 96, stroke = 8 }: { score: number; size?: number; stroke?: number }) {
  const c = scoreColor(score)
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.max(0, Math.min(100, score)) / 100)
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/60" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="currentColor" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${c.ring} transition-[stroke-dashoffset] duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${c.text}`}>{Math.round(score)}</span>
        <span className="text-[10px] text-muted-foreground font-medium">/ 100</span>
      </div>
    </div>
  )
}

function AnalyzerResults({ result }: { result: ResumeAnalysis }) {
  const overall = scoreColor(result.score)
  const ats = scoreColor(result.atsCompatibility)
  const subs = [
    { name: 'Formatting', icon: FileText, ...result.formatting },
    { name: 'Experience', icon: Briefcase, ...result.experience },
    { name: 'Achievements', icon: Award, ...result.achievements },
    { name: 'Impact', icon: Sparkles, ...result.impact },
    { name: 'Role alignment', icon: ShieldCheck, ...result.roleAlignment },
  ]

  return (
    <div className="space-y-4 fade-in">
      {/* Hero score card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="flex flex-col items-center">
            <ScoreRing score={result.score} />
            <span className={`text-xs font-medium mt-1 ${overall.text}`}>{overall.label}</span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-semibold text-lg tracking-tight">Resume analysis</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              An honest, fact-based review of your resume. We do not invent skills, experiences, or achievements that aren&apos;t in your text.
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="relative inline-flex items-center justify-center size-10">
                  <svg width="40" height="40" className="-rotate-90">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/60" />
                    <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="4"
                      strokeDasharray={2 * Math.PI * 16}
                      strokeDashoffset={2 * Math.PI * 16 * (1 - Math.max(0, Math.min(100, result.atsCompatibility)) / 100)}
                      strokeLinecap="round" className={`${ats.ring}`} />
                  </svg>
                  <span className={`absolute text-[11px] font-bold ${ats.text}`}>{Math.round(result.atsCompatibility)}</span>
                </div>
                <div>
                  <p className="text-xs font-medium">ATS compatibility</p>
                  <p className="text-[11px] text-muted-foreground">Likely to parse cleanly</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Skills detected / Missing keywords */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-medium mb-3">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" /> Skills detected
            <Badge variant="secondary" className="ml-auto text-[11px]">{result.skillsDetected.length}</Badge>
          </div>
          {result.skillsDetected.length === 0 ? (
            <p className="text-sm text-muted-foreground">No skills were detected. Make sure your resume lists technologies and tools explicitly.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {result.skillsDetected.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-2 py-0.5">
                  {s}
                </Badge>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-medium mb-3">
            <AlertTriangle className="size-4 text-amber-500" /> Missing keywords
            <Badge variant="secondary" className="ml-auto text-[11px]">{result.missingKeywords.length}</Badge>
          </div>
          {result.missingKeywords.length === 0 ? (
            <p className="text-sm text-muted-foreground">No critical keywords missing for your target role. Nice coverage.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {result.missingKeywords.map((k) => (
                <Badge key={k} variant="secondary" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-2 py-0.5">
                  {k}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Sub-scores */}
      <Card className="p-5">
        <h4 className="text-sm font-medium mb-4 flex items-center gap-2"><Sparkles className="size-4 text-primary" /> Sub-scores</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {subs.map((s) => {
            const sc = scoreColor(s.score)
            return (
              <div key={s.name} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <s.icon className="size-3.5 text-muted-foreground" /> {s.name}
                  </span>
                  <span className={`text-xs font-semibold ${sc.text}`}>{Math.round(s.score)}/100</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${sc.bg} transition-[width] duration-700`} style={{ width: `${Math.max(0, Math.min(100, s.score))}%` }} />
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">{s.notes}</p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Suggestions */}
      <Card className="p-5">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Wand2 className="size-4 text-primary" /> Suggestions</h4>
        {result.suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No further action items — your resume looks strong.</p>
        ) : (
          <ul className="space-y-2">
            {result.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[11px] font-semibold mt-0.5">
                  {i + 1}
                </span>
                <span className="text-foreground/90 leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

/* ---------------- Builder ---------------- */

function newId() {
  return Math.random().toString(36).slice(2, 10)
}

function Builder() {
  const user = useApp((s) => s.user)
  const [template, setTemplate] = useState<TemplateId>('modern')
  const [form, setForm] = useState<ResumeForm>(EMPTY_FORM)
  const [hydrated, setHydrated] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hydrate from localStorage on mount
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
        if (raw && active) {
          const parsed = JSON.parse(raw) as ResumeForm
          setForm({ ...EMPTY_FORM, ...parsed })
        } else if (user && user.role === 'candidate') {
          // Prefill from profile (best-effort)
          const p = await api.getProfile()
          if (!active) return
          setForm((f) => ({
            ...f,
            name: user.name,
            email: user.email,
            phone: p.phone ?? '',
            location: p.currentLocation ?? '',
            summary: p.headline ?? p.desiredJobTitle ?? '',
            skills: p.technicalSkills ?? '',
            certifications: p.certifications ?? '',
            education: p.university || p.degree || p.graduationYear
              ? [{
                  id: newId(),
                  degree: [p.degree, p.branch].filter(Boolean).join(' — '),
                  institution: p.university ?? p.college ?? '',
                  startYear: p.graduationYear ? String(p.graduationYear - 4) : '',
                  endYear: p.graduationYear ? String(p.graduationYear) : '',
                  grade: p.cgpa ? `CGPA ${p.cgpa}` : p.percentage ? `${p.percentage}%` : '',
                }]
              : [],
          }))
        }
      } catch {
        // ignore localStorage parse errors
      } finally {
        if (active) setHydrated(true)
      }
    }
    load()
    return () => { active = false }
  }, [user])

  // Debounced autosave
  useEffect(() => {
    if (!hydrated) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
      } catch {
        // storage may be full or blocked; ignore
      }
    }, 600)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [form, hydrated])

  const update = <K extends keyof ResumeForm>(key: K, value: ResumeForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const addRow = (key: 'education' | 'experience' | 'projects') => {
    const blank = key === 'education'
      ? { id: newId(), degree: '', institution: '', startYear: '', endYear: '', grade: '' }
      : key === 'experience'
        ? { id: newId(), role: '', company: '', start: '', end: '', description: '' }
        : { id: newId(), name: '', link: '', description: '' }
    setForm((f) => ({ ...f, [key]: [...f[key], blank] as any }))
  }

  const updateRow = (key: 'education' | 'experience' | 'projects', id: string, patch: any) =>
    setForm((f) => ({ ...f, [key]: f[key].map((r: any) => r.id === id ? { ...r, ...patch } : r) as any }))

  const removeRow = (key: 'education' | 'experience' | 'projects', id: string) =>
    setForm((f) => ({ ...f, [key]: f[key].filter((r: any) => r.id !== id) as any }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      {/* Form column */}
      <div className="space-y-5">
        {/* Template picker */}
        <div>
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Pencil className="size-4 text-primary" /> Choose a template
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {TEMPLATES.map((t) => {
              const active = template === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`text-left p-3 rounded-xl border transition-all card-hover ${active ? 'border-primary ring-1 ring-primary/30 bg-accent/40' : 'border-border bg-card hover:border-primary/30'}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`size-2.5 rounded-full ${t.accent}`} />
                    <span className="text-sm font-semibold">{t.name}</span>
                    {active && <CheckCircle2 className="size-3.5 text-primary ml-auto" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">{t.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Contact */}
        <SectionCard title="Contact">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput label="Full name" value={form.name} onChange={(v) => update('name', v)} placeholder="Jane Doe" />
            <TextInput label="Email" value={form.email} onChange={(v) => update('email', v)} placeholder="jane@example.com" type="email" />
            <TextInput label="Phone" value={form.phone} onChange={(v) => update('phone', v)} placeholder="+91 98765 43210" />
            <TextInput label="Location" value={form.location} onChange={(v) => update('location', v)} placeholder="Bangalore, IN" />
          </div>
        </SectionCard>

        {/* Summary */}
        <SectionCard title="Summary" icon={Sparkles}>
          <Textarea
            value={form.summary}
            onChange={(e) => update('summary', e.target.value)}
            placeholder="2–3 sentences on who you are and what you bring."
            className="text-[13px] min-h-[80px] resize-y"
          />
        </SectionCard>

        {/* Education */}
        <RepeatableSection
          title="Education" icon={GraduationCap}
          rows={form.education} onAdd={() => addRow('education')} onRemove={(id) => removeRow('education', id)}
          addLabel="Add education"
        >
          {(row) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <TextInput value={(row as EducationRow).degree} onChange={(v) => updateRow('education', row.id, { degree: v })} placeholder="BTech CSE" />
              <TextInput value={(row as EducationRow).institution} onChange={(v) => updateRow('education', row.id, { institution: v })} placeholder="IIT Bombay" />
              <TextInput value={(row as EducationRow).startYear} onChange={(v) => updateRow('education', row.id, { startYear: v })} placeholder="Start (e.g. 2020)" />
              <TextInput value={(row as EducationRow).endYear} onChange={(v) => updateRow('education', row.id, { endYear: v })} placeholder="End (e.g. 2024)" />
              <TextInput value={(row as EducationRow).grade} onChange={(v) => updateRow('education', row.id, { grade: v })} placeholder="CGPA / %" className="sm:col-span-2" />
            </div>
          )}
        </RepeatableSection>

        {/* Experience */}
        <RepeatableSection
          title="Experience" icon={Briefcase}
          rows={form.experience} onAdd={() => addRow('experience')} onRemove={(id) => removeRow('experience', id)}
          addLabel="Add experience"
        >
          {(row) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <TextInput value={(row as ExperienceRow).role} onChange={(v) => updateRow('experience', row.id, { role: v })} placeholder="Software Engineer" />
              <TextInput value={(row as ExperienceRow).company} onChange={(v) => updateRow('experience', row.id, { company: v })} placeholder="Acme Corp" />
              <TextInput value={(row as ExperienceRow).start} onChange={(v) => updateRow('experience', row.id, { start: v })} placeholder="Start (e.g. Jan 2022)" />
              <TextInput value={(row as ExperienceRow).end} onChange={(v) => updateRow('experience', row.id, { end: v })} placeholder="End (or Present)" />
              <Textarea
                value={(row as ExperienceRow).description}
                onChange={(e) => updateRow('experience', row.id, { description: e.target.value })}
                placeholder="What you built, scaled, or shipped — with measurable impact."
                className="text-[13px] min-h-[60px] resize-y sm:col-span-2"
              />
            </div>
          )}
        </RepeatableSection>

        {/* Projects */}
        <RepeatableSection
          title="Projects" icon={FolderGit2}
          rows={form.projects} onAdd={() => addRow('projects')} onRemove={(id) => removeRow('projects', id)}
          addLabel="Add project"
        >
          {(row) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <TextInput value={(row as ProjectRow).name} onChange={(v) => updateRow('projects', row.id, { name: v })} placeholder="Project name" />
              <TextInput value={(row as ProjectRow).link} onChange={(v) => updateRow('projects', row.id, { link: v })} placeholder="GitHub / live URL" />
              <Textarea
                value={(row as ProjectRow).description}
                onChange={(e) => updateRow('projects', row.id, { description: e.target.value })}
                placeholder="Short description, stack, and outcome."
                className="text-[13px] min-h-[60px] resize-y sm:col-span-2"
              />
            </div>
          )}
        </RepeatableSection>

        {/* Comma-separated sections */}
        <SectionCard title="Skills" icon={Star}>
          <Textarea
            value={form.skills}
            onChange={(e) => update('skills', e.target.value)}
            placeholder="React, TypeScript, Node.js, PostgreSQL, AWS…"
            className="text-[13px] min-h-[60px] resize-y"
          />
          <p className="text-[11px] text-muted-foreground mt-1.5">Comma-separated. Group by relevance if helpful.</p>
        </SectionCard>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <SectionCard title="Certifications" icon={ShieldCheck}>
            <Textarea value={form.certifications} onChange={(e) => update('certifications', e.target.value)} placeholder="AWS SAA, GCP PCA…" className="text-[13px] min-h-[60px] resize-y" />
          </SectionCard>
          <SectionCard title="Achievements" icon={Award}>
            <Textarea value={form.achievements} onChange={(e) => update('achievements', e.target.value)} placeholder="Hackathon winner, Dean's list…" className="text-[13px] min-h-[60px] resize-y" />
          </SectionCard>
          <SectionCard title="Positions of responsibility" icon={Briefcase}>
            <Textarea value={form.positions} onChange={(e) => update('positions', e.target.value)} placeholder="Club lead, Mentor…" className="text-[13px] min-h-[60px] resize-y" />
          </SectionCard>
          <SectionCard title="Publications" icon={BookOpen}>
            <Textarea value={form.publications} onChange={(e) => update('publications', e.target.value)} placeholder="Papers, talks, blog posts…" className="text-[13px] min-h-[60px] resize-y" />
          </SectionCard>
          <SectionCard title="Languages" icon={Languages} className="sm:col-span-2">
            <Input value={form.languages} onChange={(e) => update('languages', e.target.value)} placeholder="English, Hindi, Tamil…" className="text-[13px]" />
          </SectionCard>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
          <Save className="size-3.5" />
          Auto-saved to this browser as you type.
        </div>
      </div>

      {/* Preview column */}
      <div className="lg:sticky lg:top-32 lg:self-start">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <FileText className="size-4 text-primary" /> Live preview
          </h3>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="h-8 text-xs gap-1.5">
            <Printer className="size-3.5" /> Download as PDF
          </Button>
        </div>
        <div className="rounded-xl border border-border bg-card overflow-hidden print:border-0 print:rounded-none">
          <ResumePreview form={form} template={template} />
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
          Tip: <span className="font-medium text-foreground">Download as PDF</span> uses your browser&apos;s print dialog — choose &quot;Save as PDF&quot; as the destination and set margins to <span className="font-medium">None</span> for the cleanest output.
        </p>
      </div>
    </div>
  )
}

function SectionCard({
  title, icon: Icon, children, className,
}: {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={`p-4 ${className ?? ''}`}>
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        <h4 className="text-sm font-medium">{title}</h4>
      </div>
      {children}
    </Card>
  )
}

function TextInput({
  label, value, onChange, placeholder, type = 'text', className,
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  className?: string
}) {
  return (
    <div className={className}>
      {label && <Label className="text-[11px] text-muted-foreground">{label}</Label>}
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="text-[13px] mt-0.5"
      />
    </div>
  )
}

function RepeatableSection({
  title, icon: Icon, rows, onAdd, onRemove, addLabel, children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  rows: { id: string }[]
  onAdd: () => void
  onRemove: (id: string) => void
  addLabel: string
  children: (row: any) => React.ReactNode
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">{title}</h4>
          {rows.length > 0 && <Badge variant="secondary" className="text-[10px]">{rows.length}</Badge>}
        </div>
        <Button variant="ghost" size="sm" onClick={onAdd} className="h-7 text-xs text-primary hover:text-primary">
          <Plus className="size-3.5 mr-1" /> {addLabel}
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No {title.toLowerCase()} added yet. Click <span className="font-medium text-foreground">{addLabel}</span> to begin.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-lg border border-border bg-background/50 p-3 relative">
              <button
                onClick={() => onRemove(row.id)}
                className="absolute top-2 right-2 size-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                aria-label="Remove row"
                title="Remove"
              >
                <Trash2 className="size-3.5" />
              </button>
              {children(row)}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

/* ---------------- Live preview ---------------- */

function csvToItems(s: string): string[] {
  return s.split(',').map((x) => x.trim()).filter(Boolean)
}

function ResumePreview({ form, template }: { form: ResumeForm; template: TemplateId }) {
  const skills = csvToItems(form.skills)
  const certs = csvToItems(form.certifications)
  const achievements = csvToItems(form.achievements)
  const positions = csvToItems(form.positions)
  const publications = csvToItems(form.publications)
  const languages = csvToItems(form.languages)

  const isAts = template === 'ats'
  const isSerif = template === 'academic'
  const isMono = template === 'developer'
  const accentClass: Record<TemplateId, string> = {
    ats: 'text-foreground',
    modern: 'text-primary',
    engineering: 'text-blue-600 dark:text-blue-400',
    business: 'text-slate-700 dark:text-slate-300',
    academic: 'text-amber-700 dark:text-amber-500',
    fresher: 'text-emerald-600 dark:text-emerald-400',
    developer: 'text-violet-600 dark:text-violet-400',
  }
  const accentBg: Record<TemplateId, string> = {
    ats: 'bg-muted-foreground',
    modern: 'bg-primary',
    engineering: 'bg-blue-500',
    business: 'bg-slate-700',
    academic: 'bg-amber-700',
    fresher: 'bg-emerald-600',
    developer: 'bg-violet-600',
  }

  return (
    <div
      className={`bg-white text-black p-6 sm:p-8 text-[11px] leading-relaxed font-serif-${isSerif ? 'serif' : isMono ? 'mono' : 'sans'} print:p-0`}
      style={{
        fontFamily: isSerif ? 'Georgia, "Times New Roman", serif' : isMono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'ui-sans-serif, system-ui, sans-serif',
        minHeight: '600px',
      }}
    >
      {/* Header */}
      <div className="flex flex-col items-start mb-4 pb-3 border-b border-gray-300">
        <h1 className="text-xl font-bold tracking-tight">{form.name || 'Your Name'}</h1>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-gray-600 mt-0.5">
          {form.email && <span>{form.email}</span>}
          {form.phone && <span>· {form.phone}</span>}
          {form.location && <span>· {form.location}</span>}
        </div>
      </div>

      {/* Summary */}
      {form.summary && (
        <Section title="Summary" accentClass={accentClass[template]} accentBg={accentBg[template]} isAts={isAts}>
          <p>{form.summary}</p>
        </Section>
      )}

      {/* Developer template shows projects first */}
      {template === 'developer' && form.projects.length > 0 && (
        <Section title="Projects" accentClass={accentClass[template]} accentBg={accentBg[template]} isAts={isAts}>
          {form.projects.map((p) => (
            <div key={p.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <p className="font-semibold">{p.name}{p.link && <span className="text-gray-500 font-normal ml-1">— {p.link}</span>}</p>
              </div>
              {p.description && <p className="text-gray-700">{p.description}</p>}
            </div>
          ))}
        </Section>
      )}

      {/* Experience */}
      {form.experience.length > 0 && (
        <Section title="Experience" accentClass={accentClass[template]} accentBg={accentBg[template]} isAts={isAts}>
          {form.experience.map((e) => (
            <div key={e.id} className="mb-2.5">
              <div className="flex justify-between items-baseline">
                <p className="font-semibold">{e.role}{e.company && <span className="text-gray-600 font-normal"> · {e.company}</span>}</p>
                <span className="text-[10px] text-gray-500">{[e.start, e.end].filter(Boolean).join(' — ')}</span>
              </div>
              {e.description && <p className="text-gray-700 mt-0.5 whitespace-pre-line">{e.description}</p>}
            </div>
          ))}
        </Section>
      )}

      {/* Education */}
      {form.education.length > 0 && (
        <Section title="Education" accentClass={accentClass[template]} accentBg={accentBg[template]} isAts={isAts}>
          {form.education.map((e) => (
            <div key={e.id} className="mb-2 flex justify-between items-baseline">
              <div>
                <p className="font-semibold">{e.degree || 'Degree'}</p>
                <p className="text-gray-600">{e.institution}{e.grade && <span> · {e.grade}</span>}</p>
              </div>
              <span className="text-[10px] text-gray-500">{[e.startYear, e.endYear].filter(Boolean).join(' — ')}</span>
            </div>
          ))}
        </Section>
      )}

      {/* Projects (non-developer) */}
      {template !== 'developer' && form.projects.length > 0 && (
        <Section title="Projects" accentClass={accentClass[template]} accentBg={accentBg[template]} isAts={isAts}>
          {form.projects.map((p) => (
            <div key={p.id} className="mb-2">
              <p className="font-semibold">{p.name}{p.link && <span className="text-gray-500 font-normal ml-1">— {p.link}</span>}</p>
              {p.description && <p className="text-gray-700">{p.description}</p>}
            </div>
          ))}
        </Section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <Section title="Skills" accentClass={accentClass[template]} accentBg={accentBg[template]} isAts={isAts}>
          <p className="text-gray-800">{skills.join(' · ')}</p>
        </Section>
      )}

      {/* Certifications */}
      {certs.length > 0 && (
        <Section title="Certifications" accentClass={accentClass[template]} accentBg={accentBg[template]} isAts={isAts}>
          <ul className="list-disc list-inside text-gray-800 space-y-0.5">
            {certs.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </Section>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <Section title="Achievements" accentClass={accentClass[template]} accentBg={accentBg[template]} isAts={isAts}>
          <ul className="list-disc list-inside text-gray-800 space-y-0.5">
            {achievements.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </Section>
      )}

      {/* Positions */}
      {positions.length > 0 && (
        <Section title="Positions of Responsibility" accentClass={accentClass[template]} accentBg={accentBg[template]} isAts={isAts}>
          <ul className="list-disc list-inside text-gray-800 space-y-0.5">
            {positions.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </Section>
      )}

      {/* Publications */}
      {publications.length > 0 && (
        <Section title="Publications" accentClass={accentClass[template]} accentBg={accentBg[template]} isAts={isAts}>
          <ul className="list-disc list-inside text-gray-800 space-y-0.5">
            {publications.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </Section>
      )}

      {/* Languages */}
      {languages.length > 0 && (
        <Section title="Languages" accentClass={accentClass[template]} accentBg={accentBg[template]} isAts={isAts}>
          <p className="text-gray-800">{languages.join(' · ')}</p>
        </Section>
      )}
    </div>
  )
}

function Section({
  title, children, accentClass, accentBg, isAts,
}: {
  title: string
  children: React.ReactNode
  accentClass: string
  accentBg: string
  isAts: boolean
}) {
  return (
    <section className="mb-3.5">
      <h2 className={`text-[11px] font-bold uppercase tracking-[0.08em] mb-1.5 ${accentClass}`}>
        {!isAts && <span className={`inline-block w-1.5 h-3 mr-1.5 align-middle ${accentBg} rounded-sm`} />}
        {title}
      </h2>
      {children}
    </section>
  )
}
