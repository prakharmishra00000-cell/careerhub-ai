import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { NotificationItem } from '@/lib/types'

function serialize(n: any): NotificationItem {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.read,
    createdAt: n.createdAt?.toISOString ? n.createdAt.toISOString() : n.createdAt,
  }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 })
    }
    const notifications = await db.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(notifications.map(serialize))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'notifications fetch failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
