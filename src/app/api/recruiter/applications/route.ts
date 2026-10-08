import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await requireUser(['recruiter', 'company_admin', 'admin'])
    if (!user) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 })
    }

    // Find jobs posted by current user (or all if admin)
    const jobWhere = user.role === 'admin' ? {} : { postedById: user.id }
    const jobs = await db.job.findMany({
      where: jobWhere,
      select: { id: true },
    })
    const jobIds = jobs.map((j) => j.id)

    if (jobIds.length === 0) {
      return NextResponse.json({ applications: [] })
    }

    const apps = await db.application.findMany({
      where: { jobId: { in: jobIds } },
      orderBy: { appliedAt: 'desc' },
      include: {
        job: { include: { source: true, company: true } },
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    })

    const items = apps.map((a: any) => ({
      id: a.id,
      jobId: a.jobId,
      jobTitle: a.job?.title ?? '',
      companyName: a.job?.companyName ?? '',
      status: a.status,
      appliedAt: a.appliedAt?.toISOString ? a.appliedAt.toISOString() : a.appliedAt,
      updatedAt: a.updatedAt?.toISOString ? a.updatedAt.toISOString() : a.updatedAt,
      deadline: a.deadline?.toISOString ? a.deadline.toISOString() : a.deadline ?? null,
      interviewDate: a.interviewDate?.toISOString ? a.interviewDate.toISOString() : a.interviewDate ?? null,
      notes: a.notes,
      source: a.source,
      user: a.user,
    }))

    return NextResponse.json({ applications: items })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'recruiter applications fetch failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
