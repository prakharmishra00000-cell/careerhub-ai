import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Pure-DB autocomplete for the search bar — no LLM (for speed).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const q = (body?.q ?? '').toString().trim()
    const kind: string = (body?.kind ?? 'all').toString()

    if (!q) {
      return NextResponse.json({ jobs: [], companies: [], skills: [], locations: [] })
    }

    const want = (k: string) => kind === 'all' || kind === k

    const [jobRows, companyRows, skillsRows, locationRows] = await Promise.all([
      want('jobs')
        ? db.job.findMany({
            where: { status: 'active', title: { contains: q } },
            select: { title: true },
            take: 100,
          })
        : Promise.resolve([]),
      want('companies')
        ? db.company.findMany({
            where: { name: { contains: q } },
            select: { id: true, name: true },
            take: 20,
          })
        : Promise.resolve([]),
      want('skills')
        ? db.job.findMany({
            where: { status: 'active', skills: { contains: q } },
            select: { skills: true },
            take: 200,
          })
        : Promise.resolve([]),
      want('locations')
        ? db.job.findMany({
            where: { status: 'active', city: { contains: q } },
            select: { city: true },
            take: 200,
          })
        : Promise.resolve([]),
    ])

    // Distinct job titles (max 8)
    const jobTitles: string[] = []
    for (const r of jobRows as any[]) {
      if (r.title && !jobTitles.includes(r.title)) jobTitles.push(r.title)
      if (jobTitles.length >= 8) break
    }

    // Distinct companies (max 5)
    const companyList = (companyRows as any[]).slice(0, 5).map((c) => ({ id: c.id, name: c.name }))

    // Distinct skills containing q (max 8)
    const qLower = q.toLowerCase()
    const skillSet = new Set<string>()
    for (const r of skillsRows as any[]) {
      if (!r.skills) continue
      for (const s of r.skills.split(/[,\n/|;&]+/).map((s: string) => s.trim()).filter(Boolean)) {
        if (s.toLowerCase().includes(qLower)) skillSet.add(s)
        if (skillSet.size >= 30) break
      }
      if (skillSet.size >= 30) break
    }
    const skillList = Array.from(skillSet).slice(0, 8)

    // Distinct cities containing q (max 8)
    const citySet = new Set<string>()
    for (const r of locationRows as any[]) {
      if (r.city) citySet.add(r.city)
      if (citySet.size >= 30) break
    }
    const locationList = Array.from(citySet).slice(0, 8)

    return NextResponse.json({
      jobs: jobTitles,
      companies: companyList,
      skills: skillList,
      locations: locationList,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'search-suggest failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
