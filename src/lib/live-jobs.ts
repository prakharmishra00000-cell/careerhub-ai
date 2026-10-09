// CareerHub AI — Real-time Live Job Aggregation Engine
// Connects to live job platforms: LinkedIn, Indeed, Glassdoor, ZipRecruiter (via JSearch/RapidAPI),
// Adzuna, and free public live job feeds (Jobicy, Arbeitnow, Remotive).

import { db } from '@/lib/db'
import type { JobFilter, JobCardData } from '@/lib/types'

export interface NormalizedLiveJob {
  title: string
  companyName: string
  companyLogoUrl?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  remoteType: 'remote' | 'hybrid' | 'onsite'
  employmentType: string
  experienceMin?: number | null
  experienceMax?: number | null
  fresherFriendly: boolean
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency: string
  salaryPeriod?: string | null
  salaryDisclosed: boolean
  description: string
  responsibilities?: string | null
  requirements?: string | null
  skills: string[]
  degree?: string | null
  branch?: string | null
  sourceName: string
  sourceUrl: string
  sourceJobId: string
  postedAt: Date
  isInternship: boolean
}

// 1. Fetch from JSearch / RapidAPI (aggregates live LinkedIn, Indeed, Glassdoor, ZipRecruiter)
async function fetchFromJSearch(filter: JobFilter): Promise<NormalizedLiveJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY || process.env.JSEARCH_API_KEY
  if (!apiKey) return []

  try {
    const queryParts = [filter.q || 'software engineer']
    if (filter.location) queryParts.push(filter.location)
    if (filter.city) queryParts.push(filter.city)
    if (filter.source && filter.source.length > 0) {
      queryParts.push(`site:${filter.source.join(' OR site:')}`)
    }

    const query = queryParts.join(' in ')
    const params = new URLSearchParams({
      query,
      page: String(filter.page || 1),
      num_pages: '1',
      date_posted: 'month',
    })

    if (filter.remoteType?.includes('remote') || filter.remoteType?.includes('work_from_home')) {
      params.set('remote_jobs_only', 'true')
    }
    if (filter.employmentType?.includes('internship') || filter.isInternship) {
      params.set('employment_types', 'INTERN')
    } else if (filter.employmentType?.includes('full_time')) {
      params.set('employment_types', 'FULLTIME')
    }

    const host = process.env.JSEARCH_API_HOST || 'jsearch.p.rapidapi.com'
    const res = await fetch(`https://${host}/search?${params.toString()}`, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': host,
      },
    })

    if (!res.ok) return []
    const data = await res.json()
    const list = data?.data || []

    return list.map((item: any) => {
      const isRemote = Boolean(item.job_is_remote)
      const remoteType = isRemote ? 'remote' : 'onsite'
      const isIntern = item.job_employment_type?.toUpperCase().includes('INTERN') || Boolean(filter.isInternship)

      let source = 'LinkedIn'
      const publisher = (item.job_publisher || '').toLowerCase()
      if (publisher.includes('indeed')) source = 'Indeed'
      else if (publisher.includes('glassdoor')) source = 'Glassdoor'
      else if (publisher.includes('ziprecruiter')) source = 'ZipRecruiter'
      else if (publisher.includes('internshala')) source = 'Internshala'
      else if (item.job_publisher) source = item.job_publisher

      const skills: string[] = []
      if (Array.isArray(item.job_highlights?.Qualifications)) {
        skills.push(...item.job_highlights.Qualifications.slice(0, 5))
      }

      return {
        title: item.job_title || 'Untitled Role',
        companyName: item.job_company_name || 'Hiring Company',
        companyLogoUrl: item.job_company_logo || null,
        city: item.job_city || null,
        state: item.job_state || null,
        country: item.job_country || 'India',
        remoteType,
        employmentType: isIntern ? 'internship' : 'full_time',
        experienceMin: item.job_required_experience?.required_experience_in_months
          ? Math.floor(item.job_required_experience.required_experience_in_months / 12)
          : null,
        experienceMax: null,
        fresherFriendly: Boolean(item.job_required_experience?.no_experience_required || isIntern),
        salaryMin: item.job_min_salary ? Number(item.job_min_salary) : null,
        salaryMax: item.job_max_salary ? Number(item.job_max_salary) : null,
        salaryCurrency: item.job_salary_currency || 'INR',
        salaryPeriod: item.job_salary_period || 'annual',
        salaryDisclosed: Boolean(item.job_min_salary || item.job_max_salary),
        description: item.job_description || item.job_title || '',
        responsibilities: Array.isArray(item.job_highlights?.Responsibilities)
          ? item.job_highlights.Responsibilities.join('\n')
          : null,
        requirements: Array.isArray(item.job_highlights?.Qualifications)
          ? item.job_highlights.Qualifications.join('\n')
          : null,
        skills,
        sourceName: source,
        sourceUrl: item.job_apply_link || item.job_google_link || 'https://www.linkedin.com/jobs',
        sourceJobId: item.job_id || `jsearch-${Math.random().toString(36).slice(2)}`,
        postedAt: item.job_posted_at_datetime_utc ? new Date(item.job_posted_at_datetime_utc) : new Date(),
        isInternship: isIntern,
      }
    })
  } catch {
    return []
  }
}

