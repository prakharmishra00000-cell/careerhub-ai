import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { fetchRemotive, fetchArbeitnow, syncJobsToDatabase } from '@/lib/source-adapters'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// POST /api/sources/sync — fetch real jobs from public APIs and persist to DB
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const source = body.source || 'all' // 'all' | 'remotive' | 'arbeitnow'

    const results: any = { sources: [], totalInserted: 0, totalSkipped: 0, totalErrors: 0 }

    if (source === 'all' || source === 'remotive') {
      try {
        const jobs = await fetchRemotive()
        const res = await syncJobsToDatabase('Remotive', jobs)
        results.sources.push({ name: 'Remotive', fetched: jobs.length, ...res })
        results.totalInserted += res.inserted
        results.totalSkipped += res.skipped
        results.totalErrors += res.errors
      } catch (e: any) {
        results.sources.push({ name: 'Remotive', error: e.message })
        results.totalErrors++
      }
    }

    if (source === 'all' || source === 'arbeitnow') {
      try {
        const jobs = await fetchArbeitnow()
        const res = await syncJobsToDatabase('Arbeitnow', jobs)
        results.sources.push({ name: 'Arbeitnow', fetched: jobs.length, ...res })
        results.totalInserted += res.inserted
        results.totalSkipped += res.skipped
        results.totalErrors += res.errors
      } catch (e: any) {
        results.sources.push({ name: 'Arbeitnow', error: e.message })
        results.totalErrors++
      }
    }

    return NextResponse.json(results)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET /api/sources/sync — check sync status
export async function GET() {
  try {
    const sources = await db.jobSource.findMany({
      select: { id: true, name: true, enabled: true, lastSyncAt: true, lastSuccessAt: true, jobsFetched: true, errorRate: true },
    })
    const realJobs = await db.job.count({ where: { isDemo: false } })
    const demoJobs = await db.job.count({ where: { isDemo: true } })
    return NextResponse.json({ sources, realJobs, demoJobs })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
