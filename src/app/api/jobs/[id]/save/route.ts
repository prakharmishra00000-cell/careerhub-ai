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
    const folder = typeof body.folder === 'string' && body.folder.trim() ? body.folder.trim() : 'default'
    const notes = typeof body.notes === 'string' ? body.notes : null

    // Ensure job exists
    const job = await db.job.findUnique({ where: { id }, select: { id: true } })
    if (!job) {
      return NextResponse.json({ error: 'job not found' }, { status: 404 })
    }

    await db.savedJob.upsert({
      where: { userId_jobId: { userId: user.id, jobId: id } },
      create: { userId: user.id, jobId: id, folder, notes },
      update: { folder, notes },
    })

    return NextResponse.json({ ok: true, saved: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'save failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(['candidate'])
    if (!user) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 })
    }
    const { id } = await params
    await db.savedJob.deleteMany({ where: { userId: user.id, jobId: id } })
    return NextResponse.json({ ok: true, saved: false })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unsave failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
