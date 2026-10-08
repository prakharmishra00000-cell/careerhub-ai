import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(['candidate', 'recruiter', 'company_admin', 'admin'])
    if (!user) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 })
    }
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const read = typeof body.read === 'boolean' ? body.read : true

    const n = await db.notification.findUnique({ where: { id } })
    if (!n || n.userId !== user.id) {
      return NextResponse.json({ error: 'notification not found' }, { status: 404 })
    }
    const updated = await db.notification.update({ where: { id }, data: { read } })
    return NextResponse.json(updated)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'notification update failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
