'use client'

import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Briefcase, Plus, Pencil, Eye, Ban, RotateCcw, Users, ClipboardList, CalendarClock, Trophy,
  MapPin, Search, ExternalLink, Inbox, Loader2, Sparkles, Star, Building2,
  Clock, Info,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  employmentTypeLabel, remoteTypeLabel, timeAgo, daysUntil,
  DEGREES, EMPLOYMENT_TYPES, REMOTE_TYPES, BACKLOG_POLICIES, SALARY_PERIODS,
} from '@/lib/jobs'
import type { View } from '@/lib/types'

type RecruiterTab = 'dashboard' | 'jobs' | 'post' | 'applications'

const viewToTab: Record<string, RecruiterTab> = {
  recruiter: 'dashboard',
  'recruiter-jobs': 'jobs',
  'recruiter-new-job': 'post',
  'recruiter-applications': 'applications',
}

const tabToView: Record<RecruiterTab, View> = {
  dashboard: 'recruiter',
  jobs: 'recruiter-jobs',
  post: 'recruiter-new-job',
  applications: 'recruiter-applications',
}

// Normalize API responses (some wrappers declare array but endpoints return { key: [...] })
function unwrap<T>(res: any, key: string): T[] {
  if (Array.isArray(res)) return res as T[]
  if (res && Array.isArray(res[key])) return res[key] as T[]
  return []
}

// ---------------- Job form state & helpers ----------------
interface JobFormState {
  title: string
  department: string
  companyName: string
  location: string  // city
  state: string
  country: string
  remoteType: string
  employmentType: string
  experienceMin: string
  experienceMax: string
  fresherFriendly: boolean
  salaryMin: string
  salaryMax: string
  salaryDisclosed: boolean
  salaryPeriod: string
  degree: string
  branch: string  // comma separated
  specialization: string
  cgpaRequirement: string
  backlogPolicy: string
  skills: string  // comma separated
  description: string
  responsibilities: string
  requirements: string
  benefits: string  // comma separated
  applicationDeadline: string  // yyyy-mm-dd
  isInternship: boolean
  internshipDurationMonths: string
  internshipPaid: string
  stipendMin: string
  stipendMax: string
  ppoAvailable: boolean
}

const emptyForm: JobFormState = {
  title: '',
  department: '',
  companyName: '',
  location: '',
  state: '',
  country: 'India',
  remoteType: 'onsite',
  employmentType: 'full_time',
  experienceMin: '',
  experienceMax: '',
  fresherFriendly: false,
  salaryMin: '',
  salaryMax: '',
  salaryDisclosed: false,
  salaryPeriod: 'annual',
  degree: '',
  branch: '',
  specialization: '',
  cgpaRequirement: '',
  backlogPolicy: '',
  skills: '',
  description: '',
  responsibilities: '',
  requirements: '',
  benefits: '',
  applicationDeadline: '',
  isInternship: false,
  internshipDurationMonths: '',
  internshipPaid: 'paid',
  stipendMin: '',
  stipendMax: '',
  ppoAvailable: false,
}

function jobToForm(j: any): JobFormState {
  const toDateInput = (v?: string | null) => {
    if (!v) return ''
    const d = new Date(v)
    if (isNaN(d.getTime())) return ''
    return d.toISOString().slice(0, 10)
  }
  return {
    title: j.title ?? '',
    department: j.department ?? '',
    companyName: j.companyName ?? '',
    location: j.city ?? '',
    state: j.state ?? '',
    country: j.country ?? 'India',
    remoteType: j.remoteType ?? 'onsite',
    employmentType: j.employmentType ?? 'full_time',
    experienceMin: j.experienceMin != null ? String(j.experienceMin) : '',
    experienceMax: j.experienceMax != null ? String(j.experienceMax) : '',
    fresherFriendly: !!j.fresherFriendly,
    salaryMin: j.salaryMin != null ? String(j.salaryMin) : '',
    salaryMax: j.salaryMax != null ? String(j.salaryMax) : '',
    salaryDisclosed: !!j.salaryDisclosed,
    salaryPeriod: j.salaryPeriod ?? 'annual',
    degree: j.degree ?? '',
    branch: j.branch ?? '',
    specialization: j.specialization ?? '',
    cgpaRequirement: j.cgpaRequirement != null ? String(j.cgpaRequirement) : '',
    backlogPolicy: j.backlogPolicy ?? '',
    skills: Array.isArray(j.skills) ? j.skills.join(', ') : (j.skills ?? ''),
    description: j.description ?? '',
    responsibilities: j.responsibilities ?? '',
    requirements: j.requirements ?? '',
    benefits: Array.isArray(j.benefits) ? j.benefits.join(', ') : (j.benefits ?? ''),
    applicationDeadline: toDateInput(j.applicationDeadline),
    isInternship: !!j.isInternship,
    internshipDurationMonths: j.internshipDurationMonths != null ? String(j.internshipDurationMonths) : '',
    internshipPaid: j.internshipPaid ?? 'paid',
    stipendMin: j.stipendMin != null ? String(j.stipendMin) : '',
    stipendMax: j.stipendMax != null ? String(j.stipendMax) : '',
    ppoAvailable: !!j.ppoAvailable,
  }
}