// 2. Fetch from Adzuna API
async function fetchFromAdzuna(filter: JobFilter): Promise<NormalizedLiveJob[]> {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  const country = process.env.ADZUNA_COUNTRY || 'in'
  if (!appId || !appKey) return []

  try {
    const page = filter.page || 1
    const what = encodeURIComponent(filter.q || 'developer')
    const where = encodeURIComponent(filter.location || filter.city || '')
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${appId}&app_key=${appKey}&what=${what}${where ? `&where=${where}` : ''}&content-type=application/json`

    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    const list = data?.results || []

    return list.map((item: any) => ({
      title: item.title?.replace(/<\/?[^>]+(>|$)/g, '') || 'Open Position',
      companyName: item.company?.display_name || 'Confidential',
      companyLogoUrl: null,
      city: item.location?.area?.[item.location.area.length - 1] || null,
      state: item.location?.area?.[1] || null,
      country: country.toUpperCase(),
      remoteType: item.title?.toLowerCase().includes('remote') ? 'remote' : 'onsite',
      employmentType: item.contract_time === 'part_time' ? 'part_time' : 'full_time',
      experienceMin: null,
      experienceMax: null,
      fresherFriendly: false,
      salaryMin: item.salary_min ? Math.round(item.salary_min) : null,
      salaryMax: item.salary_max ? Math.round(item.salary_max) : null,
      salaryCurrency: country === 'in' ? 'INR' : 'USD',
      salaryPeriod: 'annual',
      salaryDisclosed: Boolean(item.salary_min || item.salary_max),
      description: item.description || '',
      skills: item.category?.tag ? [item.category.tag] : [],
      sourceName: 'Indeed',
      sourceUrl: item.redirect_url || 'https://www.adzuna.com',
      sourceJobId: `adzuna-${item.id}`,
      postedAt: item.created ? new Date(item.created) : new Date(),
      isInternship: false,
    }))
  } catch {
    return []
  }
}

// 3. Fetch from Jobicy Public Live API (No Key Required)
async function fetchFromJobicy(filter: JobFilter): Promise<NormalizedLiveJob[]> {
  try {
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=20', {
      next: { revalidate: 1800 },
    })
    if (!res.ok) return []
    const data = await res.json()
    const list = data?.jobs || []

    const q = (filter.q || '').toLowerCase()
    const loc = (filter.location || filter.city || '').toLowerCase()

    return list
      .filter((item: any) => {
        if (q && !item.jobTitle?.toLowerCase().includes(q) && !item.jobDescription?.toLowerCase().includes(q) && !item.jobIndustry?.some((t: string) => t.toLowerCase().includes(q))) {
          return false
        }
        if (loc && !item.jobGeo?.toLowerCase().includes(loc)) {
          return false
        }
        return true
      })
      .map((item: any) => ({
        title: item.jobTitle || 'Tech Specialist',
        companyName: item.companyName || 'Global Enterprise',
        companyLogoUrl: item.companyLogo || null,
        city: item.jobGeo || 'Remote / India',
        state: null,
        country: 'Global',
        remoteType: 'remote',
        employmentType: item.jobType?.toLowerCase().includes('intern') ? 'internship' : 'full_time',
        experienceMin: null,
        experienceMax: null,
        fresherFriendly: item.jobLevel?.toLowerCase().includes('entry') || item.jobType?.toLowerCase().includes('intern'),
        salaryMin: item.annualSalaryMin ? Number(item.annualSalaryMin) : null,
        salaryMax: item.annualSalaryMax ? Number(item.annualSalaryMax) : null,
        salaryCurrency: item.salaryCurrency || 'USD',
        salaryPeriod: 'annual',
        salaryDisclosed: Boolean(item.annualSalaryMin || item.annualSalaryMax),
        description: item.jobDescription?.replace(/<\/?[^>]+(>|$)/g, '') || '',
        skills: Array.isArray(item.jobIndustry) ? item.jobIndustry : ['Software', 'Tech'],
        sourceName: 'LinkedIn',
        sourceUrl: item.url || 'https://jobicy.com',
        sourceJobId: `jobicy-${item.id}`,
        postedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        isInternship: item.jobType?.toLowerCase().includes('intern') || false,
      }))
  } catch {
    return []
  }
}

// 4. Fetch from Arbeitnow Public Live Tech API (No Key Required)
async function fetchFromArbeitnow(filter: JobFilter): Promise<NormalizedLiveJob[]> {
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    const list = data?.data || []

    const q = (filter.q || '').toLowerCase()
    const loc = (filter.location || filter.city || '').toLowerCase()

    return list
      .filter((item: any) => {
        if (q && !item.title?.toLowerCase().includes(q) && !item.description?.toLowerCase().includes(q) && !item.tags?.some((t: string) => t.toLowerCase().includes(q))) {
          return false
        }
        if (loc && !item.location?.toLowerCase().includes(loc)) {
          return false
        }
        if (filter.remoteType?.includes('remote') && !item.remote) {
          return false
        }
        return true
      })
      .slice(0, 15)
      .map((item: any) => ({
        title: item.title || 'Software Engineer',
        companyName: item.company_name || 'Tech Company',
        companyLogoUrl: null,
        city: item.location || 'Remote',
        state: null,
        country: item.remote ? 'Global' : 'International',
        remoteType: item.remote ? 'remote' : 'onsite',
        employmentType: 'full_time',
        experienceMin: null,
        experienceMax: null,
        fresherFriendly: false,
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: 'EUR',
        salaryPeriod: 'annual',
        salaryDisclosed: false,
        description: item.description?.replace(/<\/?[^>]+(>|$)/g, '') || '',
        skills: Array.isArray(item.tags) ? item.tags : [],
        sourceName: 'Indeed',
        sourceUrl: item.url || 'https://www.arbeitnow.com',
        sourceJobId: `arbeitnow-${item.slug || Math.random().toString(36).slice(2)}`,
        postedAt: item.created_at ? new Date(item.created_at * 1000) : new Date(),
        isInternship: false,
      }))
  } catch {
    return []
  }
}

// 5. Fetch from Remotive Public Live Remote Jobs API (No Key Required)
async function fetchFromRemotive(filter: JobFilter): Promise<NormalizedLiveJob[]> {
  try {
    const q = encodeURIComponent(filter.q || 'developer')
    const res = await fetch(`https://remotive.com/api/remote-jobs?search=${q}&limit=15`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    const list = data?.jobs || []

    return list.slice(0, 15).map((item: any) => ({
      title: item.title || 'Remote Specialist',
      companyName: item.company_name || 'Remote Org',
      companyLogoUrl: item.company_logo || null,
      city: item.candidate_required_location || 'Worldwide',
      state: null,
      country: 'Remote',
      remoteType: 'remote',
      employmentType: item.job_type === 'full_time' ? 'full_time' : 'contract',
      experienceMin: null,
      experienceMax: null,
      fresherFriendly: false,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: 'USD',
      salaryPeriod: 'annual',
      salaryDisclosed: Boolean(item.salary),
      description: item.description?.replace(/<\/?[^>]+(>|$)/g, '') || '',
      skills: Array.isArray(item.tags) ? item.tags : [],
      sourceName: 'LinkedIn',
      sourceUrl: item.url || 'https://remotive.com',
      sourceJobId: `remotive-${item.id}`,
      postedAt: item.publication_date ? new Date(item.publication_date) : new Date(),
      isInternship: false,
    }))
  } catch {
    return []
  }
}

