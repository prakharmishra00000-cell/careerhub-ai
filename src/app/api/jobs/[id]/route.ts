import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { jobToCard } from '@/lib/jobs'
import { getSession } from '@/lib/auth'
import type { JobDetails } from '@/lib/types'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const job = await db.job.findUnique({
      where: { id },
      include: { source: true, company: true },
    })
    if (!job) {
      return NextResponse.json({ error: 'job not found' }, { status: 404 })
    }

    // Fire-and-forget view count increment (do not await)
    db.job.update({ where: { id: job.id }, data: { viewCount: { increment: 1 } } }).catch(() => {})

    const card = jobToCard(job)
    const details: JobDetails = {
      ...card,
      description: job.description,
      responsibilities: job.responsibilities,
      requirements: job.requirements,
      benefits: job.benefits ? job.benefits.split(',').map((s) => s.trim()).filter(Boolean) : null,
      sourceId: job.sourceId,
      sourceJobId: job.sourceJobId,
      status: job.status,
      expiresAt: job.expiresAt ? job.expiresAt.toISOString() : null,
      updatedAt: job.updatedAt.toISOString(),
      postedById: job.postedById,
      createdAt: job.createdAt.toISOString(),
      company: job.company
        ? {
            id: job.company.id,
            name: job.company.name,
            industry: job.company.industry,
            companySize: job.company.companySize,
            companyType: job.company.companyType,
            headquarters: job.company.headquarters,
            description: job.company.description,
            website: job.company.website,
            verified: job.company.verified,
          }
        : null,
    }

    // Attach savedByMe / appliedByMe for logged-in candidates
    const session = await getSession()
    if (session && session.role === 'candidate') {
      const [saved, applied] = await Promise.all([
        db.savedJob.findUnique({ where: { userId_jobId: { userId: session.id, jobId: job.id } } }),
        db.application.findUnique({ where: { userId_jobId: { userId: session.id, jobId: job.id } } }),
      ])
      details.savedByMe = !!saved
      details.appliedByMe = !!applied
    }

    return NextResponse.json(details)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'job fetch failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
