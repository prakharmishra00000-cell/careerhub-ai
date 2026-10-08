'use client'

import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  ClipboardList, MoreVertical, Pencil, ExternalLink, CalendarClock, CalendarDays,
  ArrowRight, Building2, FileText, AlertTriangle, CheckCircle2, ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { timeAgo, daysUntil } from '@/lib/jobs'
import type { ApplicationItem } from '@/lib/types'

const COLUMNS: { key: string; label: string; accent: string; dot: string; bar: string }[] = [
  { key: 'saved', label: 'Saved', accent: 'text-muted-foreground', dot: 'bg-muted-foreground', bar: 'border-l-muted-foreground/40' },
  { key: 'applied', label: 'Applied', accent: 'text-primary', dot: 'bg-primary', bar: 'border-l-primary/40' },
  { key: 'assessment', label: 'Assessment', accent: 'text-blue-500 dark:text-blue-400', dot: 'bg-blue-500', bar: 'border-l-blue-500/40' },
  { key: 'interview', label: 'Interview', accent: 'text-violet-500 dark:text-violet-400', dot: 'bg-violet-500', bar: 'border-l-violet-500/40' },
  { key: 'offer', label: 'Offer', accent: 'text-emerald-500 dark:text-emerald-400', dot: 'bg-emerald-500', bar: 'border-l-emerald-500/40' },
  { key: 'rejected', label: 'Rejected', accent: 'text-destructive', dot: 'bg-destructive', bar: 'border-l-destructive/40' },
  { key: 'withdrawn', label: 'Withdrawn', accent: 'text-muted-foreground', dot: 'bg-muted-foreground', bar: 'border-l-muted-foreground/40' },
]

const STATUS_KEYS = COLUMNS.map((c) => c.key)

