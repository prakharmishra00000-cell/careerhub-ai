import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

// GET /api/cron/sync — auto-sync jobs from all sources (no auth, for Vercel cron)
export async function GET() {
  try {
    // Rate limit: only sync if last sync was > 10 minutes ago
    const lastSync = await db.jobSource.findFirst({
      orderBy: { lastSyncAt: 'desc' },
      select: { lastSyncAt: true },
    })

    if (lastSync?.lastSyncAt) {
      const minutesSinceSync = (Date.now() - lastSync.lastSyncAt.getTime()) / 60000
      if (minutesSinceSync < 10) {
        return NextResponse.json({
          ok: true,
          message: `Last sync was ${Math.round(minutesSinceSync)} minutes ago. Skipping (min 10 min interval).`,
          lastSync: lastSync.lastSyncAt,
        })
      }
    }

    // Dynamic import to prevent build-time fetch analysis
    const { syncAllSources } = await import('@/lib/source-adapters')
    const result = await syncAllSources()

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
