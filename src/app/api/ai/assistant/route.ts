import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { buildJobWhere, buildJobOrderBy, jobToCard } from '@/lib/jobs'
import type { JobFilter, JobCardData, AIAssistantTurn } from '@/lib/types'

const SYSTEM_FILTER = `You are CareerHub AI's career assistant. Convert the user's natural-language job search request into a strict JSON job filter object. Only output JSON, no prose.
Available fields and allowed values:
- q: string (free-text keyword)
- location: string
- remoteType: array of ['remote','hybrid','onsite','work_from_home']
- employmentType: array of ['full_time','part_time','contract','temporary','freelance','internship','apprenticeship','trainee','graduate_program','management_trainee','work_study','volunteer','fellowship','research','coop']
- degree: array of ['BTech','BE','MTech','ME','BCA','MCA','BBA','MBA','BCom','MCom','BSc','MSc','BA','MA','PhD','Diploma','ITI','Polytechnic']
- branch: array of ['CSE','IT','AI','ML','Data Science','Cybersecurity','ECE','EEE','Mechanical','Civil','Electrical','Chemical','Production','Automobile','Aerospace','Biotech','Biomedical','Environmental','Instrumentation','Architecture','HR','Operations','Marketing','Statistics','English','Biotechnology']
- experience: 'fresher'|'0-1'|'1-2'|'2-3'|'3-5'|'5-10'|'10+'
- fresherFriendly: boolean
- isInternship: boolean
- minSalary: number (annual INR)
- maxSalary: number (annual INR)
- minStipend: number (monthly INR)
- stipendPaid: 'paid'|'unpaid'|'not_disclosed'
- internshipDuration: number (months)
- ppoAvailable: boolean
- source: array of source names (LinkedIn, Indeed, Naukri, Internshala, Unstop, Wellfound, Company Website, Government Portal, Glassdoor)
- companyType: array of ['startup','mnc','government','psu','ngo','consulting','product','service','agency','research','university']
- backlogPolicy: array of ['allowed','not_allowed','current_allowed','previous_allowed','not_specified']
- minCgpa: number
- sort: 'relevance'|'newest'|'salary_high'|'salary_low'|'best_match'|'closing_soon'|'recently_updated'
Omit fields not mentioned by the user. Do not invent values. Output ONLY a JSON object.`

const SYSTEM_EXPLAIN = `You are CareerHub AI's career assistant. Given the user's request, the filters you extracted, the number of results, write 1-3 short sentences explaining what you searched and what you found. Be honest. If zero results, suggest relaxing one filter. Do not invent job details.`

function stripJsonFences(s: string): string {
  let t = s.trim()
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '')
  return t.trim()
}

function safeParseFilters(s: string | undefined | null): Partial<JobFilter> | null {
  if (!s) return null
  const cleaned = stripJsonFences(s)
  try {
    const obj = JSON.parse(cleaned)
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) return obj as Partial<JobFilter>
    return null
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/)
    if (m) {
      try {
        const obj = JSON.parse(m[0])
        if (obj && typeof obj === 'object' && !Array.isArray(obj)) return obj as Partial<JobFilter>
      } catch {
        // ignore
      }
    }
    return null
  }
}

function buildProfileContext(p: any): string {
  if (!p) return ''
  const parts: string[] = []
  if (p.desiredJobTitle) parts.push(`desired job title: ${p.desiredJobTitle}`)
  if (p.preferredLocations) parts.push(`preferred locations: ${p.preferredLocations}`)
  if (p.degree) parts.push(`degree: ${p.degree}`)
  if (p.branch) parts.push(`branch: ${p.branch}`)
  if (p.technicalSkills) parts.push(`technical skills: ${p.technicalSkills}`)
  if (p.remotePreference) parts.push(`remote preference: ${p.remotePreference}`)
  if (p.experienceKind) parts.push(`experience kind: ${p.experienceKind}`)
  if (p.totalExperienceYears != null) parts.push(`total experience: ${p.totalExperienceYears}y`)
  if (p.salaryExpectationMin != null) parts.push(`min salary expectation: ${p.salaryExpectationMin}`)
  return parts.join('; ')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const message = (body?.message ?? '').toString().trim()
    const history: AIAssistantTurn[] = Array.isArray(body?.history) ? body.history : []

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    // Optional auth — works for logged-out users too
    const session = await getSession()
    let profile: any = null
    if (session && session.role === 'candidate') {
      profile = await db.profile.findUnique({ where: { userId: session.id } })
    }

    // Find last assistant turn with filters in history
    let priorFilters: Partial<JobFilter> | undefined
    for (let i = history.length - 1; i >= 0; i--) {
      const t = history[i]
      if (t?.role === 'assistant' && t.filters && Object.keys(t.filters).length > 0) {
        priorFilters = t.filters
        break
      }
    }

    // Compose user message: original + optional profile context + optional prior filters
    let userMsg = message
    const profileCtx = buildProfileContext(profile)
    if (profileCtx) userMsg += `\n\n[Candidate profile context — use as soft defaults only when the user is vague: ${profileCtx}]`
    if (priorFilters) {
      userMsg += `\n\n[Previous filters applied: ${JSON.stringify(priorFilters)}. Produce the COMPLETE updated filter set, keeping the previous filters unless the user explicitly changes them.]`
    }

    let newFilters: Partial<JobFilter> = {}
    let aiFailed = false
    try {
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: SYSTEM_FILTER },
          { role: 'user', content: userMsg },
        ],
        thinking: { type: 'disabled' },
      })
      const raw = completion?.choices?.[0]?.message?.content
      const parsed = safeParseFilters(typeof raw === 'string' ? raw : null)
      if (parsed) newFilters = parsed
    } catch {
      aiFailed = true
    }

    // Shallow-merge: prior filters as base, new filters on top
    const merged: JobFilter = { ...(priorFilters ?? {}), ...newFilters }

    // Fallback: if AI failed entirely, use the raw message as q
    let replyNote = ''
    if (aiFailed || Object.keys(merged).length === 0) {
      if (!merged.q) merged.q = message
      replyNote = " I couldn't run the AI parser, so I used your message as a keyword search instead."
    }

    // Run the search
    const where = buildJobWhere(merged)
    const orderBy = buildJobOrderBy(merged)
    const rows = await db.job.findMany({
      where,
      orderBy,
      take: 20,
      include: { source: true, company: true },
    })
    const jobs: JobCardData[] = rows.map((j: any) => jobToCard(j))
    const total = jobs.length

    // Generate friendly explanation via second LLM call
    let reply = ''
    try {
      const zai = await ZAI.create()
      const explainUserMsg = JSON.stringify({
        originalMessage: message,
        filters: merged,
        resultsCount: total,
        top3Titles: jobs.slice(0, 3).map((j) => j.title),
      })
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: SYSTEM_EXPLAIN },
          { role: 'user', content: explainUserMsg },
        ],
        thinking: { type: 'disabled' },
      })
      const text = completion?.choices?.[0]?.message?.content
      reply = typeof text === 'string' ? text.trim() : ''
    } catch {
      reply = ''
    }
    if (!reply) {
      reply = total > 0
        ? `I searched for jobs matching your request and found ${total} result${total === 1 ? '' : 's'}.${replyNote}`
        : `I couldn't find any jobs matching your request.${replyNote} Try relaxing one of your filters (e.g. location, experience, or salary).`
    }

    return NextResponse.json({
      reply,
      filters: merged,
      jobs,
      total,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'assistant failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
