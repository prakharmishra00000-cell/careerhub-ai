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
    postedAt: j.postedAt.toISOString ? j.postedAt.toISOString() : new Date(j.postedAt).toISOString(),
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

    const page = Math.max(1, filter.page ?? 1)
    const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 20))

    let fetchedLiveJobs: NormalizedLiveJob[] = []
    try {
      fetchedLiveJobs = await getLiveJobs(filter)
    } catch {
      fetchedLiveJobs = []
    }

    const isRemoteDB = process.env.DATABASE_URL?.startsWith('postgresql://') || process.env.DATABASE_URL?.startsWith('postgres://')
    let jobs: JobCardData[] = []
    let total = 0

    if (isRemoteDB) {
      try {
        const where = buildJobWhere(filter)
        const orderBy = buildJobOrderBy(filter)
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
        const rows = findResult || []
        jobs = rows.map((j: any) => jobToCard(j))
      } catch {
        jobs = []
        total = 0
      }
    }

    // Use live external jobs if DB returns 0 or if running without a DB
    if (jobs.length === 0) {
      let filtered = [...fetchedLiveJobs]

      // KEYWORD filter — match on title and company name only, NOT description
      if (filter.q && filter.q.trim()) {
        const q = filter.q.toLowerCase().trim()
        filtered = filtered.filter((j) =>
          (j.title && j.title.toLowerCase().includes(q)) ||
          (j.companyName && j.companyName.toLowerCase().includes(q)) ||
          (j.skills && j.skills.some((s) => s.toLowerCase().includes(q))) ||
          (j.branch && j.branch.toLowerCase().includes(q))
        )
      }

      // Branch filter — only keep jobs that MATCH, don't include jobs with no branch
      if (filter.branch && filter.branch.length > 0) {
        filtered = filtered.filter((j) => {
          if (!j.branch) return false
          return filter.branch!.some((b) => (j.branch || '').toLowerCase().includes(b.toLowerCase()))
        })
      }

      // Location / City
      if (filter.location) {
        const loc = filter.location.toLowerCase()
        filtered = filtered.filter((j) =>
          (j.city && j.city.toLowerCase().includes(loc)) ||
          (j.state && j.state.toLowerCase().includes(loc)) ||
          (j.country && j.country.toLowerCase().includes(loc))
        )
      }
      if (filter.city) {
        const city = filter.city.toLowerCase()
        filtered = filtered.filter((j) => j.city && j.city.toLowerCase().includes(city))
      }

      // Remote Type
      if (filter.remoteType && filter.remoteType.length > 0) {
        filtered = filtered.filter((j) => filter.remoteType!.includes(j.remoteType))
      }

      // Employment Type
      if (filter.employmentType && filter.employmentType.length > 0) {
        filtered = filtered.filter((j) => filter.employmentType!.includes(j.employmentType))
      }

      // Fresher Friendly
      if (filter.fresherFriendly) {
        filtered = filtered.filter((j) => j.fresherFriendly === true)
      }

      // Internship
      if (typeof filter.isInternship === 'boolean') {
        filtered = filtered.filter((j) => j.isInternship === filter.isInternship)
      }

      // Source
      if (filter.source && filter.source.length > 0) {
        filtered = filtered.filter((j) => filter.source!.some((s) => (j.sourceName || '').toLowerCase().includes(s.toLowerCase())))
      }

      // Sort
      if (filter.sort === 'newest') {
        filtered.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
      } else if (filter.sort === 'salary_high') {
        filtered.sort((a, b) => (b.salaryMax || b.salaryMin || 0) - (a.salaryMax || a.salaryMin || 0))
      } else if (filter.sort === 'salary_low') {
        filtered.sort((a, b) => (a.salaryMin || a.salaryMax || 0) - (b.salaryMin || b.salaryMax || 0))
      }

      total = filtered.length
      const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
      jobs = paged.map(liveJobToCard)
    }

    // Dynamic real-time facets computation
    const branchCounts: Record<string, number> = {}
    const sourceCounts: Record<string, number> = {}
    const remoteCounts: Record<string, number> = {}
    const empCounts: Record<string, number> = {}

    for (const j of fetchedLiveJobs) {
      if (j.branch) branchCounts[j.branch] = (branchCounts[j.branch] ?? 0) + 1
      if (j.sourceName) sourceCounts[j.sourceName] = (sourceCounts[j.sourceName] ?? 0) + 1
      if (j.remoteType) remoteCounts[j.remoteType] = (remoteCounts[j.remoteType] ?? 0) + 1
      if (j.employmentType) empCounts[j.employmentType] = (empCounts[j.employmentType] ?? 0) + 1
    }

    const facets = {
      sources: sourceCounts,
      employmentTypes: empCounts,
      remoteTypes: remoteCounts,
      degrees: {},
      branches: branchCounts,
      cities: {},
      companyTypes: {},
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
