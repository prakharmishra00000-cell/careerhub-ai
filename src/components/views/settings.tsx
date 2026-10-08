'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { useTheme } from 'next-themes'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  User as UserIcon, Shield, Palette, Download, LogOut, Trash2, Monitor, Sun, Moon,
  Smartphone, Lock, Info, Loader2, CheckCircle2, Globe,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ProfileData, Role } from '@/lib/types'

const roleBadgeClass: Record<Role, string> = {
  candidate: 'bg-muted text-muted-foreground border-border',
  recruiter: 'bg-primary/10 text-primary border-primary/20',
  company_admin: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
  moderator: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
}

const roleLabel: Record<Role, string> = {
  candidate: 'Candidate',
  recruiter: 'Recruiter',
  company_admin: 'Company admin',
  admin: 'Admin',
  moderator: 'Moderator',
}

export function SettingsView() {
  const user = useApp((s) => s.user)
  const logout = useApp((s) => s.logout)
  const setView = useApp((s) => s.setView)
  const { theme, setTheme } = useTheme()

  const [mounted, setMounted] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState(user?.name ?? '')
  const [savingName, setSavingName] = useState(false)
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [pushNotifs, setPushNotifs] = useState(false)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [alertFreq, setAlertFreq] = useState<'instant' | 'daily' | 'weekly'>('daily')
  const [signingOut, setSigningOut] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const p = await api.getProfile()
        if (active) setProfile(p)
      } catch {
        // profile optional
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  // One-time mount flag so we can render theme buttons without hydration mismatch.
  useEffect(() => {
     
    setMounted(true)
  }, [])

  const saveName = async () => {
    if (!name.trim()) { toast.error('Name cannot be empty'); return }
    setSavingName(true)
    // No backend endpoint exists for renaming a User row in this demo.
    setTimeout(() => {
      setSavingName(false)
      toast.success('Name updated locally (demo — backend rename not wired)')
    }, 600)
  }

  const changePassword = () => {
    toast.info('Password change is not enabled in this demo')
  }

  const exportData = () => {
    setExporting(true)
    setTimeout(() => {
      setExporting(false)
      toast.success('Export started — you’ll receive an email with a download link (demo)')
    }, 900)
  }

  const signOutAll = async () => {
    setSigningOut(true)
    try {
      await api.logout()
      await logout()
    } catch {
      // fallthrough — still toast + navigate
    } finally {
      setSigningOut(false)
      toast.success('Signed out of all sessions (demo)')
      setView('landing')
    }
  }

  if (!user) {
    return (
      <div className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <Card className="p-10 text-center">
          <Lock className="size-10 mx-auto text-muted-foreground/40 mb-3" />
          <h1 className="text-lg font-semibold">Sign in to manage settings</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Your preferences are tied to your account.</p>
          <Button onClick={() => useApp.getState().openAuth('login')}>Sign in</Button>
        </Card>
      </div>
    )
  }

  const initials = user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="flex-1 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account, preferences, and privacy.</p>
      </header>

      <div className="space-y-6">
        {/* ACCOUNT */}
        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserIcon className="size-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Account</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 ml-10">Your identity on CareerHub AI.</p>

          <div className="flex items-center gap-4 mb-6">
            <Avatar className="size-16 rounded-xl border border-border">
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold truncate">{user.name}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <Badge variant="outline" className={`mt-1.5 ${roleBadgeClass[user.role]}`}>
                {roleLabel[user.role]}
              </Badge>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="set-name" className="text-xs text-muted-foreground">Display name</Label>
              <Input id="set-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-email" className="text-xs text-muted-foreground">Email</Label>
              <Input id="set-email" value={user.email} readOnly disabled className="bg-muted/50 text-muted-foreground" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button onClick={saveName} disabled={savingName} size="sm">
              {savingName ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Save name
            </Button>
            <Button onClick={changePassword} variant="outline" size="sm">
              <Lock className="size-3.5" /> Change password
            </Button>
          </div>

          <Separator className="my-6" />

          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">User ID</p>
              <p className="font-mono text-xs mt-0.5 truncate">{user.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="mt-0.5">{roleLabel[user.role]}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Profile completion</p>
              <p className="mt-0.5">{loading ? '—' : `${profile?.completionPct ?? 0}%`}</p>
            </div>
          </div>
        </Card>

        {/* PREFERENCES */}
        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Palette className="size-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Preferences</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 ml-10">Personalize the experience.</p>

          {/* Theme */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">Choose how CareerHub looks.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 max-w-md">
              <ThemeButton
                active={mounted && theme === 'light'}
                onClick={() => setTheme('light')}
                icon={Sun}
                label="Light"
              />
              <ThemeButton
                active={mounted && theme === 'dark'}
                onClick={() => setTheme('dark')}
                icon={Moon}
                label="Dark"
              />
              <ThemeButton
                active={mounted && theme === 'system'}
                onClick={() => setTheme('system')}
                icon={Monitor}
                label="System"
              />
            </div>
          </div>

          <Separator className="my-6" />

          {/* Notifications */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Notifications</p>
              <p className="text-xs text-muted-foreground">Demo toggles — stored locally only.</p>
            </div>
            <ToggleRow
              title="Email notifications"
              description="Job alerts, application updates, and account emails"
              checked={emailNotifs}
              onChange={setEmailNotifs}
            />
            <ToggleRow
              title="Push notifications"
              description="Real-time updates in your browser"
              checked={pushNotifs}
              onChange={setPushNotifs}
            />
            <ToggleRow
              title="Product & marketing emails"
              description="Tips, new features, and occasional offers"
              checked={marketingEmails}
              onChange={setMarketingEmails}
            />

            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium">Default job alert frequency</p>
              <RadioGroup
                value={alertFreq}
                onValueChange={(v) => setAlertFreq(v as 'instant' | 'daily' | 'weekly')}
                className="grid sm:grid-cols-3 gap-2"
              >
                {[
                  { v: 'instant', label: 'Instant', hint: 'As soon as new jobs match' },
                  { v: 'daily', label: 'Daily digest', hint: 'One summary per day' },
                  { v: 'weekly', label: 'Weekly digest', hint: 'One summary per week' },
                ].map((o) => (
                  <label
                    key={o.v}
                    htmlFor={`freq-${o.v}`}
                    className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${alertFreq === o.v ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-accent/40'}`}
                  >
                    <RadioGroupItem id={`freq-${o.v}`} value={o.v} className="mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{o.label}</p>
                      <p className="text-xs text-muted-foreground">{o.hint}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </div>
        </Card>

        {/* PRIVACY */}
        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="size-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Privacy & data</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 ml-10">Your data, your control.</p>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Export your data</p>
                <p className="text-xs text-muted-foreground">Download a copy of your profile, applications, and saved jobs.</p>
              </div>
              <Button onClick={exportData} disabled={exporting} variant="outline" size="sm">
                {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                Export
              </Button>
            </div>
            <Separator />
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2.5">
                <Globe className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Data retention</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your data is retained while your account is active. Saved jobs auto-expire after 90 days of inactivity.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Info className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Sharing</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    CareerHub never sells your data. Your profile is only shared with recruiters when you apply.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* SESSIONS */}
        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Smartphone className="size-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Sessions</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 ml-10">Manage devices signed in to your account.</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Monitor className="size-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium flex items-center gap-2">
                    This device <Badge variant="secondary" className="text-[10px] font-normal">Current</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground truncate">Signed in · {user.email}</p>
                </div>
              </div>
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <div>
                <p className="text-sm font-medium">Sign out everywhere</p>
                <p className="text-xs text-muted-foreground">End all other active sessions on every device.</p>
              </div>
              <Button onClick={signOutAll} disabled={signingOut} variant="outline" size="sm">
                {signingOut ? <Loader2 className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />}
                Sign out all
              </Button>
            </div>
          </div>
        </Card>

        {/* DANGER ZONE */}
        <Card className="p-6 sm:p-8 border-destructive/30">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Trash2 className="size-4 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-destructive">Danger zone</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 ml-10">Irreversible actions. Proceed with care.</p>

          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div className="min-w-0">
              <p className="text-sm font-medium">Delete account</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently delete your account, profile, saved jobs, and applications. This cannot be undone.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="size-3.5" /> Delete account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Really delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This is a demo environment — account deletion is not enabled. Your data will not actually be removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => toast.info('Account deletion is not enabled in this demo')}>
                    I understand, continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>

        <div className="text-center text-xs text-muted-foreground pt-2 pb-4 flex items-center justify-center gap-1.5">
          <Info className="size-3.5" />
          Settings marked “demo” are not persisted in this sandbox build.
        </div>
      </div>
    </div>
  )
}

function ThemeButton({
  active, onClick, icon: Icon, label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-colors ${
        active ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-accent/50 text-muted-foreground'
      }`}
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}

function ToggleRow({
  title, description, checked, onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
