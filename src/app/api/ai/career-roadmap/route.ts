import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const session = await getSession()

    // Build context from profile if logged in
    let profileContext = ''
    if (session) {
      const profile = await db.profile.findUnique({ where: { userId: session.id } })
      if (profile) {
        const parts = [
          profile.degree ? `Degree: ${profile.degree}` : '',
          profile.branch ? `Branch: ${profile.branch}` : '',
          profile.experienceKind ? `Experience: ${profile.experienceKind}` : '',
          profile.totalExperienceYears != null ? `Years: ${profile.totalExperienceYears}` : '',
          profile.technicalSkills ? `Skills: ${profile.technicalSkills}` : '',
          profile.desiredJobTitle ? `Desired role: ${profile.desiredJobTitle}` : '',
          profile.desiredRoles ? `Target roles: ${profile.desiredRoles}` : '',
          profile.industries ? `Industries: ${profile.industries}` : '',
        ].filter(Boolean)
        profileContext = parts.join('\n')
      }
    }

    // Use body overrides or profile defaults
    const currentRole = body.currentRole || ''
    const targetRole = body.targetRole || ''
    const timeline = body.timeline || '2-3 years'

    const userContext = [
      profileContext,
      currentRole ? `Current role: ${currentRole}` : '',
      targetRole ? `Target role: ${targetRole}` : '',
      `Timeline: ${timeline}`,
    ].filter(Boolean).join('\n')

    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are an expert career coach and technical mentor with 20+ years of experience across software, data, product, and engineering careers. Generate a personalized career roadmap. Respond with STRICT JSON only — no markdown fences, no prose outside JSON. Use this exact shape:
{
  "summary": "2-3 sentence personalized career summary",
  "milestones": [
    {
      "phase": "Phase 1: Foundation",
      "duration": "0-6 months",
      "title": "Short milestone title",
      "description": "What to focus on in this phase",
      "skills": ["skill1", "skill2"],
      "actions": ["specific action 1", "action 2"],
      "resources": ["resource type 1", "resource type 2"],
      "milestone": "What achievement marks completion of this phase"
    }
  ],
  "skillsGap": [
    { "skill": "skill name", "priority": "high|medium|low", "why": "why it matters for the target role", "howToLearn": "brief learning path" }
  ],
  "certifications": [
    { "name": "cert name", "provider": "provider", "value": "why it's valuable", "priority": "high|medium|low" }
  ],
  "salaryProjection": [
    { "phase": "Phase 1", "range": "₹X-Y LPA", "note": "context" }
  ],
  "pitfalls": ["common mistake 1", "mistake 2"],
  "networkingTips": ["tip 1", "tip 2"]
}
Generate 4-5 milestones (Foundation → Intermediate → Advanced → Specialization → Target Role). Generate 4-6 skill gaps. Generate 3-4 certifications. Make everything specific and actionable. Never fabricate unrealistic timelines.`
        },
        {
          role: 'user',
          content: userContext || 'Generate a general software engineering career roadmap for a fresher aiming to become a senior engineer in 3-4 years.'
        }
      ],
      thinking: { type: 'disabled' }
    })

    let text = completion.choices[0]?.message?.content || '{}'
    text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        try { parsed = JSON.parse(match[0]) } catch { parsed = { raw: text } }
      } else {
        parsed = { raw: text }
      }
    }

    return NextResponse.json(parsed)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
