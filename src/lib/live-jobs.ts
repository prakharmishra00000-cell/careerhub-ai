// CareerHub AI — Real-time Live Job Aggregation Engine
// Connects to live job platforms: LinkedIn, Indeed, Glassdoor, ZipRecruiter, Shine, Apna (via JSearch/RapidAPI),
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

// Universal query relevance matching
export function matchesTextQuery(title: string, description: string, tags: string[], query?: string): boolean {
  if (!query || !query.trim()) return true
  const q = query.toLowerCase().trim()
  const t = title.toLowerCase()
  const tagStr = tags.join(' ').toLowerCase()
  const d = description.toLowerCase()
  const allText = `${t} ${tagStr} ${d}`

  // Direct substring match
  if (t.includes(q) || tagStr.includes(q)) return true

  // Graduate Engineer Trainee / GET / Trainee queries
  if (/graduate\s+engineer|engineer\s+trainee|\bget\b|management\s+trainee|executive\s+trainee|graduate\s+trainee/i.test(q)) {
    const isTrainee = /trainee|graduate|entry\s+level|fresher|\bget\b|apprentice|junior\s+engineer|associate\s+engineer/i.test(t) ||
                      /trainee|graduate|get|fresher/i.test(tagStr) ||
                      /graduate\s+engineer\s+trainee|\bget\b|entry\s+level\s+trainee/i.test(d)
    const isExcludedSenior = /senior|lead|principal|architect|staff/i.test(t)
    return isTrainee && !isExcludedSenior
  }

  // UI / UX / Product Design queries
  if (/ui[\s/_-]?ux|ux[\s/_-]?ui|product\s+design|designer|figma|graphic/i.test(q)) {
    return (
      /ui[\s/_-]?ux|ux[\s/_-]?ui|product\s+designer|web\s*designer|graphic\s+designer|motion\s+designer|interaction\s+designer|designer|figma/i.test(t) ||
      /ui[\s/_-]?ux|ux[\s/_-]?ui|product\s+design|figma|design/i.test(tagStr) ||
      (/figma|user\s+experience|user\s+interface|wireframe|prototype/i.test(d) && /design/i.test(t))
    )
  }

  // Mechanical / Automobile / Production
  if (/mechanical|automobile|automotive|production\s+engineer|manufacturing\s+engineer|thermal|hvac|cad\s+engineer|solidworks/i.test(q)) {
    return (
      /mechanical|automobile|automotive|production|manufacturing|thermal|hvac|solidworks|autocad|catia|piping|mechatronics|aerospace/i.test(t) ||
      /mechanical|automobile|production|manufacturing|cad|solidworks/i.test(tagStr) ||
      (/mechanical|cad|solidworks|thermodynamics/i.test(d) && !/software\s+engineer/i.test(t))
    )
  }

  // Civil / Structural / Construction / Infrastructure
  if (/civil|structural|construction|site\s+engineer|staad|surveyor|geotechnical|infrastructure/i.test(q)) {
    return (
      /civil|structural|construction|site\s+engineer|staad|surveyor|geotechnical|infrastructure|highway|bridge/i.test(t) ||
      /civil|structural|construction|surveying/i.test(tagStr) ||
      (/civil\s+engineering|structural\s+analysis|construction\s+site/i.test(d) && !/software/i.test(t))
    )
  }

  // Electrical / Power / Automation / EEE
  if (/electrical|power\s+system|substation|plc|scada|transformer|switchgear|\beee\b/i.test(q)) {
    return (
      /electrical|power\s+system|substation|plc|scada|transformer|switchgear|high\s+voltage|\beee\b/i.test(t) ||
      /electrical|power|plc|scada/i.test(tagStr)
    )
  }

  // Electronics / ECE / VLSI / Embedded / IoT
  if (/electronic|\bece\b|vlsi|embedded|iot|pcb|microcontroller|fpga|firmware|semiconductor/i.test(q)) {
    return (
      /electronic|\bece\b|vlsi|embedded|iot|pcb|microcontroller|fpga|firmware|semiconductor|hardware\s+engineer|rtl/i.test(t) ||
      /electronics|embedded|iot|vlsi|pcb/i.test(tagStr)
    )
  }

  // Chemical / Process / Petroleum / Refinery
  if (/chemical|petrochemical|refinery|process\s+engineer|distillation|polymer/i.test(q)) {
    return (
      /chemical|petrochemical|refinery|process\s+engineer|distillation|polymer|plant\s+engineer/i.test(t) ||
      /chemical|refinery|petrochemical/i.test(tagStr)
    )
  }

  // Finance / Accounting / Auditing
  if (/finance|financial|accountant|accounting|\bca\b|audit|tax|treasury|investment\s+banking/i.test(q)) {
    return (
      /finance|financial|accountant|accounting|\bca\b|audit|taxation|treasury|investment\s+banking|equity\s+research/i.test(t) ||
      /finance|accounting|audit|tax/i.test(tagStr)
    )
  }

  // HR / Recruitment / Talent
  if (/\bhr\b|human\s+resources|recruiter|recruitment|talent\s+acquisition|people\s+ops/i.test(q)) {
    return (
      /\bhr\b|human\s+resources|recruiter|recruitment|talent\s+acquisition|people\s+operations|staffing/i.test(t) ||
      /hr|recruitment|talent/i.test(tagStr)
    )
  }

  // Marketing / SEO / Sales / BD
  if (/marketing|seo|growth|campaign|social\s+media|sales|business\s+development|\bbd\b/i.test(q)) {
    return (
      /marketing|seo|growth|campaign|social\s+media|sales|business\s+development|\bbd\b|content\s+writer/i.test(t) ||
      /marketing|sales|growth|seo/i.test(tagStr)
    )
  }

  // General token matching
  const stopWords = new Set(['in', 'and', 'or', 'for', 'with', 'at', 'to', 'the', 'a', 'an', 'of', 'on', 'by', 'job', 'jobs', 'role', 'roles'])
  const tokens = q.split(/\s+/).filter((w) => w.length > 2 && !stopWords.has(w))
  if (tokens.length === 0) return true

  const matches = tokens.filter((tok) => allText.includes(tok))
  return matches.length >= Math.ceil(tokens.length * 0.7)
}

