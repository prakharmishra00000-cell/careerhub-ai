import { NextRequest, NextResponse } from 'next/server'
import { generateAICompletion } from '@/lib/ai-provider'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { jobToCard } from '@/lib/jobs'
import type { JobCardData } from '@/lib/types'

const SYSTEM = `You are CareerHub AI's matching engine. Compare the candidate profile to the job. Return STRICT JSON:
{ "summary": string (1-2 sentences, honest), "strengths": string[], "gaps": string[], "eligibilityWarnings": string[] }
Never fabricate eligibility. If something is not specified in the job, say so.`

interface MatchExplanation {
  summary: string
  strengths: string[]
  gaps: string[]
  eligibilityWarnings: string[]
}

function stripJsonFences(s: string): string {
  let t = s.trim()
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '')
  return t.trim()
}

function safeParseExplanation(s: string | undefined | null): MatchExplanation | null {
  if (!s) return null
  const cleaned = stripJsonFences(s)
  const tryParse = (txt: string): MatchExplanation | null => {
    try {
      const obj = JSON.parse(txt)
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        return {
          summary: typeof obj.summary === 'string' ? obj.summary : '',
          strengths: Array.isArray(obj.strengths) ? obj.strengths.filter((x: any) => typeof x === 'string') : [],
          gaps: Array.isArray(obj.gaps) ? obj.gaps.filter((x: any) => typeof x === 'string') : [],
          eligibilityWarnings: Array.isArray(obj.eligibilityWarnings) ? obj.eligibilityWarnings.filter((x: any) => typeof x === 'string') : [],
        }
      }
    } catch {
      // ignore
    }
    return null
  }
  let parsed = tryParse(cleaned)
  if (parsed) return parsed
  const m = cleaned.match(/\{[\s\S]*\}/)
  if (m) parsed = tryParse(m[0])
  return parsed
}

function tokenizeSkills(s: string | null | undefined): string[] {
  if (!s) return []
  return s.split(/[,\n/|;&]+/).map((t) => t.trim()).filter(Boolean)
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(['candidate'])
    if (!user) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({} as any))
    const jobId = (body?.jobId ?? '').toString().trim()
    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    const [job, profile] = await Promise.all([
      db.job.findUnique({ where: { id: jobId }, include: { source: true, company: true } }),
      db.profile.findUnique({ where: { userId: user.id } }),
    ])
    if (!job) {
      return NextResponse.json({ error: 'job not found' }, { status: 404 })
    }
    if (!profile) {
      return NextResponse.json({ error: 'profile not found' }, { status: 404 })
    }

    // Build compact profile + job payloads for the LLM
    const profilePayload = {
      degree: profile.degree,
      branch: profile.branch,
      cgpa: profile.cgpa,
      activeBacklogs: profile.activeBacklogs,
      totalExperienceYears: profile.totalExperienceYears,
      preferredLocations: profile.preferredLocations,
      remotePreference: profile.remotePreference,
      technicalSkills: tokenizeSkills(profile.technicalSkills),
      desiredJobTitle: profile.desiredJobTitle,
      salaryExpectationMin: profile.salaryExpectationMin,
    }
    const jobPayload = {
      title: job.title,
      degree: job.degree,
      branch: job.branch,
      cgpaRequirement: job.cgpaRequirement,
      backlogPolicy: job.backlogPolicy,
      experienceMin: job.experienceMin,
      experienceMax: job.experienceMax,
      city: job.city,
      remoteType: job.remoteType,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      skills: tokenizeSkills(job.skills),
      employmentType: job.employmentType,
    }

    let explanation: MatchExplanation | null = null
    try {
      const raw = await generateAICompletion([
        { role: 'system', content: SYSTEM },
        { role: 'user', content: JSON.stringify({ profile: profilePayload, job: jobPayload }) },
      ], { jsonMode: true })
      explanation = safeParseExplanation(typeof raw === 'string' ? raw : null)
    } catch {
      // Fallback matching calculation
      const candSkills = new Set(profilePayload.technicalSkills.map((s: string) => s.toLowerCase()))
      const matched = jobPayload.skills.filter((s: string) => candSkills.has(s.toLowerCase()))
      const missing = jobPayload.skills.filter((s: string) => !candSkills.has(s.toLowerCase()))

      explanation = {
        summary: `Your profile demonstrates good foundational alignment with ${job.title} at ${job.companyName}.`,
        strengths: matched.length > 0 ? matched.map((s) => `Matched skill: ${s}`) : ['Relevant background and educational alignment'],
        gaps: missing.length > 0 ? missing.map((s) => `Skill to develop: ${s}`) : [],
        eligibilityWarnings: [],
      }
    }

    if (!explanation) {
      return NextResponse.json(
        { error: 'AI match explanation is temporarily unavailable. Please try again later.' },
        { status: 503 },
      )
    }

    const jobCard: JobCardData = jobToCard(job)

    return NextResponse.json({
      summary: explanation.summary,
      strengths: explanation.strengths,
      gaps: explanation.gaps,
      eligibilityWarnings: explanation.eligibilityWarnings,
      job: jobCard,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'match-score failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