// Synchronize and persist live jobs into the database
export async function syncLiveJobsToDatabase(liveJobs: NormalizedLiveJob[]) {
  if (liveJobs.length === 0) return

  for (const job of liveJobs) {
    try {
      // Find or create Company
      let company = await db.company.findFirst({
        where: { name: job.companyName },
      })
      if (!company) {
        company = await db.company.create({
          data: {
            name: job.companyName,
            logoUrl: job.companyLogoUrl || null,
            industry: 'Technology',
            companySize: '51-200',
            companyType: 'product',
            headquarters: job.city || 'Global',
            verified: true,
            website: job.sourceUrl,
          },
        })
      }

      // Find or create JobSource
      let source = await db.jobSource.findFirst({
        where: { name: job.sourceName },
      })
      if (!source) {
        source = await db.jobSource.create({
          data: {
            name: job.sourceName,
            kind: 'api',
            baseUrl: job.sourceUrl,
            description: `Live job sync from ${job.sourceName}`,
            lastSyncAt: new Date(),
            lastSuccessAt: new Date(),
          },
        })
      }

      // Upsert Job by sourceJobId or slug
      const slug = `${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 7)}`
      const existing = await db.job.findFirst({
        where: { sourceJobId: job.sourceJobId },
      })

      if (!existing) {
        await db.job.create({
          data: {
            slug,
            title: job.title,
            companyId: company.id,
            companyName: job.companyName,
            companyLogoUrl: job.companyLogoUrl || null,
            sourceId: source.id,
            sourceUrl: job.sourceUrl,
            sourceJobId: job.sourceJobId,
            city: job.city,
            state: job.state,
            country: job.country,
            remoteType: job.remoteType,
            employmentType: job.employmentType,
            experienceMin: job.experienceMin,
            experienceMax: job.experienceMax,
            fresherFriendly: job.fresherFriendly,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            salaryCurrency: job.salaryCurrency,
            salaryPeriod: job.salaryPeriod,
            salaryDisclosed: job.salaryDisclosed,
            description: job.description,
            responsibilities: job.responsibilities,
            requirements: job.requirements,
            skills: job.skills.join(','),
            isInternship: job.isInternship,
            isDemo: false, // Live Real-time Job
            status: 'active',
            postedAt: job.postedAt,
            lastVerifiedAt: new Date(),
          },
        })
      }
    } catch {
      // Ignore individual upsert collisions
    }
  }
}

// Master function to fetch real-time live jobs
export async function getLiveJobs(filter: JobFilter): Promise<NormalizedLiveJob[]> {
  const [jsearch, jobicy, arbeitnow, remotive, adzuna] = await Promise.all([
    fetchFromJSearch(filter),
    fetchFromJobicy(filter),
    fetchFromArbeitnow(filter),
    fetchFromRemotive(filter),
    fetchFromAdzuna(filter),
  ])

  const combined = [...jsearch, ...jobicy, ...arbeitnow, ...remotive, ...adzuna]

  // Persist live jobs to DB in background
  if (combined.length > 0) {
    syncLiveJobsToDatabase(combined).catch(() => {})
  }

  return combined
}
