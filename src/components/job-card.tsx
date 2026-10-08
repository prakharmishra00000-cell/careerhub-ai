'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import type { JobCardData } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bookmark, MapPin, Clock, Briefcase, GraduationCap, ExternalLink, CheckCircle2, AlertTriangle, Building2, Sparkles, Trophy, IndianRupee } from 'lucide-react'
import { formatSalary, formatStipend, timeAgo, daysUntil, freshnessLabel, employmentTypeLabel, remoteTypeLabel } from '@/lib/jobs'

interface Props {
  job: JobCardData
  variant?: 'default' | 'compact'
  saved?: boolean
  onOpen?: () => void
}

export function JobCard({ job, variant = 'default', saved: savedProp, onOpen }: Props) {
  const { openJob, openCompany, saveJob, unsaveJob, user, applyJob, openAuth } = useApp()
  const [saved, setSaved] = useState(savedProp ?? false)
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) { openAuth('login'); return }
    setSaving(true)
    if (saved) { await unsaveJob(job.id); setSaved(false) }
    else { await saveJob(job.id); setSaved(true) }
    setSaving(false)
  }

  const handleApply = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) { openAuth('login'); return }
    await applyJob(job.id, job.sourceName ?? undefined)
    window.open(job.sourceUrl ?? '#', '_blank', 'noopener,noreferrer')
  }

  const deadline = daysUntil(job.applicationDeadline)
  const closingSoon = deadline != null && deadline <= 5 && deadline >= 0
  const expired = deadline != null && deadline < 0

  return (
    <Card
      className={`card-hover relative p-0 overflow-hidden cursor-pointer group border-border/70 hover:border-primary/30 ${closingSoon ? 'border-l-2 border-l-amber-500/50' : ''}`}
      onClick={() => (onOpen ? onOpen() : openJob(job.id))}
    >
      {job.isInternship && (
        <div className="absolute top-0 right-0 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-300 bg-violet-500/10 rounded-bl-lg">
          INTERNSHIP
        </div>
      )}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Avatar className="size-11 rounded-xl border border-border bg-muted shrink-0">
            <AvatarFallback className="rounded-xl bg-primary/8 text-primary font-semibold text-sm">
              {job.companyName.split(' ').slice(0, 2).map((w) => w[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-[15px] leading-snug tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                  {job.title}
                </h3>
                <button
                  onClick={(e) => { e.stopPropagation(); openCompany(job.companyId ?? '') }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 mt-0.5"
                >
                  <Building2 className="size-3.5" />
                  <span className="truncate max-w-[180px]">{job.companyName}</span>
                  {job.companyVerified && <CheckCircle2 className="size-3.5 text-primary shrink-0" />}
                </button>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`size-8 inline-flex items-center justify-center rounded-full hover:bg-accent transition-colors shrink-0 ${saved ? 'text-primary' : 'text-muted-foreground'}`}
                aria-label={saved ? 'Unsave' : 'Save'}
                title={saved ? 'Saved' : 'Save job'}
              >
                <Bookmark className={`size-4 ${saved ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-xs text-muted-foreground">
          {job.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" /> {job.city}{job.state ? `, ${job.state}` : ''}
            </span>
          )}
          {job.remoteType && (
            <>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1">{remoteTypeLabel(job.remoteType)}</span>
            </>
          )}
          {job.employmentType && (
            <>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1"><Briefcase className="size-3.5" />{employmentTypeLabel(job.employmentType)}</span>
            </>
          )}
          {typeof job.experienceMin === 'number' && (
            <>
              <span className="text-border">·</span>
              <span>{job.experienceMin === 0 && job.experienceMax === 0 ? 'Fresher' : job.experienceMin === job.experienceMax ? `${job.experienceMin}y` : `${job.experienceMin}–${job.experienceMax}y`}</span>
            </>
          )}
        </div>

        {/* skills */}
        {job.skills.length > 0 && variant !== 'compact' && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {job.skills.slice(0, 5).map((s) => (
              <Badge key={s} variant="secondary" className="text-[11px] font-normal bg-muted text-muted-foreground px-1.5 py-0">{s}</Badge>
            ))}
            {job.skills.length > 5 && <Badge variant="outline" className="text-[11px] px-1.5 py-0">+{job.skills.length - 5}</Badge>}
          </div>
        )}

        {/* eligibility summary */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-[11px]">
          {job.fresherFriendly && (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <Sparkles className="size-3" /> Fresher friendly
            </span>
          )}
          {job.degree && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <GraduationCap className="size-3" /> {job.degree}{job.branch ? ` · ${job.branch}` : ''}
            </span>
          )}
          {job.ppoAvailable && (
            <span className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400 font-medium">
              <Trophy className="size-3" /> PPO
            </span>
          )}
        </div>

        {/* salary + footer */}
        <div className="flex items-end justify-between gap-3 mt-3.5 pt-3 border-t border-border/60">
          <div className="min-w-0 flex-1">
            {job.isInternship ? (
              <p className="text-sm font-semibold text-foreground">
                {formatStipend(job.stipendMin, job.stipendMax, job.internshipPaid)}
                {job.internshipDurationMonths ? <span className="text-xs text-muted-foreground font-normal"> · {job.internshipDurationMonths}mo</span> : null}
              </p>
            ) : (
              <p className="text-sm font-semibold text-foreground">
                {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod, job.salaryDisclosed)}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {freshnessLabel(job.postedAt, job.lastVerifiedAt)}</span>
              {closingSoon && <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium"><AlertTriangle className="size-3" /> Closes in {deadline}d</span>}
              {expired && <span className="inline-flex items-center gap-1 text-destructive font-medium"><AlertTriangle className="size-3" /> Closed</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {job.sourceName && (
              <span className="text-[11px] text-muted-foreground hidden sm:inline-flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded-md">
                {job.sourceName}
              </span>
            )}
            <Button size="sm" onClick={handleApply} className="h-8 text-xs gap-1.5">
              Apply <ExternalLink className="size-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
