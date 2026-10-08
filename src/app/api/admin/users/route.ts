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
    const role = sp.get('role') ?? undefined
    const page = Math.max(1, Number(sp.get('page') ?? 1))
    const pageSize = Math.min(100, Math.max(1, Number(sp.get('pageSize') ?? 20)))

    const where: any = {}
    if (q) where.OR = [{ name: { contains: q } }, { email: { contains: q } }]
    if (role) where.role = role

    const [total, users] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, name: true, role: true, avatarUrl: true,
          emailVerified: true, createdAt: true, lastLoginAt: true,
          _count: { select: { postedJobs: true, applications: true, savedJobs: true } },
        },
      }),
    ])

    const items = users.map((u: any) => ({
      ...u,
      postedJobs: u._count?.postedJobs ?? 0,
      applicationCount: u._count?.applications ?? 0,
      savedCount: u._count?.savedJobs ?? 0,
      _count: undefined,
    }))

    return NextResponse.json({ users: items, total, page, pageSize })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'users fetch failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
