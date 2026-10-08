'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useApp } from '@/lib/store'
import {
  Dialog, DialogContent, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import type { View } from '@/lib/types'
import {
  Search, Home, Briefcase, GraduationCap, Globe, Sparkles, ShieldCheck, Building2,
  LayoutDashboard, User as UserIcon, Bookmark, ClipboardList, Bell, FileText, Bot,
  Compass, ArrowRight, CornerDownLeft, Sun, Moon, Settings, LogOut, Plus, Bell as BellIcon, TrendingUp, Brain, Map,
} from 'lucide-react'

interface CommandItem {
  id: string
  label: string
  hint?: string
  icon: any
  group: 'Navigate' | 'Search' | 'Account' | 'Actions'
  keywords?: string
  action: () => void
  shortcut?: string
}

export function CommandPalette() {
  const {
    view, setView, openJob, user, openAuth, logout, setFilter, runSearch, openAuth: openA,
  } = useApp()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Global keyboard shortcut: ⌘K (mac) / Ctrl+K (win/linux)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape' && open) setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const go = (v: View) => { setView(v); setOpen(false) }

  const commands: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [
      { id: 'nav-home', label: 'Home', icon: Home, group: 'Navigate', action: () => go('landing'), shortcut: 'G H' },
      { id: 'nav-search', label: 'Browse all jobs', icon: Briefcase, group: 'Navigate', action: () => go('search'), shortcut: 'G J' },
      { id: 'nav-internships', label: 'Internships', icon: GraduationCap, group: 'Navigate', action: () => go('internships') },
      { id: 'nav-remote', label: 'Remote jobs', icon: Globe, group: 'Navigate', action: () => go('remote-jobs') },
      { id: 'nav-freshers', label: 'Fresher jobs', icon: Sparkles, group: 'Navigate', action: () => go('freshers') },
      { id: 'nav-govt', label: 'Government jobs', icon: ShieldCheck, group: 'Navigate', action: () => go('government-jobs') },
      { id: 'nav-companies', label: 'Companies directory', icon: Building2, group: 'Navigate', action: () => go('companies') },
      { id: 'nav-salary', label: 'Salary Insights', icon: TrendingUp, group: 'Navigate', action: () => go('salary-insights'), keywords: 'analytics compensation pay' },
      { id: 'nav-interview', label: 'Interview Prep', icon: Brain, group: 'Navigate', action: () => go('interview-prep'), keywords: 'questions preparation practice tips' },
      { id: 'nav-roadmap', label: 'Career Roadmap', icon: Map, group: 'Navigate', action: () => go('career-roadmap'), keywords: 'career path milestones growth plan' },
      { id: 'nav-ai', label: 'AI Career Assistant', icon: Bot, group: 'Navigate', action: () => go('career-ai'), keywords: 'chat search natural language' },
      { id: 'nav-resume', label: 'Resume tools', icon: FileText, group: 'Navigate', action: () => go('resume'), keywords: 'analyzer builder ats' },
    ]

    if (user) {
      items.push(
        { id: 'acc-dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Account', action: () => go('dashboard'), shortcut: 'G D' },
        { id: 'acc-profile', label: 'My profile', icon: UserIcon, group: 'Account', action: () => go('profile'), shortcut: 'G P' },
        { id: 'acc-saved', label: 'Saved jobs', icon: Bookmark, group: 'Account', action: () => go('saved'), shortcut: 'G S' },
        { id: 'acc-applications', label: 'Application tracker', icon: ClipboardList, group: 'Account', action: () => go('applications'), shortcut: 'G A' },
        { id: 'acc-alerts', label: 'Job alerts', icon: Bell, group: 'Account', action: () => go('alerts') },
        { id: 'acc-settings', label: 'Settings', icon: Settings, group: 'Account', action: () => go('settings') },
        { id: 'acc-logout', label: 'Sign out', icon: LogOut, group: 'Account', action: () => { logout(); setOpen(false) } },
      )

      if (user.role === 'recruiter' || user.role === 'company_admin' || user.role === 'admin') {
        items.push({ id: 'acc-recruiter', label: 'Recruiter portal', icon: Building2, group: 'Account', action: () => go('recruiter') })
      }
      if (user.role === 'admin') {
        items.push({ id: 'acc-admin', label: 'Admin dashboard', icon: ShieldCheck, group: 'Account', action: () => go('admin') })
      }
    } else {
      items.push(
        { id: 'acc-login', label: 'Sign in', icon: LogOut, group: 'Account', action: () => { openA('login'); setOpen(false) } },
        { id: 'acc-register', label: 'Create account', icon: Plus, group: 'Account', action: () => { openA('register'); setOpen(false) } },
      )
    }

    // Quick search actions
    items.push(
      { id: 'act-search-fresher', label: 'Search: Fresher-friendly jobs', icon: Sparkles, group: 'Actions', action: () => { setFilter({ fresherFriendly: true, page: 1 }, { replace: true }); setView('search'); runSearch(); setOpen(false) } },
      { id: 'act-search-remote', label: 'Search: Remote jobs', icon: Globe, group: 'Actions', action: () => { setFilter({ remoteType: ['remote', 'work_from_home'], page: 1 }, { replace: true }); setView('search'); runSearch(); setOpen(false) } },
      { id: 'act-search-intern', label: 'Search: Internships', icon: GraduationCap, group: 'Actions', action: () => { setFilter({ isInternship: true, page: 1 }, { replace: true }); setView('search'); runSearch(); setOpen(false) } },
      { id: 'act-search-govt', label: 'Search: Government & PSU jobs', icon: ShieldCheck, group: 'Actions', action: () => { setFilter({ companyType: ['government', 'psu'], page: 1 }, { replace: true }); setView('search'); runSearch(); setOpen(false) } },
      { id: 'act-create-alert', label: 'Create a job alert', icon: BellIcon, group: 'Actions', action: () => { go('alerts') }, keywords: 'notification email' },
    )

    return items
  }, [user, view])

  // Filter commands by query
  const filtered = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    return commands.filter((c) =>
      c.label.toLowerCase().includes(q) ||
      c.group.toLowerCase().includes(q) ||
      c.keywords?.toLowerCase().includes(q) ||
      c.hint?.toLowerCase().includes(q)
    )
  }, [query, commands])

  // Group filtered commands
  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    filtered.forEach((c) => {
      if (!groups[c.group]) groups[c.group] = []
      groups[c.group].push(c)
    })
    return groups
  }, [filtered])

  // Reset active index when query changes
  useEffect(() => { setActiveIndex(0) }, [query])

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`)
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); filtered[activeIndex]?.action() }
  }

  const groupOrder = ['Navigate', 'Search', 'Actions', 'Account']
  let runningIdx = 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-2xl overflow-hidden rounded-2xl shadow-2xl" style={{ top: '15%' }}>
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex h-5 px-1.5 items-center text-[10px] font-medium rounded border border-border bg-muted text-muted-foreground shrink-0">ESC</kbd>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-[400px]" ref={listRef as any}>
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Search className="size-6 mx-auto mb-2 opacity-30" />
              No commands found for "{query}"
            </div>
          ) : (
            <div className="py-2">
              {groupOrder.map((groupName) => {
                const items = grouped[groupName]
                if (!items?.length) return null
                return (
                  <div key={groupName} className="mb-1">
                    <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{groupName}</div>
                    {items.map((item) => {
                      const idx = runningIdx++
                      const active = idx === activeIndex
                      return (
                        <button
                          key={item.id}
                          data-idx={idx}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={item.action}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${active ? 'bg-accent' : 'hover:bg-accent/50'}`}
                        >
                          <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <item.icon className="size-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{item.label}</div>
                            {item.hint && <div className="text-xs text-muted-foreground truncate">{item.hint}</div>}
                          </div>
                          {item.shortcut && (
                            <kbd className="hidden sm:inline-flex h-5 px-1.5 items-center text-[10px] font-medium rounded border border-border bg-muted text-muted-foreground shrink-0">{item.shortcut}</kbd>
                          )}
                          {active && <CornerDownLeft className="size-3.5 text-muted-foreground shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="h-4 px-1 inline-flex items-center rounded border border-border bg-muted font-mono">↑</kbd><kbd className="h-4 px-1 inline-flex items-center rounded border border-border bg-muted font-mono">↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="h-4 px-1 inline-flex items-center rounded border border-border bg-muted font-mono">↵</kbd> select</span>
          </div>
          <span className="flex items-center gap-1"><Compass className="size-3" /> CareerHub AI</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
