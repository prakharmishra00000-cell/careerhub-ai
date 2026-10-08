import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await requireUser(['admin'])
    if (!user) {
      return NextResponse.json({ error: 'admin authentication required' }, { status: 401 })
    }
    const reports = await db.jobReport.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        job: { select: { id: true, title: true, companyName: true, slug: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })
    // Sort so 'open' appears before 'reviewed' before 'resolved'
    const orderRank: Record<string, number> = { open: 0, reviewed: 1, resolved: 2 }
    const sorted = [...reports].sort((a: any, b: any) => {
      const ra = orderRank[a.status] ?? 3
      const rb = orderRank[b.status] ?? 3
      if (ra !== rb) return ra - rb
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
    const items = sorted.map((r: any) => ({
      id: r.id,
      jobId: r.jobId,
      job: r.job,
      user: r.user,
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.createdAt?.toISOString ? r.createdAt.toISOString() : r.createdAt,
    }))
    return NextResponse.json({ reports: items })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'reports fetch failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
