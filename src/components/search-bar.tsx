'use client'

import { useState, useRef, useEffect } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, MapPin, Loader2, Briefcase, Building2, Sparkles } from 'lucide-react'

interface Props {
  onSearch?: () => void
  className?: string
  size?: 'lg' | 'md'
}

export function SearchBar({ onSearch, className = '', size = 'lg' }: Props) {
  const { filter, setFilter, setView, runSearch } = useApp()
  const [q, setQ] = useState(filter.q ?? '')
  const [loc, setLoc] = useState(filter.location ?? '')
  const [suggestions, setSuggestions] = useState<any>(null)
  const [showSug, setShowSug] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeField, setActiveField] = useState<'q' | 'loc' | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // debounce suggestions
  useEffect(() => {
    const t = setTimeout(async () => {
      if (activeField === 'q' && q.length >= 2) {
        setLoading(true)
        try { const s = await api.aiSearchSuggest(q); setSuggestions(s); setShowSug(true) } catch {}
        setLoading(false)
      } else { setShowSug(false); setSuggestions(null) }
    }, 200)
    return () => clearTimeout(t)
  }, [q, activeField])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowSug(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const doSearch = () => {
    setFilter({ q: q || undefined, location: loc || undefined, page: 1 })
    setView('search')
    runSearch()
    onSearch?.()
  }

  const pickSuggestion = (type: 'job' | 'company' | 'skill' | 'location', value: string) => {
    if (type === 'job') setQ(value)
    if (type === 'company') setQ(value)
    if (type === 'skill') { const cur = q ? `${q} ${value}` : value; setQ(cur) }
    if (type === 'location') setLoc(value)
    setShowSug(false)
  }

  const hasSug = suggestions && (suggestions.jobs.length || suggestions.companies.length || suggestions.skills.length)

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className={`flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-stretch sm:border sm:border-border sm:rounded-2xl sm:bg-card sm:shadow-lg sm:shadow-primary/5 sm:focus-within:ring-2 sm:focus-within:ring-primary/30 sm:focus-within:border-primary/40 transition-all`}>
        <div className="relative flex-1 min-w-0">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none ${size === 'lg' ? 'size-5' : 'size-4'}`} />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setActiveField('q')}
            onKeyDown={(e) => { if (e.key === 'Enter') doSearch() }}
            placeholder="Job title, skill, company, keyword"
            className={`border-0 bg-transparent focus-visible:ring-0 shadow-none pl-11 ${size === 'lg' ? 'h-14 text-base' : 'h-11'} rounded-2xl sm:rounded-none`}
          />
        </div>
        <div className="hidden sm:block w-px bg-border self-stretch my-2.5" />
        <div className="relative flex-1 min-w-0">
          <MapPin className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none ${size === 'lg' ? 'size-5' : 'size-4'}`} />
          <Input
            value={loc}
            onChange={(e) => setLoc(e.target.value)}
            onFocus={() => setActiveField('loc')}
            onKeyDown={(e) => { if (e.key === 'Enter') doSearch() }}
            placeholder="Location (city, state, remote)"
            className={`border-0 bg-transparent focus-visible:ring-0 shadow-none pl-11 ${size === 'lg' ? 'h-14 text-base' : 'h-11'} rounded-2xl sm:rounded-none`}
          />
        </div>
        <Button
          onClick={doSearch}
          size={size === 'lg' ? 'lg' : 'default'}
          className={`sm:rounded-l-none sm:rounded-r-2xl sm:m-0.5 sm:my-1.5 ${size === 'lg' ? 'h-14 sm:w-32' : 'h-11'} sm:self-stretch font-semibold`}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4 sm:hidden" />}
          <span className="hidden sm:inline">Search</span>
        </Button>
      </div>

      {showSug && hasSug && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-popover border border-border rounded-xl shadow-xl overflow-hidden fade-in">
          {suggestions.jobs.length > 0 && (
            <div className="p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1 flex items-center gap-1.5"><Briefcase className="size-3" /> Job titles</p>
              {suggestions.jobs.slice(0, 5).map((j: string) => (
                <button key={j} onClick={() => pickSuggestion('job', j)} className="w-full text-left px-2 py-1.5 text-sm rounded-lg hover:bg-accent flex items-center gap-2">
                  <Briefcase className="size-3.5 text-muted-foreground" /> {j}
                </button>
              ))}
            </div>
          )}
          {suggestions.companies.length > 0 && (
            <div className="p-2 border-t border-border">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1 flex items-center gap-1.5"><Building2 className="size-3" /> Companies</p>
              {suggestions.companies.slice(0, 4).map((c: any) => (
                <button key={c.id} onClick={() => pickSuggestion('company', c.name)} className="w-full text-left px-2 py-1.5 text-sm rounded-lg hover:bg-accent flex items-center gap-2">
                  <Building2 className="size-3.5 text-muted-foreground" /> {c.name}
                </button>
              ))}
            </div>
          )}
          {suggestions.skills.length > 0 && (
            <div className="p-2 border-t border-border">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1 flex items-center gap-1.5"><Sparkles className="size-3" /> Skills</p>
              <div className="flex flex-wrap gap-1 px-2">
                {suggestions.skills.slice(0, 8).map((s: string) => (
                  <button key={s} onClick={() => pickSuggestion('skill', s)} className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">{s}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
