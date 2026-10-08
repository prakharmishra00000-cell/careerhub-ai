'use client'

import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { JobCard } from '@/components/job-card'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  Bookmark, Search, FolderIcon, Briefcase, GraduationCap, Globe, ShieldCheck,
  Flame, CalendarClock, ChevronDown, ArrowRight, FolderInput,
} from 'lucide-react'
import { toast } from 'sonner'
import { timeAgo } from '@/lib/jobs'
import type { SavedJobItem } from '@/lib/types'

type FolderKey = 'all' | 'high_priority' | 'apply_today' | 'internship' | 'full_time' | 'remote' | 'government' | string

const BUILTIN_FOLDERS: { key: FolderKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'all', label: 'All', icon: Bookmark },
  { key: 'high_priority', label: 'High Priority', icon: Flame },
  { key: 'apply_today', label: 'Apply Today', icon: CalendarClock },
  { key: 'internship', label: 'Internship', icon: GraduationCap },
  { key: 'full_time', label: 'Full Time', icon: Briefcase },
  { key: 'remote', label: 'Remote', icon: Globe },
  { key: 'government', label: 'Government', icon: ShieldCheck },
]

function folderLabel(key: string): string {
  const builtin = BUILTIN_FOLDERS.find((f) => f.key === key)
  if (builtin) return builtin.label
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
}

export function SavedView() {
  const setView = useApp((s) => s.setView)
  const savedJobsVersion = useApp((s) => s.savedJobsVersion)
  const bumpSaved = useApp((s) => s.bumpSaved)

  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState<SavedJobItem[]>([])
  const [activeFolder, setActiveFolder] = useState<FolderKey>('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const data = await api.savedJobs()
        if (active) setSaved(data)
      } catch (e: any) {
        if (active) toast.error(e.message || 'Could not load saved jobs')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [savedJobsVersion])

  // Build the list of folders available (built-in + custom from data)
  const folders: { key: FolderKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = useMemo(() => {
    const custom = new Set<string>()
    for (const s of saved) {
      if (s.folder && !BUILTIN_FOLDERS.find((f) => f.key === s.folder)) custom.add(s.folder)
    }
    return [...BUILTIN_FOLDERS, ...Array.from(custom).map((c) => ({ key: c as FolderKey, label: folderLabel(c), icon: FolderIcon }))]
  }, [saved])

  // counts per folder
  const folderCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const s of saved) {
      const f = s.folder || 'all'
      m[f] = (m[f] || 0) + 1
      m['all'] = (m['all'] || 0) + 1
    }
    return m
  }, [saved])

  // filtered list
  const filtered = useMemo(() => {
    let list = saved
    if (activeFolder !== 'all') list = list.filter((s) => (s.folder || 'all') === activeFolder)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((s) =>
        s.title.toLowerCase().includes(q) ||
        s.companyName.toLowerCase().includes(q) ||
        (s.city ?? '').toLowerCase().includes(q) ||
        (s.state ?? '').toLowerCase().includes(q) ||
        (s.skills || []).some((sk) => sk.toLowerCase().includes(q))
      )
    }
    return list
  }, [saved, activeFolder, query])

  const moveFolder = async (jobId: string, newFolder: string) => {
    try {
      await api.saveJob(jobId, { folder: newFolder })
      toast.success(`Moved to "${folderLabel(newFolder)}"`)
      bumpSaved()
    } catch (e: any) {
      toast.error(e.message || 'Could not move job')
    }
  }

  return (
    <div className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Saved jobs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? 'Loading…' : `${saved.length} saved · organize with folders`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter saved jobs…"
              className="pl-9 w-full sm:w-72"
            />
          </div>
          <Button onClick={() => setView('search')} size="sm" className="hidden sm:inline-flex">
            Browse jobs <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </header>

      {/* Mobile folder chips */}
      <div className="sm:hidden mb-4 -mx-4 px-4 overflow-x-auto scroll-thin pb-1">
        <div className="flex gap-2 w-max">
          {folders.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFolder(f.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
                activeFolder === f.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
              }`}
            >
              <f.icon className="size-3.5" />
              {f.label}
              <span className={`ml-1 ${activeFolder === f.key ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {folderCounts[f.key] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:flex gap-6">
        {/* Sidebar */}
        <aside className="w-56 shrink-0">
          <div className="sticky top-20 space-y-1">
            {folders.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFolder(f.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  activeFolder === f.key
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <f.icon className="size-4 shrink-0" />
                <span className="flex-1 text-left truncate">{f.label}</span>
                <span className="text-xs text-muted-foreground">{folderCounts[f.key] || 0}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
          ) : saved.length === 0 ? (
            <EmptySaved onBrowse={() => setView('search')} />
          ) : filtered.length === 0 ? (
            <Card className="p-10 text-center border-dashed">
              <p className="text-sm text-muted-foreground">No jobs in this folder.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((job) => (
                <SavedJobRow key={job.id} job={job} onMove={moveFolder} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile list (always shown) */}
      <div className="sm:hidden">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : saved.length === 0 ? (
          <EmptySaved onBrowse={() => setView('search')} />
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center border-dashed">
            <p className="text-sm text-muted-foreground">No jobs in this folder.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((job) => (
              <SavedJobRow key={job.id} job={job} onMove={moveFolder} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SavedJobRow({ job, onMove }: { job: SavedJobItem; onMove: (id: string, folder: string) => void }) {
  const currentFolder = job.folder || 'all'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span className="inline-flex items-center gap-1.5">
          <FolderInput className="size-3.5" />
          <Badge variant="outline" className="text-[10px] font-normal">{folderLabel(currentFolder)}</Badge>
          <span>Saved {timeAgo(job.savedAt)}</span>
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-accent hover:text-foreground transition-colors">
              Move to <ChevronDown className="size-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {BUILTIN_FOLDERS.filter((f) => f.key !== 'all').map((f) => (
              <DropdownMenuItem
                key={f.key}
                onClick={() => onMove(job.id, f.key)}
                disabled={currentFolder === f.key}
                className="text-xs"
              >
                <f.icon className="size-3.5" /> {f.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <JobCard job={job} saved />
    </div>
  )
}

function EmptySaved({ onBrowse }: { onBrowse: () => void }) {
  return (
    <Card className="p-10 sm:p-16 border-dashed text-center">
      <div className="size-16 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center mb-4">
        <Bookmark className="size-8 text-primary" />
      </div>
      <h2 className="text-lg font-semibold mb-1.5">Nothing saved yet</h2>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
        Bookmark jobs from any search to keep them here. Organize with folders, set priorities, and apply when you're ready.
      </p>
      <Button onClick={onBrowse}>
        Browse jobs <ArrowRight className="size-4 ml-1" />
      </Button>
    </Card>
  )
}
