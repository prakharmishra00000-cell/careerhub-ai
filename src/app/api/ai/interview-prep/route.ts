import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(req: NextRequest) {
  try {
    const { jobTitle, company, skills, experienceLevel } = await req.json()
    if (!jobTitle) return NextResponse.json({ error: 'jobTitle is required' }, { status: 400 })

    const zai = await ZAI.create()

    const skillsStr = Array.isArray(skills) ? skills.join(', ') : (skills || '')
    const contextParts = [
      `Job title: ${jobTitle}`,
      company ? `Company: ${company}` : '',
      skillsStr ? `Key skills: ${skillsStr}` : '',
      experienceLevel ? `Experience level: ${experienceLevel}` : '',
    ].filter(Boolean).join('\n')

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are an expert interview coach with 15+ years of experience helping candidates prepare for technical and non-technical interviews. Generate a comprehensive interview preparation guide. Respond with STRICT JSON only — no markdown fences, no prose outside JSON. Use this exact shape:
{
  "overview": "2-3 sentence summary of what to expect in this interview",
  "technicalQuestions": [{ "question": "...", "topic": "...", "difficulty": "easy|medium|hard", "hint": "..." }],
  "behavioralQuestions": [{ "question": "...", "framework": "STAR method suggested", "tip": "..." }],
  "topicsToReview": ["topic1", "topic2", ...],
  "tips": ["actionable tip 1", "tip 2", ...],
  "redFlags": ["things to avoid 1", ...],
  "salaryNegotiationTip": "one specific tip for this role"
}
Generate 5 technical questions, 5 behavioral questions, 5-8 topics, 5-8 tips, 3-4 red flags. Make questions specific to the role and skills. Never fabricate company-specific inside information.`
        },
        {
          role: 'user',
          content: contextParts
        }
      ],
      thinking: { type: 'disabled' }
    })

    let text = completion.choices[0]?.message?.content || '{}'
    // Strip markdown JSON fences if present
    text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      // Try to extract JSON object
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
