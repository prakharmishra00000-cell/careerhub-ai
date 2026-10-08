import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import type { JobSourceHealth } from '@/lib/types'

function computeStatus(s: any): 'healthy' | 'degraded' | 'down' | 'unknown' {
  if (!s.enabled) return 'down'
  const now = Date.now()
  const lastSuccess = s.lastSuccessAt ? new Date(s.lastSuccessAt).getTime() : 0
  const hoursSinceSuccess = (now - lastSuccess) / 3_600_000
  if (hoursSinceSuccess < 6 && (s.errorRate ?? 0) < 0.05) return 'healthy'
  if (hoursSinceSuccess < 24 && (s.errorRate ?? 0) < 0.2) return 'degraded'
  return 'down'
}

function serialize(s: any): JobSourceHealth {
  return {
    id: s.id,
    name: s.name,
    kind: s.kind,
    enabled: s.enabled,
    lastSyncAt: s.lastSyncAt?.toISOString ? s.lastSyncAt.toISOString() : s.lastSyncAt ?? null,
    lastSuccessAt: s.lastSuccessAt?.toISOString ? s.lastSuccessAt.toISOString() : s.lastSuccessAt ?? null,
    lastErrorAt: s.lastErrorAt?.toISOString ? s.lastErrorAt.toISOString() : s.lastErrorAt ?? null,
    lastErrorMessage: s.lastErrorMessage,
    jobsFetched: s.jobsFetched,
    jobsUpdated: s.jobsUpdated,
    jobsFailed: s.jobsFailed,
    errorRate: s.errorRate,
    quotaUsed: s.quotaUsed,
    quotaLimit: s.quotaLimit,
    syncFrequency: s.syncFrequency,
    parserVersion: s.parserVersion,
    status: computeStatus(s),
  }
}

export async function GET() {
  try {
    const user = await requireUser(['admin'])
    if (!user) {
      return NextResponse.json({ error: 'admin authentication required' }, { status: 401 })
    }
    const sources = await db.jobSource.findMany({ orderBy: { name: 'asc' } })
    // Never expose credentials — they aren't even on this model
    return NextResponse.json({ sources: sources.map(serialize) })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'sources fetch failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
