import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'authentication required' }, { status: 401 })

    const profile = await db.profile.findUnique({ where: { userId: session.id } })
    if (!profile) return NextResponse.json({ error: 'profile not found' }, { status: 404 })

    // Parse candidate's skills
    const candidateSkills = new Set<string>()
    const parseSkills = (s: string | null) => {
      if (!s) return
      s.split(',').forEach((skill) => {
        const trimmed = skill.trim().toLowerCase()
        if (trimmed) candidateSkills.add(trimmed)
      })
    }
    parseSkills(profile.technicalSkills)
    parseSkills(profile.softSkills)
    parseSkills(profile.tools)

    // Build job query based on profile
    const where: any = { status: 'active' }
    if (profile.branch) {
      where.OR = [{ branch: { contains: profile.branch } }, { branch: { contains: profile.branch.toUpperCase() } }, { branch: { contains: profile.branch.toLowerCase() } }]
    }
    if (profile.desiredJobTitle) {
      where.OR = where.OR
        ? [...where.OR, { title: { contains: profile.desiredJobTitle } }]
        : [{ title: { contains: profile.desiredJobTitle } }]
    }

    // Fetch matching jobs
    const jobs = await db.job.findMany({
      where,
      select: { id: true, title: true, skills: true, salaryMin: true, salaryMax: true, companyName: true },
      take: 200,
    })

    // Aggregate skill demand across matching jobs
    const skillDemand: Record<string, { count: number; jobs: string[] }> = {}
    jobs.forEach((job) => {
      if (!job.skills) return
      job.skills.split(',').forEach((skill) => {
        const trimmed = skill.trim().toLowerCase()
        if (!trimmed) return
        if (!skillDemand[trimmed]) skillDemand[trimmed] = { count: 0, jobs: [] }
        skillDemand[trimmed].count++
        if (skillDemand[trimmed].jobs.length < 3) skillDemand[trimmed].jobs.push(job.title)
      })
    })

    // Categorize skills
    const allDemandSkills = Object.entries(skillDemand)
      .map(([skill, data]) => ({ skill, count: data.count, percentage: Math.round((data.count / jobs.length) * 100), jobExamples: data.jobs }))
      .sort((a, b) => b.count - a.count)

    const matched = allDemandSkills.filter((s) => candidateSkills.has(s.skill))
    const missing = allDemandSkills.filter((s) => !candidateSkills.has(s.skill))

    // Skill gap score: ratio of high-demand skills the candidate has
    const topSkills = allDemandSkills.slice(0, 10)
    const matchedTopCount = topSkills.filter((s) => candidateSkills.has(s.skill)).length
    const gapScore = topSkills.length > 0 ? Math.round((matchedTopCount / topSkills.length) * 100) : 0

    // Candidate's skills that aren't in demand (might be niche/overspecialized)
    const candidateSkillList = Array.from(candidateSkills)
    const nicheSkills = candidateSkillList.filter((s) => !skillDemand[s])

    return NextResponse.json({
      totalJobsAnalyzed: jobs.length,
      gapScore,
      gapLabel: gapScore >= 80 ? 'Excellent' : gapScore >= 60 ? 'Good' : gapScore >= 40 ? 'Fair' : 'Needs work',
      candidateSkills: candidateSkillList,
      matchedSkills: matched.slice(0, 10),
      missingHighDemand: missing.slice(0, 10),
      nicheSkills: nicheSkills.slice(0, 10),
      topDemandSkills: topSkills,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