/* ---------- date helpers ---------- */
function isoToDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function isoToDateInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function datetimeLocalToIso(s: string): string | null {
  if (!s) return null
  const d = new Date(s)
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}
function dateInputToIso(s: string): string | null {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59)).toISOString()
}
function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function ApplicationsView() {
  const setView = useApp((s) => s.setView)
  const openJob = useApp((s) => s.openJob)
  const applicationsVersion = useApp((s) => s.applicationsVersion)
  const bumpApplications = useApp((s) => s.bumpApplications)

  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<Record<string, ApplicationItem[]>>({})
  const [editing, setEditing] = useState<ApplicationItem | null>(null)
  const [moving, setMoving] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const data = await api.applications()
        if (active) setGroups(data)
      } catch (e: any) {
        if (active) toast.error(e.message || 'Could not load applications')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [applicationsVersion])

  const totalCount = useMemo(() => {
    return STATUS_KEYS.reduce((sum, k) => sum + (groups[k]?.length ?? 0), 0)
  }, [groups])

  const moveStatus = async (id: string, status: string) => {
    setMoving(id)
    try {
      await api.updateApplication(id, { status })
      toast.success(`Moved to "${COLUMNS.find((c) => c.key === status)?.label ?? status}"`)
      bumpApplications()
    } catch (e: any) {
      toast.error(e.message || 'Could not update status')
    } finally {
      setMoving(null)
    }
  }

  const saveEdits = async (id: string, body: { notes?: string | null; interviewDate?: string | null; deadline?: string | null }) => {
    try {
      await api.updateApplication(id, body)
      toast.success('Application updated')
      setEditing(null)
      bumpApplications()
    } catch (e: any) {
      toast.error(e.message || 'Could not save changes')
    }
  }

  return (
    <div className="flex-1 w-full">
      {/* Header */}
      <div className="border-b border-border bg-card/30 sticky top-16 z-30 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight truncate">Application tracker</h1>
              <p className="text-xs text-muted-foreground truncate">
                {loading ? 'Loading…' : `${totalCount} application${totalCount === 1 ? '' : 's'} across every source`}
              </p>
            </div>
            <Button size="sm" onClick={() => setView('search')}>
              Browse jobs <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-md" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
            </div>
          </div>
        ) : totalCount === 0 ? (
          <EmptyApplications onBrowse={() => setView('search')} />
        ) : (
          <>
            {/* Mobile vertical stack */}
            <div className="lg:hidden space-y-6">
              {COLUMNS.map((col) => (
                <ColumnSection
                  key={col.key}
                  column={col}
                  items={groups[col.key] ?? []}
                  onOpen={openJob}
                  onMove={moveStatus}
                  onEdit={setEditing}
                  moving={moving}
                />
              ))}
            </div>

            {/* Desktop horizontal scroll */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto scroll-thin -mx-2 px-2 pb-4">
                <div className="flex gap-4 min-w-max">
                  {COLUMNS.map((col) => (
                    <ColumnSection
                      key={col.key}
                      column={col}
                      items={groups[col.key] ?? []}
                      onOpen={openJob}
                      onMove={moveStatus}
                      onEdit={setEditing}
                      moving={moving}
                      horizontal
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {editing && (
        <EditApplicationDialog
          application={editing}
          onClose={() => setEditing(null)}
          onSave={saveEdits}
        />
      )}
    </div>
  )
}

/* ---------- Column ---------- */
function ColumnSection({
  column, items, onOpen, onMove, onEdit, moving, horizontal,
}: {
  column: { key: string; label: string; accent: string; dot: string; bar: string }
  items: ApplicationItem[]
  onOpen: (id: string) => void
  onMove: (id: string, status: string) => void
  onEdit: (app: ApplicationItem) => void
  moving: string | null
  horizontal?: boolean
}) {
  return (
    <div className={`bg-card/40 rounded-xl border border-border/70 ${horizontal ? 'w-[300px] shrink-0' : 'w-full'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2.5 border-b ${column.bar} border-l-2`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={`size-2 rounded-full ${column.dot}`} />
          <h3 className={`text-sm font-semibold ${column.accent} truncate`}>{column.label}</h3>
          <span className="text-xs text-muted-foreground">{items.length}</span>
        </div>
      </div>

      {/* Body */}
      <div className={`p-2 space-y-2 ${horizontal ? 'max-h-[calc(100vh-18rem)] overflow-y-auto scroll-thin' : ''}`}>
        {items.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg p-6 text-center text-xs text-muted-foreground">
            Drop applications here
          </div>
        ) : (
          items.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              onOpen={() => onOpen(app.id)}
              onMove={(status) => onMove(app.id, status)}
              onEdit={() => onEdit(app)}
              moving={moving === app.id}
            />
          ))
        )}
      </div>
    </div>
  )
}

/* ---------- Card ---------- */
function ApplicationCard({
  app, onOpen, onMove, onEdit, moving,
}: {
  app: ApplicationItem
  onOpen: () => void
  onMove: (status: string) => void
  onEdit: () => void
  moving: boolean
}) {
  const deadline = daysUntil(app.deadline)
  const closingSoon = deadline != null && deadline <= 5 && deadline >= 0
  const expired = deadline != null && deadline < 0
  const initials = (app.companyName || '?').split(' ').slice(0, 2).map((w) => w[0]).join('')

  return (
    <div
      onClick={onOpen}
      className="group rounded-lg bg-background border border-border/70 p-3 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all"
    >
      {/* Top row */}
      <div className="flex items-start gap-2">
        <Avatar className="size-8 rounded-md border border-border shrink-0">
          <AvatarFallback className="rounded-md bg-primary/10 text-primary text-[10px] font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium leading-snug line-clamp-1 group-hover:text-primary transition-colors">{app.title}</h4>
          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate mt-0.5">
            <Building2 className="size-3" /> {app.companyName}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              disabled={moving}
              className="size-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0 disabled:opacity-50"
              aria-label="Move status"
            >
              {moving ? <div className="size-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <MoreVertical className="size-4" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Move to status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {COLUMNS.map((c) => (
              <DropdownMenuItem
                key={c.key}
                disabled={c.key === app.status}
                onClick={() => onMove(c.key)}
                className="text-xs gap-2"
              >
                <span className={`size-2 rounded-full ${c.dot}`} />
                <span>{c.label}</span>
                {c.key === app.status && <CheckCircle2 className="size-3 ml-auto text-primary" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit()} className="text-xs gap-2">
              <Pencil className="size-3.5" /> Edit details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpen} className="text-xs gap-2">
              <ExternalLink className="size-3.5" /> Open job
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Meta badges */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="size-3" /> Applied {timeAgo(app.appliedAt)}
        </span>
        {app.sourceName && (
          <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">{app.sourceName}</Badge>
        )}
      </div>

      {/* Deadline / Interview */}
      {(app.deadline || app.interviewDate) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px]">
          {app.deadline && (
            <span className={`inline-flex items-center gap-1 ${closingSoon ? 'text-amber-600 dark:text-amber-400' : expired ? 'text-destructive' : 'text-muted-foreground'}`}>
              <AlertTriangle className="size-3" />
              {expired ? `Closed ${fmtDate(app.deadline)}` : `Closes ${fmtDate(app.deadline)}`}
              {!expired && closingSoon && ` · ${deadline}d`}
            </span>
          )}
          {app.interviewDate && (
            <span className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400 font-medium">
              <CalendarDays className="size-3" />
              Interview {fmtDate(app.interviewDate)}
            </span>
          )}
        </div>
      )}

      {/* Notes preview */}
      {app.notes && (
        <div className="mt-2 pt-2 border-t border-border/50 flex items-start gap-1.5">
          <FileText className="size-3 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground line-clamp-1">{app.notes}</p>
        </div>
      )}
    </div>
  )
}

/* ---------- Edit dialog ---------- */
function EditApplicationDialog({
  application,
  onClose,
  onSave,
}: {
  application: ApplicationItem
  onClose: () => void
  onSave: (id: string, body: { notes?: string | null; interviewDate?: string | null; deadline?: string | null }) => void
}) {
  const [notes, setNotes] = useState(application.notes ?? '')
  const [interviewDate, setInterviewDate] = useState(isoToDatetimeLocal(application.interviewDate))
  const [deadline, setDeadline] = useState(isoToDateInput(application.deadline))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(application.id, {
        notes: notes.trim() || null,
        interviewDate: datetimeLocalToIso(interviewDate),
        deadline: dateInputToIso(deadline),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit application</DialogTitle>
          <DialogDescription>
            {application.title} · {application.companyName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes — recruiter contact, prep, questions, follow-ups…"
              rows={4}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Interview date & time</Label>
              <Input
                type="datetime-local"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Deadline</Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <CheckCircle2 className="size-4" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- Empty state ---------- */
function EmptyApplications({ onBrowse }: { onBrowse: () => void }) {
  return (
    <Card className="p-12 sm:p-16 border-dashed text-center">
      <div className="size-16 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center mb-4">
        <ClipboardList className="size-8 text-primary" />
      </div>
      <h2 className="text-lg font-semibold mb-1.5">No applications yet</h2>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
        When you apply to a job (or save one), it lands here in your tracker. Track every application across every source in one place.
      </p>
      <Button onClick={onBrowse}>
        Browse jobs <ArrowRight className="size-4 ml-1" />
      </Button>
    </Card>
  )
}
