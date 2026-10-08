'use client'

import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  GraduationCap, Briefcase, Sparkles, Link as LinkIcon, FileText, User as UserIcon,
  Target, Pencil, Check, Loader2, ExternalLink, Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { DEGREES, BRANCHES, profileCompletionPct } from '@/lib/jobs'
import type { ProfileData } from '@/lib/types'

type SectionKey =
  | 'personal' | 'education' | 'experience' | 'skills'
  | 'preferences' | 'portfolio' | 'resume'

const SECTIONS: { key: SectionKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'personal', label: 'Personal', icon: UserIcon },
  { key: 'education', label: 'Education', icon: GraduationCap },
  { key: 'experience', label: 'Experience', icon: Briefcase },
  { key: 'skills', label: 'Skills', icon: Sparkles },
  { key: 'preferences', label: 'Preferences', icon: Target },
  { key: 'portfolio', label: 'Portfolio', icon: LinkIcon },
  { key: 'resume', label: 'Resume', icon: FileText },
]

const HIGHEST_QUALIFICATIONS = ['High School', 'Diploma', 'ITI', 'Polytechnic', 'Undergraduate', 'Postgraduate', 'Doctorate', 'Other'] as const
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'] as const
const EXPERIENCE_KINDS = [
  { value: 'fresher', label: 'Fresher (no full-time experience)' },
  { value: 'experienced', label: 'Experienced professional' },
  { value: 'intern', label: 'Intern / Student' },
  { value: 'gap', label: 'Career gap / returning' },
] as const
const EMPLOYMENT_OPTIONS = ['full_time', 'part_time', 'contract', 'internship', 'apprenticeship', 'freelance', 'graduate_program', 'management_trainee']
const REMOTE_OPTIONS = ['remote', 'hybrid', 'onsite', 'work_from_home', 'no_preference']
const SHIFT_OPTIONS = ['day', 'night', 'rotating', 'flexible', 'any']

function csvToList(s: string | null | undefined): string[] {
  if (!s) return []
  return s.split(',').map((x) => x.trim()).filter(Boolean)
}

function listToCsv(arr: string[]): string {
  return arr.join(', ')
}

function orDash(v: any): string {
  if (v === null || v === undefined || v === '') return 'Not specified'
  if (typeof v === 'number' && v === 0) return 'Not specified'
  return String(v)
}

