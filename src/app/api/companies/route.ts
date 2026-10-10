import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { CompanyListItem } from '@/lib/types'

const fallbackCompanies: CompanyListItem[] = [
  { id: 'c-1', name: 'Ruby Labs', logoUrl: null, industry: 'Technology & AI', companySize: '51-200', companyType: 'product', headquarters: 'Europe / Remote', description: 'Product studio creating global mobile and AI automation applications.', verified: true, openJobs: 5 },
  { id: 'c-2', name: 'CodeForAI', logoUrl: null, industry: 'Software & Education', companySize: '11-50', companyType: 'startup', headquarters: 'Global / Remote', description: 'AI engineering and code trainer platform for developer evaluation.', verified: true, openJobs: 8 },
  { id: 'c-3', name: 'STARTPLATZ AI Academy', logoUrl: null, industry: 'Design & Tech', companySize: '11-50', companyType: 'startup', headquarters: 'Cologne / Hybrid', description: 'Accelerator and product studio developing next-generation applications.', verified: true, openJobs: 6 },
  { id: 'c-4', name: 'Skalar', logoUrl: null, industry: 'Design & UI/UX', companySize: '51-200', companyType: 'product', headquarters: 'Europe / Remote', description: 'Leading digital product design agency creating modern UX platforms.', verified: true, openJobs: 4 },
  { id: 'c-5', name: 'Unio Digital', logoUrl: null, industry: 'Cloud & Infrastructure', companySize: '201-500', companyType: 'service', headquarters: 'Worldwide', description: 'Global enterprise cloud consulting and technical services provider.', verified: true, openJobs: 7 },
  { id: 'c-6', name: 'Lemon.io', logoUrl: null, industry: 'Software Engineering', companySize: '501-1000', companyType: 'product', headquarters: 'Remote', description: 'Top-tier marketplace connecting vetted developers with US & EU startups.', verified: true, openJobs: 12 },
]

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const q = (sp.get('q') ?? '').toLowerCase()
    const page = Math.max(1, Number(sp.get('page') ?? 1))
    const pageSize = Math.min(50, Math.max(1, Number(sp.get('pageSize') ?? 20)))

    const isRemoteDB = process.env.DATABASE_URL?.startsWith('postgresql://') || process.env.DATABASE_URL?.startsWith('postgres://')
    let items: CompanyListItem[] = []
    let total = 0

    if (isRemoteDB) {
      try {
        const where: any = {}
        if (q) where.name = { contains: q }
        const [count, companies] = await Promise.all([
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
        total = count
        items = companies.map((c: any) => ({
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
      } catch {
        items = []
        total = 0
      }
    }

    if (items.length === 0) {
      let filtered = fallbackCompanies
      if (q) filtered = filtered.filter((c) => c.name.toLowerCase().includes(q) || (c.industry || '').toLowerCase().includes(q))
      total = filtered.length
      items = filtered.slice((page - 1) * pageSize, page * pageSize)
    }

    return NextResponse.json({ companies: items, total, page, pageSize })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'companies fetch failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
