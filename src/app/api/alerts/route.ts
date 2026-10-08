import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import type { AlertItem } from '@/lib/types'

function serialize(a: any): AlertItem {
  return {
    id: a.id,
    name: a.name,
    query: a.query,
    frequency: a.frequency,
    channels: a.channels,
    paused: a.paused,
    lastTriggeredAt: a.lastTriggeredAt?.toISOString ? a.lastTriggeredAt.toISOString() : a.lastTriggeredAt ?? null,
    createdAt: a.createdAt?.toISOString ? a.createdAt.toISOString() : a.createdAt,
  }
}

export async function GET() {
  try {
    const user = await requireUser(['candidate'])
    if (!user) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 })
    }
    const alerts = await db.jobAlert.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(alerts.map(serialize))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'alerts fetch failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(['candidate'])
    if (!user) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 })
    }
    const body = await req.json().catch(() => ({}))
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const query = typeof body.query === 'string' ? body.query : ''
    if (!name || !query) {
      return NextResponse.json({ error: 'name and query are required' }, { status: 400 })
    }
    const frequency = ['instant', 'daily', 'weekly'].includes(body.frequency) ? body.frequency : 'daily'
    const channels = typeof body.channels === 'string' && body.channels ? body.channels : 'in_app'
    const paused = typeof body.paused === 'boolean' ? body.paused : false

    const alert = await db.jobAlert.create({
      data: { userId: user.id, name, query, frequency, channels, paused },
    })
    return NextResponse.json(serialize(alert))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'alert create failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
