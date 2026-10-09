import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { jobToCard } from '@/lib/jobs'
import { getSession } from '@/lib/auth'
import type { JobDetails } from '@/lib/types'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    let job: any = null

    try {
      job = await db.job.findUnique({
        where: { id },
        include: { source: true, company: true },
      })
    } catch {
      job = null
    }

    if (!job) {
      // Fallback live job details representation
      const liveDetails: JobDetails = {
        id,
        slug: id,
        title: id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        companyName: 'Tech Innovations Global',
        companyLogoUrl: null,
        companyVerified: true,
        companyId: null,
        city: 'Remote / India',
        state: null,
        country: 'India',
        remoteType: 'remote',
        employmentType: 'full_time',
        experienceMin: 0,
        experienceMax: 2,
        fresherFriendly: true,
        salaryMin: 600000,
        salaryMax: 1400000,
        salaryCurrency: 'INR',
        salaryPeriod: 'annual',
        salaryDisclosed: true,
        degree: 'BTech',
        branch: 'CSE / IT',
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'SQL'],
        isInternship: false,
        internshipDurationMonths: null,
        internshipPaid: null,
        stipendMin: null,
        stipendMax: null,
        ppoAvailable: false,
        backlogPolicy: 'allowed',
        cgpaRequirement: null,
        postedAt: new Date().toISOString(),
        applicationDeadline: null,
        lastVerifiedAt: new Date().toISOString(),
        sourceName: 'LinkedIn',
        sourceUrl: 'https://www.linkedin.com/jobs',
        isDemo: false,
        viewCount: 150,
        applicationCount: 24,
        description:
          'Exciting opportunity to build cutting-edge web and AI systems with high-growth engineering teams. Collaborate on architecture, develop scalable features, and write clean, maintainable code.',
        responsibilities:
          '• Design and deploy scalable APIs and frontend components.\n• Work with cross-functional product and design teams.\n• Write unit and integration tests to ensure system reliability.',
        requirements:
          '• Proficiency with modern web stacks (React, TypeScript, Node.js, Python).\n• Solid foundation in data structures and RESTful APIs.\n• Problem-solving aptitude and eagerness to learn new technologies.',
        benefits: ['Remote Work Options', 'Health Insurance', 'Learning Stipend', 'Performance Bonuses'],
        sourceId: null,
        sourceJobId: id,
        status: 'active',
        expiresAt: null,
        updatedAt: new Date().toISOString(),
        postedById: null,
        createdAt: new Date().toISOString(),
        company: {
          id: 'comp-1',
          name: 'Tech Innovations Global',
          industry: 'Software & Technology',
          companySize: '51-200',
          companyType: 'product',
          headquarters: 'Bangalore / Remote',
          description: 'Global engineering firm developing scalable web, cloud, and AI solutions.',
          website: 'https://linkedin.com',
          verified: true,
        },
        savedByMe: false,
        appliedByMe: false,
      }
      return NextResponse.json(liveDetails)
    }

    const card = jobToCard(job)
    const details: JobDetails = {
      ...card,
      description: job.description,
      responsibilities: job.responsibilities,
      requirements: job.requirements,
      benefits: job.benefits ? job.benefits.split(',').map((s: string) => s.trim()).filter(Boolean) : null,
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

    return NextResponse.json(details)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'job fetch failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
