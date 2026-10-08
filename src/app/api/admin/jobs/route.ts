import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { jobToCard } from '@/lib/jobs'

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(['admin'])
    if (!user) {
      return NextResponse.json({ error: 'admin authentication required' }, { status: 401 })
    }
    const sp = req.nextUrl.searchParams
    const q = sp.get('q') ?? undefined
    const status = sp.get('status') ?? undefined
    const page = Math.max(1, Number(sp.get('page') ?? 1))
    const pageSize = Math.min(100, Math.max(1, Number(sp.get('pageSize') ?? 20)))

    const where: any = {}
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { companyName: { contains: q } },
        { skills: { contains: q } },
        { description: { contains: q } },
      ]
    }
    if (status) where.status = status

    const [total, rows] = await Promise.all([
      db.job.count({ where }),
      db.job.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { postedAt: 'desc' },
        include: { source: true, company: true },
      }),
    ])

    const jobs = rows.map((j: any) => ({
      ...jobToCard(j),
      description: j.description,
      status: j.status,
      postedById: j.postedById,
      updatedAt: j.updatedAt?.toISOString ? j.updatedAt.toISOString() : j.updatedAt,
      createdAt: j.createdAt?.toISOString ? j.createdAt.toISOString() : j.createdAt,
    }))

    return NextResponse.json({ jobs, total, page, pageSize })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'admin jobs fetch failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