function formToBody(f: JobFormState): any {
  const num = (v: string) => (v.trim() === '' ? undefined : Number(v))
  const str = (v: string) => (v.trim() === '' ? undefined : v.trim())
  const body: any = {
    title: f.title.trim(),
    companyName: f.companyName.trim(),
    department: str(f.department),
    city: str(f.location),
    state: str(f.state),
    country: str(f.country) || 'India',
    remoteType: f.remoteType,
    employmentType: f.employmentType,
    fresherFriendly: f.fresherFriendly,
    salaryDisclosed: f.salaryDisclosed,
    salaryPeriod: f.salaryPeriod,
    isInternship: f.isInternship,
    ppoAvailable: f.ppoAvailable,
  }
  const emin = num(f.experienceMin); if (emin != null) body.experienceMin = emin
  const emax = num(f.experienceMax); if (emax != null) body.experienceMax = emax
  const smin = num(f.salaryMin); if (smin != null) body.salaryMin = smin
  const smax = num(f.salaryMax); if (smax != null) body.salaryMax = smax
  if (str(f.degree)) body.degree = str(f.degree)
  if (str(f.branch)) body.branch = str(f.branch)
  if (str(f.specialization)) body.specialization = str(f.specialization)
  const cgpa = num(f.cgpaRequirement); if (cgpa != null) body.cgpaRequirement = cgpa
  if (str(f.backlogPolicy)) body.backlogPolicy = str(f.backlogPolicy)
  if (str(f.skills)) body.skills = str(f.skills)
  if (str(f.description)) body.description = str(f.description)
  if (str(f.responsibilities)) body.responsibilities = str(f.responsibilities)
  if (str(f.requirements)) body.requirements = str(f.requirements)
  if (str(f.benefits)) body.benefits = str(f.benefits)
  if (str(f.applicationDeadline)) body.applicationDeadline = str(f.applicationDeadline)
  if (f.isInternship) {
    const d = num(f.internshipDurationMonths); if (d != null) body.internshipDurationMonths = d
    body.internshipPaid = f.internshipPaid
    const stmin = num(f.stipendMin); if (stmin != null) body.stipendMin = stmin
    const stmax = num(f.stipendMax); if (stmax != null) body.stipendMax = stmax
  }
  return body
}

