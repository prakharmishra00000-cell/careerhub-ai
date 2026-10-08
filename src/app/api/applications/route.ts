import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { jobToCard } from '@/lib/jobs'
import type { ApplicationItem } from '@/lib/types'

const GROUPS = ['saved', 'applied', 'assessment', 'interview', 'offer', 'rejected', 'withdrawn'] as const

export async function GET() {
  try {
    const user = await requireUser(['candidate'])
    if (!user) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 })
    }
    const apps = await db.application.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: { job: { include: { source: true, company: true } } },
    })

    const grouped: Record<string, ApplicationItem[]> = {}
    for (const g of GROUPS) grouped[g] = []

    for (const a of apps) {
      const item: ApplicationItem = {
        ...jobToCard((a as any).job),
        status: a.status,
        appliedAt: a.appliedAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        deadline: a.deadline ? a.deadline.toISOString() : null,
        interviewDate: a.interviewDate ? a.interviewDate.toISOString() : null,
        notes: a.notes,
      }
      if (grouped[a.status]) grouped[a.status].push(item)
    }

    return NextResponse.json(grouped)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'applications fetch failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
