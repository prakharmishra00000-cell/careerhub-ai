import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(['candidate'])
    if (!user) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 })
    }
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const source = typeof body.source === 'string' ? body.source : null

    const job = await db.job.findUnique({ where: { id }, select: { id: true } })
    if (!job) {
      return NextResponse.json({ error: 'job not found' }, { status: 404 })
    }

    await db.application.upsert({
      where: { userId_jobId: { userId: user.id, jobId: id } },
      create: { userId: user.id, jobId: id, status: 'applied', source },
      update: { status: 'applied', source: source ?? undefined, updatedAt: new Date() },
    })

    // Fire-and-forget application count increment
    db.job.update({ where: { id }, data: { applicationCount: { increment: 1 } } }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'apply failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
