import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { jobToCard } from '@/lib/jobs'
import type { CompanyDetails, JobCardData } from '@/lib/types'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const company = await db.company.findUnique({
      where: { id },
      include: {
        jobs: {
          where: { status: 'active' },
          orderBy: { postedAt: 'desc' },
          include: { source: true, company: true },
        },
      },
    })
    if (!company) {
      return NextResponse.json({ error: 'company not found' }, { status: 404 })
    }

    const jobs: JobCardData[] = (company.jobs as any[]).map((j) => jobToCard(j))

    const details: CompanyDetails = {
      id: company.id,
      name: company.name,
      logoUrl: company.logoUrl,
      industry: company.industry,
      companySize: company.companySize,
      companyType: company.companyType,
      headquarters: company.headquarters,
      description: company.description,
      verified: company.verified,
      openJobs: jobs.length,
      website: company.website,
      jobs,
    }

    return NextResponse.json(details)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'company fetch failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
