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
  Brain, Sparkles, Loader2, ChevronDown, ChevronUp, Lightbulb, AlertTriangle,
  TrendingUp, MessageSquare, Code, DollarSign, Target, ArrowRight, Zap,
} from 'lucide-react'
import { toast } from 'sonner'

const POPULAR_ROLES = [
  'Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer',
  'Backend Engineer', 'Frontend Engineer', 'DevOps Engineer', 'Mechanical Engineer',
  'Business Analyst', 'Full-stack Developer', 'Machine Learning Engineer', 'QA Engineer',
]

export function InterviewPrepView() {
  const { user } = useApp()
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [skills, setSkills] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('fresher')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [expandedQ, setExpandedQ] = useState<string | null>(null)

  // Prefill from profile
  useEffect(() => {
    let active = true
    const load = async () => {
      if (!user) return
      try {
        const profile = await api.getProfile()
        if (!active) return
        if (profile.desiredJobTitle) setJobTitle(profile.desiredJobTitle)
        if (profile.technicalSkills) setSkills(profile.technicalSkills)
        if (profile.experienceKind) setExperienceLevel(profile.experienceKind)
      } catch {}
    }
    load()
    return () => { active = false }
  }, [user])

  const generate = async () => {
    if (!jobTitle.trim()) { toast.error('Please enter a job title'); return }
    setLoading(true)
    setResult(null)
    try {
      const skillsArr = skills.split(',').map((s) => s.trim()).filter(Boolean)
      const res = await api.aiInterviewPrep(jobTitle.trim(), company.trim() || undefined, skillsArr, experienceLevel)
      setResult(res)
      // Save to history
      const title = company.trim() ? `${jobTitle.trim()} @ ${company.trim()}` : jobTitle.trim()
      api.saveAiGeneration({ type: 'interview_prep', title, input: { jobTitle, company, skills: skillsArr, experienceLevel }, result: res }).catch(() => {})
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="flex-1 w-full">
      {/* Header */}
      <div className="border-b border-border bg-card/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-11 rounded-xl bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center shadow-sm">
              <Brain className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">AI Interview Prep</h1>
              <p className="text-xs text-muted-foreground">Personalized interview questions, topics, and tips — powered by AI</p>
            </div>
          </div>

          {/* Input form */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Job title</Label>
              <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Software Engineer" className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Company (optional)</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Google, TechVedika..." className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Experience level</Label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fresher" className="text-sm">Fresher (0-1 yrs)</SelectItem>
                  <SelectItem value="junior" className="text-sm">Junior (1-3 yrs)</SelectItem>
                  <SelectItem value="mid" className="text-sm">Mid-level (3-5 yrs)</SelectItem>
                  <SelectItem value="senior" className="text-sm">Senior (5+ yrs)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Key skills (comma-separated)</Label>
              <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Python, SQL" className="h-9 text-sm" />
            </div>
          </div>
          <Button onClick={generate} disabled={loading} className="mt-3 gap-1.5">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {loading ? 'Generating prep guide...' : 'Generate interview prep'}
          </Button>
        </div>
      </div>

      {/* Popular roles */}
      {!result && !loading && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
          <Card className="p-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Zap className="size-4 text-primary" /> Try a popular role</h3>
            <div className="flex flex-wrap gap-2">
              {POPULAR_ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => { setJobTitle(r); }}
                  className="px-3 py-1.5 rounded-full border border-border text-sm hover:border-primary/40 hover:bg-accent transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          </Card>

          {/* Feature description */}
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <FeatureCard icon={Code} title="Technical questions" desc="Role-specific technical questions with difficulty levels and hints" />
            <FeatureCard icon={MessageSquare} title="Behavioral questions" desc="STAR-method behavioral questions with answering tips" />
            <FeatureCard icon={Target} title="Topics & tips" desc="Key topics to review, actionable tips, and red flags to avoid" />
          </div>

          {/* History */}
          <AiHistorySection type="interview_prep" onLoad={(res, input) => { setResult(res); if (input?.jobTitle) setJobTitle(input.jobTitle); if (input?.company) setCompany(input.company); if (input?.skills) setSkills(Array.isArray(input.skills) ? input.skills.join(', ') : ''); if (input?.experienceLevel) setExperienceLevel(input.experienceLevel) }} />
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          <Skeleton className="h-20" />
          <div className="grid md:grid-cols-2 gap-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-32" />
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 space-y-5 fade-in">
          {/* Overview */}
          {result.overview && (
            <Card className="p-5 bg-gradient-to-br from-violet-500/5 to-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Lightbulb className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">What to expect</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.overview}</p>
                </div>
              </div>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-5">
            {/* Technical questions */}
            {result.technicalQuestions?.length > 0 && (
              <Card className="p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Code className="size-4 text-primary" /> Technical questions
                  <Badge variant="secondary" className="text-[10px] ml-auto">{result.technicalQuestions.length}</Badge>
                </h3>
                <div className="space-y-2">
                  {result.technicalQuestions.map((q: any, i: number) => {
                    const key = `tech-${i}`
                    const expanded = expandedQ === key
                    return (
                      <div key={key} className="border border-border/60 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedQ(expanded ? null : key)}
                          className="w-full flex items-start gap-2 p-3 text-left hover:bg-accent/30 transition-colors"
                        >
                          <span className="text-xs font-semibold text-muted-foreground shrink-0 mt-0.5">Q{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{q.question}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {q.topic && <Badge variant="outline" className="text-[10px] py-0">{q.topic}</Badge>}
                              {q.difficulty && (
                                <Badge className={`text-[10px] py-0 ${q.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : q.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-destructive/10 text-destructive'}`}>
                                  {q.difficulty}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {expanded ? <ChevronUp className="size-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="size-4 text-muted-foreground shrink-0 mt-1" />}
                        </button>
                        {expanded && q.hint && (
                          <div className="px-3 pb-3 pt-1 text-xs text-muted-foreground bg-muted/30 border-t border-border/40">
                            <span className="font-medium text-foreground/80">💡 Hint:</span> {q.hint}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Behavioral questions */}
            {result.behavioralQuestions?.length > 0 && (
              <Card className="p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <MessageSquare className="size-4 text-primary" /> Behavioral questions
                  <Badge variant="secondary" className="text-[10px] ml-auto">{result.behavioralQuestions.length}</Badge>
                </h3>
                <div className="space-y-2">
                  {result.behavioralQuestions.map((q: any, i: number) => {
                    const key = `beh-${i}`
                    const expanded = expandedQ === key
                    return (
                      <div key={key} className="border border-border/60 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedQ(expanded ? null : key)}
                          className="w-full flex items-start gap-2 p-3 text-left hover:bg-accent/30 transition-colors"
                        >
                          <span className="text-xs font-semibold text-muted-foreground shrink-0 mt-0.5">Q{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{q.question}</p>
                            {q.framework && <Badge variant="outline" className="text-[10px] py-0 mt-1">{q.framework}</Badge>}
                          </div>
                          {expanded ? <ChevronUp className="size-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="size-4 text-muted-foreground shrink-0 mt-1" />}
                        </button>
                        {expanded && q.tip && (
                          <div className="px-3 pb-3 pt-1 text-xs text-muted-foreground bg-muted/30 border-t border-border/40">
                            <span className="font-medium text-foreground/80">💡 Tip:</span> {q.tip}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* Topics to review */}
          {result.topicsToReview?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Target className="size-4 text-primary" /> Topics to review</h3>
              <div className="flex flex-wrap gap-2">
                {result.topicsToReview.map((t: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-sm py-1 px-2.5 bg-primary/10 text-primary">{t}</Badge>
                ))}
              </div>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-5">
            {/* Tips */}
            {result.tips?.length > 0 && (
              <Card className="p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><TrendingUp className="size-4 text-emerald-500" /> Tips for success</h3>
                <ul className="space-y-2">
                  {result.tips.map((t: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="size-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                      <span className="text-muted-foreground">{t}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Red flags */}
            {result.redFlags?.length > 0 && (
              <Card className="p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><AlertTriangle className="size-4 text-destructive" /> Things to avoid</h3>
                <ul className="space-y-2">
                  {result.redFlags.map((t: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{t}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Salary negotiation */}
          {result.salaryNegotiationTip && (
            <Card className="p-5 bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/20">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <DollarSign className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Salary negotiation tip</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.salaryNegotiationTip}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Regenerate */}
          <div className="text-center pt-2">
            <Button variant="outline" onClick={generate} disabled={loading} className="gap-1.5">
              <Sparkles className="size-4" /> Generate again
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <Card className="p-5 hover-lift">
      <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
        <Icon className="size-5 text-primary" />
      </div>
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </Card>
  )
}
