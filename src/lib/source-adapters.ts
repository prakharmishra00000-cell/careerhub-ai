// Source adapters — real job fetching from free public APIs
// These are legitimate, free, no-API-key-required public endpoints.

import { db } from '@/lib/db'

export interface FetchedJob {
  title: string
  companyName: string
  description: string
  sourceUrl: string
  city?: string
  country?: string
  remoteType?: string
  employmentType?: string
  skills?: string[]
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  sourceName: string
  tags?: string[]
}

// ============================================================
// Remotive — Free remote jobs API (no key needed)
// https://remotive.com/api/remote-jobs
// ============================================================
export async function fetchRemotive(): Promise<FetchedJob[]> {
  // Dynamic URL to bypass Next.js fetch cache analysis
  const url = 'https://remotive.com/api/' + 'remote-jobs?limit=100'
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Remotive: ${res.status}`)
  const data = await res.json()
  const jobs: FetchedJob[] = (data.jobs || []).map((j: any) => ({
    title: j.title?.trim() || 'Untitled',
    companyName: j.company_name?.trim() || 'Unknown',
    description: (j.description || '').replace(/<[^>]*>/g, '').slice(0, 5000),
    sourceUrl: j.url || 'https://remotive.com',
    city: j.candidate_required_location?.split(',')[0]?.trim() || 'Remote',
    country: 'Worldwide',
    remoteType: 'remote',
    employmentType: j.job_type || 'full_time',
    skills: j.tags?.slice(0, 8) || [],
    sourceName: 'Remotive',
    tags: j.tags || [],
  }))
  return jobs
}

// ============================================================
// Arbeitnow — Free job board API (no key needed)
// https://www.arbeitnow.com/api/job-board-api
// ============================================================
export async function fetchArbeitnow(): Promise<FetchedJob[]> {
  // Dynamic URL to bypass Next.js fetch cache analysis (response >2MB)
  const url = 'https://www.arbeitnow.com/api/' + 'job-board-api?page=1'
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Arbeitnow: ${res.status}`)
  const data = await res.json()
  // Only take first 50 to keep response size manageable
  const jobs: FetchedJob[] = (data.data || []).slice(0, 50).map((j: any) => ({
    title: j.title?.trim() || 'Untitled',
    companyName: j.company_name?.trim() || 'Unknown',
    description: (j.description || '').replace(/<[^>]*>/g, '').slice(0, 5000),
    sourceUrl: j.url || 'https://www.arbeitnow.com',
    city: j.location?.split(',')[0]?.trim() || 'Not specified',
    country: j.location?.includes('Germany') ? 'Germany' : j.location || 'Europe',
    remoteType: j.remote ? 'remote' : 'onsite',
    employmentType: 'full_time',
    skills: j.tags?.slice(0, 8) || [],
    sourceName: 'Arbeitnow',
    tags: j.tags || [],
  }))
  return jobs
}

// ============================================================
// RemoteOK — Free remote jobs API (no key needed)
// https://remoteok.com/api
// ============================================================
export async function fetchRemoteOK(): Promise<FetchedJob[]> {
  const url = 'https://remoteok.com/' + 'api'
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`RemoteOK: ${res.status}`)
  const data = await res.json()
  // First element is metadata, rest are jobs
  const jobs: FetchedJob[] = (Array.isArray(data) ? data.slice(1) : []).slice(0, 50).map((j: any) => ({
    title: j.position?.trim() || 'Untitled',
    companyName: j.company?.trim() || 'Unknown',
    description: (j.description || '').replace(/<[^>]*>/g, '').slice(0, 5000),
    sourceUrl: j.url ? (j.url.startsWith('http') ? j.url : `https://remoteok.com${j.url}`) : 'https://remoteok.com',
    city: j.location?.split(',')[0]?.trim() || 'Remote',
    country: j.location || 'Worldwide',
    remoteType: 'remote',
    employmentType: 'full_time',
    skills: j.tags?.slice(0, 8) || [],
    sourceName: 'RemoteOK',
    tags: j.tags || [],
  }))
  return jobs
}

// ============================================================
// Fetch all sources and sync to DB
// ============================================================
export async function syncAllSources(): Promise<{ totalInserted: number; totalSkipped: number; totalErrors: number; sources: any[] }> {
  const sources = [
    { name: 'Remotive', fn: fetchRemotive },
    { name: 'Arbeitnow', fn: fetchArbeitnow },
    { name: 'RemoteOK', fn: fetchRemoteOK },
  ]
  let totalInserted = 0
  let totalSkipped = 0
  let totalErrors = 0
  const results: any[] = []

  for (const s of sources) {
    try {
      const jobs = await s.fn()
      const res = await syncJobsToDatabase(s.name, jobs)
      results.push({ name: s.name, fetched: jobs.length, ...res })
      totalInserted += res.inserted
      totalSkipped += res.skipped
      totalErrors += res.errors
    } catch (e: any) {
      results.push({ name: s.name, error: e.message })
      totalErrors++
    }
  }
  return { totalInserted, totalSkipped, totalErrors, sources: results }
}

// ============================================================
// Persist fetched jobs into the database
// ============================================================
export async function syncJobsToDatabase(sourceName: string, jobs: FetchedJob[]): Promise<{ inserted: number; skipped: number; errors: number }> {
  let inserted = 0
  let skipped = 0
  let errors = 0

  // Get or create the source record
  let source = await db.jobSource.findFirst({ where: { name: sourceName } })
  if (!source) {
    source = await db.jobSource.create({
      data: {
        name: sourceName,
        kind: 'api',
        baseUrl: sourceName === 'Remotive' ? 'https://remotive.com' : 'https://www.arbeitnow.com',
        enabled: true,
        syncFrequency: 'hourly',
        parserVersion: '2.0.0',
      },
    })
  }

  for (const j of jobs) {
    try {
      // Deduplicate by sourceUrl
      const existing = await db.job.findFirst({ where: { sourceUrl: j.sourceUrl }, select: { id: true } })
      if (existing) { skipped++; continue }

      // Get or create company
      let company = await db.company.findFirst({ where: { name: j.companyName } })
      if (!company) {
        company = await db.company.create({
          data: {
            name: j.companyName,
            companyType: 'product',
            companySize: 'Unknown',
            industry: j.tags?.[0] || 'Technology',
            verified: false,
          },
        })
      }

      // Build slug
      const slug = j.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) + '-' + Math.random().toString(36).slice(2, 6)

      await db.job.create({
        data: {
          sourceId: source.id,
          sourceJobId: j.sourceUrl,
          sourceUrl: j.sourceUrl,
          companyId: company.id,
          companyName: company.name,
          title: j.title.slice(0, 300),
          slug,
          description: j.description.slice(0, 10000),
          city: j.city,
          country: j.country,
          remoteType: j.remoteType,
          employmentType: j.employmentType || 'full_time',
          skills: j.skills?.join(', ') || null,
          salaryCurrency: j.salaryCurrency || 'USD',
          salaryDisclosed: false,
          fresherFriendly: /junior|fresher|entry|intern/i.test(j.title),
          isDemo: false,
          status: 'active',
          postedAt: new Date(),
          lastVerifiedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 86400000),
        },
      })
      inserted++
    } catch (e) {
      errors++
    }
  }

  // Update source health
  await db.jobSource.update({
    where: { id: source.id },
    data: {
      lastSyncAt: new Date(),
      lastSuccessAt: new Date(),
      jobsFetched: { increment: inserted },
      errorRate: 0,
    },
  })

  return { inserted, skipped, errors }
}
