import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

const VALID_STATUSES = new Set(['open', 'reviewed', 'resolved'])

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(['admin'])
    if (!user) {
      return NextResponse.json({ error: 'admin authentication required' }, { status: 401 })
    }
    const { id } = await params
    const report = await db.jobReport.findUnique({ where: { id } })
    if (!report) {
      return NextResponse.json({ error: 'report not found' }, { status: 404 })
    }
    const body = await req.json().catch(() => ({}))
    const status = typeof body.status === 'string' ? body.status : null
    if (!status || !VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 })
    }
    const updated = await db.jobReport.update({ where: { id }, data: { status } })
    return NextResponse.json(updated)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'report update failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