function CompletionRing({ value, size = 96 }: { value: number; size?: number }) {
  const stroke = 8
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={stroke} className="text-muted/40" fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        stroke="currentColor" strokeWidth={stroke} fill="none"
        className="text-primary transition-all duration-500"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ProfileView() {
  const user = useApp((s) => s.user)
  const setView = useApp((s) => s.setView)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [editing, setEditing] = useState<SectionKey | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const p = await api.getProfile()
        if (active) setProfile(p)
      } catch (e: any) {
        if (active) toast.error(e.message || 'Could not load profile')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const completion = useMemo(() => (profile ? profileCompletionPct(profile) : 0), [profile])

  const handleSave = async (section: SectionKey, data: Partial<ProfileData>) => {
    setSaving(true)
    try {
      const updated = await api.updateProfile(data)
      setProfile(updated)
      setEditing(null)
      toast.success('Profile updated')
    } catch (e: any) {
      toast.error(e.message || 'Could not save changes')
    } finally {
      setSaving(false)
    }
  }

  // Suggestions for completion
  const suggestions: string[] = []
  if (profile) {
    if (!profile.resumeUrl) suggestions.push('Add your resume to boost match accuracy by ~30%.')
    if (!profile.linkedinUrl) suggestions.push('Link your LinkedIn to help recruiters find you.')
    if (!profile.technicalSkills) suggestions.push('Add technical skills to surface in recruiter search.')
    if (!profile.desiredJobTitle) suggestions.push('Specify your desired job title for personalized recommendations.')
    if (!profile.preferredLocations) suggestions.push('Add preferred locations to refine your job matches.')
    if (!profile.githubUrl && !profile.portfolioUrl) suggestions.push('Showcase work with a GitHub or portfolio link.')
  }

  if (loading) {
    return (
      <div className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-12 border-dashed text-center">
          <h2 className="text-lg font-semibold mb-2">Could not load your profile</h2>
          <p className="text-sm text-muted-foreground mb-4">There was a problem fetching your profile. Please try again.</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header card */}
      <Card className="p-6 mb-6 overflow-hidden relative border-border/70">
        <div className="absolute inset-0 hero-grid opacity-20 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="relative shrink-0">
            <CompletionRing value={completion} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tracking-tight">{completion}%</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">complete</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <Avatar className="size-10 rounded-xl border border-border">
                <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold text-sm">
                  {user?.name?.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{user?.name ?? 'Your profile'}</h1>
                <p className="text-sm text-muted-foreground truncate">
                  {profile?.headline || 'Add a headline to stand out to recruiters'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Progress value={completion} className="h-1.5 max-w-sm flex-1" />
              <span className="text-xs text-muted-foreground">
                {completion >= 100 ? 'Profile complete' : completion >= 70 ? 'Almost there' : completion >= 40 ? 'Keep going' : 'Just getting started'}
              </span>
            </div>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="relative mt-5 pt-5 border-t border-border/60">
            <div className="flex items-start gap-2">
              <Info className="size-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Boost your profile</p>
                <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                  {suggestions.slice(0, 3).map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-primary">·</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Sections grid */}
      <div className="grid gap-5">
        <PersonalSection profile={profile} onEdit={() => setEditing('personal')} />
        <EducationSection profile={profile} onEdit={() => setEditing('education')} />
        <ExperienceSection profile={profile} onEdit={() => setEditing('experience')} />
        <SkillsSection profile={profile} onEdit={() => setEditing('skills')} />
        <PreferencesSection profile={profile} onEdit={() => setEditing('preferences')} />
        <PortfolioSection profile={profile} onEdit={() => setEditing('portfolio')} />
        <ResumeSection profile={profile} onEdit={() => setEditing('resume')} />
      </div>

      {/* Edit dialogs */}
      {editing === 'personal' && (
        <PersonalDialog
          profile={profile!} saving={saving}
          onClose={() => setEditing(null)}
          onSave={(d) => handleSave('personal', d)}
        />
      )}
      {editing === 'education' && (
        <EducationDialog
          profile={profile!} saving={saving}
          onClose={() => setEditing(null)}
          onSave={(d) => handleSave('education', d)}
        />
      )}
      {editing === 'experience' && (
        <ExperienceDialog
          profile={profile!} saving={saving}
          onClose={() => setEditing(null)}
          onSave={(d) => handleSave('experience', d)}
        />
      )}
      {editing === 'skills' && (
        <SkillsDialog
          profile={profile!} saving={saving}
          onClose={() => setEditing(null)}
          onSave={(d) => handleSave('skills', d)}
        />
      )}
      {editing === 'preferences' && (
        <PreferencesDialog
          profile={profile!} saving={saving}
          onClose={() => setEditing(null)}
          onSave={(d) => handleSave('preferences', d)}
        />
      )}
      {editing === 'portfolio' && (
        <PortfolioDialog
          profile={profile!} saving={saving}
          onClose={() => setEditing(null)}
          onSave={(d) => handleSave('portfolio', d)}
        />
      )}
      {editing === 'resume' && (
        <ResumeDialog
          profile={profile!} saving={saving}
          onClose={() => setEditing(null)}
          onSave={(d) => handleSave('resume', d)}
        />
      )}

      {/* footer hint */}
      <p className="mt-8 text-center text-xs text-muted-foreground">
        Tip: a complete profile improves match accuracy and surfaces you in recruiter searches.
        {' '}
        <button onClick={() => setView('dashboard')} className="text-primary hover:underline">Back to dashboard</button>
      </p>
    </div>
  )
}

/* ---------- Section card wrapper ---------- */
function SectionCard({
  title, subtitle, icon: Icon, onEdit, children,
}: {
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <Card className="border-border/70">
      <div className="flex items-start justify-between p-5 pb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="size-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-base">{title}</h2>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onEdit} className="shrink-0">
          <Pencil className="size-3.5" /> Edit
        </Button>
      </div>
      <div className="px-5 pb-5">{children}</div>
    </Card>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  )
}

function TagList({ items, emptyLabel = 'Not specified' }: { items: string[]; emptyLabel?: string }) {
  if (items.length === 0) return <span className="text-sm text-muted-foreground">{emptyLabel}</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <Badge key={s} variant="secondary" className="text-xs font-normal bg-muted text-foreground/80">
          {s}
        </Badge>
      ))}
    </div>
  )
}

