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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Bell, Plus, Pencil, Trash2, Pause, Play, Mail, BellRing, Clock, Sparkles,
  Loader2, Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { timeAgo, employmentTypeLabel, remoteTypeLabel } from '@/lib/jobs'
import type { AlertItem } from '@/lib/types'

const FREQUENCIES = [
  { value: 'instant', label: 'Instant' },
  { value: 'daily', label: 'Daily digest' },
  { value: 'weekly', label: 'Weekly digest' },
]

const CHANNEL_OPTIONS = [
  { value: 'in_app', label: 'In-app', icon: BellRing },
  { value: 'email', label: 'Email', icon: Mail },
]

const FIELD_LABELS: Record<string, string> = {
  q: 'Search',
  location: 'Location',
  city: 'City',
  remoteType: 'Remote',
  employmentType: 'Type',
  degree: 'Degree',
  branch: 'Branch',
  experience: 'Experience',
  fresherFriendly: 'Fresher friendly',
  isInternship: 'Internship',
  companyType: 'Company type',
  minSalary: 'Min salary',
  maxSalary: 'Max salary',
  sort: 'Sort',
}

function parseQuery(q: string): Record<string, any> {
  if (!q) return {}
  try {
    const parsed = JSON.parse(q)
    if (parsed && typeof parsed === 'object') return parsed
  } catch { /* not JSON — treat as raw q */ }
  return { q }
}

function channelsToArray(s: string | null): string[] {
  if (!s) return []
  return s.split(',').map((x) => x.trim()).filter(Boolean)
}
function arrayToChannels(arr: string[]): string {
  return arr.join(',')
}

function valueToLabel(key: string, v: any): string {
  if (typeof v === 'boolean') return FIELD_LABELS[key] ?? key
  if (Array.isArray(v)) {
    return v.map((x) => valueToLabel(key, x)).join(', ')
  }
  if (key === 'employmentType' || key === 'remoteType') {
    return key === 'employmentType' ? employmentTypeLabel(String(v)) : remoteTypeLabel(String(v))
  }
  return String(v)
}

