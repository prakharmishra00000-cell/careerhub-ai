import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

const UPDATABLE = [
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(['recruiter', 'company_admin', 'admin'])
    if (!user) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 })
    }
    const { id } = await params
    const job = await db.job.findUnique({ where: { id }, select: { id: true, postedById: true } })
    if (!job) {
      return NextResponse.json({ error: 'job not found' }, { status: 404 })
    }
    if (job.postedById !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    const body = await req.json().catch(() => ({}))
    const data: Record<string, unknown> = {}
    for (const f of UPDATABLE) {
      if (f in body) {
        const v = (body as any)[f]
        if (v === null || v === undefined) {
          data[f] = null
          continue
        }
        if (f === 'expiresAt' || f === 'applicationDeadline' || f === 'lastVerifiedAt') {
          if (v === null) { data[f] = null; continue }
          const d = new Date(v as string)
          if (!isNaN(d.getTime())) (data as any)[f] = d
          continue
        }
        if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') {
          (data as any)[f] = v
        }
      }
    }
    const updated = await db.job.update({ where: { id }, data: data as any })
    return NextResponse.json(updated)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'job update failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(['recruiter', 'company_admin', 'admin'])
    if (!user) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 })
    }
    const { id } = await params
    const job = await db.job.findUnique({ where: { id }, select: { id: true, postedById: true } })
    if (!job) {
      return NextResponse.json({ error: 'job not found' }, { status: 404 })
    }
    if (job.postedById !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    // Soft delete — set status to closed
    const updated = await db.job.update({ where: { id }, data: { status: 'closed' } })
    return NextResponse.json({ ok: true, status: updated.status })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'job delete failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
