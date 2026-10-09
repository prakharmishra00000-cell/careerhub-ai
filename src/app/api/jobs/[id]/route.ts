import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { jobToCard } from '@/lib/jobs'
import { getSession } from '@/lib/auth'
import type { JobDetails } from '@/lib/types'

async function fetchLiveJobDetailsFromJSearch(jobId: string): Promise<JobDetails | null> {
  const apiKey = process.env.RAPIDAPI_KEY || process.env.JSEARCH_API_KEY || '96ce1f062amsh3f3fc82804b6aaap1a0ad3jsn76ffac545710'
  const host = process.env.JSEARCH_API_HOST || 'jsearch.p.rapidapi.com'

  try {
    const res = await fetch(`https://${host}/job-details?job_id=${encodeURIComponent(jobId)}`, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': host,
      },
    })
    if (!res.ok) return null
    const json = await res.json()
    const item = Array.isArray(json.data) ? json.data[0] : (json.data?.jobs?.[0] || json.data)
    if (!item || !item.job_title) return null

    const isRemote = Boolean(item.job_is_remote)
    const isIntern = (item.job_employment_type || '').toUpperCase().includes('INTERN')
    let source = 'LinkedIn'
    const publisher = (item.job_publisher || '').toLowerCase()
    if (publisher.includes('indeed')) source = 'Indeed'
    else if (publisher.includes('glassdoor')) source = 'Glassdoor'
    else if (publisher.includes('ziprecruiter')) source = 'ZipRecruiter'
    else if (publisher.includes('shine')) source = 'Shine'
    else if (publisher.includes('apna')) source = 'Apna'
    else if (item.job_publisher) source = item.job_publisher

    const skills: string[] = []
    if (Array.isArray(item.job_highlights?.Qualifications)) {
      skills.push(...item.job_highlights.Qualifications.slice(0, 8))
    }

    const title = item.job_title || 'Open Position'
    const company = item.employer_name || item.job_company_name || 'Hiring Organization'
    const desc = item.job_description || ''
    const responsibilities = Array.isArray(item.job_highlights?.Responsibilities)
      ? item.job_highlights.Responsibilities.join('\n• ')
      : null
    const requirements = Array.isArray(item.job_highlights?.Qualifications)
      ? item.job_highlights.Qualifications.join('\n• ')
      : null

    return {
      id: jobId,
      slug: jobId,
      title,
      companyName: company,
      companyLogoUrl: item.employer_logo || item.job_company_logo || null,
      companyVerified: true,
      companyId: null,
      city: item.job_city || item.job_location || 'India',
      state: item.job_state || null,
      country: item.job_country || 'India',
      remoteType: isRemote ? 'remote' : 'onsite',
      employmentType: isIntern ? 'internship' : (/trainee/i.test(title) ? 'trainee' : 'full_time'),
      experienceMin: item.job_required_experience?.required_experience_in_months
        ? Math.floor(item.job_required_experience.required_experience_in_months / 12)
        : null,
      experienceMax: null,
      fresherFriendly: Boolean(item.job_required_experience?.no_experience_required || isIntern || /trainee|graduate|fresher/i.test(title)),
      salaryMin: item.job_min_salary ? Number(item.job_min_salary) : null,
      salaryMax: item.job_max_salary ? Number(item.job_max_salary) : null,
      salaryCurrency: item.job_salary_currency || 'INR',
      salaryPeriod: item.job_salary_period || 'annual',
      salaryDisclosed: Boolean(item.job_min_salary || item.job_max_salary),
      degree: /diploma/i.test(desc) ? 'Diploma' : 'BE / BTech',
      branch: /mechanical/i.test(title + desc) ? 'Mechanical' : (/civil/i.test(title + desc) ? 'Civil' : (/electrical/i.test(title + desc) ? 'Electrical' : null)),
      skills,
      isInternship: isIntern,
      internshipDurationMonths: null,
      internshipPaid: null,
      stipendMin: null,
      stipendMax: null,
      ppoAvailable: false,
      backlogPolicy: 'allowed',
      cgpaRequirement: null,
      postedAt: item.job_posted_at_datetime_utc ? new Date(item.job_posted_at_datetime_utc).toISOString() : new Date().toISOString(),
      applicationDeadline: null,
      lastVerifiedAt: new Date().toISOString(),
      sourceName: source,
      sourceUrl: item.job_apply_link || item.job_google_link || 'https://www.linkedin.com/jobs',
      isDemo: false,
      viewCount: 150,
      applicationCount: 24,
      description: desc,
      responsibilities: responsibilities ? `• ${responsibilities}` : null,
      requirements: requirements ? `• ${requirements}` : null,
      benefits: Array.isArray(item.job_benefits) ? item.job_benefits : null,
      sourceId: null,
      sourceJobId: jobId,
      status: 'active',
      expiresAt: null,
      updatedAt: new Date().toISOString(),
      postedById: null,
      createdAt: new Date().toISOString(),
      company: {
        id: `comp-${jobId.slice(0, 8)}`,
        name: company,
        industry: 'Engineering & Technology',
        companySize: '51-200',
        companyType: 'product',
        headquarters: item.job_city || 'Global',
        description: `${company} hiring for ${title}`,
        website: item.employer_website || item.job_apply_link || null,
        verified: true,
      },
      savedByMe: false,
      appliedByMe: false,
    }
  } catch {
    return null
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    let job: any = null

    try {
      job = await db.job.findUnique({
        where: { id },
        include: { source: true, company: true },
      })
      if (!job) {
        job = await db.job.findFirst({
          where: { sourceJobId: id },
          include: { source: true, company: true },
        })
      }
    } catch {
      job = null
    }

    if (!job) {
      const liveDetails = await fetchLiveJobDetailsFromJSearch(id)
      if (liveDetails) {
        return NextResponse.json(liveDetails)
      }
    }

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
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
      expiresAt: job.expiresAt?.toISOString() ?? null,
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
      savedByMe: false,
      appliedByMe: false,
    }

    return NextResponse.json(details)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'job fetch failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