export function AlertsView() {
  const setView = useApp((s) => s.setView)
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AlertItem | null>(null)
  const [deleting, setDeleting] = useState<AlertItem | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const data = await api.alerts()
        if (active) setAlerts(data)
      } catch (e: any) {
        if (active) toast.error(e.message || 'Could not load alerts')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const togglePause = async (a: AlertItem) => {
    setToggling(a.id)
    try {
      await api.updateAlert(a.id, { paused: !a.paused })
      setAlerts((prev) => prev.map((x) => (x.id === a.id ? { ...x, paused: !a.paused } : x)))
      toast.success(a.paused ? 'Alert resumed' : 'Alert paused')
    } catch (e: any) {
      toast.error(e.message || 'Could not update alert')
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await api.deleteAlert(deleting.id)
      setAlerts((prev) => prev.filter((x) => x.id !== deleting.id))
      toast.success('Alert deleted')
    } catch (e: any) {
      toast.error(e.message || 'Could not delete alert')
    } finally {
      setDeleting(null)
    }
  }

  const handleSave = async (data: { name: string; description: string; frequency: string; channels: string[]; }) => {
    const body = {
      name: data.name,
      query: JSON.stringify({ q: data.description.trim() }),
      frequency: data.frequency,
      channels: arrayToChannels(data.channels),
    }
    try {
      if (editing) {
        const updated = await api.updateAlert(editing.id, body)
        setAlerts((prev) => prev.map((x) => (x.id === editing.id ? updated : x)))
        toast.success('Alert updated')
      } else {
        const created = await api.createAlert(body)
        setAlerts((prev) => [created, ...prev])
        toast.success('Alert created')
      }
      setDialogOpen(false)
      setEditing(null)
    } catch (e: any) {
      toast.error(e.message || 'Could not save alert')
    }
  }

  return (
    <div className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Job alerts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? 'Loading…' : `${alerts.length} alert${alerts.length === 1 ? '' : 's'} · ${alerts.filter(a => !a.paused).length} active`}
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
          <Plus className="size-4" /> Create alert
        </Button>
      </header>

      {/* tip */}
      <Card className="p-3.5 mb-5 border-primary/30 bg-primary/5">
        <div className="flex items-start gap-2.5">
          <Info className="size-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">Tip: </span>
            Create an alert to get notified when new jobs match your criteria — instant, daily, or weekly digests.
            You can pause or delete alerts anytime.
          </p>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : alerts.length === 0 ? (
        <EmptyAlerts onCreate={() => { setEditing(null); setDialogOpen(true) }} onBrowse={() => setView('search')} />
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <AlertRow
              key={a.id}
              alert={a}
              toggling={toggling === a.id}
              onToggle={() => togglePause(a)}
              onEdit={() => { setEditing(a); setDialogOpen(true) }}
              onDelete={() => setDeleting(a)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit dialog */}
      {dialogOpen && (
        <AlertFormDialog
          key={editing?.id ?? 'new'}
          alert={editing}
          onClose={() => { setDialogOpen(false); setEditing(null) }}
          onSave={handleSave}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this alert?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? `"${deleting.name}" will be permanently removed. You can always create a new one later.` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="size-4" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ---------- Row ---------- */
function AlertRow({
  alert: a, toggling, onToggle, onEdit, onDelete,
}: {
  alert: AlertItem
  toggling: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const query = useMemo(() => parseQuery(a.query), [a.query])
  const channels = useMemo(() => channelsToArray(a.channels), [a.channels])
  const freq = FREQUENCIES.find((f) => f.value === a.frequency) ?? FREQUENCIES[1]

  // build chip list
  const chips: { label: string }[] = []
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') continue
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v === null || v === undefined || v === '') continue
        chips.push({ label: `${FIELD_LABELS[key] ?? key}: ${valueToLabel(key, v)}` })
      }
    } else if (typeof value === 'boolean') {
      if (value) chips.push({ label: FIELD_LABELS[key] ?? key })
    } else {
      chips.push({ label: `${FIELD_LABELS[key] ?? key}: ${valueToLabel(key, value)}` })
    }
  }

  return (
    <Card className={`p-4 sm:p-5 ${a.paused ? 'opacity-60' : ''} border-border/70 hover:border-primary/30 transition-colors`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${a.paused ? 'bg-muted' : 'bg-primary/10'}`}>
            {a.paused ? <Bell className="size-5 text-muted-foreground" /> : <BellRing className="size-5 text-primary" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-[15px] leading-tight">{a.name}</h3>
              {a.paused && (
                <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">Paused</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" /> {freq.label}
              </span>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1.5">
                {channels.includes('in_app') && <span className="inline-flex items-center gap-0.5"><BellRing className="size-3" />In-app</span>}
                {channels.includes('email') && <span className="inline-flex items-center gap-0.5"><Mail className="size-3" />Email</span>}
                {channels.length === 0 && <span>No channels</span>}
              </span>
              {a.lastTriggeredAt && (
                <>
                  <span className="text-border">·</span>
                  <span>Last triggered {timeAgo(a.lastTriggeredAt)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggle}
            disabled={toggling}
            className="size-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
            title={a.paused ? 'Resume' : 'Pause'}
            aria-label={a.paused ? 'Resume alert' : 'Pause alert'}
          >
            {toggling ? <Loader2 className="size-4 animate-spin" /> : a.paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          </button>
          <button
            onClick={onEdit}
            className="size-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Edit"
            aria-label="Edit alert"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={onDelete}
            className="size-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="Delete"
            aria-label="Delete alert"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pl-0 sm:pl-13">
          {chips.slice(0, 8).map((c, i) => (
            <Badge key={i} variant="secondary" className="text-[11px] font-normal bg-muted text-foreground/80">
              {c.label}
            </Badge>
          ))}
          {chips.length > 8 && (
            <Badge variant="outline" className="text-[11px] font-normal">+{chips.length - 8}</Badge>
          )}
        </div>
      )}
    </Card>
  )
}

/* ---------- Create/Edit dialog ---------- */
function AlertFormDialog({
  alert, onClose, onSave,
}: {
  alert: AlertItem | null
  onClose: () => void
  onSave: (d: { name: string; description: string; frequency: string; channels: string[] }) => void
}) {
  const parsed = alert ? parseQuery(alert.query) : {}
  const [name, setName] = useState(alert?.name ?? '')
  const [description, setDescription] = useState(parsed.q ?? '')
  const [frequency, setFrequency] = useState(alert?.frequency ?? 'daily')
  const [channels, setChannels] = useState<string[]>(() => {
    const c = channelsToArray(alert?.channels ?? null)
    return c.length > 0 ? c : ['in_app']
  })
  const [saving, setSaving] = useState(false)

  const toggleChannel = (v: string) => {
    setChannels((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v])
  }

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Alert name is required'); return }
    if (channels.length === 0) { toast.error('Select at least one channel'); return }
    setSaving(true)
    try {
      await onSave({ name: name.trim(), description: description.trim(), frequency, channels })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{alert ? 'Edit alert' : 'Create a new alert'}</DialogTitle>
          <DialogDescription>
            We'll notify you when new jobs match your criteria.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Alert name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. BTech CSE Fresher • Bangalore • Remote"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Search description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you're looking for in plain English — e.g. 'software engineer internships in Bangalore with stipend above 15k'"
              rows={3}
            />
            <p className="text-[11px] text-muted-foreground">
              This free-text description powers your alert's matching criteria.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Channels</Label>
            <div className="flex flex-wrap gap-4 pt-1">
              {CHANNEL_OPTIONS.map((c) => (
                <label key={c.value} className="inline-flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={channels.includes(c.value)}
                    onCheckedChange={() => toggleChannel(c.value)}
                  />
                  <span className="text-sm inline-flex items-center gap-1.5">
                    <c.icon className="size-3.5 text-muted-foreground" /> {c.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {alert ? 'Save changes' : 'Create alert'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- Empty state ---------- */
function EmptyAlerts({ onCreate, onBrowse }: { onCreate: () => void; onBrowse: () => void }) {
  return (
    <Card className="p-10 sm:p-16 border-dashed text-center">
      <div className="size-16 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center mb-4">
        <Bell className="size-8 text-primary" />
      </div>
      <h2 className="text-lg font-semibold mb-1.5">No alerts yet</h2>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
        Create an alert for any search and we'll notify you the moment matching jobs are indexed — across every source.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        <Button onClick={onCreate}>
          <Plus className="size-4" /> Create your first alert
        </Button>
        <Button variant="outline" onClick={onBrowse}>Browse jobs first</Button>
      </div>
    </Card>
  )
}