function inferBranch(title: string, desc: string): string {
  const combined = `${title} ${desc}`.toLowerCase()
  if (/graduate\s+engineer\s+trainee|\bget\b|trainee\s+engineer/i.test(title)) return 'Engineering (GET)'
  if (/mechanical|solidworks|autocad|cad|hvac|thermodynamics|automobile|automotive/i.test(combined)) return 'Mechanical'
  if (/civil|structural|site\s+engineer|construction|surveyor|staad/i.test(combined)) return 'Civil'
  if (/electrical|power\s+systems|plc|scada|transformer|\beee\b/i.test(combined)) return 'Electrical'
  if (/vlsi|embedded|\bece\b|microcontroller|pcb|iot|fpga|semiconductor/i.test(combined)) return 'ECE / IoT'
  if (/chemical|petrochemical|refinery|process\s+engineer/i.test(combined)) return 'Chemical'
  if (/ui[\s/_-]?ux|designer|product\s+design|figma|graphic/i.test(combined)) return 'Design & UI/UX'
  if (/finance|accountant|accounting|\bca\b|audit|treasury|taxation/i.test(combined)) return 'Finance'
  if (/\bhr\b|human\s+resources|recruiter|talent\s+acquisition/i.test(combined)) return 'HR'
  if (/marketing|seo|growth|sales|business\s+development/i.test(combined)) return 'Marketing'
  if (/data\s+scientist|machine\s+learning|\bai\b|deep\s+learning/i.test(combined)) return 'AI & Data Science'
  if (/cybersecurity|security\s+analyst|infosec/i.test(combined)) return 'Cybersecurity'
  return 'CSE / IT'
}

