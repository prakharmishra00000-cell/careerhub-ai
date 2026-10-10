'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/store'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Compass, Sparkles, ShieldCheck, Building2, Loader2 } from 'lucide-react'

const demoAccounts = [
  { email: 'candidate@demo.careerhub.ai', role: 'Candidate', icon: Sparkles, desc: 'BTech CSE fresher, full-stack & AI' },
  { email: 'recruiter@demo.careerhub.ai', role: 'Recruiter', icon: Building2, desc: 'Posts & manages jobs' },
]

export function AuthModal() {
  const { authModalOpen, authMode, closeAuth, login, register, openAuth } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'candidate' | 'recruiter'>('candidate')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => { if (authModalOpen) { setErr(null); setPassword('') } }, [authModalOpen])

  const submit = async (mode: 'login' | 'register') => {
    setLoading(true); setErr(null)
    try {
      if (mode === 'login') await login(email, password)
      else await register(email, password, name || email.split('@')[0], role)
    } catch (e: any) {
      setErr(e.message || 'Something went wrong')
    } finally { setLoading(false) }
  }

  const quickFill = (acc: { email: string }) => {
    setEmail(acc.email); setPassword('demo1234')
    if (authMode === 'register') openAuth('login')
  }

  return (
    <Dialog open={authModalOpen} onOpenChange={(o) => { if (!o) closeAuth() }}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/8 to-transparent p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
              <Compass className="size-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div>
              <DialogTitle className="text-lg leading-tight">Welcome to CareerHub AI</DialogTitle>
              <DialogDescription className="text-xs">Every Opportunity. One Smart Search.</DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 pt-4">
          <Tabs value={authMode} onValueChange={(v) => openAuth(v as any)}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="register">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-3 mt-0">
              <div className="space-y-1.5">
                <Label htmlFor="le" className="text-xs">Email</Label>
                <Input id="le" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lp" className="text-xs">Password</Label>
                <Input id="lp" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
              </div>
              {err && <p className="text-xs text-destructive">{err}</p>}
              <Button className="w-full" disabled={loading} onClick={() => submit('login')}>
                {loading ? <Loader2 className="size-4 mr-2 animate-spin" /> : null} Sign in
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-3 mt-0">
              <div className="space-y-1.5">
                <Label htmlFor="rn" className="text-xs">Full name</Label>
                <Input id="rn" value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarav Sharma" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="re" className="text-xs">Email</Label>
                <Input id="re" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rp" className="text-xs">Password</Label>
                <Input id="rp" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">I am a</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['candidate', 'recruiter'] as const).map((r) => (
                    <button key={r} type="button" onClick={() => setRole(r)} className={`px-3 py-2.5 rounded-lg border text-sm font-medium capitalize transition-colors text-left ${role === r ? 'border-primary bg-accent text-accent-foreground' : 'border-border hover:bg-accent/50'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              {err && <p className="text-xs text-destructive">{err}</p>}
              <Button className="w-full" disabled={loading} onClick={() => submit('register')}>
                {loading ? <Loader2 className="size-4 mr-2 animate-spin" /> : null} Create account
              </Button>
            </TabsContent>
          </Tabs>

          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 text-center">Demo accounts — one click to try</p>
            <div className="space-y-1.5">
              {demoAccounts.map((a) => (
                <button key={a.email} onClick={() => quickFill(a)} className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/50 transition-colors text-left">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <a.icon className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{a.role}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">password: demo1234</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{a.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
