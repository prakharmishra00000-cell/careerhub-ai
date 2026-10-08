import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

const JOB_FIELDS = [
  'title', 'slug', 'description', 'responsibilities', 'requirements',
  'location', 'country', 'state', 'city', 'remoteType',
  'employmentType', 'experienceMin', 'experienceMax', 'fresherFriendly',
  'salaryMin', 'salaryMax', 'salaryCurrency', 'salaryPeriod', 'salaryDisclosed',
  'education', 'degree', 'branch', 'specialization', 'cgpaRequirement',
  'cgpaExplicitNone', 'percentageRequirement', 'backlogPolicy', 'backlogMaxCount',
  'skills', 'isInternship', 'internshipDurationMonths', 'internshipPaid',
  'stipendMin', 'stipendMax', 'ppoAvailable', 'benefits',
  'expiresAt', 'applicationDeadline', 'lastVerifiedAt', 'status',
  'sourceId', 'sourceJobId', 'sourceUrl', 'companyId', 'companyName', 'companyLogoUrl',
] as const

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100)
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(['recruiter', 'company_admin', 'admin'])
    if (!user) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 })
    }
    const body = await req.json().catch(() => ({}))
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : ''
    if (!title || !companyName) {
      return NextResponse.json({ error: 'title and companyName are required' }, { status: 400 })
    }

    const data: Record<string, unknown> = {
      postedById: user.id,
      isDemo: true,
      slug: typeof body.slug === 'string' && body.slug ? body.slug : slugify(title) + '-' + Math.random().toString(36).slice(2, 8),
    }
    for (const f of JOB_FIELDS) {
      if (f in body && f !== 'slug') {
        const v = (body as any)[f]
        if (v === null || v === undefined) continue
        if (f === 'expiresAt' || f === 'applicationDeadline' || f === 'lastVerifiedAt') {
          const d = new Date(v as string)
          if (!isNaN(d.getTime())) (data as any)[f] = d
          continue
        }
        if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') {
          (data as any)[f] = v
        }
      }
    }

    const job = await db.job.create({ data: data as any })
    return NextResponse.json(job)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'job create failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await requireUser(['recruiter', 'company_admin', 'admin'])
    if (!user) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 })
    }
    const where = user.role === 'admin' ? {} : { postedById: user.id }
    const jobs = await db.job.findMany({
      where,
      orderBy: { postedAt: 'desc' },
      include: {
        source: true,
        company: true,
        _count: { select: { applications: true } },
      },
    })
    const items = jobs.map((j: any) => ({
      ...j,
      applicationCount: j._count?.applications ?? j.applicationCount ?? 0,
    }))
    return NextResponse.json({ jobs: items })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'jobs fetch failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
