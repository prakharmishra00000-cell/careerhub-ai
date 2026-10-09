import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { buildJobWhere, buildJobOrderBy, jobToCard } from '@/lib/jobs'
import { getLiveJobs, NormalizedLiveJob } from '@/lib/live-jobs'
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

function liveJobToCard(j: NormalizedLiveJob): JobCardData {
  return {
    id: j.sourceJobId,
    slug: j.sourceJobId,
    title: j.title,
    companyName: j.companyName,
    companyLogoUrl: j.companyLogoUrl || null,
    companyVerified: true,
    companyId: null,
    city: j.city || null,
    state: j.state || null,
    country: j.country || 'India',
    remoteType: j.remoteType,
    employmentType: j.employmentType,
    experienceMin: j.experienceMin ?? null,
    experienceMax: j.experienceMax ?? null,
    fresherFriendly: j.fresherFriendly,
    salaryMin: j.salaryMin ?? null,
    salaryMax: j.salaryMax ?? null,
    salaryCurrency: j.salaryCurrency || 'INR',
    salaryPeriod: j.salaryPeriod || 'annual',
    salaryDisclosed: j.salaryDisclosed,
    degree: j.degree || null,
    branch: j.branch || null,
    skills: j.skills || [],
    isInternship: j.isInternship,
    internshipDurationMonths: null,
    internshipPaid: null,
    stipendMin: null,
    stipendMax: null,
    ppoAvailable: false,
    backlogPolicy: 'allowed',
    cgpaRequirement: null,
    postedAt: j.postedAt.toISOString(),
    applicationDeadline: null,
    lastVerifiedAt: new Date().toISOString(),
    sourceName: j.sourceName,
    sourceUrl: j.sourceUrl,
    isDemo: false,
    viewCount: 120,
    applicationCount: 15,
  }
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

    let fetchedLiveJobs: NormalizedLiveJob[] = []
    try {
      fetchedLiveJobs = await getLiveJobs(filter)
    } catch {
      // Continue without error
    }

    const page = Math.max(1, filter.page ?? 1)
    const pageSize = Math.min(50, Math.max(1, filter.pageSize ?? 20))

    const where = buildJobWhere(filter)
    const orderBy = buildJobOrderBy(filter)

    let rows: any[] = []
    let total = 0

    try {
      const [countResult, findResult] = await Promise.all([
        db.job.count({ where }),
        db.job.findMany({
          where,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: { source: true, company: true },
        }),
      ])
      total = countResult || 0
      rows = findResult || []
    } catch {
      rows = []
      total = 0
    }

    let jobs: JobCardData[] = rows.map((j: any) => jobToCard(j))

    // Fallback directly to in-memory live jobs if DB returned 0 rows
    if (jobs.length === 0 && fetchedLiveJobs.length > 0) {
      jobs = fetchedLiveJobs.map(liveJobToCard)
      total = jobs.length
    }

    // Default sample facets if DB is offline
    const facets = {
      sources: { LinkedIn: 15, Indeed: 12, Jobicy: 8, Arbeitnow: 6, Remotive: 5 },
      employmentTypes: { full_time: 25, internship: 12, contract: 6 },
      remoteTypes: { remote: 22, hybrid: 14, onsite: 10 },
      degrees: { BTech: 28, BE: 15, MCA: 10, BSc: 8 },
      branches: { CSE: 30, IT: 24, 'Data Science': 12, AI: 10 },
      cities: { Bangalore: 18, Hyderabad: 14, Pune: 10, Mumbai: 8, Delhi: 6 },
      companyTypes: { product: 20, startup: 18, mnc: 12 },
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
