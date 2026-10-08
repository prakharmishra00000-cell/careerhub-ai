'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { LandingView } from '@/components/views/landing'
import { SearchView } from '@/components/views/search'
import { JobDetailsView } from '@/components/views/job-details'
import { DashboardView } from '@/components/views/dashboard'
import { ProfileView } from '@/components/views/profile'
import { SavedView } from '@/components/views/saved'
import { ApplicationsView } from '@/components/views/applications'
import { AlertsView } from '@/components/views/alerts'
import { ResumeView } from '@/components/views/resume'
import { CareerAIView } from '@/components/views/career-ai'
import { CompaniesView } from '@/components/views/companies'
import { CompanyDetailsView } from '@/components/views/company-details'
import { SalaryInsightsView } from '@/components/views/salary-insights'
import { InterviewPrepView } from '@/components/views/interview-prep'
import { CareerRoadmapView } from '@/components/views/career-roadmap'
import { SkillGapView } from '@/components/views/skill-gap'
import { RecruiterView } from '@/components/views/recruiter'
import { AdminView } from '@/components/views/admin'
import { SettingsView } from '@/components/views/settings'
import { TopNav } from '@/components/top-nav'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { Footer } from '@/components/footer'
import { AuthModal } from '@/components/auth-modal'
import { CommandPalette } from '@/components/command-palette'
import { CompareBar } from '@/components/compare-bar'
import { CompanyCompareBar } from '@/components/company-compare-bar'
import { OnboardingWizard } from '@/components/onboarding-wizard'