// ---------------- Job form component ----------------
function JobForm({
  initial, onSubmit, submitLabel = 'Publish job', onCancel, compact,
}: {
  initial?: JobFormState
  onSubmit: (body: any) => Promise<void>
  submitLabel?: string
  onCancel?: () => void
  compact?: boolean
}) {
  const [form, setForm] = useState<JobFormState>(() => initial ?? emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const user = useApp((s) => s.user)

  // Pre-fill companyName from the signed-in company_admin / recruiter if available
  useEffect(() => {
     
    if (!initial && user && (user as any).companyName) {
      setForm((f) => ({ ...f, companyName: (user as any).companyName }))
    }
  }, [initial, user])

  const set = <K extends keyof JobFormState>(k: K, v: JobFormState[K]) => setForm((f) => ({ ...f, [k]: v }))

  const validate = (): string | null => {
    if (!form.title.trim()) return 'Job title is required'
    if (!form.location.trim()) return 'Location (city) is required'
    if (!form.employmentType) return 'Employment type is required'
    if (!form.companyName.trim()) return 'Company name is required'
    if (form.salaryMin && form.salaryMax && Number(form.salaryMin) > Number(form.salaryMax)) {
      return 'Salary min cannot exceed salary max'
    }
    if (form.experienceMin && form.experienceMax && Number(form.experienceMin) > Number(form.experienceMax)) {
      return 'Experience min cannot exceed experience max'
    }
    return null
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { toast.error(err); return }
    setSubmitting(true)
    try {
      await onSubmit(formToBody(form))
    } catch (e: any) {
      toast.error(e.message || 'Could not save job')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className={compact ? 'space-y-5' : 'space-y-6'}>
      {/* BASIC */}
      <SectionCard icon={Briefcase} title="Basic information" description="The essentials candidates see first.">
        <Grid2>
          <Field label="Job title" required>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Frontend Engineer" />
          </Field>
          <Field label="Department / team">
            <Input value={form.department} onChange={(e) => set('department', e.target.value)} placeholder="e.g. Engineering" />
          </Field>
          <Field label="Company name" required>
            <Input value={form.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="e.g. Acme Inc." />
          </Field>
          <Field label="Country">
            <Input value={form.country} onChange={(e) => set('country', e.target.value)} placeholder="India" />
          </Field>
          <Field label="City" required>
            <Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Bengaluru" />
          </Field>
          <Field label="State">
            <Input value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="e.g. Karnataka" />
          </Field>
          <Field label="Remote type">
            <Select value={form.remoteType} onValueChange={(v) => set('remoteType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REMOTE_TYPES.map((t) => <SelectItem key={t} value={t}>{remoteTypeLabel(t)}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Employment type" required>
            <Select value={form.employmentType} onValueChange={(v) => set('employmentType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{employmentTypeLabel(t)}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Experience min (years)">
            <Input type="number" min="0" value={form.experienceMin} onChange={(e) => set('experienceMin', e.target.value)} placeholder="0" />
          </Field>
          <Field label="Experience max (years)">
            <Input type="number" min="0" value={form.experienceMax} onChange={(e) => set('experienceMax', e.target.value)} placeholder="3" />
          </Field>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox checked={form.fresherFriendly} onCheckedChange={(v) => set('fresherFriendly', v === true)} />
              <div>
                <p className="text-sm font-medium">Fresher friendly</p>
                <p className="text-xs text-muted-foreground">Highlight this role for entry-level candidates.</p>
              </div>
            </label>
          </div>
        </Grid2>
      </SectionCard>

      {/* COMPENSATION */}
      <SectionCard icon={Trophy} title="Compensation" description="Optional — but listed jobs with salary get 2× more applications.">
        <Grid2>
          <Field label="Salary min (₹)">
            <Input type="number" min="0" value={form.salaryMin} onChange={(e) => set('salaryMin', e.target.value)} placeholder="600000" />
          </Field>
          <Field label="Salary max (₹)">
            <Input type="number" min="0" value={form.salaryMax} onChange={(e) => set('salaryMax', e.target.value)} placeholder="1200000" />
          </Field>
          <Field label="Salary period">
            <Select value={form.salaryPeriod} onValueChange={(v) => set('salaryPeriod', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SALARY_PERIODS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox checked={form.salaryDisclosed} onCheckedChange={(v) => set('salaryDisclosed', v === true)} />
              <div>
                <p className="text-sm font-medium">Disclose salary to candidates</p>
                <p className="text-xs text-muted-foreground">Uncheck to hide the salary range.</p>
              </div>
            </label>
          </div>
        </Grid2>
      </SectionCard>

      {/* ELIGIBILITY */}
      <SectionCard icon={Pencil} title="Eligibility" description="Set the screening criteria. Blank means no requirement.">
        <Grid2>
          <Field label="Degree">
            <Select value={form.degree} onValueChange={(v) => set('degree', v === '__none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Any degree" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Any degree</SelectItem>
                {DEGREES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Branch / specialization (comma separated)">
            <Input value={form.branch} onChange={(e) => set('branch', e.target.value)} placeholder="CSE, IT, ECE" />
          </Field>
          <Field label="Specialization">
            <Input value={form.specialization} onChange={(e) => set('specialization', e.target.value)} placeholder="e.g. Full-stack web" />
          </Field>
          <Field label="Min CGPA">
            <Input type="number" min="0" max="10" step="0.1" value={form.cgpaRequirement} onChange={(e) => set('cgpaRequirement', e.target.value)} placeholder="e.g. 7.0" />
          </Field>
          <Field label="Backlog policy">
            <Select value={form.backlogPolicy} onValueChange={(v) => set('backlogPolicy', v === '__none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Not specified" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Not specified</SelectItem>
                {BACKLOG_POLICIES.map((p) => <SelectItem key={p} value={p}>{p.replace(/_/g, ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Skills (comma separated)">
            <Input value={form.skills} onChange={(e) => set('skills', e.target.value)} placeholder="React, TypeScript, Node" />
          </Field>
        </Grid2>
      </SectionCard>

      {/* INTERNSHIP */}
      <SectionCard icon={Sparkles} title="Internship options" description="Toggle if this is an internship role.">
        <label className="flex items-center gap-2.5 cursor-pointer mb-4">
          <Checkbox checked={form.isInternship} onCheckedChange={(v) => set('isInternship', v === true)} />
          <div>
            <p className="text-sm font-medium">This is an internship</p>
            <p className="text-xs text-muted-foreground">Adds internship-specific fields to the listing.</p>
          </div>
        </label>
        {form.isInternship && (
          <Grid2>
            <Field label="Duration (months)">
              <Input type="number" min="1" value={form.internshipDurationMonths} onChange={(e) => set('internshipDurationMonths', e.target.value)} placeholder="3" />
            </Field>
            <Field label="Paid status">
              <Select value={form.internshipPaid} onValueChange={(v) => set('internshipPaid', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="stipend_not_disclosed">Stipend not disclosed</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Stipend min (₹/mo)">
              <Input type="number" min="0" value={form.stipendMin} onChange={(e) => set('stipendMin', e.target.value)} placeholder="10000" />
            </Field>
            <Field label="Stipend max (₹/mo)">
              <Input type="number" min="0" value={form.stipendMax} onChange={(e) => set('stipendMax', e.target.value)} placeholder="25000" />
            </Field>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox checked={form.ppoAvailable} onCheckedChange={(v) => set('ppoAvailable', v === true)} />
                <div>
                  <p className="text-sm font-medium">Pre-placement offer (PPO) available</p>
                  <p className="text-xs text-muted-foreground">High-performing interns may be offered full-time roles.</p>
                </div>
              </label>
            </div>
          </Grid2>
        )}
      </SectionCard>

      {/* CONTENT */}
      <SectionCard icon={ClipboardList} title="Job content" description="Tell candidates what to expect.">
        <div className="space-y-4">
          <Field label="Description">
            <Textarea rows={6} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the role, team, and what a typical day looks like." />
          </Field>
          <Field label="Responsibilities">
            <Textarea rows={4} value={form.responsibilities} onChange={(e) => set('responsibilities', e.target.value)} placeholder="What will the person own and deliver?" />
          </Field>
          <Field label="Requirements">
            <Textarea rows={4} value={form.requirements} onChange={(e) => set('requirements', e.target.value)} placeholder="Must-haves and nice-to-haves." />
          </Field>
          <Grid2>
            <Field label="Benefits (comma separated)">
              <Input value={form.benefits} onChange={(e) => set('benefits', e.target.value)} placeholder="Health insurance, ESOPs, WFH" />
            </Field>
            <Field label="Application deadline">
              <Input type="date" value={form.applicationDeadline} onChange={(e) => set('applicationDeadline', e.target.value)} />
            </Field>
          </Grid2>
        </div>
      </SectionCard>

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

function SectionCard({
  icon: Icon, title, description, children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="size-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </Card>
  )
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  )
}

// ---------------- Main view ----------------
export function RecruiterView() {
  const view = useApp((s) => s.view)
  const setView = useApp((s) => s.setView)
  const user = useApp((s) => s.user)

  const tab = viewToTab[view] ?? 'dashboard'
  const setTab = (t: RecruiterTab) => setView(tabToView[t])

  const [editJob, setEditJob] = useState<any | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [jobsVersion, setJobsVersion] = useState(0)
  const bump = () => setJobsVersion((v) => v + 1)

  if (!user) {
    return (
      <div className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <Card className="p-10 text-center">
          <Briefcase className="size-10 mx-auto text-muted-foreground/40 mb-3" />
          <h1 className="text-lg font-semibold">Recruiter access required</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Sign in with a recruiter or company admin account to continue.</p>
          <Button onClick={() => useApp.getState().openAuth('login')}>Sign in</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1">
      <Tabs value={tab} onValueChange={(v) => setTab(v as RecruiterTab)} className="gap-0">
        {/* Sticky sub-nav */}
        <div className="sticky top-16 z-30 bg-background/85 backdrop-blur-xl border-b border-border/70 supports-[backdrop-filter]:bg-background/70">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <Briefcase className="size-5 text-primary" /> Recruiter portal
                </h1>
                <p className="text-xs text-muted-foreground">Post jobs, review applications, and track pipeline.</p>
              </div>
              <Button onClick={() => setTab('post')} size="sm" className="hidden sm:inline-flex">
                <Plus className="size-3.5" /> Post a job
              </Button>
            </div>
            <TabsList className="w-full justify-start overflow-x-auto sm:w-fit sm:justify-center">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="jobs">My jobs</TabsTrigger>
              <TabsTrigger value="post">Post a job</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <TabsContent value="dashboard">
            <DashboardTab onGoJobs={() => setTab('jobs')} onGoApps={() => setTab('applications')} onPost={() => setTab('post')} />
          </TabsContent>
          <TabsContent value="jobs">
            <JobsTab
              jobsVersion={jobsVersion}
              onPost={() => setTab('post')}
              onEdit={(job) => { setEditJob(job); setEditOpen(true) }}
            />
          </TabsContent>
          <TabsContent value="post">
            <PostJobTab
              onDone={() => { bump(); setTab('jobs') }}
              onCancel={() => setTab('jobs')}
            />
          </TabsContent>
          <TabsContent value="applications">
            <ApplicationsTab />
          </TabsContent>
        </div>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit job</DialogTitle>
            <DialogDescription>Update the listing details below.</DialogDescription>
          </DialogHeader>
          {editJob && (
            <JobForm
              key={editJob.id}
              initial={jobToForm(editJob)}
              submitLabel="Save changes"
              onCancel={() => setEditOpen(false)}
              compact
              onSubmit={async (body) => {
                try {
                  await api.recruiterUpdateJob(editJob.id, body)
                  toast.success('Job updated')
                  setEditOpen(false)
                  bump()
                } catch (e: any) {
                  throw e
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------- Dashboard tab ----------------
function DashboardTab({
  onGoJobs, onGoApps, onPost,
}: {
  onGoJobs: () => void
  onGoApps: () => void
  onPost: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<any[]>([])
  const [apps, setApps] = useState<any[]>([])

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      const [jobsRes, appsRes] = await Promise.allSettled([
        api.recruiterJobs(),
        api.recruiterApplications(),
      ])
      if (!active) return
      if (jobsRes.status === 'fulfilled') setJobs(unwrap<any>(jobsRes.value, 'jobs'))
      if (appsRes.status === 'fulfilled') setApps(unwrap<any>(appsRes.value, 'applications'))
      if (jobsRes.status === 'rejected' && appsRes.status === 'rejected') {
        toast.error('Could not load recruiter dashboard')
      }
      if (active) setLoading(false)
    }
    load()
    return () => { active = false }
  }, [])

  const activeJobs = jobs.filter((j) => j.status === 'active')
  const interviews = apps.filter((a) => a.status === 'interview').length
  const offers = apps.filter((a) => a.status === 'offer').length

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <RecruiterStat icon={Briefcase} label="Active jobs" value={loading ? '—' : String(activeJobs.length)} onClick={onGoJobs} loading={loading} />
        <RecruiterStat icon={ClipboardList} label="Total applications" value={loading ? '—' : String(apps.length)} onClick={onGoApps} loading={loading} />
        <RecruiterStat icon={CalendarClock} label="Interviews scheduled" value={loading ? '—' : String(interviews)} onClick={onGoApps} loading={loading} accent="violet" />
        <RecruiterStat icon={Trophy} label="Offers made" value={loading ? '—' : String(offers)} onClick={onGoApps} loading={loading} accent="emerald" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active jobs list */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="size-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Your active jobs</h2>
                <p className="text-xs text-muted-foreground">5 most recent</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs" onClick={onGoJobs}>View all</Button>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-md" />)}
            </div>
          ) : activeJobs.length === 0 ? (
            <EmptyBlock title="No active jobs" description="Post your first job to start receiving applications." cta={<Button size="sm" onClick={onPost}><Plus className="size-3.5" /> Post a job</Button>} />
          ) : (
            <div className="space-y-2">
              {activeJobs.slice(0, 5).map((j) => (
                <button key={j.id} onClick={onGoJobs} className="w-full text-left p-3 rounded-lg border border-border/70 hover:border-primary/30 hover:bg-accent/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{j.title}</p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                        <Building2 className="size-3" /> {j.companyName}
                        {j.city && <><span className="text-border">·</span><MapPin className="size-3" /> {j.city}</>}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{j.applicationCount ?? 0} apps</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Recent applications */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="size-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Recent applications</h2>
                <p className="text-xs text-muted-foreground">5 most recent</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs" onClick={onGoApps}>View all</Button>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-md" />)}
            </div>
          ) : apps.length === 0 ? (
            <EmptyBlock title="No applications yet" description="Once candidates apply to your jobs, they'll appear here." />
          ) : (
            <div className="space-y-2">
              {apps.slice(0, 5).map((a) => (
                <div key={a.id} className="p-3 rounded-lg border border-border/70">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{a.user?.name ?? 'Applicant'}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.jobTitle}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">{timeAgo(a.appliedAt)}</p>
                    </div>
                    <ApplicationStatusBadge status={a.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// ---------------- My Jobs tab ----------------
function JobsTab({
  jobsVersion, onPost, onEdit,
}: {
  jobsVersion: number
  onPost: () => void
  onEdit: (job: any) => void
}) {
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.recruiterJobs()
        if (active) setJobs(unwrap<any>(res, 'jobs'))
      } catch (e: any) {
        if (active) toast.error(e.message || 'Could not load jobs')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [jobsVersion])

  const filtered = useMemo(() => {
    if (!q.trim()) return jobs
    const t = q.toLowerCase()
    return jobs.filter((j) =>
      (j.title ?? '').toLowerCase().includes(t) ||
      (j.companyName ?? '').toLowerCase().includes(t) ||
      (j.city ?? '').toLowerCase().includes(t)
    )
  }, [jobs, q])

  const closeJob = async (j: any) => {
    setBusy(j.id)
    try {
      await api.recruiterDeleteJob(j.id)
      setJobs((prev) => prev.map((x) => (x.id === j.id ? { ...x, status: 'closed' } : x)))
      toast.success('Job closed')
    } catch (e: any) {
      toast.error(e.message || 'Could not close job')
    } finally {
      setBusy(null)
    }
  }

  const reopenJob = async (j: any) => {
    setBusy(j.id)
    try {
      await api.recruiterUpdateJob(j.id, { status: 'active' })
      setJobs((prev) => prev.map((x) => (x.id === j.id ? { ...x, status: 'active' } : x)))
      toast.success('Job reopened')
    } catch (e: any) {
      toast.error(e.message || 'Could not reopen job')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your jobs…"
            className="pl-9"
          />
        </div>
        <Button onClick={onPost} size="sm">
          <Plus className="size-3.5" /> Post a new job
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyBlock
          title={jobs.length === 0 ? 'No jobs posted yet' : 'No matches'}
          description={jobs.length === 0 ? 'Post your first job to attract candidates.' : 'Try a different search term.'}
          cta={jobs.length === 0 ? <Button size="sm" onClick={onPost}><Plus className="size-3.5" /> Post a job</Button> : undefined}
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((j) => {
            const closed = j.status === 'closed'
            const deadline = daysUntil(j.applicationDeadline)
            return (
              <Card key={j.id} className={`p-4 sm:p-5 ${closed ? 'opacity-70' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{j.title}</h3>
                      <StatusPill status={j.status} />
                      {j.fresherFriendly && <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Fresher friendly</Badge>}
                      {j.isInternship && <Badge variant="secondary" className="text-[10px] bg-violet-500/10 text-violet-700 dark:text-violet-400">Internship</Badge>}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Building2 className="size-3" />{j.companyName}</span>
                      {j.city && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{j.city}</span>}
                      {j.remoteType && <span>{remoteTypeLabel(j.remoteType)}</span>}
                      {j.employmentType && <span>{employmentTypeLabel(j.employmentType)}</span>}
                      <span className="inline-flex items-center gap-1"><Clock className="size-3" />Posted {timeAgo(j.postedAt)}</span>
                      {deadline != null && deadline >= 0 && <span className="text-amber-600 dark:text-amber-400">Closes in {deadline}d</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      <Users className="size-3 mr-1" /> {j.applicationCount ?? 0}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => onEdit(j)} title="Edit">
                      <Pencil className="size-3.5" />
                    </Button>
                    {closed ? (
                      <Button size="sm" variant="outline" onClick={() => reopenJob(j)} disabled={busy === j.id} title="Reopen">
                        {busy === j.id ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => closeJob(j)} disabled={busy === j.id} title="Close">
                        {busy === j.id ? <Loader2 className="size-3.5 animate-spin" /> : <Ban className="size-3.5" />}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => useApp.getState().openJob(j.id)} title="View">
                      <Eye className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------------- Post a Job tab ----------------
function PostJobTab({
  onDone, onCancel,
}: {
  onDone: () => void
  onCancel: () => void
}) {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight">Post a new job</h2>
        <p className="text-sm text-muted-foreground mt-1">Fill out the details below. Required fields are marked with <span className="text-destructive">*</span>.</p>
      </div>
      <JobForm
        submitLabel="Publish job"
        onCancel={onCancel}
        onSubmit={async (body) => {
          await api.recruiterCreateJob(body)
          toast.success('Job published')
          onDone()
        }}
      />
    </div>
  )
}

// ---------------- Applications tab ----------------
type AppFilter = 'all' | 'applied' | 'assessment' | 'interview' | 'offer' | 'rejected'

const APP_FILTERS: { key: AppFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'applied', label: 'Applied' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'interview', label: 'Interview' },
  { key: 'offer', label: 'Offer' },
  { key: 'rejected', label: 'Rejected' },
]

function ApplicationsTab() {
  const [loading, setLoading] = useState(true)
  const [apps, setApps] = useState<any[]>([])
  const [filter, setFilter] = useState<AppFilter>('all')
  const [q, setQ] = useState('')
  const [shortlisted, setShortlisted] = useState<Record<string, boolean>>({})
  const [selected, setSelected] = useState<any | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.recruiterApplications()
        if (active) setApps(unwrap<any>(res, 'applications'))
      } catch (e: any) {
        if (active) toast.error(e.message || 'Could not load applications')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      if (filter !== 'all' && a.status !== filter) return false
      if (q.trim()) {
        const t = q.toLowerCase()
        const name = (a.user?.name ?? '').toLowerCase()
        const email = (a.user?.email ?? '').toLowerCase()
        const jobTitle = (a.jobTitle ?? '').toLowerCase()
        if (!name.includes(t) && !email.includes(t) && !jobTitle.includes(t)) return false
      }
      return true
    })
  }, [apps, filter, q])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: apps.length }
    for (const a of apps) c[a.status] = (c[a.status] ?? 0) + 1
    return c
  }, [apps])

  return (
    <div className="space-y-4">
      <Card className="p-3 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-2 text-xs">
          <Info className="size-4 text-primary shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Recruiter application management is in demo mode.</span>{' '}
            You can browse applications and shortlist candidates locally — status updates and notes are not persisted in this sandbox.
          </p>
        </div>
      </Card>

      {/* Filter + search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 flex-wrap">
          {APP_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {f.label}
              <span className="ml-1.5 opacity-70">{counts[f.key] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="relative max-w-xs flex-1 min-w-[200px]">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search applicant or job…" className="pl-9" />
        </div>
      </div>

      {/* Table (desktop) / cards (mobile) */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-md" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyBlock
          title={apps.length === 0 ? 'No applications yet' : 'No matches'}
          description={apps.length === 0 ? 'Applications to your posted jobs will appear here.' : 'Try a different filter or search.'}
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Applicant</th>
                  <th className="text-left font-medium px-4 py-3">Job</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3">Applied</th>
                  <th className="text-right font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-t border-border/70 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8 rounded-full border border-border">
                          <AvatarFallback className="rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {(a.user?.name ?? '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{a.user?.name ?? 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground truncate">{a.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="truncate max-w-[220px]">{a.jobTitle}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[220px]">{a.companyName}</p>
                    </td>
                    <td className="px-4 py-3"><ApplicationStatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{timeAgo(a.appliedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant={shortlisted[a.id] ? 'default' : 'outline'}
                          onClick={() => setShortlisted((s) => ({ ...s, [a.id]: !s[a.id] }))}
                          className="h-8 px-2.5"
                          title="Shortlist (local only)"
                        >
                          <Star className={`size-3.5 ${shortlisted[a.id] ? 'fill-current' : ''}`} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSelected(a)} className="h-8 px-2.5">
                          <Eye className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2.5">
            {filtered.map((a) => (
              <Card key={a.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-9 rounded-full border border-border shrink-0">
                      <AvatarFallback className="rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {(a.user?.name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.user?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.user?.email}</p>
                    </div>
                  </div>
                  <ApplicationStatusBadge status={a.status} />
                </div>
                <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm truncate">{a.jobTitle}</p>
                    <p className="text-xs text-muted-foreground">{a.companyName} · {timeAgo(a.appliedAt)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant={shortlisted[a.id] ? 'default' : 'outline'} onClick={() => setShortlisted((s) => ({ ...s, [a.id]: !s[a.id] }))} className="h-8 px-2.5">
                      <Star className={`size-3.5 ${shortlisted[a.id] ? 'fill-current' : ''}`} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelected(a)} className="h-8 px-2.5">
                      <Eye className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Details dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Application details</DialogTitle>
            <DialogDescription>Demo mode — read-only in this sandbox.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-12 rounded-full border border-border">
                  <AvatarFallback className="rounded-full bg-primary/10 text-primary font-medium">
                    {(selected.user?.name ?? '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selected.user?.name}</p>
                  <p className="text-sm text-muted-foreground">{selected.user?.email}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Job</p>
                  <p className="font-medium">{selected.jobTitle}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Company</p>
                  <p className="font-medium">{selected.companyName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Applied</p>
                  <p className="font-medium">{timeAgo(selected.appliedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <ApplicationStatusBadge status={selected.status} />
                </div>
                {selected.interviewDate && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Interview date</p>
                    <p className="font-medium">{new Date(selected.interviewDate).toLocaleString()}</p>
                  </div>
                )}
                {selected.notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="text-sm">{selected.notes}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button
                  asChild
                  className="flex-1"
                >
                  <a href={`mailto:${selected.user?.email}?subject=Re: Your application for ${encodeURIComponent(selected.jobTitle ?? '')}`}>
                    <ExternalLink className="size-3.5" /> Contact candidate
                  </a>
                </Button>
                <Button
                  variant={shortlisted[selected.id] ? 'default' : 'outline'}
                  onClick={() => setShortlisted((s) => ({ ...s, [selected.id]: !s[selected.id] }))}
                >
                  <Star className={`size-3.5 ${shortlisted[selected.id] ? 'fill-current' : ''}`} />
                  {shortlisted[selected.id] ? 'Shortlisted' : 'Shortlist'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------- Small components ----------------
function RecruiterStat({
  icon: Icon, label, value, onClick, loading, accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  onClick: () => void
  loading?: boolean
  accent?: 'violet' | 'emerald'
}) {
  const accentClass = accent === 'violet'
    ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
    : accent === 'emerald'
    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    : 'bg-primary/10 text-primary'
  return (
    <button onClick={onClick} className="text-left group focus:outline-none">
      <Card className="p-4 card-hover border-border/70 group-hover:border-primary/30 h-full">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-2xl font-bold tracking-tight mt-1">{loading ? '—' : value}</p>
          </div>
          <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${accentClass}`}>
            <Icon className="size-4" />
          </div>
        </div>
      </Card>
    </button>
  )
}

function EmptyBlock({ title, description, cta }: { title: string; description: string; cta?: React.ReactNode }) {
  return (
    <Card className="p-10 border-dashed text-center bg-muted/20">
      <Inbox className="size-9 mx-auto text-muted-foreground/40 mb-3" />
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm mx-auto">{description}</p>
      {cta}
    </Card>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    closed: 'bg-muted text-muted-foreground',
    expired: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    draft: 'bg-muted text-muted-foreground',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${map[status] ?? 'bg-muted text-muted-foreground'}`}>{status}</span>
}

function ApplicationStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    applied: 'bg-muted text-muted-foreground border-border',
    assessment: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    interview: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20',
    offer: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    rejected: 'bg-destructive/10 text-destructive border-destructive/20',
    withdrawn: 'bg-muted text-muted-foreground border-border',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${map[status] ?? map.applied}`}>
      {status}
    </span>
  )
}
