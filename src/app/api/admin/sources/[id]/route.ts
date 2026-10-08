import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

const UPDATABLE = ['enabled', 'syncFrequency', 'parserVersion'] as const

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(['admin'])
    if (!user) {
      return NextResponse.json({ error: 'admin authentication required' }, { status: 401 })
    }
    const { id } = await params
    const source = await db.jobSource.findUnique({ where: { id }, select: { id: true } })
    if (!source) {
      return NextResponse.json({ error: 'source not found' }, { status: 404 })
    }
    const body = await req.json().catch(() => ({}))
    const data: Record<string, unknown> = {}
    for (const f of UPDATABLE) {
      if (f in body) {
        const v = (body as any)[f]
        if (f === 'enabled' && typeof v === 'boolean') {
          data[f] = v
        } else if (typeof v === 'string') {
          data[f] = v
        }
      }
    }
    // IMPORTANT: never accept/echo credentials via this endpoint
    const updated = await db.jobSource.update({ where: { id }, data: data as any })
    return NextResponse.json(updated)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'source update failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
