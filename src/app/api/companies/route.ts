import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { CompanyListItem } from '@/lib/types'

function parseRepeatable(sp: URLSearchParams, key: string): string[] {
  const vals = sp.getAll(key)
  if (vals.length === 0) return []
  return vals.flatMap((v) => v.split(',')).map((s) => s.trim()).filter(Boolean)
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const q = sp.get('q') ?? undefined
    const industry = sp.get('industry') ?? undefined
    const companyType = parseRepeatable(sp, 'companyType')
    const companySize = parseRepeatable(sp, 'companySize')
    const verified = sp.get('verified')
    const page = Math.max(1, Number(sp.get('page') ?? 1))
    const pageSize = Math.min(50, Math.max(1, Number(sp.get('pageSize') ?? 20)))

    const where: any = {}
    if (q) where.name = { contains: q }
    if (industry) where.industry = { contains: industry }
    if (companyType.length) where.companyType = { in: companyType }
    if (companySize.length) where.companySize = { in: companySize }
    if (verified === '1' || verified === 'true') where.verified = true

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

    const items: CompanyListItem[] = companies.map((c: any) => ({
      id: c.id,
      name: c.name,
      logoUrl: c.logoUrl,
      industry: c.industry,
      companySize: c.companySize,
      companyType: c.companyType,
      headquarters: c.headquarters,
      description: c.description,
      verified: c.verified,
      openJobs: c._count?.jobs ?? 0,
    }))

    return NextResponse.json({ companies: items, total, page, pageSize })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'companies fetch failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
