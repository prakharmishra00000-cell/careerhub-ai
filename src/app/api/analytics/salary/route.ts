import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const branch = searchParams.get('branch')
    const city = searchParams.get('city')
    const employmentType = searchParams.get('employmentType')
    const remoteType = searchParams.get('remoteType')

    const where: any = { status: 'active', salaryDisclosed: true, salaryMin: { not: null }, salaryMax: { not: null } }
    if (branch) where.OR = [{ branch: { contains: branch } }, { branch: { contains: branch.toUpperCase() } }, { branch: { contains: branch.toLowerCase() } }]
    if (city) where.city = { contains: city }
    if (employmentType) where.employmentType = employmentType
    if (remoteType) where.remoteType = remoteType

    const jobs = await db.job.findMany({
      where,
      select: {
        id: true, title: true, salaryMin: true, salaryMax: true, salaryCurrency: true,
        city: true, branch: true, employmentType: true, remoteType: true, experienceMin: true, experienceMax: true,
        companyName: true, company: { select: { industry: true, companyType: true } },
      },
      take: 500,
    })

    const salaries = jobs.map((j) => ((j.salaryMin! + j.salaryMax!) / 2)).filter((s) => s > 0)
    const avgSalary = salaries.length ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0
    const medianSalary = salaries.length ? salaries.sort((a, b) => a - b)[Math.floor(salaries.length / 2)] : 0
    const minSalary = salaries.length ? Math.min(...salaries) : 0
    const maxSalary = salaries.length ? Math.max(...salaries) : 0
    const p25 = salaries.length ? salaries.sort((a, b) => a - b)[Math.floor(salaries.length * 0.25)] : 0
    const p75 = salaries.length ? salaries.sort((a, b) => a - b)[Math.floor(salaries.length * 0.75)] : 0

    const byBranch: Record<string, { count: number; avg: number; min: number; max: number }> = {}
    jobs.forEach((j) => {
      const b = j.branch || 'Other'
      const mid = (j.salaryMin! + j.salaryMax!) / 2
      if (!byBranch[b]) byBranch[b] = { count: 0, avg: 0, min: Infinity, max: 0 }
      byBranch[b].count++
      byBranch[b].avg += mid
      byBranch[b].min = Math.min(byBranch[b].min, j.salaryMin!)
      byBranch[b].max = Math.max(byBranch[b].max, j.salaryMax!)
    })
    Object.keys(byBranch).forEach((b) => { if (byBranch[b].count > 0) byBranch[b].avg = Math.round(byBranch[b].avg / byBranch[b].count) })

    const byCity: Record<string, { count: number; avg: number }> = {}
    jobs.forEach((j) => {
      const c = j.city || 'Remote/Other'
      const mid = (j.salaryMin! + j.salaryMax!) / 2
      if (!byCity[c]) byCity[c] = { count: 0, avg: 0 }
      byCity[c].count++
      byCity[c].avg += mid
    })
    Object.keys(byCity).forEach((c) => { if (byCity[c].count > 0) byCity[c].avg = Math.round(byCity[c].avg / byCity[c].count) })

    const byExperience: Record<string, { count: number; avg: number }> = {}
    jobs.forEach((j) => {
      const lvl = j.experienceMax == null ? 'Unknown' : j.experienceMax === 0 ? 'Fresher' : j.experienceMax <= 2 ? '0-2 yrs' : j.experienceMax <= 5 ? '3-5 yrs' : '5+ yrs'
      const mid = (j.salaryMin! + j.salaryMax!) / 2
      if (!byExperience[lvl]) byExperience[lvl] = { count: 0, avg: 0 }
      byExperience[lvl].count++
      byExperience[lvl].avg += mid
    })
    Object.keys(byExperience).forEach((l) => { if (byExperience[l].count > 0) byExperience[l].avg = Math.round(byExperience[l].avg / byExperience[l].count) })

    const byType: Record<string, { count: number; avg: number }> = {}
    jobs.forEach((j) => {
      const t = j.employmentType || 'Unknown'
      const mid = (j.salaryMin! + j.salaryMax!) / 2
      if (!byType[t]) byType[t] = { count: 0, avg: 0 }
      byType[t].count++
      byType[t].avg += mid
    })
    Object.keys(byType).forEach((t) => { if (byType[t].count > 0) byType[t].avg = Math.round(byType[t].avg / byType[t].count) })

    const buckets = [
      { label: '0-3 LPA', min: 0, max: 300000, count: 0 },
      { label: '3-6 LPA', min: 300000, max: 600000, count: 0 },
      { label: '6-10 LPA', min: 600000, max: 1000000, count: 0 },
      { label: '10-15 LPA', min: 1000000, max: 1500000, count: 0 },
      { label: '15-25 LPA', min: 1500000, max: 2500000, count: 0 },
      { label: '25-40 LPA', min: 2500000, max: 4000000, count: 0 },
      { label: '40+ LPA', min: 4000000, max: Infinity, count: 0 },
    ]
    salaries.forEach((s) => {
      const b = buckets.find((b) => s >= b.min && s < b.max)
      if (b) b.count++
    })

    return NextResponse.json({
      total: jobs.length,
      summary: { avg: avgSalary, median: medianSalary, min: minSalary, max: maxSalary, p25, p75 },
      byBranch: Object.entries(byBranch).map(([branch, d]) => ({ branch, ...d })).sort((a, b) => b.avg - a.avg).slice(0, 12),
      byCity: Object.entries(byCity).map(([city, d]) => ({ city, ...d })).sort((a, b) => b.avg - a.avg).slice(0, 10),
      byExperience: Object.entries(byExperience).map(([level, d]) => ({ level, ...d })),
      byType: Object.entries(byType).map(([type, d]) => ({ type, ...d })),
      distribution: buckets,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
