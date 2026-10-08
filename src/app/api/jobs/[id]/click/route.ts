import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Fire-and-forget; we still await briefly to validate
    const job = await db.job.findUnique({ where: { id }, select: { id: true } })
    if (!job) {
      return NextResponse.json({ error: 'job not found' }, { status: 404 })
    }
    await db.job.update({ where: { id }, data: { sourceClickCount: { increment: 1 } } })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'click track failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
