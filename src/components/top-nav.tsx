'use client'

import Link from 'next/link'
import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Briefcase, GraduationCap, Globe, Sparkles, Building2, LayoutDashboard, Bookmark,
  ClipboardList, Bell, FileText, Bot, Settings, LogOut, Menu, Sun, Moon, User as UserIcon, ShieldCheck, Compass,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const navLinks = [
  { label: 'Jobs', view: 'search' as const, icon: Briefcase },
  { label: 'Internships', view: 'internships' as const, icon: GraduationCap },
  { label: 'Remote', view: 'remote-jobs' as const, icon: Globe },
  { label: 'Freshers', view: 'freshers' as const, icon: Sparkles },
  { label: 'Government', view: 'government-jobs' as const, icon: ShieldCheck },
  { label: 'Companies', view: 'companies' as const, icon: Building2 },
]

export function TopNav() {
  const { user, view, setView, logout } = useApp()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const go = (v: any) => { setView(v); setMobileMenu(false) }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <button onClick={() => go('landing')} className="flex items-center gap-2 shrink-0 group">
            <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm ring-1 ring-primary/20">
              <Compass className="size-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="font-semibold text-[15px] tracking-tight">CareerHub <span className="text-primary">AI</span></span>
              <span className="hidden sm:block text-[10px] text-muted-foreground font-medium">Every Opportunity. One Search.</span>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((l) => {
              const active = view === l.view || (l.view === 'search' && view === 'search')
              return (
                <button
                  key={l.label}
                  onClick={() => go(l.view)}
                  className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground ${active ? 'text-primary bg-accent font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {l.label}
                  {active && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-primary" />}
                </button>
              )
            })}
            {user && (user.role === 'recruiter' || user.role === 'company_admin' || user.role === 'admin') && (
              <button onClick={() => go('recruiter')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${view.startsWith('recruiter') ? 'text-primary bg-accent' : 'text-muted-foreground'}`}>
                Recruiter
              </button>
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="size-9 inline-flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
            )}

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-2 h-9 pl-1.5 pr-3 rounded-full border border-border bg-card hover:bg-accent transition-colors">
                    <Avatar className="size-6">
                      <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">{user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium max-w-[8rem] truncate">{user.name.split(' ')[0]}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
                      <Badge variant="secondary" className="w-fit mt-1 text-[10px] capitalize">{user.role.replace('_', ' ')}</Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => go('dashboard')}><LayoutDashboard className="size-4 mr-2" /> Dashboard</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => go('profile')}><UserIcon className="size-4 mr-2" /> Profile</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => go('saved')}><Bookmark className="size-4 mr-2" /> Saved jobs</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => go('applications')}><ClipboardList className="size-4 mr-2" /> Applications</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => go('resume')}><FileText className="size-4 mr-2" /> Resume tools</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => go('settings')}><Settings className="size-4 mr-2" /> Settings</DropdownMenuItem>
                  </DropdownMenuGroup>
                  {(user.role === 'recruiter' || user.role === 'company_admin' || user.role === 'admin') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => go('recruiter')}><Building2 className="size-4 mr-2" /> Recruiter portal</DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive"><LogOut className="size-4 mr-2" /> Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <button
              onClick={() => setMobileMenu((m) => !m)}
              className="lg:hidden size-9 inline-flex items-center justify-center rounded-full hover:bg-accent"
              aria-label="Menu"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="lg:hidden border-t border-border py-3 fade-in">
            <nav className="flex flex-col gap-0.5">
              {navLinks.map((l) => (
                <button key={l.label} onClick={() => go(l.view)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent text-left">
                  <l.icon className="size-4 text-muted-foreground" /> {l.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
