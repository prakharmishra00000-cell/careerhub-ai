'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { DEGREES, BRANCHES, REMOTE_TYPES, employmentTypeLabel, remoteTypeLabel } from '@/lib/jobs'
import {
  GraduationCap, Sparkles, Briefcase, Target, MapPin, Check, Loader2, X, ArrowRight, ArrowLeft,
  Plus, Trash2, Wrench,
} from 'lucide-react'
import { toast } from 'sonner'

const STEPS = [
  { key: 'education', label: 'Education', icon: GraduationCap, desc: 'Tell us about your academic background' },
  { key: 'skills', label: 'Skills', icon: Wrench, desc: 'What are you good at?' },
  { key: 'experience', label: 'Experience', icon: Briefcase, desc: 'Your work history so far' },
  { key: 'preferences', label: 'Career goals', icon: Target, desc: 'What are you looking for?' },
  { key: 'location', label: 'Location', icon: MapPin, desc: 'Where do you want to work?' },
] as const

interface OnboardingData {
  degree: string
  branch: string
  university: string
  graduationYear: number | null
  cgpa: number | null
  technicalSkills: string
  softSkills: string
  tools: string
  experienceKind: string
  totalExperienceYears: number | null
  desiredJobTitle: string
  desiredRoles: string
  industries: string
  salaryExpectationMin: number | null
  salaryExpectationMax: number | null
  employmentType: string
  remotePreference: string
  willingToRelocate: boolean
  currentLocation: string
  preferredLocations: string
}

const INITIAL_DATA: OnboardingData = {
  degree: '', branch: '', university: '', graduationYear: null, cgpa: null,
  technicalSkills: '', softSkills: '', tools: '',
  experienceKind: 'fresher', totalExperienceYears: null,
  desiredJobTitle: '', desiredRoles: '', industries: '',
  salaryExpectationMin: null, salaryExpectationMax: null,
  employmentType: 'full_time', remotePreference: 'hybrid', willingToRelocate: false,
  currentLocation: '', preferredLocations: '',
}

const SKILL_SUGGESTIONS = ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'SQL', 'Java', 'AWS', 'Docker', 'Git', 'Communication', 'Leadership', 'Problem-solving', 'Teamwork', 'Excel', 'Figma', 'C++', 'Machine Learning']

