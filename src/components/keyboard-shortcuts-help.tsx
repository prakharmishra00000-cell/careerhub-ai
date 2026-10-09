'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/store'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Command, Keyboard, ArrowRight, Search, Bot, FileText, Bookmark,
  ClipboardList, Bell, Brain, Map, TrendingUp, LayoutDashboard,
} from 'lucide-react'

const SHORTCUTS = [
  { group: 'Global', items: [
    { keys: ['⌘', 'K'], label: 'Open command palette', icon: Command },
    { keys: ['?'], label: 'Show keyboard shortcuts', icon: Keyboard },
    { keys: ['Esc'], label: 'Close dialog / menu', icon: null },
  ]},
  { group: 'Navigation', items: [
    { keys: ['G', 'H'], label: 'Go to Home', icon: null },
    { keys: ['G', 'J'], label: 'Browse all jobs', icon: Search },
    { keys: ['G', 'D'], label: 'Go to Dashboard', icon: LayoutDashboard },
    { keys: ['G', 'P'], label: 'Go to Profile', icon: null },
    { keys: ['G', 'S'], label: 'Go to Saved jobs', icon: Bookmark },
    { keys: ['G', 'A'], label: 'Go to Applications', icon: ClipboardList },
  ]},
  { group: 'Tools', items: [
    { keys: ['G', 'I'], label: 'Interview prep', icon: Brain },
    { keys: ['G', 'R'], label: 'Resume tools', icon: FileText },
    { keys: ['G', 'M'], label: 'Career roadmap', icon: Map },
    { keys: ['G', '$'], label: 'Salary insights', icon: TrendingUp },
    { keys: ['G', 'B'], label: 'AI Career Assistant', icon: Bot },
    { keys: ['G', 'L'], label: 'Job alerts', icon: Bell },
  ]},
]

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Open with ? (Shift+/)
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape' && open) setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 to-transparent p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Keyboard className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">Keyboard shortcuts</DialogTitle>
              <DialogDescription className="text-xs">Navigate CareerHub AI faster with these shortcuts</DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto scroll-thin space-y-6">
          {SHORTCUTS.map((group) => (
            <div key={group.group}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{group.group}</h3>
              <div className="space-y-1">
                {group.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-2.5">
                      {item.icon && <item.icon className="size-4 text-muted-foreground" />}
                      <span className="text-sm text-foreground/80">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, j) => (
                        <span key={j} className="inline-flex items-center justify-center min-w-7 h-6 px-1.5 rounded border border-border bg-muted text-xs font-mono font-medium text-foreground/80">
                          {key}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border px-5 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Press <kbd className="inline-flex items-center justify-center min-w-6 h-5 px-1 rounded border border-border bg-muted text-[10px] font-mono">?</kbd> anytime to toggle this help</span>
          <Badge variant="outline" className="text-[10px]">Demo mode</Badge>
        </div>
      </DialogContent>
    </Dialog>
  )
}
