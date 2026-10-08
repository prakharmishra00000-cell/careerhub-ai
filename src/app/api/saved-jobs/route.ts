import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { jobToCard } from '@/lib/jobs'
import type { SavedJobItem } from '@/lib/types'

export async function GET() {
  try {
    const user = await requireUser(['candidate'])
    if (!user) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 })
    }
    const saved = await db.savedJob.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { job: { include: { source: true, company: true } } },
    })
    const items: SavedJobItem[] = saved.map((s: any) => ({
      ...jobToCard(s.job),
      savedAt: s.createdAt?.toISOString ? s.createdAt.toISOString() : s.createdAt,
      folder: s.folder,
      notes: s.notes,
    }))
    return NextResponse.json(items)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'saved jobs fetch failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