export function OnboardingWizard({ open, onComplete, onSkip }: {
  open: boolean
  onComplete: () => void
  onSkip: () => void
}) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA)
  const [skillInput, setSkillInput] = useState('')
  const [saving, setSaving] = useState(false)

  const update = (field: keyof OnboardingData, value: any) => setData((d) => ({ ...d, [field]: value }))

  const addSkill = (field: 'technicalSkills' | 'softSkills' | 'tools', skill: string) => {
    const cur = (data[field] || '').split(',').map((s) => s.trim()).filter(Boolean)
    if (!cur.includes(skill) && skill.trim()) {
      update(field, [...cur, skill.trim()].join(', '))
    }
    setSkillInput('')
  }

  const removeSkill = (field: 'technicalSkills' | 'softSkills' | 'tools', skill: string) => {
    const cur = (data[field] || '').split(',').map((s) => s.trim()).filter(Boolean)
    update(field, cur.filter((s) => s !== skill).join(', '))
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1)
    else handleSave()
  }

  const handleBack = () => { if (step > 0) setStep((s) => s - 1) }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Convert to profile fields
      const profileUpdate: any = {}
      if (data.degree) profileUpdate.degree = data.degree
      if (data.branch) profileUpdate.branch = data.branch
      if (data.university) profileUpdate.university = data.university
      if (data.graduationYear) profileUpdate.graduationYear = data.graduationYear
      if (data.cgpa != null) profileUpdate.cgpa = data.cgpa
      if (data.technicalSkills) profileUpdate.technicalSkills = data.technicalSkills
      if (data.softSkills) profileUpdate.softSkills = data.softSkills
      if (data.tools) profileUpdate.tools = data.tools
      if (data.experienceKind) profileUpdate.experienceKind = data.experienceKind
      if (data.totalExperienceYears != null) profileUpdate.totalExperienceYears = data.totalExperienceYears
      if (data.desiredJobTitle) profileUpdate.desiredJobTitle = data.desiredJobTitle
      if (data.desiredRoles) profileUpdate.desiredRoles = data.desiredRoles
      if (data.industries) profileUpdate.industries = data.industries
      if (data.salaryExpectationMin != null) profileUpdate.salaryExpectationMin = data.salaryExpectationMin
      if (data.salaryExpectationMax != null) profileUpdate.salaryExpectationMax = data.salaryExpectationMax
      if (data.employmentType) profileUpdate.employmentType = data.employmentType
      if (data.remotePreference) profileUpdate.remotePreference = data.remotePreference
      profileUpdate.willingToRelocate = data.willingToRelocate
      if (data.currentLocation) profileUpdate.currentLocation = data.currentLocation
      if (data.preferredLocations) profileUpdate.preferredLocations = data.preferredLocations

      await api.updateProfile(profileUpdate)
      toast.success('Your personalized job feed is ready!')
      onComplete()
    } catch (e: any) {
      toast.error(e.message || 'Could not save your profile')
    } finally {
      setSaving(false)
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100
  const curStep = STEPS[step]

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onSkip() }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 border-b border-border">
          <button onClick={onSkip} className="absolute top-3 right-3 size-7 rounded-full hover:bg-accent flex items-center justify-center text-muted-foreground" aria-label="Skip">
            <X className="size-4" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <curStep.icon className="size-5 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-base">Welcome to CareerHub AI</DialogTitle>
              <DialogDescription className="text-xs">Step {step + 1} of {STEPS.length} · {curStep.desc}</DialogDescription>
            </div>
          </div>
          <Progress value={progress} className="h-1.5" />
          <div className="flex items-center justify-between mt-2">
            {STEPS.map((s, i) => (
              <div key={s.key} className={`flex flex-col items-center gap-1 flex-1 ${i <= step ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`size-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${i < step ? 'bg-primary text-primary-foreground' : i === step ? 'bg-primary/15 text-primary ring-2 ring-primary/30' : 'bg-muted text-muted-foreground'}`}>
                  {i < step ? <Check className="size-3.5" /> : i + 1}
                </div>
                <span className="text-[10px] text-muted-foreground hidden sm:block">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="p-5 max-h-[50vh] overflow-y-auto scroll-thin">
          {step === 0 && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs mb-1.5">Highest degree</Label>
                <Select value={data.degree} onValueChange={(v) => update('degree', v)}>
                  <SelectTrigger><SelectValue placeholder="Select your degree" /></SelectTrigger>
                  <SelectContent>
                    {DEGREES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5">Branch / specialization</Label>
                <Select value={data.branch} onValueChange={(v) => update('branch', v)}>
                  <SelectTrigger><SelectValue placeholder="Select your branch" /></SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5">University / College</Label>
                <Input value={data.university} onChange={(e) => update('university', e.target.value)} placeholder="e.g. VTU, IIT Delhi" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5">Graduation year</Label>
                  <Input type="number" value={data.graduationYear ?? ''} onChange={(e) => update('graduationYear', e.target.value ? parseInt(e.target.value) : null)} placeholder="2025" />
                </div>
                <div>
                  <Label className="text-xs mb-1.5">CGPA (optional)</Label>
                  <Input type="number" step="0.1" min="0" max="10" value={data.cgpa ?? ''} onChange={(e) => update('cgpa', e.target.value ? parseFloat(e.target.value) : null)} placeholder="8.5" />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <SkillInput
                label="Technical skills"
                value={data.technicalSkills}
                onChange={(v) => update('technicalSkills', v)}
                onAdd={(s) => addSkill('technicalSkills', s)}
                onRemove={(s) => removeSkill('technicalSkills', s)}
                suggestions={SKILL_SUGGESTIONS.slice(0, 10)}
                skillInput={skillInput}
                setSkillInput={setSkillInput}
              />
              <SkillInput
                label="Soft skills"
                value={data.softSkills}
                onChange={(v) => update('softSkills', v)}
                onAdd={(s) => addSkill('softSkills', s)}
                onRemove={(s) => removeSkill('softSkills', s)}
                suggestions={SKILL_SUGGESTIONS.slice(10, 15)}
                skillInput=""
                setSkillInput={() => {}}
              />
              <SkillInput
                label="Tools & technologies"
                value={data.tools}
                onChange={(v) => update('tools', v)}
                onAdd={(s) => addSkill('tools', s)}
                onRemove={(s) => removeSkill('tools', s)}
                suggestions={['Git', 'Docker', 'AWS', 'Figma', 'Excel', 'VS Code']}
                skillInput=""
                setSkillInput={() => {}}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs mb-1.5">Experience level</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: 'fresher', l: 'Fresher' },
                    { v: 'internship', l: 'Internship' },
                    { v: 'fulltime', l: 'Full-time' },
                  ].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => update('experienceKind', o.v)}
                      className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${data.experienceKind === o.v ? 'border-primary bg-accent text-accent-foreground' : 'border-border hover:bg-accent/50'}`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
              {data.experienceKind !== 'fresher' && (
                <div>
                  <Label className="text-xs mb-1.5">Total years of experience</Label>
                  <Input type="number" min="0" value={data.totalExperienceYears ?? ''} onChange={(e) => update('totalExperienceYears', e.target.value ? parseInt(e.target.value) : null)} placeholder="2" />
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs mb-1.5">Desired job title</Label>
                <Input value={data.desiredJobTitle} onChange={(e) => update('desiredJobTitle', e.target.value)} placeholder="e.g. Software Engineer" />
              </div>
              <div>
                <Label className="text-xs mb-1.5">Desired roles (comma-separated)</Label>
                <Input value={data.desiredRoles} onChange={(e) => update('desiredRoles', e.target.value)} placeholder="e.g. Backend Engineer, Full-stack Developer" />
              </div>
              <div>
                <Label className="text-xs mb-1.5">Industries of interest (comma-separated)</Label>
                <Input value={data.industries} onChange={(e) => update('industries', e.target.value)} placeholder="e.g. IT, Finance, Healthcare" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5">Min salary (LPA)</Label>
                  <Input type="number" value={data.salaryExpectationMin ?? ''} onChange={(e) => update('salaryExpectationMin', e.target.value ? parseInt(e.target.value) * 100000 : null)} placeholder="6" />
                </div>
                <div>
                  <Label className="text-xs mb-1.5">Max salary (LPA)</Label>
                  <Input type="number" value={data.salaryExpectationMax ?? ''} onChange={(e) => update('salaryExpectationMax', e.target.value ? parseInt(e.target.value) * 100000 : null)} placeholder="12" />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1.5">Employment type</Label>
                <Select value={data.employmentType} onValueChange={(v) => update('employmentType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full-time</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="part_time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs mb-1.5">Current location</Label>
                <Input value={data.currentLocation} onChange={(e) => update('currentLocation', e.target.value)} placeholder="e.g. Bangalore, Karnataka" />
              </div>
              <div>
                <Label className="text-xs mb-1.5">Preferred locations (comma-separated)</Label>
                <Input value={data.preferredLocations} onChange={(e) => update('preferredLocations', e.target.value)} placeholder="e.g. Bangalore, Pune, Remote" />
              </div>
              <div>
                <Label className="text-xs mb-1.5">Remote preference</Label>
                <Select value={data.remotePreference} onValueChange={(v) => update('remotePreference', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REMOTE_TYPES.map((r) => <SelectItem key={r} value={r}>{remoteTypeLabel(r)}</SelectItem>)}
                    <SelectItem value="any">Any</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Label className="text-sm font-medium">Willing to relocate</Label>
                  <p className="text-xs text-muted-foreground">Open to moving for the right opportunity</p>
                </div>
                <Switch checked={data.willingToRelocate} onCheckedChange={(c) => update('willingToRelocate', c)} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-card/30">
          <Button variant="ghost" size="sm" onClick={onSkip} className="text-xs text-muted-foreground">
            Skip for now
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={handleBack} className="gap-1">
                <ArrowLeft className="size-3.5" /> Back
              </Button>
            )}
            <Button size="sm" onClick={handleNext} disabled={saving} className="gap-1">
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : step === STEPS.length - 1 ? <Check className="size-3.5" /> : <ArrowRight className="size-3.5" />}
              {step === STEPS.length - 1 ? 'Complete' : 'Next'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SkillInput({ label, value, onChange, onAdd, onRemove, suggestions, skillInput, setSkillInput }: {
  label: string
  value: string
  onChange: (v: string) => void
  onAdd: (s: string) => void
  onRemove: (s: string) => void
  suggestions: string[]
  skillInput: string
  setSkillInput: (s: string) => void
}) {
  const skills = (value || '').split(',').map((s) => s.trim()).filter(Boolean)
  return (
    <div>
      <Label className="text-xs mb-1.5">{label}</Label>
      <div className="flex gap-2 mb-2">
        <Input
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (skillInput.trim()) onAdd(skillInput) } }}
          placeholder="Type a skill and press Enter"
          className="text-sm"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => { if (skillInput.trim()) onAdd(skillInput) }}
          className="shrink-0"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {skills.map((s) => (
            <Badge key={s} variant="secondary" className="gap-1 py-1">
              {s}
              <button onClick={() => onRemove(s)} className="hover:text-destructive"><X className="size-3" /></button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {suggestions.filter((s) => !skills.includes(s)).slice(0, 6).map((s) => (
          <button
            key={s}
            onClick={() => onAdd(s)}
            className="text-[11px] px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            + {s}
          </button>
        ))}
      </div>
    </div>
  )
}
