import { NextRequest, NextResponse } from 'next/server'
import { generateAICompletion } from '@/lib/ai-provider'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const session = await getSession()

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

    const currentRole = body.currentRole || ''
    const targetRole = body.targetRole || 'Senior Software Engineer'
    const timeline = body.timeline || '2-3 years'

    const userContext = [
      profileContext,
      currentRole ? `Current role: ${currentRole}` : '',
      targetRole ? `Target role: ${targetRole}` : '',
      `Timeline: ${timeline}`,
    ].filter(Boolean).join('\n')

    let parsed: any = null
    try {
      const text = await generateAICompletion([
        {
          role: 'system',
          content: `You are an expert career coach. Generate a personalized career roadmap. Respond with STRICT JSON only — no markdown fences, no prose outside JSON. Use this exact shape:
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
}`
        },
        {
          role: 'user',
          content: userContext || `Generate a software engineering roadmap for ${targetRole}.`
        }
      ], { jsonMode: true })

      const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      // Heuristic fallback
      parsed = {
        summary: `Strategic career progression roadmap towards becoming a high-impact ${targetRole}.`,
        milestones: [
          {
            phase: 'Phase 1: Core Fundamentals & System Design',
            duration: '0-6 months',
            title: 'Master Architecture & Clean Code',
            description: 'Deepen knowledge of distributed systems, concurrency, and scalable backends.',
            skills: ['Data Structures & Algorithms', 'TypeScript', 'PostgreSQL', 'Docker'],
            actions: ['Build 2 full-stack end-to-end projects', 'Contribute to open source'],
            resources: ['System Design Primer', 'Official Next.js Docs'],
            milestone: 'Deliver a production-ready application with CI/CD',
          },
          {
            phase: 'Phase 2: Cloud Infrastructure & Scalability',
            duration: '6-12 months',
            title: 'Cloud Architecture & DevOps',
            description: 'Deploy resilient microservices and master monitoring & telemetry.',
            skills: ['AWS / GCP', 'Kubernetes', 'Redis', 'GraphQL'],
            actions: ['Implement distributed caching and message queues', 'Pass AWS Solution Architect cert'],
            resources: ['AWS Free Tier Labs', 'Kubernetes in Action'],
            milestone: 'Architect a low-latency high-throughput microservice',
          },
          {
            phase: 'Phase 3: Leadership & Senior Impact',
            duration: '12-24 months',
            title: 'Technical Leadership & Mentorship',
            description: 'Lead technical RFCs, mentor junior developers, and drive architectural choices.',
            skills: ['System Architecture', 'Technical Mentorship', 'API Governance'],
            actions: ['Lead a major engineering initiative', 'Write engineering blog posts'],
            resources: ['Staff Engineer by Will Larson'],
            milestone: 'Promotion / Offer for Senior Engineer role',
          }
        ],
        skillsGap: [
          { skill: 'System Design', priority: 'high', why: 'Essential for senior roles', howToLearn: 'Study distributed design patterns and real-world architectures' },
          { skill: 'Cloud DevOps', priority: 'high', why: 'Crucial for autonomous delivery', howToLearn: 'Hands-on practice with AWS and Terraform' },
        ],
        certifications: [
          { name: 'AWS Certified Solutions Architect', provider: 'Amazon Web Services', value: 'Industry standard for cloud competence', priority: 'high' }
        ],
        salaryProjection: [
          { phase: 'Entry / Current', range: '₹8–15 LPA', note: 'Standard base market rate' },
          { phase: 'Senior Milestone', range: '₹22–40 LPA', note: 'Top product firms and high-growth startups' },
        ],
        pitfalls: ['Focusing purely on syntax instead of architecture', 'Neglecting communication and ownership'],
        networkingTips: ['Participate actively in developer communities and hackathons', 'Share your learnings publicly on LinkedIn and GitHub'],
      }
    }

    return NextResponse.json(parsed)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
