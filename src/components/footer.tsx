'use client'

import { useApp } from '@/lib/store'
import { Compass, Github, Twitter, Linkedin } from 'lucide-react'

export function Footer() {
  const setView = useApp((s) => s.setView)
  return (
    <footer className="mt-auto border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 pb-24 lg:pb-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <button onClick={() => setView('landing')} className="flex items-center gap-2 mb-3">
              <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Compass className="size-4 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <span className="font-semibold text-sm tracking-tight">CareerHub <span className="text-primary">AI</span></span>
            </button>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Every Opportunity. One Smart Search. Discover jobs, internships, apprenticeships and more from trusted sources across the web.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" aria-label="Twitter" className="size-8 inline-flex items-center justify-center rounded-full border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"><Twitter className="size-4" /></a>
              <a href="#" aria-label="LinkedIn" className="size-8 inline-flex items-center justify-center rounded-full border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"><Linkedin className="size-4" /></a>
              <a href="#" aria-label="GitHub" className="size-8 inline-flex items-center justify-center rounded-full border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"><Github className="size-4" /></a>
            </div>
          </div>
          <FooterCol title="Discover" links={[
            { label: 'All jobs', view: 'search' as const },
            { label: 'Internships', view: 'internships' as const },
            { label: 'Remote jobs', view: 'remote-jobs' as const },
            { label: 'Fresher jobs', view: 'freshers' as const },
            { label: 'Government jobs', view: 'government-jobs' as const },
            { label: 'Companies', view: 'companies' as const },
          ]} />
          <FooterCol title="Candidate" links={[
            { label: 'Dashboard', view: 'dashboard' as const },
            { label: 'Profile', view: 'profile' as const },
            { label: 'Saved jobs', view: 'saved' as const },
            { label: 'Applications', view: 'applications' as const },
            { label: 'Job alerts', view: 'alerts' as const },
          ]} />
          <FooterCol title="Tools" links={[
            { label: 'AI Job Search', view: 'career-ai' as const },
            { label: 'Recruiter portal', view: 'recruiter' as const },
          ]} />
        </div>
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} CareerHub AI. Real-time live career aggregation engine.</p>
          <p className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> All feeds operational</span>
            <span>·</span>
            <span>v1.0 live</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: { label: string; view: any }[] }) {
  const setView = useApp((s) => s.setView)
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <button onClick={() => setView(l.view)} className="text-sm text-foreground/80 hover:text-primary transition-colors text-left">{l.label}</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