export function AppShell() {
  const view = useApp((s) => s.view)
  const refreshUser = useApp((s) => s.refreshUser)
  const refreshNotifications = useApp((s) => s.refreshNotifications)
  const user = useApp((s) => s.user)
  const authLoading = useApp((s) => s.authLoading)
  const [onboardingOpen, setOnboardingOpen] = useState(false)

  // load session on mount
  useEffect(() => { refreshUser() }, [refreshUser])

  // sync URL hash <-> view
  useEffect(() => {
    const applyHash = () => {
      const h = window.location.hash.replace(/^#/, '')
      if (!h) return
      const [view, id] = h.split('/')
      if (view && view !== useApp.getState().view) {
        // only accept known views
        const known = ['landing', 'search', 'job', 'dashboard', 'profile', 'profile-edit', 'saved', 'applications', 'alerts', 'resume', 'resume-analyzer', 'resume-builder', 'career-ai', 'companies', 'company', 'recruiter', 'recruiter-jobs', 'recruiter-new-job', 'recruiter-applications', 'admin', 'admin-users', 'admin-jobs', 'admin-sources', 'admin-companies', 'admin-reports', 'admin-analytics', 'settings', 'internships', 'remote-jobs', 'freshers', 'government-jobs', 'salary-insights', 'interview-prep', 'career-roadmap', 'skill-gap']
        if (known.includes(view)) {
          useApp.getState().setView(view as any)
          if (id) {
            if (view === 'job') useApp.getState().openJob(id)
            if (view === 'company') useApp.getState().openCompany(id)
          }
        }
      }
    }
    applyHash()
    window.addEventListener('hashchange', applyHash)
    return () => window.removeEventListener('hashchange', applyHash)
  }, [])

  // update hash when view changes
  useEffect(() => {
    const s = useApp.getState()
    let hash = s.view
    if (s.view === 'job' && s.selectedJobId) hash = `job/${s.selectedJobId}`
    else if (s.view === 'company' && s.selectedCompanyId) hash = `company/${s.selectedCompanyId}`
    if (typeof window !== 'undefined') {
      const cur = window.location.hash.replace(/^#/, '')
      if (cur !== hash) history.replaceState(null, '', `#${hash}`)
    }
  }, [view, useApp((s) => s.selectedJobId), useApp((s) => s.selectedCompanyId)])

  // refresh notifications when user changes
  useEffect(() => { if (user) refreshNotifications() }, [user, refreshNotifications])

  // trigger onboarding for new candidates with low profile completion
  useEffect(() => {
    if (!user || user.role !== 'candidate') return
    // Only check once per session — use sessionStorage to avoid re-prompting
    if (typeof window === 'undefined') return
    const dismissed = window.sessionStorage.getItem('careerhub_onboarding_dismissed')
    if (dismissed === '1') return
    // Check profile completion
    const checkOnboarding = async () => {
      try {
        const profile = await api.getProfile()
        if (profile.completionPct < 40) {
          setOnboardingOpen(true)
        }
      } catch { /* ignore — profile may not exist yet */ }
    }
    checkOnboarding()
  }, [user])

  const handleOnboardingComplete = () => {
    setOnboardingOpen(false)
    if (typeof window !== 'undefined') window.sessionStorage.setItem('careerhub_onboarding_dismissed', '1')
    useApp.getState().setView('dashboard')
  }
  const handleOnboardingSkip = () => {
    setOnboardingOpen(false)
    if (typeof window !== 'undefined') window.sessionStorage.setItem('careerhub_onboarding_dismissed', '1')
  }

  // render
  let content: React.ReactNode = null
  switch (view) {
    case 'landing': content = <LandingView />; break
    case 'search':
    case 'internships':
    case 'remote-jobs':
    case 'freshers':
    case 'government-jobs': content = <SearchView preset={view} />; break
    case 'job': content = <JobDetailsView />; break
    case 'dashboard': content = <DashboardView />; break
    case 'profile':
    case 'profile-edit': content = <ProfileView />; break
    case 'saved': content = <SavedView />; break
    case 'applications': content = <ApplicationsView />; break
    case 'alerts': content = <AlertsView />; break
    case 'resume':
    case 'resume-analyzer':
    case 'resume-builder': content = <ResumeView />; break
    case 'career-ai': content = <CareerAIView />; break
    case 'companies': content = <CompaniesView />; break
    case 'company': content = <CompanyDetailsView />; break
    case 'salary-insights': content = <SalaryInsightsView />; break
    case 'interview-prep': content = <InterviewPrepView />; break
    case 'career-roadmap': content = <CareerRoadmapView />; break
    case 'skill-gap': content = <SkillGapView />; break
    case 'recruiter':
    case 'recruiter-jobs':
    case 'recruiter-new-job':
    case 'recruiter-applications': content = <RecruiterView />; break
    case 'admin':
    case 'admin-users':
    case 'admin-jobs':
    case 'admin-sources':
    case 'admin-companies':
    case 'admin-reports':
    case 'admin-analytics': content = <AdminView />; break
    case 'settings': content = <SettingsView />; break
    default: content = <LandingView />
  }

  // gate recruiter/admin for unauthorized users
  const gated = (view === 'recruiter' || view.startsWith('recruiter-')) && !(user?.role === 'recruiter' || user?.role === 'company_admin' || user?.role === 'admin')
  const adminGated = (view === 'admin' || view.startsWith('admin-')) && user?.role !== 'admin'
  const dashboardGated = (view === 'dashboard' || view === 'profile' || view === 'saved' || view === 'applications' || view === 'alerts' || view === 'resume') && !user

  if (gated || adminGated || dashboardGated) {
    if (!authLoading) {
      content = (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <h2 className="text-2xl font-semibold tracking-tight">Sign in required</h2>
          <p className="text-muted-foreground max-w-md">
            {adminGated ? 'This area is restricted to platform administrators.' : gated ? 'Recruiter portal is for recruiter accounts.' : 'Please sign in to access this page.'}
          </p>
          <div className="flex gap-2">
            <AuthModal />
            <button onClick={() => useApp.getState().setView('landing')} className="text-sm text-muted-foreground hover:text-foreground underline">Back home</button>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="flex-1 flex flex-col w-full">
        {content}
      </main>
      <Footer />
      <MobileBottomNav />
      <AuthModal />
      <CommandPalette />
      <CompareBar />
      <CompanyCompareBar />
      <OnboardingWizard open={onboardingOpen} onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip} />
    </div>
  )
}