/* ---------- Display sections ---------- */
function PersonalSection({ profile, onEdit }: { profile: ProfileData | null; onEdit: () => void }) {
  return (
    <SectionCard title="Personal information" subtitle="How recruiters will identify and reach you" icon={UserIcon} onEdit={onEdit}>
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
        <Field label="Headline" value={orDash(profile?.headline)} />
        <Field label="Phone" value={orDash(profile?.phone)} />
        <Field label="Current location" value={orDash(profile?.currentLocation)} />
        <Field label="Preferred locations" value={orDash(profile?.preferredLocations)} />
      </dl>
    </SectionCard>
  )
}

function EducationSection({ profile, onEdit }: { profile: ProfileData | null; onEdit: () => void }) {
  return (
    <SectionCard title="Education" subtitle="Your highest qualification and academic record" icon={GraduationCap} onEdit={onEdit}>
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
        <Field label="Highest qualification" value={orDash(profile?.highestQualification)} />
        <Field label="Degree" value={orDash(profile?.degree)} />
        <Field label="Branch / Specialization" value={orDash(profile?.specialization || profile?.branch)} />
        <Field label="University" value={orDash(profile?.university)} />
        <Field label="College" value={orDash(profile?.college)} />
        <Field label="Graduation year" value={orDash(profile?.graduationYear)} />
        <Field label="CGPA" value={profile?.cgpa ? String(profile.cgpa) : 'Not specified'} />
        <Field label="Percentage" value={profile?.percentage ? `${profile.percentage}%` : 'Not specified'} />
        <Field label="Backlogs" value={profile?.backlogs ? String(profile.backlogs) : '0'} />
        <Field label="Active backlogs" value={profile?.activeBacklogs ? String(profile.activeBacklogs) : '0'} />
        <Field label="Gap years" value={profile?.gapYears ? String(profile.gapYears) : '0'} />
      </dl>
    </SectionCard>
  )
}

function ExperienceSection({ profile, onEdit }: { profile: ProfileData | null; onEdit: () => void }) {
  const kindLabel = profile?.experienceKind
    ? EXPERIENCE_KINDS.find((k) => k.value === profile.experienceKind)?.label ?? profile.experienceKind
    : 'Not specified'
  return (
    <SectionCard title="Experience" subtitle="Your career stage and total experience" icon={Briefcase} onEdit={onEdit}>
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
        <Field label="Experience kind" value={kindLabel} />
        <Field label="Total experience (years)" value={orDash(profile?.totalExperienceYears)} />
      </dl>
    </SectionCard>
  )
}

function SkillsSection({ profile, onEdit }: { profile: ProfileData | null; onEdit: () => void }) {
  return (
    <SectionCard title="Skills & certifications" subtitle="Technical, soft, tools and certifications" icon={Sparkles} onEdit={onEdit}>
      <div className="space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-2">Technical skills</p>
          <TagList items={csvToList(profile?.technicalSkills)} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-2">Soft skills</p>
          <TagList items={csvToList(profile?.softSkills)} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-2">Tools</p>
          <TagList items={csvToList(profile?.tools)} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-2">Certifications</p>
          <TagList items={csvToList(profile?.certifications)} />
        </div>
      </div>
    </SectionCard>
  )
}

