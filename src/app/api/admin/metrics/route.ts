import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import type { AdminMetrics } from '@/lib/types'

export async function GET() {
  try {
    const user = await requireUser(['admin'])
    if (!user) {
      return NextResponse.json({ error: 'admin authentication required' }, { status: 401 })
    }

    const [
      totalUsers,
      activeUsers,
      jobsIndexed,
      jobsToday,
      jobsUpdated,
      jobsExpired,
      sourcesActive,
      sourceFailures,
      applications,
      savedJobs,
      reportedJobs,
      byRoleRows,
      bySourceRows,
      byCityRows,
      byBranchRows,
      byEmploymentTypeRows,
      jobsRecent,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { lastLoginAt: { gte: new Date(Date.now() - 30 * 86400_000) } } }),
      db.job.count(),
      db.job.count({ where: { postedAt: { gte: new Date(Date.now() - 86400_000) } } }),
      db.job.count({ where: { updatedAt: { gte: new Date(Date.now() - 86400_000) } } }),
      db.job.count({ where: { status: 'expired' } }),
      db.jobSource.count({ where: { enabled: true } }),
      db.jobSource.count({ where: { errorRate: { gte: 0.05 } } }),
      db.application.count(),
      db.savedJob.count(),
      db.jobReport.count({ where: { status: 'open' } }),
      db.user.groupBy({ by: ['role'], _count: { _all: true } }),
      db.job.groupBy({ by: ['sourceId'], _count: { _all: true } }),
      db.job.groupBy({ by: ['city'], _count: { _all: true } }),
      db.job.groupBy({ by: ['branch'], _count: { _all: true } }),
      db.job.groupBy({ by: ['employmentType'], _count: { _all: true } }),
      db.job.findMany({
        where: { postedAt: { gte: new Date(Date.now() - 14 * 86400_000) } },
        select: { postedAt: true },
        take: 5000,
      }),
    ])

    // Duplicate jobs: jobs with same title+companyName (rough heuristic)
    // SQLite's groupBy having clause is limited; compute in JS instead.
    const dupAgg = await db.job.groupBy({
      by: ['title', 'companyName'],
      _count: { _all: true },
    })
    const duplicateJobs = dupAgg.reduce((acc: number, r: any) => acc + (r._count._all > 1 ? r._count._all - 1 : 0), 0)

    // Source name resolution
    const sourceIds = bySourceRows.map((r: any) => r.sourceId).filter(Boolean) as string[]
    const sourceRows = sourceIds.length
      ? await db.jobSource.findMany({ where: { id: { in: sourceIds } }, select: { id: true, name: true } })
      : []
    const sourceIdToName = new Map(sourceRows.map((s) => [s.id, s.name]))

    const byRole: Record<string, number> = {}
    for (const r of byRoleRows as any[]) byRole[r.role ?? 'unknown'] = r._count._all

    const bySource: Record<string, number> = {}
    for (const r of bySourceRows as any[]) {
      const name = sourceIdToName.get(r.sourceId as string) ?? 'unknown'
      bySource[name] = (bySource[name] ?? 0) + r._count._all
    }

    const byCity: Record<string, number> = {}
    for (const r of byCityRows as any[]) byCity[r.city ?? 'unspecified'] = r._count._all

    const byBranch: Record<string, number> = {}
    for (const r of byBranchRows as any[]) {
      const branches = (r.branch ?? '').split(',').map((s: string) => s.trim()).filter(Boolean)
      if (branches.length === 0) {
        byBranch.unspecified = (byBranch.unspecified ?? 0) + r._count._all
      } else {
        for (const b of branches) byBranch[b] = (byBranch[b] ?? 0) + r._count._all
      }
    }

    const byEmploymentType: Record<string, number> = {}
    for (const r of byEmploymentTypeRows as any[]) byEmploymentType[r.employmentType ?? 'unspecified'] = r._count._all

    // Jobs timeline (last 14 days)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const timeline: { date: string; count: number }[] = []
    const counts = new Map<string, number>()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400_000)
      const key = d.toISOString().slice(0, 10)
      counts.set(key, 0)
    }
    for (const r of jobsRecent as any[]) {
      const d = new Date(r.postedAt)
      d.setHours(0, 0, 0, 0)
      const key = d.toISOString().slice(0, 10)
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    for (const [date, count] of counts.entries()) timeline.push({ date, count })

    const metrics: AdminMetrics = {
      totalUsers,
      activeUsers,
      jobsIndexed,
      jobsToday,
      jobsUpdated,
      jobsExpired,
      sourcesActive,
      sourceFailures,
      applications,
      savedJobs,
      reportedJobs,
      duplicateJobs,
      searches: 0,
      byRole,
      bySource,
      byCity,
      byBranch,
      byEmploymentType,
      jobsTimeline: timeline,
      topSearches: [
        { term: 'software engineer', count: 0 },
        { term: 'remote jobs', count: 0 },
        { term: 'internship', count: 0 },
        { term: 'fresher jobs', count: 0 },
        { term: 'data analyst', count: 0 },
      ],
    }

    return NextResponse.json(metrics)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'admin metrics failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
