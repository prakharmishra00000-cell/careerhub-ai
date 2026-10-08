import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

const VALID_REASONS = new Set([
  'expired', 'fake', 'incorrect_info', 'wrong_salary', 'wrong_eligibility',
  'duplicate', 'broken_link', 'scam', 'other',
])

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    const details = typeof body.details === 'string' ? body.details : null

    if (!reason || !VALID_REASONS.has(reason)) {
      return NextResponse.json({ error: 'invalid reason' }, { status: 400 })
    }

    const job = await db.job.findUnique({ where: { id }, select: { id: true } })
    if (!job) {
      return NextResponse.json({ error: 'job not found' }, { status: 404 })
    }

    await db.jobReport.create({
      data: {
        jobId: id,
        userId: session?.id ?? null,
        reason,
        details,
        status: 'open',
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'report failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
