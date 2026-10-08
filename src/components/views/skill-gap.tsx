'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Wrench, CheckCircle2, AlertCircle, TrendingUp, Target, Sparkles, ArrowRight,
  Lightbulb, Award, XCircle, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

export function SkillGapView() {
  const { user, openAuth, setView } = useApp()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.skillGap()
        if (active) setData(res)
      } catch (e: any) { if (active) toast.error(e.message) }
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [user])

  if (!user && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] px-4">
        <Card className="p-8 text-center max-w-md">
          <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Wrench className="size-7 text-primary" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Sign in to analyze your skill gaps</h2>
          <p className="text-sm text-muted-foreground mb-4">We'll cross-reference your profile skills with real job market demand to show you exactly what to learn next.</p>
          <Button onClick={() => openAuth('login')}>Sign in</Button>
        </Card>
      </div>
    )
  }

  const gapScore = data?.gapScore ?? 0
  const gapColor = gapScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : gapScore >= 60 ? 'text-primary' : gapScore >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-destructive'
  const gapBarColor = gapScore >= 80 ? '[&>div]:bg-emerald-500' : gapScore >= 60 ? '[&>div]:bg-primary' : gapScore >= 40 ? '[&>div]:bg-amber-500' : '[&>div]:bg-destructive'

  return (
    <div className="flex-1 w-full">
      {/* Header */}
      <div className="border-b border-border bg-card/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-11 rounded-xl bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center shadow-sm">
              <Wrench className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Skill Gap Analysis</h1>
              <p className="text-xs text-muted-foreground">Your skills vs. real market demand from {data?.totalJobsAnalyzed ?? '...'} active job postings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <div className="grid md:grid-cols-2 gap-4">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        ) : !data ? (
          <Card className="p-8 text-center">
            <AlertCircle className="size-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Could not load skill gap analysis. Make sure your profile has skills and a desired job title.</p>
            <Button variant="outline" className="mt-4" onClick={() => setView('profile')}>Update profile</Button>
          </Card>
        ) : (
          <div className="space-y-5 fade-in">
            {/* Gap score hero card */}
            <Card className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-violet-500/5 to-transparent pointer-events-none" />
              <div className="relative flex flex-col sm:flex-row items-center gap-6">
                {/* Circular score */}
                <div className="relative shrink-0">
                  <svg className="size-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--muted)" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
                      className={gapColor}
                      strokeDasharray={`${(gapScore / 100) * 264} 264`}
                      style={{ transition: 'stroke-dasharray 1s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-bold ${gapColor}`}>{gapScore}%</span>
                    <span className="text-[10px] text-muted-foreground">match</span>
                  </div>
                </div>
                {/* Summary */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <h2 className="text-lg font-semibold">Market readiness: {data.gapLabel}</h2>
                    <Badge className={
                      gapScore >= 80 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' :
                      gapScore >= 60 ? 'bg-primary/10 text-primary' :
                      gapScore >= 40 ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' :
                      'bg-destructive/10 text-destructive'
                    }>{data.gapLabel}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Based on {data.totalJobsAnalyzed} active job postings matching your profile, you have <span className="font-medium text-foreground">{data.matchedSkills.length}</span> of the top {data.topDemandSkills.length} in-demand skills.
                    {gapScore < 80 && ' Focus on the missing skills below to boost your match rate.'}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <Progress value={gapScore} className={`flex-1 h-2 ${gapBarColor}`} />
                    <span className="text-xs text-muted-foreground shrink-0">{data.matchedSkills.length}/{data.topDemandSkills.length} top skills</span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Matched skills */}
              <Card className="p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" /> Skills you have (in demand)
                  <Badge variant="secondary" className="text-[10px] ml-auto">{data.matchedSkills.length}</Badge>
                </h3>
                {data.matchedSkills.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No matched skills yet. Add skills to your profile.</p>
                ) : (
                  <div className="space-y-2">
                    {data.matchedSkills.map((s: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                          <div>
                            <p className="text-sm font-medium capitalize">{s.skill}</p>
                            <p className="text-[10px] text-muted-foreground">In {s.count} job postings ({s.percentage}%)</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">{s.percentage}%</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Missing high-demand skills */}
              <Card className="p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Target className="size-4 text-amber-500" /> Skills to learn (high demand)
                  <Badge variant="secondary" className="text-[10px] ml-auto">{data.missingHighDemand.length}</Badge>
                </h3>
                {data.missingHighDemand.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">You have all the top in-demand skills! 🎉</p>
                ) : (
                  <div className="space-y-2">
                    {data.missingHighDemand.map((s: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="size-4 text-amber-500 shrink-0" />
                          <div>
                            <p className="text-sm font-medium capitalize">{s.skill}</p>
                            <p className="text-[10px] text-muted-foreground">In {s.count} job postings ({s.percentage}%)</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30">{s.percentage}%</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Top demand skills bar chart */}
            <Card className="p-5">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <TrendingUp className="size-4 text-primary" /> Top 10 in-demand skills for your target roles
              </h3>
              <div className="space-y-2.5">
                {data.topDemandSkills.map((s: any, i: number) => {
                  const has = data.candidateSkills.includes(s.skill)
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-28 text-xs font-medium truncate shrink-0 capitalize">{s.skill}</div>
                      <div className="flex-1 relative h-7 bg-muted/50 rounded-lg overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-lg flex items-center justify-end px-2 transition-all duration-700 ${has ? 'bg-emerald-500/20' : 'bg-primary/15'}`}
                          style={{ width: `${Math.max(s.percentage, 5)}%` }}
                        >
                          <span className={`text-[10px] font-semibold ${has ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'}`}>{s.percentage}%</span>
                        </div>
                        {has && (
                          <div className="absolute inset-y-0 left-2 flex items-center">
                            <CheckCircle2 className="size-3.5 text-emerald-500" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground w-16 text-right shrink-0">{s.count} jobs</span>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Niche skills */}
            {data.nicheSkills.length > 0 && (
              <Card className="p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="size-4 text-violet-500" /> Your niche skills (not in current demand)
                </h3>
                <p className="text-xs text-muted-foreground mb-3">These skills you have aren't showing up in current job postings. They might be valuable for specialized roles or consider broadening your search.</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.nicheSkills.map((s: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs capitalize border-violet-500/30 text-violet-600 dark:text-violet-400">{s}</Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* CTA */}
            <Card className="p-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Lightbulb className="size-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Boost your match rate</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Add missing skills to your profile or explore learning resources in the Career Roadmap.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => setView('profile')}>Update profile</Button>
                  <Button size="sm" onClick={() => setView('career-roadmap')}>Career roadmap <ArrowRight className="size-3.5" /></Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
