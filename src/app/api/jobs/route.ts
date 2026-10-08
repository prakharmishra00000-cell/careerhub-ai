import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { buildJobWhere, buildJobOrderBy, jobToCard } from '@/lib/jobs'
import type { JobFilter, JobCardData } from '@/lib/types'

function parseRepeatable(sp: URLSearchParams, key: string): string[] {
  const vals = sp.getAll(key)
  if (vals.length === 0) return []
  return vals.flatMap((v) => v.split(',')).map((s) => s.trim()).filter(Boolean)
}

function parseBool(v: string | null): boolean | undefined {
  if (v === null || v === undefined) return undefined
  if (v === '1' || v === 'true' || v === 'yes') return true
  if (v === '0' || v === 'false' || v === 'no') return false
  return undefined
}

function parseNum(v: string | null): number | undefined {
  if (v === null || v === undefined || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const filter: JobFilter = {
      q: sp.get('q') ?? undefined,
      location: sp.get('location') ?? undefined,
      city: sp.get('city') ?? undefined,
      remoteType: parseRepeatable(sp, 'remoteType'),
      employmentType: parseRepeatable(sp, 'employmentType'),
      degree: parseRepeatable(sp, 'degree'),
      branch: parseRepeatable(sp, 'branch'),
      experience: sp.get('experience') ?? undefined,
      fresherFriendly: parseBool(sp.get('fresherFriendly')),
      isInternship: parseBool(sp.get('isInternship')),
      minSalary: parseNum(sp.get('minSalary')),
      maxSalary: parseNum(sp.get('maxSalary')),
      minStipend: parseNum(sp.get('minStipend')),
      stipendPaid: (sp.get('stipendPaid') as JobFilter['stipendPaid']) ?? undefined,
      internshipDuration: parseNum(sp.get('internshipDuration')),
      ppoAvailable: parseBool(sp.get('ppoAvailable')),
      source: parseRepeatable(sp, 'source'),
      companyType: parseRepeatable(sp, 'companyType'),
      companySize: parseRepeatable(sp, 'companySize'),
      companyVerified: parseBool(sp.get('companyVerified')),
      backlogPolicy: parseRepeatable(sp, 'backlogPolicy'),
      minCgpa: parseNum(sp.get('minCgpa')),
      sort: (sp.get('sort') as JobFilter['sort']) ?? undefined,
      page: parseNum(sp.get('page')) ?? 1,
      pageSize: parseNum(sp.get('pageSize')) ?? 20,
    }

    const page = Math.max(1, filter.page ?? 1)
    const pageSize = Math.min(50, Math.max(1, filter.pageSize ?? 20))

    const where = buildJobWhere(filter)
    const orderBy = buildJobOrderBy(filter)

    const [total, rows] = await Promise.all([
      db.job.count({ where }),
      db.job.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { source: true, company: true },
      }),
    ])

    const jobs: JobCardData[] = rows.map((j: any) => jobToCard(j))

    // --- Facets ---
    // Compute counts based on the current where clause (excluding the specific facet for less biased counts would be ideal,
    // but for simplicity we compute on the full current filter set's matching jobs, capped for efficiency).
    const facetRows = await db.job.findMany({
      where,
      select: {
        id: true,
        sourceId: true,
        employmentType: true,
        remoteType: true,
        degree: true,
        branch: true,
        city: true,
        company: { select: { companyType: true } },
        source: { select: { name: true } },
      },
      take: 2000,
    })

    const sources: Record<string, number> = {}
    const employmentTypes: Record<string, number> = {}
    const remoteTypes: Record<string, number> = {}
    const degrees: Record<string, number> = {}
    const branches: Record<string, number> = {}
    const cities: Record<string, number> = {}
    const companyTypes: Record<string, number> = {}

    for (const r of facetRows) {
      if (r.source?.name) sources[r.source.name] = (sources[r.source.name] ?? 0) + 1
      if (r.employmentType) employmentTypes[r.employmentType] = (employmentTypes[r.employmentType] ?? 0) + 1
      if (r.remoteType) remoteTypes[r.remoteType] = (remoteTypes[r.remoteType] ?? 0) + 1
      if (r.degree) degrees[r.degree] = (degrees[r.degree] ?? 0) + 1
      if (r.branch) {
        for (const b of r.branch.split(',').map((s) => s.trim()).filter(Boolean)) {
          branches[b] = (branches[b] ?? 0) + 1
        }
      }
      if (r.city) cities[r.city] = (cities[r.city] ?? 0) + 1
      if (r.company?.companyType) companyTypes[r.company.companyType] = (companyTypes[r.company.companyType] ?? 0) + 1
    }

    const facets = {
      sources,
      employmentTypes,
      remoteTypes,
      degrees,
      branches,
      cities,
      companyTypes,
    }

    return NextResponse.json({
      jobs,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      facets,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'jobs fetch failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
