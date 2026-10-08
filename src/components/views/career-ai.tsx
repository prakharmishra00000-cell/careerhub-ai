'use client'

import { useEffect, useRef, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { JobCard } from '@/components/job-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Bot, Send, Trash2, Sparkles, Filter, Bell, ArrowRight, Briefcase,
} from 'lucide-react'
import { toast } from 'sonner'
import type { AIAssistantTurn, JobCardData, JobFilter } from '@/lib/types'

const SUGGESTED_PROMPTS = [
  'Find fresher mechanical jobs in Pune above 5 LPA',
  'Remote internships paying more than ₹10,000 per month',
  'BTech CSE jobs in Bangalore for freshers',
  'MTech CSE jobs with no minimum CGPA requirement',
  'Government PSU jobs for ECE graduates',
  'Data scientist roles in Mumbai with 2-3 years experience',
]

const FIELD_LABELS: Record<string, string> = {
  q: 'Keyword', location: 'Location', city: 'City', remoteType: 'Remote',
  employmentType: 'Type', degree: 'Degree', branch: 'Branch', experience: 'Experience',
  fresherFriendly: 'Fresher friendly', isInternship: 'Internship',
  minSalary: 'Min salary', maxSalary: 'Max salary', minStipend: 'Min stipend',
  stipendPaid: 'Stipend', internshipDuration: 'Duration', ppoAvailable: 'PPO',
  source: 'Source', companyType: 'Company type', companySize: 'Company size',
  companyVerified: 'Verified only', backlogPolicy: 'Backlog policy', minCgpa: 'Min CGPA',
  sort: 'Sort',
}

const ARRAY_FIELDS = new Set([
  'remoteType', 'employmentType', 'degree', 'branch', 'source',
  'companyType', 'companySize', 'backlogPolicy',
])

