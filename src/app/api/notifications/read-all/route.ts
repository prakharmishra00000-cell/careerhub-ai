import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 })
    }
    await db.notification.updateMany({
      where: { userId: session.id, read: false },
      data: { read: true },
    })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'mark all failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
