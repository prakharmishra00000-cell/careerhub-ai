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

async function getOwnedAlert(id: string, userId: string) {
  const alert = await db.jobAlert.findUnique({ where: { id } })
  if (!alert || alert.userId !== userId) return null
  return alert
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(['candidate'])
    if (!user) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 })
    }
    const { id } = await params
    const alert = await getOwnedAlert(id, user.id)
    if (!alert) {
      return NextResponse.json({ error: 'alert not found' }, { status: 404 })
    }
    const body = await req.json().catch(() => ({}))
    const data: Record<string, unknown> = {}
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim()
    if (typeof body.query === 'string') data.query = body.query
    if (['instant', 'daily', 'weekly'].includes(body.frequency)) data.frequency = body.frequency
    if (typeof body.channels === 'string') data.channels = body.channels
    if (typeof body.paused === 'boolean') data.paused = body.paused

    const updated = await db.jobAlert.update({ where: { id }, data: data as any })
    return NextResponse.json(serialize(updated))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'alert update failed'
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
    const alert = await getOwnedAlert(id, user.id)
    if (!alert) {
      return NextResponse.json({ error: 'alert not found' }, { status: 404 })
    }
    await db.jobAlert.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'alert delete failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
