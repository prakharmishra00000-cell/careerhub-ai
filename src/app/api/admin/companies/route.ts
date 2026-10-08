import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(['admin'])
    if (!user) {
      return NextResponse.json({ error: 'admin authentication required' }, { status: 401 })
    }
    const sp = req.nextUrl.searchParams
    const q = sp.get('q') ?? undefined
    const page = Math.max(1, Number(sp.get('page') ?? 1))
    const pageSize = Math.min(100, Math.max(1, Number(sp.get('pageSize') ?? 20)))

    const where: any = {}
    if (q) where.name = { contains: q }

    const [total, companies] = await Promise.all([
      db.company.count({ where }),
      db.company.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { jobs: { where: { status: 'active' } } } },
        },
      }),
    ])

    const items = companies.map((c: any) => ({
      id: c.id,
      name: c.name,
      logoUrl: c.logoUrl,
      industry: c.industry,
      companySize: c.companySize,
      companyType: c.companyType,
      headquarters: c.headquarters,
      description: c.description,
      verified: c.verified,
      website: c.website,
      createdAt: c.createdAt?.toISOString ? c.createdAt.toISOString() : c.createdAt,
      openJobs: c._count?.jobs ?? 0,
    }))

    return NextResponse.json({ companies: items, total, page, pageSize })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'admin companies fetch failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