function PreferencesSection({ profile, onEdit }: { profile: ProfileData | null; onEdit: () => void }) {
  const empLabel = (v: string | null | undefined) => v ? v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Not specified'
  return (
    <SectionCard title="Career preferences" subtitle="What you're looking for in your next role" icon={Target} onEdit={onEdit}>
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
        <Field label="Desired job title" value={orDash(profile?.desiredJobTitle)} />
        <Field label="Desired roles" value={orDash(profile?.desiredRoles)} />
        <Field label="Industries" value={orDash(profile?.industries)} />
        <Field label="Salary expectation" value={
          profile?.salaryExpectationMin != null || profile?.salaryExpectationMax != null
            ? `₹${profile?.salaryExpectationMin ?? 0} – ₹${profile?.salaryExpectationMax ?? 0} LPA`
            : 'Not specified'
        } />
        <Field label="Employment type" value={empLabel(profile?.employmentType)} />
        <Field label="Remote preference" value={empLabel(profile?.remotePreference)} />
        <Field label="Willing to relocate" value={profile?.willingToRelocate ? 'Yes' : 'No'} />
        <Field label="Shift preference" value={empLabel(profile?.shiftPreference)} />
      </dl>
    </SectionCard>
  )
}

function PortfolioSection({ profile, onEdit }: { profile: ProfileData | null; onEdit: () => void }) {
  const links = [
    { label: 'GitHub', url: profile?.githubUrl },
    { label: 'LinkedIn', url: profile?.linkedinUrl },
    { label: 'Portfolio', url: profile?.portfolioUrl },
    { label: 'Behance', url: profile?.behanceUrl },
    { label: 'Dribbble', url: profile?.dribbbleUrl },
    { label: 'Kaggle', url: profile?.kaggleUrl },
    { label: 'ResearchGate', url: profile?.researchgateUrl },
  ].filter((l) => l.url)
  return (
    <SectionCard title="Portfolio & links" subtitle="Showcase your work across platforms" icon={LinkIcon} onEdit={onEdit}>
      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground">Not specified</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.url!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline truncate"
            >
              <ExternalLink className="size-3.5 shrink-0" />
              <span className="truncate">{l.label}: {l.url}</span>
            </a>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

function ResumeSection({ profile, onEdit }: { profile: ProfileData | null; onEdit: () => void }) {
  return (
    <SectionCard title="Resume" subtitle="Your latest resume link" icon={FileText} onEdit={onEdit}>
      {profile?.resumeUrl ? (
        <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ExternalLink className="size-3.5" />
          {profile.resumeUrl}
        </a>
      ) : (
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <Info className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium">Not uploaded</p>
            <p className="text-xs text-muted-foreground mt-0.5">Add your resume to boost match accuracy by ~30%.</p>
          </div>
        </div>
      )}
    </SectionCard>
  )
}

/* ---------- Dialog primitives ---------- */
function DialogShell({
  title, onClose, onSave, saving, children, description,
}: {
  title: string
  description?: string
  onClose: () => void
  onSave: () => void
  saving: boolean
  children: React.ReactNode
}) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4 py-2">{children}</div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TextInput({ label, value, onChange, placeholder, type = 'text' }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

function NumberInput({ label, value, onChange, placeholder }: {
  label: string
  value: number | string
  onChange: (v: number | null) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value
          onChange(v === '' ? null : Number(v))
        }}
        placeholder={placeholder}
      />
    </div>
  )
}

function SelectInput({ label, value, onChange, options }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value || '__none'} onValueChange={(v) => onChange(v === '__none' ? '' : v)}>
        <SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__none" className="text-muted-foreground">Not specified</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function CommaInput({ label, value, onChange, placeholder }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Comma-separated values…'}
        rows={2}
      />
      <p className="text-[11px] text-muted-foreground">Separate with commas. Rendered as tag chips.</p>
    </div>
  )
}

