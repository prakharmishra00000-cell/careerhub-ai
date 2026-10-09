import { NextRequest, NextResponse } from 'next/server'
import { getLiveJobs } from '@/lib/live-jobs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const query = body.query || 'software developer'
    const location = body.location || ''

    const liveJobs = await getLiveJobs({
      q: query,
      location,
      page: 1,
    })

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${liveJobs.length} live jobs from external platforms.`,
      count: liveJobs.length,
      sample: liveJobs.slice(0, 3).map((j) => ({
        title: j.title,
        company: j.companyName,
        source: j.sourceName,
        url: j.sourceUrl,
      })),
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'sync failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
