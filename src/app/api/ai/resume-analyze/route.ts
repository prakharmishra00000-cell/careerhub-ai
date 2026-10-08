import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

const SYSTEM = `You are an expert ATS resume reviewer. Analyze the resume and return STRICT JSON only with this exact shape:
{
  "score": number (0-100),
  "atsCompatibility": number (0-100),
  "skillsDetected": string[],
  "missingKeywords": string[],
  "formatting": { "score": number, "notes": string },
  "experience": { "score": number, "notes": string },
  "achievements": { "score": number, "notes": string },
  "impact": { "score": number, "notes": string },
  "roleAlignment": { "score": number, "notes": string },
  "suggestions": string[]
}
Never fabricate skills the user doesn't have. Be specific and actionable.`

interface ResumeAnalysis {
  score: number
  atsCompatibility: number
  skillsDetected: string[]
  missingKeywords: string[]
  formatting: { score: number; notes: string }
  experience: { score: number; notes: string }
  achievements: { score: number; notes: string }
  impact: { score: number; notes: string }
  roleAlignment: { score: number; notes: string }
  suggestions: string[]
}

function stripJsonFences(s: string): string {
  let t = s.trim()
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '')
  return t.trim()
}

function safeParseAnalysis(s: string | undefined | null): ResumeAnalysis | null {
  if (!s) return null
  const cleaned = stripJsonFences(s)
  const tryParse = (txt: string): ResumeAnalysis | null => {
    try {
      const obj = JSON.parse(txt)
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        return obj as ResumeAnalysis
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

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(['candidate'])
    if (!user) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({} as any))
    const resumeText = (body?.resumeText ?? '').toString()
    let targetRole = (body?.targetRole ?? '').toString().trim() || ''

    if (!resumeText || resumeText.trim().length < 20) {
      return NextResponse.json({ error: 'resumeText is required (min 20 chars)' }, { status: 400 })
    }

    // Fall back to the candidate's profile.desiredJobTitle if targetRole not given
    if (!targetRole) {
      const profile = await db.profile.findUnique({ where: { userId: user.id } })
      targetRole = profile?.desiredJobTitle ?? 'not specified'
    }

    // LLM call
    let analysis: ResumeAnalysis | null = null
    try {
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: SYSTEM },
          { role: 'user', content: `Resume:\n${resumeText}\n\nTarget role: ${targetRole}` },
        ],
        thinking: { type: 'disabled' },
      })
      const raw = completion?.choices?.[0]?.message?.content
      analysis = safeParseAnalysis(typeof raw === 'string' ? raw : null)
    } catch {
      analysis = null
    }

    if (!analysis) {
      return NextResponse.json(
        { error: 'AI analysis is temporarily unavailable. Please try again later.' },
        { status: 503 },
      )
    }

    // Persist as a new ResumeVersion; mark prior versions as not latest (atomic)
    const resume = await db.$transaction(async (tx) => {
      await tx.resumeVersion.updateMany({
        where: { userId: user.id, isLatest: true },
        data: { isLatest: false },
      })
      return tx.resumeVersion.create({
        data: {
          userId: user.id,
          fileName: 'pasted-text',
          content: resumeText,
          score: typeof analysis!.score === 'number' ? Math.round(analysis!.score) : null,
          analysis: JSON.stringify(analysis),
          isLatest: true,
        },
      })
    })

    return NextResponse.json({ ...analysis, resumeId: resume.id })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'resume-analyze failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
