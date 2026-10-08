'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { AiHistorySection } from '@/components/ai-history-section'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Map, Sparkles, Loader2, ChevronRight, Target, Wrench, Award, TrendingUp,
  AlertTriangle, Users, DollarSign, CheckCircle2, Circle, ArrowRight, Zap, Compass,
} from 'lucide-react'
import { toast } from 'sonner'

const PHASE_COLORS = [
  'from-primary to-primary/70',
  'from-violet-500 to-violet-500/70',
  'from-emerald-500 to-emerald-500/70',
  'from-amber-500 to-amber-500/70',
  'from-rose-500 to-rose-500/70',
]

const PHASE_ICONS = [Compass, Wrench, TrendingUp, Award, Target]

export function CareerRoadmapView() {
  const { user } = useApp()
  const [currentRole, setCurrentRole] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [timeline, setTimeline] = useState('2-3 years')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activePhase, setActivePhase] = useState(0)

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!user) return
      try {
        const profile = await api.getProfile()
        if (!active) return
        if (profile.desiredJobTitle) setTargetRole(profile.desiredJobTitle)
        if (profile.experienceKind === 'fresher') setCurrentRole('Fresher / Student')
        else if (profile.desiredJobTitle) setCurrentRole(profile.desiredJobTitle)
      } catch {}
    }
    load()
    return () => { active = false }
  }, [user])

  const generate = async () => {
    setLoading(true)
    setResult(null)
    setActivePhase(0)
    try {
      const res = await api.aiCareerRoadmap({ currentRole, targetRole, timeline })
      setResult(res)
      // Save to history
      const title = `${currentRole || 'Current'} → ${targetRole || 'Target role'}`
      api.saveAiGeneration({ type: 'career_roadmap', title, input: { currentRole, targetRole, timeline }, result: res }).catch(() => {})
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="flex-1 w-full">
      {/* Header */}
      <div className="border-b border-border bg-card/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-11 rounded-xl bg-gradient-to-br from-primary via-violet-500 to-emerald-500 flex items-center justify-center shadow-sm">
              <Map className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">AI Career Roadmap</h1>
              <p className="text-xs text-muted-foreground">Personalized career path with milestones, skills, and salary projections</p>
            </div>
          </div>

          {/* Input form */}
          <div className="grid sm:grid-cols-3 gap-3 mt-5">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Current role</Label>
              <Input value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} placeholder="e.g. Junior Developer" className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Target role</Label>
              <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Senior Engineer" className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Timeline</Label>
              <Select value={timeline} onValueChange={setTimeline}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-2 years" className="text-sm">1-2 years (Fast track)</SelectItem>
                  <SelectItem value="2-3 years" className="text-sm">2-3 years (Standard)</SelectItem>
                  <SelectItem value="3-5 years" className="text-sm">3-5 years (Thorough)</SelectItem>
                  <SelectItem value="5+ years" className="text-sm">5+ years (Long-term)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={generate} disabled={loading} className="mt-3 gap-1.5">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {loading ? 'Generating your roadmap...' : 'Generate career roadmap'}
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {!result && !loading && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center dot-pattern">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-primary via-violet-500 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Map className="size-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Map your career journey</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
              Get a personalized roadmap with phased milestones, skill gaps to close, recommended certifications, and salary projections for each phase.
            </p>
            <div className="grid sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              <FeatureMini icon={Compass} label="Milestones" color="text-primary" />
              <FeatureMini icon={Wrench} label="Skill gaps" color="text-violet-500" />
              <FeatureMini icon={Award} label="Certifications" color="text-emerald-500" />
              <FeatureMini icon={DollarSign} label="Salary projection" color="text-amber-500" />
            </div>
          </Card>

          {/* History */}
          <AiHistorySection type="career_roadmap" onLoad={(res, input) => { setResult(res); setActivePhase(0); if (input?.currentRole) setCurrentRole(input.currentRole); if (input?.targetRole) setTargetRole(input.targetRole); if (input?.timeline) setTimeline(input.timeline) }} />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          <Skeleton className="h-20" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="flex-1 h-32" />)}
          </div>
          <Skeleton className="h-48" />
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 space-y-5 fade-in">
          {/* Summary */}
          {result.summary && (
            <Card className="p-5 bg-gradient-to-br from-primary/5 via-violet-500/5 to-emerald-500/5 border-primary/20">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-lg bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shrink-0">
                  <Target className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Your career roadmap</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Milestones timeline */}
          {result.milestones?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Compass className="size-4 text-primary" /> Career milestones
                <Badge variant="secondary" className="text-[10px] ml-auto">{result.milestones.length} phases</Badge>
              </h3>

              {/* Phase selector (horizontal) */}
              <div className="flex gap-2 mb-5 overflow-x-auto scroll-thin pb-2">
                {result.milestones.map((m: any, i: number) => {
                  const PhaseIcon = PHASE_ICONS[i % PHASE_ICONS.length]
                  const isActive = i === activePhase
                  return (
                    <button
                      key={i}
                      onClick={() => setActivePhase(i)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium whitespace-nowrap transition-all shrink-0 ${isActive ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:bg-accent/50'}`}
                    >
                      <div className={`size-6 rounded-full bg-gradient-to-br ${PHASE_COLORS[i % PHASE_COLORS.length]} flex items-center justify-center text-white shrink-0`}>
                        <PhaseIcon className="size-3" />
                      </div>
                      {m.phase?.replace(/Phase \d+:\s*/, '') || `Phase ${i + 1}`}
                    </button>
                  )
                })}
              </div>

              {/* Active phase detail */}
              {result.milestones[activePhase] && (
                <div className="rounded-xl border border-border overflow-hidden fade-in">
                  {/* Phase header */}
                  <div className={`bg-gradient-to-r ${PHASE_COLORS[activePhase % PHASE_COLORS.length]} p-4 text-white`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs opacity-80">{result.milestones[activePhase].phase}</p>
                        <h4 className="font-semibold text-base mt-0.5">{result.milestones[activePhase].title}</h4>
                      </div>
                      <Badge className="bg-white/20 text-white border-0 text-xs">{result.milestones[activePhase].duration}</Badge>
                    </div>
                    <p className="text-sm opacity-90 mt-2">{result.milestones[activePhase].description}</p>
                  </div>

                  {/* Phase body */}
                  <div className="p-4 space-y-4">
                    {/* Skills */}
                    {result.milestones[activePhase].skills?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Wrench className="size-3" /> Skills to develop</p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.milestones[activePhase].skills.map((s: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs bg-primary/10 text-primary">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {result.milestones[activePhase].actions?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Zap className="size-3" /> Key actions</p>
                        <ul className="space-y-1.5">
                          {result.milestones[activePhase].actions.map((a: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Resources */}
                    {result.milestones[activePhase].resources?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Award className="size-3" /> Resources</p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.milestones[activePhase].resources.map((r: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">{r}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Milestone */}
                    {result.milestones[activePhase].milestone && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                        <Target className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Completion milestone</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{result.milestones[activePhase].milestone}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between p-3 border-t border-border bg-muted/30">
                    <Button variant="ghost" size="sm" disabled={activePhase === 0} onClick={() => setActivePhase((p) => Math.max(0, p - 1))}>
                      <ChevronRight className="size-3.5 rotate-180" /> Previous
                    </Button>
                    <span className="text-xs text-muted-foreground">{activePhase + 1} / {result.milestones.length}</span>
                    <Button variant="ghost" size="sm" disabled={activePhase === result.milestones.length - 1} onClick={() => setActivePhase((p) => Math.min(result.milestones.length - 1, p + 1))}>
                      Next <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-5">
            {/* Skills gap */}
            {result.skillsGap?.length > 0 && (
              <Card className="p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Wrench className="size-4 text-violet-500" /> Skills to close</h3>
                <div className="space-y-3">
                  {result.skillsGap.map((s: any, i: number) => (
                    <div key={i} className="border border-border/60 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{s.skill}</p>
                        <Badge className={`text-[10px] ${s.priority === 'high' ? 'bg-destructive/10 text-destructive' : s.priority === 'medium' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-muted text-muted-foreground'}`}>
                          {s.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1.5">{s.why}</p>
                      <p className="text-xs text-foreground/70"><span className="font-medium">Learn:</span> {s.howToLearn}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Certifications */}
            {result.certifications?.length > 0 && (
              <Card className="p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Award className="size-4 text-emerald-500" /> Recommended certifications</h3>
                <div className="space-y-3">
                  {result.certifications.map((c: any, i: number) => (
                    <div key={i} className="border border-border/60 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{c.name}</p>
                        <Badge className={`text-[10px] ${c.priority === 'high' ? 'bg-destructive/10 text-destructive' : c.priority === 'medium' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-muted text-muted-foreground'}`}>
                          {c.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.provider}</p>
                      <p className="text-xs text-foreground/70 mt-1">{c.value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Salary projection */}
          {result.salaryProjection?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><DollarSign className="size-4 text-amber-500" /> Salary projection by phase</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {result.salaryProjection.map((s: any, i: number) => (
                  <div key={i} className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">{s.phase}</p>
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{s.range}</p>
                    {s.note && <p className="text-[10px] text-muted-foreground/70 mt-1">{s.note}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-5">
            {/* Pitfalls */}
            {result.pitfalls?.length > 0 && (
              <Card className="p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><AlertTriangle className="size-4 text-destructive" /> Common pitfalls to avoid</h3>
                <ul className="space-y-2">
                  {result.pitfalls.map((p: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="size-3.5 text-destructive shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{p}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Networking tips */}
            {result.networkingTips?.length > 0 && (
              <Card className="p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Users className="size-4 text-primary" /> Networking tips</h3>
                <ul className="space-y-2">
                  {result.networkingTips.map((t: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Users className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{t}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Regenerate */}
          <div className="text-center pt-2">
            <Button variant="outline" onClick={generate} disabled={loading} className="gap-1.5">
              <Sparkles className="size-4" /> Regenerate roadmap
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function FeatureMini({ icon: Icon, label, color }: { icon: any; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted/30">
      <Icon className={`size-5 ${color}`} />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  )
}