// 1. Fetch from JSearch / RapidAPI (aggregates live LinkedIn, Indeed, Glassdoor, ZipRecruiter, Shine, Apna)
async function fetchFromJSearch(filter: JobFilter): Promise<NormalizedLiveJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY || process.env.JSEARCH_API_KEY || '96ce1f062amsh3f3fc82804b6aaap1a0ad3jsn76ffac545710'
  if (!apiKey) return []

  try {
    const rawQ = filter.q || (filter.branch && filter.branch.length > 0 ? `${filter.branch[0]} Engineer` : 'engineer')
    const loc = filter.location || filter.city || 'India'
    const query = `${rawQ} in ${loc}`

    const params = new URLSearchParams({
      query,
      page: String(filter.page || 1),
      num_pages: '2',
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
    const res = await fetch(`https://${host}/search-v2?${params.toString()}`, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': host,
      },
    })

    if (!res.ok) return []
    const data = await res.json()
    const list: any[] = data?.data?.jobs || (Array.isArray(data?.data) ? data.data : [])

    return list.map((item: any) => {
      const isRemote = Boolean(item.job_is_remote)
      const remoteType = isRemote ? 'remote' : 'onsite'
      const isIntern = item.job_employment_type?.toUpperCase().includes('INTERN') || Boolean(filter.isInternship)
      const title = item.job_title || 'Untitled Role'
      const desc = item.job_description || title

      let source = 'LinkedIn'
      const publisher = (item.job_publisher || '').toLowerCase()
      if (publisher.includes('indeed')) source = 'Indeed'
      else if (publisher.includes('glassdoor')) source = 'Glassdoor'
      else if (publisher.includes('ziprecruiter')) source = 'ZipRecruiter'
      else if (publisher.includes('internshala')) source = 'Internshala'
      else if (publisher.includes('shine')) source = 'Shine'
      else if (publisher.includes('apna')) source = 'Apna'
      else if (item.job_publisher) source = item.job_publisher

      const skills: string[] = []
      if (Array.isArray(item.job_highlights?.Qualifications)) {
        skills.push(...item.job_highlights.Qualifications.slice(0, 5))
      }

      const isFresher = Boolean(
        item.job_required_experience?.no_experience_required ||
        isIntern ||
        /fresher|trainee|graduate|entry\s+level/i.test(title)
      )

      return {
        title,
        companyName: item.employer_name || item.job_company_name || 'Hiring Company',
        companyLogoUrl: item.employer_logo || item.job_company_logo || null,
        city: item.job_city || item.job_location || null,
        state: item.job_state || null,
        country: item.job_country || 'India',
        remoteType,
        employmentType: isIntern ? 'internship' : (/trainee/i.test(title) ? 'trainee' : 'full_time'),
        experienceMin: item.job_required_experience?.required_experience_in_months
          ? Math.floor(item.job_required_experience.required_experience_in_months / 12)
          : (isFresher ? 0 : null),
        experienceMax: null,
        fresherFriendly: isFresher,
        salaryMin: item.job_min_salary ? Number(item.job_min_salary) : null,
        salaryMax: item.job_max_salary ? Number(item.job_max_salary) : null,
        salaryCurrency: item.job_salary_currency || 'INR',
        salaryPeriod: item.job_salary_period || 'annual',
        salaryDisclosed: Boolean(item.job_min_salary || item.job_max_salary),
        description: desc,
        responsibilities: Array.isArray(item.job_highlights?.Responsibilities)
          ? item.job_highlights.Responsibilities.join('\n')
          : null,
        requirements: Array.isArray(item.job_highlights?.Qualifications)
          ? item.job_highlights.Qualifications.join('\n')
          : null,
        skills,
        degree: /diploma/i.test(desc) ? 'Diploma' : 'BE / BTech',
        branch: inferBranch(title, desc),
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
    const what = encodeURIComponent(filter.q || 'engineer')
    const where = encodeURIComponent(filter.location || filter.city || '')
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${appId}&app_key=${appKey}&what=${what}${where ? `&where=${where}` : ''}&content-type=application/json`

    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    const list = data?.results || []

    return list.map((item: any) => {
      const title = item.title?.replace(/<\/?[^>]+(>|$)/g, '') || 'Open Position'
      const desc = item.description || ''
      return {
        title,
        companyName: item.company?.display_name || 'Confidential',
        companyLogoUrl: null,
        city: item.location?.area?.[item.location.area.length - 1] || null,
        state: item.location?.area?.[1] || null,
        country: country.toUpperCase(),
        remoteType: title.toLowerCase().includes('remote') ? 'remote' : 'onsite',
        employmentType: item.contract_time === 'part_time' ? 'part_time' : 'full_time',
        experienceMin: /fresher|trainee|graduate/i.test(title) ? 0 : null,
        experienceMax: null,
        fresherFriendly: /fresher|trainee|graduate/i.test(title),
        salaryMin: item.salary_min ? Math.round(item.salary_min) : null,
        salaryMax: item.salary_max ? Math.round(item.salary_max) : null,
        salaryCurrency: country === 'in' ? 'INR' : 'USD',
        salaryPeriod: 'annual',
        salaryDisclosed: Boolean(item.salary_min || item.salary_max),
        description: desc,
        skills: item.category?.tag ? [item.category.tag] : [],
        degree: 'BTech / BE',
        branch: inferBranch(title, desc),
        sourceName: 'Adzuna',
        sourceUrl: item.redirect_url || 'https://www.adzuna.com',
        sourceJobId: `adzuna-${item.id}`,
        postedAt: item.created ? new Date(item.created) : new Date(),
        isInternship: false,
      }
    })
  } catch {
    return []
  }
}

// 3. Fetch from Jobicy Public Live API
async function fetchFromJobicy(filter: JobFilter): Promise<NormalizedLiveJob[]> {
  try {
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=50', {
      next: { revalidate: 1800 },
    })
    if (!res.ok) return []
    const data = await res.json()
    const list = data?.jobs || []

    const q = filter.q || ''
    const loc = (filter.location || filter.city || '').toLowerCase()

    return list
      .filter((item: any) => {
        if (!matchesTextQuery(item.jobTitle || '', item.jobDescription || '', item.jobIndustry || [], q)) {
          return false
        }
        if (loc && !item.jobGeo?.toLowerCase().includes(loc)) {
          return false
        }
        return true
      })
      .map((item: any) => {
        const title = item.jobTitle || 'Specialist'
        const desc = item.jobDescription?.replace(/<\/?[^>]+(>|$)/g, '') || ''
        return {
          title,
          companyName: item.companyName || 'Global Enterprise',
          companyLogoUrl: item.companyLogo || null,
          city: item.jobGeo || 'Remote',
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
          description: desc,
          skills: Array.isArray(item.jobIndustry) ? item.jobIndustry : ['Tech'],
          degree: 'Bachelor',
          branch: inferBranch(title, desc),
          sourceName: 'Jobicy',
          sourceUrl: item.url || 'https://jobicy.com',
          sourceJobId: `jobicy-${item.id}`,
          postedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          isInternship: item.jobType?.toLowerCase().includes('intern') || false,
        }
      })
  } catch {
    return []
  }
}

// 4. Fetch from Arbeitnow Public Live API
async function fetchFromArbeitnow(filter: JobFilter): Promise<NormalizedLiveJob[]> {
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    const list = data?.data || []

    const q = filter.q || ''
    const loc = (filter.location || filter.city || '').toLowerCase()

    return list
      .filter((item: any) => {
        if (!matchesTextQuery(item.title || '', item.description || '', item.tags || [], q)) {
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
      .slice(0, 20)
      .map((item: any) => {
        const title = item.title || 'Engineering Specialist'
        const desc = item.description?.replace(/<\/?[^>]+(>|$)/g, '') || ''
        return {
          title,
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
          description: desc,
          skills: Array.isArray(item.tags) ? item.tags : ['Tech'],
          degree: 'Bachelor',
          branch: inferBranch(title, desc),
          sourceName: 'Arbeitnow',
          sourceUrl: item.url || 'https://www.arbeitnow.com',
          sourceJobId: `arbeitnow-${item.slug || Math.random().toString(36).slice(2)}`,
          postedAt: item.created_at ? new Date(item.created_at * 1000) : new Date(),
          isInternship: false,
        }
      })
  } catch {
    return []
  }
}

// 5. Fetch from Remotive Public Live Remote Jobs API
async function fetchFromRemotive(filter: JobFilter): Promise<NormalizedLiveJob[]> {
  try {
    const rawQ = filter.q || ''
    let queryParam = rawQ
    if (/ui[\s/_-]?ux|designer|figma|product\s+design/i.test(rawQ)) {
      queryParam = 'design'
    } else if (/developer|frontend|react|node|python|backend/i.test(rawQ)) {
      queryParam = 'developer'
    }

    const res = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(queryParam)}&limit=30`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    const list = data?.jobs || []

    return list
      .filter((item: any) => {
        return matchesTextQuery(item.title || '', item.description || '', item.tags || [item.category || ''], rawQ)
      })
      .slice(0, 20)
      .map((item: any) => {
        const title = item.title || 'Remote Specialist'
        const desc = item.description?.replace(/<\/?[^>]+(>|$)/g, '') || ''
        return {
          title,
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
          description: desc,
          skills: Array.isArray(item.tags) ? item.tags : ['Product Design'],
          degree: 'Bachelor',
          branch: inferBranch(title, desc),
          sourceName: 'Remotive',
          sourceUrl: item.url || 'https://remotive.com',
          sourceJobId: `remotive-${item.id}`,
          postedAt: item.publication_date ? new Date(item.publication_date) : new Date(),
          isInternship: false,
        }
      })
  } catch {
    return []
  }
}

// Synchronize and persist live jobs into the database
export async function syncLiveJobsToDatabase(liveJobs: NormalizedLiveJob[]) {
  if (liveJobs.length === 0) return

  for (const job of liveJobs) {
    try {
      let company = await db.company.findFirst({
        where: { name: job.companyName },
      })
      if (!company) {
        company = await db.company.create({
          data: {
            name: job.companyName,
            logoUrl: job.companyLogoUrl || null,
            industry: job.branch || 'Technology',
            companySize: '51-200',
            companyType: 'product',
            headquarters: job.city || 'Global',
            verified: true,
            website: job.sourceUrl,
          },
        })
      }

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
            degree: job.degree,
            branch: job.branch,
            isInternship: job.isInternship,
            isDemo: false,
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

// Master function to fetch 100% real-time live jobs
export async function getLiveJobs(filter: JobFilter): Promise<NormalizedLiveJob[]> {
  const [jsearch, jobicy, arbeitnow, remotive, adzuna] = await Promise.all([
    fetchFromJSearch(filter),
    fetchFromJobicy(filter),
    fetchFromArbeitnow(filter),
    fetchFromRemotive(filter),
    fetchFromAdzuna(filter),
  ])

  let combined = [...jsearch, ...jobicy, ...arbeitnow, ...remotive, ...adzuna]

  // Filter combined results by query if specified
  const q = filter.q || ''
  if (q) {
    combined = combined.filter((j) => matchesTextQuery(j.title, j.description, j.skills, q))
  }

  // Filter combined results by branch if specified
  if (filter.branch && filter.branch.length > 0) {
    combined = combined.filter((j) => {
      if (!j.branch) return true
      return filter.branch!.some((b) => j.branch!.toLowerCase().includes(b.toLowerCase()))
    })
  }

  // Persist live jobs to DB in background
  if (combined.length > 0) {
    syncLiveJobsToDatabase(combined).catch(() => {})
  }

  return combined
}
