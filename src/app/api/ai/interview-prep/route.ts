import { NextRequest, NextResponse } from 'next/server'
import { generateAICompletion } from '@/lib/ai-provider'

export async function POST(req: NextRequest) {
  try {
    const { jobTitle, company, skills, experienceLevel } = await req.json().catch(() => ({}))
    if (!jobTitle) return NextResponse.json({ error: 'jobTitle is required' }, { status: 400 })

    const skillsStr = Array.isArray(skills) ? skills.join(', ') : (skills || '')
    const contextParts = [
      `Job title: ${jobTitle}`,
      company ? `Company: ${company}` : '',
      skillsStr ? `Key skills: ${skillsStr}` : '',
      experienceLevel ? `Experience level: ${experienceLevel}` : '',
    ].filter(Boolean).join('\n')

    let parsed: any = null
    try {
      const text = await generateAICompletion([
        {
          role: 'system',
          content: `You are an expert interview coach with 15+ years of experience. Generate a comprehensive interview preparation guide. Respond with STRICT JSON only — no markdown fences, no prose outside JSON. Use this exact shape:
{
  "overview": "2-3 sentence summary of what to expect in this interview",
  "technicalQuestions": [{ "question": "...", "topic": "...", "difficulty": "easy|medium|hard", "hint": "..." }],
  "behavioralQuestions": [{ "question": "...", "framework": "STAR method suggested", "tip": "..." }],
  "topicsToReview": ["topic1", "topic2"],
  "tips": ["actionable tip 1", "tip 2"],
  "redFlags": ["things to avoid 1"],
  "salaryNegotiationTip": "one specific tip for this role"
}`
        },
        {
          role: 'user',
          content: contextParts
        }
      ], { jsonMode: true })

      const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      // Intelligent fallback
      parsed = {
        overview: `Comprehensive interview preparation guide for the ${jobTitle} position at ${company || 'top engineering organizations'}.`,
        technicalQuestions: [
          { question: `Explain how you design scalable REST APIs and handle state in ${skillsStr || 'modern web applications'}.`, topic: 'System Design', difficulty: 'medium', hint: 'Focus on caching, rate limiting, and clean database schema modeling.' },
          { question: 'How do you optimize slow SQL / NoSQL database queries and index strategy?', topic: 'Database Optimization', difficulty: 'medium', hint: 'Discuss EXPLAIN plans, composite indexes, and connection pooling.' },
          { question: 'Describe how you troubleshoot a sudden spike in latency or 5xx server errors in production.', topic: 'Debugging & Reliability', difficulty: 'hard', hint: 'Walk through logs, telemetry metrics, rollback plans, and root cause analysis.' }
        ],
        behavioralQuestions: [
          { question: 'Describe a challenging technical disagreement you had with a teammate and how you resolved it.', framework: 'STAR method suggested', tip: 'Emphasize data-driven consensus and keeping user impact at the center.' },
          { question: 'Tell me about a time you had to meet a tight deadline under ambiguous specifications.', framework: 'STAR method suggested', tip: 'Highlight prioritization, early communication with stakeholders, and MVP delivery.' }
        ],
        topicsToReview: ['Data Structures & Algorithms', 'System Architecture & Microservices', 'CI/CD & Cloud Deployment', 'Unit & Integration Testing'],
        tips: ['Review core architectural trade-offs beforehand', 'Ask clarifying questions before jumping into coding', 'Structure answers clearly using the STAR framework'],
        redFlags: ['Not asking questions about the company stack and team workflows', 'Pretending to know answers rather than explaining how you would research them'],
        salaryNegotiationTip: 'Anchor your expectations around total compensation, equity/bonuses, and market ranges for your experience level.'
      }
    }

    return NextResponse.json(parsed)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
