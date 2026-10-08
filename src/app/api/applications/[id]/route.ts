import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

const ALLOWED_STATUSES = new Set([
  'saved', 'applied', 'assessment', 'interview', 'offer', 'rejected', 'withdrawn',
])

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(['candidate'])
    if (!user) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 })
    }
    const { id } = await params
    const body = await req.json().catch(() => ({}))

    const app = await db.application.findUnique({ where: { id } })
    if (!app || app.userId !== user.id) {
      return NextResponse.json({ error: 'application not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (typeof body.status === 'string' && ALLOWED_STATUSES.has(body.status)) {
      data.status = body.status
    }
    if (typeof body.notes === 'string') {
      data.notes = body.notes
    }
    if (body.interviewDate) {
      const d = new Date(body.interviewDate)
      if (!isNaN(d.getTime())) data.interviewDate = d
    } else if (body.interviewDate === null) {
      data.interviewDate = null
    }
    if (body.deadline) {
      const d = new Date(body.deadline)
      if (!isNaN(d.getTime())) data.deadline = d
    } else if (body.deadline === null) {
      data.deadline = null
    }

    const updated = await db.application.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'update failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
