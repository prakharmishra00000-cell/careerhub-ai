'use client'

import { useApp } from '@/lib/store'
import { Home, Search, Bookmark, ClipboardList, User as UserIcon } from 'lucide-react'

export function MobileBottomNav() {
  const { view, setView, user, openAuth } = useApp()
  const items = [
    { label: 'Home', icon: Home, view: 'landing' as const },
    { label: 'Search', icon: Search, view: 'search' as const },
    { label: 'Saved', icon: Bookmark, view: 'saved' as const, requiresAuth: true },
    { label: 'Applied', icon: ClipboardList, view: 'applications' as const, requiresAuth: true },
    { label: 'Profile', icon: UserIcon, view: 'dashboard' as const, requiresAuth: true },
  ]
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 h-16">
        {items.map((it) => {
          const active = view === it.view || (it.view === 'search' && ['search','internships','remote-jobs','freshers','government-jobs'].includes(view)) ||
            (it.view === 'saved' && view === 'saved') ||
            (it.view === 'applications' && view === 'applications') ||
            (it.view === 'dashboard' && ['dashboard','profile','resume','alerts','career-ai','settings'].includes(view))
          const handleClick = () => {
            if (it.requiresAuth && !user) openAuth('login')
            else setView(it.view)
          }
          return (
            <button key={it.label} onClick={handleClick} className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium relative">
              <it.icon className={`size-5 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={active ? 'text-primary' : 'text-muted-foreground'}>{it.label}</span>
              {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