function formatFilterValue(key: string, v: unknown): string {
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (Array.isArray(v)) return v.map((x) => String(x).replace(/_/g, ' ')).join(', ')
  if (key === 'minSalary' || key === 'maxSalary') {
    const n = Number(v)
    if (!n) return String(v)
    return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} LPA`
  }
  if (key === 'minStipend') return `₹${v}/mo`
  return String(v).replace(/_/g, ' ')
}

function filterEntries(filters?: Partial<JobFilter>): { key: string; label: string; value: string }[] {
  if (!filters) return []
  const out: { key: string; label: string; value: string }[] = []
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null || v === '') continue
    if (Array.isArray(v) && v.length === 0) continue
    if (k === 'page' || k === 'pageSize' || k === 'sort') continue
    const label = FIELD_LABELS[k] ?? k
    if (ARRAY_FIELDS.has(k) && Array.isArray(v)) {
      for (const item of v) {
        out.push({ key: `${k}-${item}`, label, value: String(item).replace(/_/g, ' ') })
      }
    } else {
      out.push({ key: k, label, value: formatFilterValue(k, v) })
    }
  }
  return out
}

function buildAlertName(userPrompt: string): string {
  const clean = userPrompt.trim().replace(/\s+/g, ' ')
  if (clean.length <= 60) return clean || 'Career AI alert'
  return clean.slice(0, 57).trim() + '…'
}

export function CareerAIView() {
  const user = useApp((s) => s.user)
  const openAuth = useApp((s) => s.openAuth)
  const assistantTurns = useApp((s) => s.assistantTurns)
  const addAssistantTurn = useApp((s) => s.addAssistantTurn)
  const clearAssistant = useApp((s) => s.clearAssistant)
  const setView = useApp((s) => s.setView)
  const setFilter = useApp((s) => s.setFilter)
  const runSearch = useApp((s) => s.runSearch)

  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  // Per-turn job preview cards (AIAssistantTurn type doesn't include jobs)
  const [jobsByTurn, setJobsByTurn] = useState<Record<string, JobCardData[]>>({})
  const [totalsByTurn, setTotalsByTurn] = useState<Record<string, number>>({})
  // Track which user prompt produced each assistant turn (for alert naming)
  const [promptByTurn, setPromptByTurn] = useState<Record<string, string>>({})

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when turns change or while typing
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [assistantTurns.length, pending])

  const send = async (message?: string) => {
    const text = (message ?? input).trim()
    if (!text || pending) return
    if (!user) { openAuth('login'); return }

    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const userTurn: AIAssistantTurn = {
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    }
    addAssistantTurn(userTurn)

    setPending(true)
    try {
      const res = await api.aiAssistant(text, assistantTurns)
      const createdAt = new Date().toISOString()
      const assistantTurn: AIAssistantTurn = {
        role: 'assistant',
        content: res.reply,
        filters: res.filters,
        resultsCount: res.total,
        createdAt,
      }
      addAssistantTurn(assistantTurn)
      setJobsByTurn((prev) => ({ ...prev, [createdAt]: res.jobs }))
      setTotalsByTurn((prev) => ({ ...prev, [createdAt]: res.total }))
      setPromptByTurn((prev) => ({ ...prev, [createdAt]: text }))
    } catch (e: any) {
      const createdAt = new Date().toISOString()
      addAssistantTurn({
        role: 'assistant',
        content: `I couldn't complete that search just now — ${e?.message || 'please try again in a moment.'}`,
        createdAt,
      })
      setJobsByTurn((prev) => ({ ...prev, [createdAt]: [] }))
      setTotalsByTurn((prev) => ({ ...prev, [createdAt]: 0 }))
      setPromptByTurn((prev) => ({ ...prev, [createdAt]: text }))
    } finally {
      setPending(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // simple auto-grow
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  const applyFilters = (filters: Partial<JobFilter>) => {
    setFilter({ ...filters, page: 1 }, { replace: true })
    setView('search')
    setTimeout(() => runSearch(), 0)
  }

  const showAll = (filters: Partial<JobFilter>) => {
    applyFilters(filters)
  }

  const saveAsAlert = async (filters: Partial<JobFilter>, userPrompt: string) => {
    if (!user) { openAuth('login'); return }
    try {
      await api.createAlert({
        name: buildAlertName(userPrompt),
        query: JSON.stringify(filters),
        frequency: 'daily',
        channels: 'in_app',
      })
      toast.success('Saved as a daily alert — you\'ll see new matches in Notifications.')
    } catch (e: any) {
      toast.error(e?.message || 'Could not save alert')
    }
  }

  const isEmpty = assistantTurns.length === 0

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]">
      {/* Header */}
      <header className="border-b border-border bg-card/40 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-sm ring-1 ring-primary/20 shrink-0">
            <Bot className="size-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-base sm:text-lg tracking-tight flex items-center gap-2">
              AI Career Assistant
              <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5">
                <Sparkles className="size-3 mr-0.5" /> Beta
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              Ask in plain language — I&apos;ll convert it to filters and find matching jobs
            </p>
          </div>
          {assistantTurns.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { clearAssistant(); setJobsByTurn({}); setTotalsByTurn({}); setPromptByTurn({}) }}
              className="text-muted-foreground hover:text-foreground shrink-0"
              title="Clear chat history"
            >
              <Trash2 className="size-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Clear chat</span>
            </Button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-thin">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
          {isEmpty && !pending ? (
            <EmptyState onPick={(p) => send(p)} />
          ) : (
            <div className="space-y-5">
              {assistantTurns.map((turn, i) => (
                <MessageBubble
                  key={`${turn.createdAt}-${i}`}
                  turn={turn}
                  jobs={turn.role === 'assistant' ? jobsByTurn[turn.createdAt] : undefined}
                  total={turn.role === 'assistant' ? totalsByTurn[turn.createdAt] : undefined}
                  userPrompt={turn.role === 'assistant' ? promptByTurn[turn.createdAt] : undefined}
                  onShowAll={showAll}
                  onApply={applyFilters}
                  onSaveAlert={saveAsAlert}
                />
              ))}
              {pending && <TypingBubble />}
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-border bg-background/95 backdrop-blur-xl pb-16 lg:pb-3 pt-3 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-card focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-ring/30 transition-colors p-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={onInput}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder={'Ask for jobs in plain language — e.g. "BTech CSE fresher jobs in Bangalore"'}
              className="flex-1 min-h-[40px] max-h-[160px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-2 text-sm leading-relaxed shadow-none"
              disabled={pending}
            />
            <Button
              size="sm"
              onClick={() => send()}
              disabled={!input.trim() || pending}
              className="h-10 w-10 p-0 shrink-0 rounded-xl"
              title="Send (Enter)"
            >
              <Send className="size-4" />
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground/70 mt-1.5 hidden sm:block px-2">
            Press <kbd className="px-1 py-0.5 rounded border border-border bg-muted text-[10px] font-medium">Enter</kbd> to send,
            <kbd className="px-1 py-0.5 rounded border border-border bg-muted text-[10px] font-medium ml-1">Shift</kbd>+
            <kbd className="px-1 py-0.5 rounded border border-border bg-muted text-[10px] font-medium ml-0.5">Enter</kbd> for a new line.
            {user ? null : <span className="ml-1 text-amber-600 dark:text-amber-400">Sign in to chat.</span>}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Sub-components ---------------- */

function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="fade-in flex flex-col items-center text-center py-8 sm:py-12">
      <div className="size-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-primary/20 mb-4">
        <Bot className="size-8 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold tracking-tight mb-2">
        Ask me anything about jobs
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        Describe what you&apos;re looking for in plain language. I&apos;ll parse your request into filters and surface matching roles from every source.
      </p>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl">
        {SUGGESTED_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => onPick(p)}
            className="group text-left p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-accent/40 transition-all card-hover"
          >
            <div className="flex items-start gap-2.5">
              <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="size-3.5" />
              </div>
              <span className="text-[13px] font-medium text-foreground/90 leading-snug pt-0.5">
                {p}
              </span>
              <ArrowRight className="size-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function MessageBubble({
  turn, jobs, total, userPrompt, onShowAll, onApply, onSaveAlert,
}: {
  turn: AIAssistantTurn
  jobs?: JobCardData[]
  total?: number
  userPrompt?: string
  onShowAll: (filters: Partial<JobFilter>) => void
  onApply: (filters: Partial<JobFilter>) => void
  onSaveAlert: (filters: Partial<JobFilter>, userPrompt: string) => void
}) {
  if (turn.role === 'user') {
    return (
      <div className="fade-in flex justify-end">
        <div className="max-w-[85%] sm:max-w-[75%] bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5 shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{turn.content}</p>
        </div>
      </div>
    )
  }

  const filterChips = filterEntries(turn.filters)
  const hasResults = jobs && jobs.length > 0
  const totalNum = total ?? turn.resultsCount ?? 0

  return (
    <div className="fade-in flex justify-start">
      <div className="flex gap-3 max-w-[95%] sm:max-w-[88%]">
        <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-sm shrink-0 mt-0.5">
          <Bot className="size-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1 space-y-2.5">
          {/* Reply card */}
          <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
              {turn.content}
            </p>
          </div>

          {/* Filter chips */}
          {filterChips.length > 0 && (
            <div className="bg-accent/40 border border-border/60 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground mb-2 font-medium">
                <Filter className="size-3" /> Parsed filters
              </div>
              <div className="flex flex-wrap gap-1.5">
                {filterChips.map((c) => (
                  <Badge
                    key={c.key}
                    variant="secondary"
                    className="text-[11px] font-medium bg-background border border-border text-foreground px-2 py-0.5"
                  >
                    <span className="text-muted-foreground mr-1">{c.label}:</span>
                    {c.value}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Button size="sm" onClick={() => onApply(turn.filters ?? {})} className="h-7 text-xs gap-1.5">
                  <Filter className="size-3" /> Apply these filters
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSaveAlert(turn.filters ?? {}, userPrompt ?? 'Career AI alert')}
                  className="h-7 text-xs gap-1.5"
                >
                  <Bell className="size-3" /> Save as alert
                </Button>
              </div>
            </div>
          )}

          {/* Results preview */}
          {hasResults && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Briefcase className="size-3.5" />
                  {totalNum.toLocaleString()} matching {totalNum === 1 ? 'job' : 'jobs'}
                </div>
                {totalNum > jobs.length && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onShowAll(turn.filters ?? {})}
                    className="h-7 text-xs text-primary hover:text-primary"
                  >
                    Show all {totalNum.toLocaleString()} <ArrowRight className="size-3.5 ml-1" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {jobs.slice(0, 4).map((job) => (
                  <JobCard key={job.id} job={job} variant="compact" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="fade-in flex justify-start">
      <div className="flex gap-3">
        <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-sm shrink-0 mt-0.5">
          <Bot className="size-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3 shadow-sm flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="size-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="size-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
          <span className="sr-only">Assistant is typing…</span>
        </div>
      </div>
    </div>
  )
}