/* ---------- Edit dialogs ---------- */
function PersonalDialog({ profile, onClose, onSave, saving }: {
  profile: ProfileData
  onClose: () => void
  onSave: (d: Partial<ProfileData>) => void
  saving: boolean
}) {
  const [headline, setHeadline] = useState(profile.headline ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [currentLocation, setCurrentLocation] = useState(profile.currentLocation ?? '')
  const [preferredLocations, setPreferredLocations] = useState(profile.preferredLocations ?? '')
  return (
    <DialogShell title="Edit personal information" description="Recruiters see this at the top of your profile." onClose={onClose} onSave={() => onSave({ headline, phone, currentLocation, preferredLocations })} saving={saving}>
      <TextInput label="Headline" value={headline} onChange={setHeadline} placeholder="e.g. BTech CSE final-year student seeking SDE internships" />
      <TextInput label="Phone" value={phone} onChange={setPhone} placeholder="e.g. +91 9876543210" />
      <TextInput label="Current location" value={currentLocation} onChange={setCurrentLocation} placeholder="e.g. Bangalore, India" />
      <CommaInput label="Preferred locations" value={preferredLocations} onChange={setPreferredLocations} placeholder="e.g. Bangalore, Pune, Remote" />
    </DialogShell>
  )
}

function EducationDialog({ profile, onClose, onSave, saving }: {
  profile: ProfileData
  onClose: () => void
  onSave: (d: Partial<ProfileData>) => void
  saving: boolean
}) {
  const [highestQualification, setHighest] = useState(profile.highestQualification ?? '')
  const [degree, setDegree] = useState(profile.degree ?? '')
  const [specialization, setSpecialization] = useState(profile.specialization ?? '')
  const [branch, setBranch] = useState(profile.branch ?? '')
  const [university, setUniversity] = useState(profile.university ?? '')
  const [college, setCollege] = useState(profile.college ?? '')
  const [graduationYear, setGraduationYear] = useState<number | null>(profile.graduationYear)
  const [cgpa, setCgpa] = useState<number | null>(profile.cgpa)
  const [percentage, setPercentage] = useState<number | null>(profile.percentage)
  const [backlogs, setBacklogs] = useState<number>(profile.backlogs ?? 0)
  const [activeBacklogs, setActiveBacklogs] = useState<number>(profile.activeBacklogs ?? 0)
  const [gapYears, setGapYears] = useState<number>(profile.gapYears ?? 0)
  return (
    <DialogShell title="Edit education" description="Your academic background drives match accuracy." onClose={onClose} onSave={() => onSave({
      highestQualification, degree, specialization, branch, university, college,
      graduationYear, cgpa, percentage, backlogs, activeBacklogs, gapYears,
    })} saving={saving}>
      <div className="grid sm:grid-cols-2 gap-3">
        <SelectInput label="Highest qualification" value={highestQualification} onChange={setHighest}
          options={HIGHEST_QUALIFICATIONS.map((q) => ({ value: q, label: q }))} />
        <SelectInput label="Degree" value={degree} onChange={setDegree}
          options={DEGREES.map((d) => ({ value: d, label: d }))} />
        <TextInput label="Specialization" value={specialization} onChange={setSpecialization} placeholder="e.g. Machine Learning" />
        <SelectInput label="Branch" value={branch} onChange={setBranch}
          options={BRANCHES.map((b) => ({ value: b, label: b }))} />
        <TextInput label="University" value={university} onChange={setUniversity} placeholder="e.g. VTU" />
        <TextInput label="College" value={college} onChange={setCollege} placeholder="e.g. RV College of Engineering" />
        <NumberInput label="Graduation year" value={graduationYear ?? ''} onChange={setGraduationYear} placeholder="e.g. 2025" />
        <NumberInput label="CGPA" value={cgpa ?? ''} onChange={setCgpa} placeholder="e.g. 8.5" />
        <NumberInput label="Percentage" value={percentage ?? ''} onChange={setPercentage} placeholder="e.g. 85" />
        <NumberInput label="Backlogs" value={backlogs} onChange={(v) => setBacklogs(v ?? 0)} placeholder="0" />
        <NumberInput label="Active backlogs" value={activeBacklogs} onChange={(v) => setActiveBacklogs(v ?? 0)} placeholder="0" />
        <NumberInput label="Gap years" value={gapYears} onChange={(v) => setGapYears(v ?? 0)} placeholder="0" />
      </div>
    </DialogShell>
  )
}

function ExperienceDialog({ profile, onClose, onSave, saving }: {
  profile: ProfileData
  onClose: () => void
  onSave: (d: Partial<ProfileData>) => void
  saving: boolean
}) {
  const [experienceKind, setKind] = useState(profile.experienceKind ?? '')
  const [totalExperienceYears, setYears] = useState<number | null>(profile.totalExperienceYears)
  return (
    <DialogShell title="Edit experience" description="Tell us where you are in your career." onClose={onClose} onSave={() => onSave({ experienceKind, totalExperienceYears })} saving={saving}>
      <SelectInput label="Experience kind" value={experienceKind} onChange={setKind}
        options={EXPERIENCE_KINDS.map((k) => ({ value: k.value, label: k.label }))} />
      <NumberInput label="Total experience (years)" value={totalExperienceYears ?? ''} onChange={setYears} placeholder="e.g. 2" />
    </DialogShell>
  )
}

function SkillsDialog({ profile, onClose, onSave, saving }: {
  profile: ProfileData
  onClose: () => void
  onSave: (d: Partial<ProfileData>) => void
  saving: boolean
}) {
  const [technicalSkills, setTechnical] = useState(profile.technicalSkills ?? '')
  const [softSkills, setSoft] = useState(profile.softSkills ?? '')
  const [tools, setTools] = useState(profile.tools ?? '')
  const [certifications, setCertifications] = useState(profile.certifications ?? '')
  return (
    <DialogShell title="Edit skills & certifications" description="Comma-separated — these become tag chips." onClose={onClose} onSave={() => onSave({ technicalSkills, softSkills, tools, certifications })} saving={saving}>
      <CommaInput label="Technical skills" value={technicalSkills} onChange={setTechnical} placeholder="e.g. Python, React, SQL, Docker" />
      <CommaInput label="Soft skills" value={softSkills} onChange={setSoft} placeholder="e.g. Communication, Leadership, Teamwork" />
      <CommaInput label="Tools" value={tools} onChange={setTools} placeholder="e.g. Git, Jira, Figma, VS Code" />
      <CommaInput label="Certifications" value={certifications} onChange={setCertifications} placeholder="e.g. AWS Solutions Architect, Google Data Analyst" />
    </DialogShell>
  )
}

function PreferencesDialog({ profile, onClose, onSave, saving }: {
  profile: ProfileData
  onClose: () => void
  onSave: (d: Partial<ProfileData>) => void
  saving: boolean
}) {
  const [desiredJobTitle, setDesiredJobTitle] = useState(profile.desiredJobTitle ?? '')
  const [desiredRoles, setDesiredRoles] = useState(profile.desiredRoles ?? '')
  const [industries, setIndustries] = useState(profile.industries ?? '')
  const [salaryExpectationMin, setMin] = useState<number | null>(profile.salaryExpectationMin)
  const [salaryExpectationMax, setMax] = useState<number | null>(profile.salaryExpectationMax)
  const [employmentType, setEmploymentType] = useState(profile.employmentType ?? '')
  const [remotePreference, setRemotePreference] = useState(profile.remotePreference ?? '')
  const [shiftPreference, setShiftPreference] = useState(profile.shiftPreference ?? '')
  const [willingToRelocate, setWillingToRelocate] = useState<boolean>(profile.willingToRelocate ?? false)
  return (
    <DialogShell title="Edit career preferences" description="What you're looking for." onClose={onClose} onSave={() => onSave({
      desiredJobTitle, desiredRoles, industries, salaryExpectationMin, salaryExpectationMax,
      employmentType, remotePreference, shiftPreference, willingToRelocate,
    })} saving={saving}>
      <div className="grid sm:grid-cols-2 gap-3">
        <TextInput label="Desired job title" value={desiredJobTitle} onChange={setDesiredJobTitle} placeholder="e.g. Software Engineer" />
        <CommaInput label="Desired roles" value={desiredRoles} onChange={setDesiredRoles} placeholder="e.g. SDE, Backend Developer, Full-stack" />
        <CommaInput label="Industries" value={industries} onChange={setIndustries} placeholder="e.g. Fintech, SaaS, Healthcare" />
        <SelectInput label="Employment type" value={employmentType} onChange={setEmploymentType}
          options={EMPLOYMENT_OPTIONS.map((e) => ({ value: e, label: e.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }))} />
        <SelectInput label="Remote preference" value={remotePreference} onChange={setRemotePreference}
          options={REMOTE_OPTIONS.map((r) => ({ value: r, label: r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }))} />
        <SelectInput label="Shift preference" value={shiftPreference} onChange={setShiftPreference}
          options={SHIFT_OPTIONS.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} />
        <NumberInput label="Salary min (LPA)" value={salaryExpectationMin ?? ''} onChange={setMin} placeholder="e.g. 6" />
        <NumberInput label="Salary max (LPA)" value={salaryExpectationMax ?? ''} onChange={setMax} placeholder="e.g. 12" />
      </div>
      <div className="flex items-center justify-between gap-3 py-2">
        <div>
          <Label>Willing to relocate</Label>
          <p className="text-xs text-muted-foreground mt-0.5">Open to moving for the right role</p>
        </div>
        <Switch checked={willingToRelocate} onCheckedChange={setWillingToRelocate} />
      </div>
    </DialogShell>
  )
}

function PortfolioDialog({ profile, onClose, onSave, saving }: {
  profile: ProfileData
  onClose: () => void
  onSave: (d: Partial<ProfileData>) => void
  saving: boolean
}) {
  const [githubUrl, setGithub] = useState(profile.githubUrl ?? '')
  const [linkedinUrl, setLinkedin] = useState(profile.linkedinUrl ?? '')
  const [portfolioUrl, setPortfolio] = useState(profile.portfolioUrl ?? '')
  const [behanceUrl, setBehance] = useState(profile.behanceUrl ?? '')
  const [dribbbleUrl, setDribbble] = useState(profile.dribbbleUrl ?? '')
  const [kaggleUrl, setKaggle] = useState(profile.kaggleUrl ?? '')
  const [researchgateUrl, setResearchgate] = useState(profile.researchgateUrl ?? '')
  return (
    <DialogShell title="Edit portfolio links" description="Showcase your work across platforms." onClose={onClose} onSave={() => onSave({
      githubUrl, linkedinUrl, portfolioUrl, behanceUrl, dribbbleUrl, kaggleUrl, researchgateUrl,
    })} saving={saving}>
      <div className="grid sm:grid-cols-2 gap-3">
        <TextInput label="GitHub" value={githubUrl} onChange={setGithub} placeholder="https://github.com/username" />
        <TextInput label="LinkedIn" value={linkedinUrl} onChange={setLinkedin} placeholder="https://linkedin.com/in/username" />
        <TextInput label="Portfolio" value={portfolioUrl} onChange={setPortfolio} placeholder="https://yourname.dev" />
        <TextInput label="Behance" value={behanceUrl} onChange={setBehance} placeholder="https://behance.net/username" />
        <TextInput label="Dribbble" value={dribbbleUrl} onChange={setDribbble} placeholder="https://dribbble.com/username" />
        <TextInput label="Kaggle" value={kaggleUrl} onChange={setKaggle} placeholder="https://kaggle.com/username" />
        <TextInput label="ResearchGate" value={researchgateUrl} onChange={setResearchgate} placeholder="https://researchgate.net/profile/username" />
      </div>
    </DialogShell>
  )
}

function ResumeDialog({ profile, onClose, onSave, saving }: {
  profile: ProfileData
  onClose: () => void
  onSave: (d: Partial<ProfileData>) => void
  saving: boolean
}) {
  const [resumeUrl, setResumeUrl] = useState(profile.resumeUrl ?? '')
  return (
    <DialogShell title="Edit resume link" description="Paste a public link to your resume (Google Drive, Dropbox, personal site)." onClose={onClose} onSave={() => onSave({ resumeUrl: resumeUrl || null })} saving={saving}>
      <TextInput label="Resume URL" value={resumeUrl} onChange={setResumeUrl} placeholder="https://drive.google.com/…" />
      <p className="text-xs text-muted-foreground">
        Tip: ensure the link is publicly accessible. To analyze your resume with our ATS scorer,{' '}
        <button
          className="text-primary hover:underline"
          onClick={() => { onClose(); useApp.getState().setView('resume-analyzer') }}
        >
          go to the Resume Analyzer
        </button>.
      </p>
    </DialogShell>
  )
}
