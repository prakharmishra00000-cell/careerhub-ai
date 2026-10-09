// CareerHub AI — job filter parsing, formatting, query building helpers
// Shared between API and UI.

import type { Prisma } from '@prisma/client'
import type { JobFilter, JobCardData } from './types'

export const DEGREES = ['BTech', 'BE', 'MTech', 'ME', 'BCA', 'MCA', 'BBA', 'MBA', 'BCom', 'MCom', 'BSc', 'MSc', 'BA', 'MA', 'PhD', 'Diploma', 'ITI', 'Polytechnic'] as const
export const BRANCHES = [
  'CSE', 'IT', 'AI', 'ML', 'Data Science', 'Cybersecurity', 'IoT', 'ECE', 'EEE',
  'Mechanical', 'Civil', 'Electrical', 'Chemical', 'Production', 'Automobile', 'Aerospace',
  'Robotics', 'Mechatronics', 'Metallurgy', 'Mining', 'Petroleum',
  'Biotech', 'Biomedical', 'Environmental', 'Instrumentation', 'Architecture',
  'Finance', 'Accounting', 'HR', 'Operations', 'Marketing', 'Business Analytics', 'Statistics',
  'English', 'Biotechnology', 'Any Branch'
] as const
export const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'temporary', 'freelance', 'internship', 'apprenticeship', 'trainee', 'graduate_program', 'management_trainee', 'work_study', 'volunteer', 'fellowship', 'research', 'coop'] as const
export const REMOTE_TYPES = ['remote', 'hybrid', 'onsite', 'work_from_home'] as const
export const COMPANY_TYPES = ['startup', 'mnc', 'government', 'psu', 'ngo', 'non_profit', 'consulting', 'product', 'service', 'agency', 'research', 'university'] as const
export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'] as const
export const BACKLOG_POLICIES = ['allowed', 'not_allowed', 'current_allowed', 'previous_allowed', 'not_specified'] as const
export const SALARY_PERIODS = ['annual', 'monthly', 'hourly', 'daily'] as const
export const SORT_OPTIONS = ['relevance', 'newest', 'salary_high', 'salary_low', 'best_match', 'closing_soon', 'recently_updated'] as const

export function parseExperienceFilter(v?: string): { min: number; max: number } | null {
  if (!v) return null
  if (v === 'fresher') return { min: 0, max: 0 }
  const m = v.match(/^(\d+)-?(\d*)$/)
  if (!m) return null
  const min = parseInt(m[1], 10)
  const max = m[2] ? parseInt(m[2], 10) : min
  return { min, max }
}

export function formatSalary(min: number | null, max: number | null, currency = 'INR', period?: string | null, disclosed?: boolean): string {
  if (!disclosed) return 'Salary not disclosed'
  if (min == null && max == null) return 'Salary not disclosed'
  // unpaid / volunteer / zero-salary roles
  if ((min == null || min === 0) && (max == null || max === 0)) return 'Unpaid / stipend-based'
  const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : ''
  if (min != null && max != null && min !== max) return `${sym}${(min / 100000).toFixed(min % 100000 === 0 ? 0 : 1)}–${(max / 100000).toFixed(max % 100000 === 0 ? 0 : 1)} LPA`
  if (min != null) return `${sym}${(min / 100000).toFixed(min % 100000 === 0 ? 0 : 1)} LPA`
  if (max != null) return `${sym}${(max / 100000).toFixed(max % 100000 === 0 ? 0 : 1)} LPA`
  return 'Salary not disclosed'
}

export function formatStipend(min: number | null, max: number | null, paid?: string | null): string {
  if (paid === 'unpaid') return 'Unpaid'
  if (paid === 'stipend_not_disclosed') return 'Stipend not disclosed'
  if (min == null && max == null) return 'Stipend not disclosed'
  const fmt = (n: number) => n >= 1000 ? `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : `₹${n}`
  if (min != null && max != null && min !== max) return `${fmt(min)}–${fmt(max)}/mo`
  if (min != null) return `${fmt(min)}/mo`
  if (max != null) return `${fmt(max)}/mo`
  return 'Stipend not disclosed'
}

export function timeAgo(dateStr: string): string {
  const d = new Date(dateStr).getTime()
  const diff = Date.now() - d
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr).getTime()
  return Math.ceil((d - Date.now()) / 86400000)
}

export function freshnessLabel(postedAt: string, lastVerifiedAt?: string | null): string {
  const days = (Date.now() - new Date(postedAt).getTime()) / 86400000
  if (days < 1) return 'Today'
  if (days < 2) return 'Yesterday'
  if (days < 7) return 'This week'
  if (days < 14) return 'Recently updated'
  if (days < 30) return 'This month'
  if (lastVerifiedAt && (Date.now() - new Date(lastVerifiedAt).getTime()) / 86400000 > 14) return 'Possibly outdated'
  return `${Math.floor(days)}d ago`
}

// Build a Prisma where clause from a JobFilter
export function buildJobWhere(f: JobFilter): Prisma.JobWhereInput {
  const where: Prisma.JobWhereInput = { status: 'active' }

  // text query
  if (f.q && f.q.trim()) {
    const q = f.q.trim()
    where.OR = [
      { title: { contains: q } },
      { companyName: { contains: q } },
      { skills: { contains: q } },
      { description: { contains: q } },
      { city: { contains: q } },
      { state: { contains: q } },
    ]
  }

  // location
  if (f.location) {
    where.OR = where.OR
      ? [...(where.OR as any[]), { city: { contains: f.location } }, { state: { contains: f.location } }, { country: { contains: f.location } }]
      : [{ city: { contains: f.location } }, { state: { contains: f.location } }, { country: { contains: f.location } }]
  }
  if (f.city) where.city = { contains: f.city }

  if (f.remoteType && f.remoteType.length) {
    where.remoteType = { in: f.remoteType }
  }

  if (f.employmentType && f.employmentType.length) {
    where.employmentType = { in: f.employmentType }
  }

  if (f.degree && f.degree.length) {
    where.degree = { in: f.degree }
  }
  if (f.branch && f.branch.length) {
    where.OR = where.OR
      ? [...(where.OR as any[]), ...f.branch.map((b) => ({ branch: { contains: b } }))]
      : f.branch.map((b) => ({ branch: { contains: b } }))
  }

  const exp = parseExperienceFilter(f.experience)
  if (exp) {
    where.experienceMin = { gte: exp.min }
    where.experienceMax = { lte: exp.max }
  }

  if (f.fresherFriendly) {
    where.fresherFriendly = true
  }
  if (typeof f.isInternship === 'boolean') {
    where.isInternship = f.isInternship
  }

  if (f.minSalary) where.salaryMax = { gte: f.minSalary }
  if (f.maxSalary) where.salaryMin = { lte: f.maxSalary }

  if (f.minStipend) where.stipendMax = { gte: f.minStipend }
  if (f.stipendPaid) where.internshipPaid = f.stipendPaid === 'not_disclosed' ? 'stipend_not_disclosed' : f.stipendPaid
  if (f.internshipDuration) where.internshipDurationMonths = { lte: f.internshipDuration }
  if (f.ppoAvailable) where.ppoAvailable = true

  if (f.source && f.source.length) {
    where.source = { name: { in: f.source } }
  }

  if (f.companyType && f.companyType.length) {
    where.company = { companyType: { in: f.companyType } }
  }
  if (f.companySize && f.companySize.length) {
    where.company = { ...((where.company as any) || {}), companySize: { in: f.companySize } }
  }
  if (f.companyVerified) {
    where.company = { ...((where.company as any) || {}), verified: true }
  }

  if (f.backlogPolicy && f.backlogPolicy.length) {
    where.backlogPolicy = { in: f.backlogPolicy }
  }
  if (f.minCgpa) {
    // jobs with cgpaRequirement >= minCgpa OR cgpaRequirement IS NULL (not specified) — be honest
    where.OR = where.OR
      ? [...(where.OR as any[]), { cgpaRequirement: { gte: f.minCgpa } }, { cgpaRequirement: null }]
      : [{ cgpaRequirement: { gte: f.minCgpa } }, { cgpaRequirement: null }]
  }

  return where
}

export function buildJobOrderBy(f: JobFilter): Prisma.JobOrderByWithRelationInput {
  switch (f.sort) {
    case 'newest': return { postedAt: 'desc' }
    case 'salary_high': return { salaryMax: 'desc' }
    case 'salary_low': return { salaryMin: 'asc' }
    case 'closing_soon': return { applicationDeadline: 'asc' }
    case 'recently_updated': return { updatedAt: 'desc' }
    case 'best_match': return { postedAt: 'desc' } // best_match handled at app layer with scoring
    default: return { postedAt: 'desc' }
  }
}

// Convert a DB job row to a JobCardData (client-safe)
export function jobToCard(j: any): JobCardData {
  return {
    id: j.id,
    slug: j.slug,
    title: j.title,
    companyName: j.companyName,
    companyLogoUrl: j.companyLogoUrl,
    companyVerified: j.company?.verified ?? false,
    companyId: j.companyId,
    city: j.city,
    state: j.state,
    country: j.country,
    remoteType: j.remoteType,
    employmentType: j.employmentType,
    experienceMin: j.experienceMin,
    experienceMax: j.experienceMax,
    fresherFriendly: j.fresherFriendly,
    salaryMin: j.salaryMin,
    salaryMax: j.salaryMax,
    salaryCurrency: j.salaryCurrency,
    salaryPeriod: j.salaryPeriod,
    salaryDisclosed: j.salaryDisclosed,
    degree: j.degree,
    branch: j.branch,
    skills: j.skills ? j.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
    isInternship: j.isInternship,
    internshipDurationMonths: j.internshipDurationMonths,
    internshipPaid: j.internshipPaid,
    stipendMin: j.stipendMin,
    stipendMax: j.stipendMax,
    ppoAvailable: j.ppoAvailable,
    backlogPolicy: j.backlogPolicy,
    cgpaRequirement: j.cgpaRequirement,
    postedAt: j.postedAt.toISOString ? j.postedAt.toISOString() : j.postedAt,
    applicationDeadline: j.applicationDeadline?.toISOString ? j.applicationDeadline.toISOString() : j.applicationDeadline ?? null,
    lastVerifiedAt: j.lastVerifiedAt?.toISOString ? j.lastVerifiedAt.toISOString() : j.lastVerifiedAt ?? null,
    sourceName: j.source?.name ?? null,
    sourceUrl: j.sourceUrl,
    isDemo: j.isDemo,
    viewCount: j.viewCount,
    applicationCount: j.applicationCount,
    duplicateCount: j._count?.savedBy ?? undefined,
  }
}

export function profileCompletionPct(p: any): number {
  const fields = [
    'headline', 'phone', 'currentLocation', 'preferredLocations',
    'highestQualification', 'degree', 'branch', 'university', 'graduationYear', 'cgpa',
    'experienceKind', 'desiredJobTitle', 'desiredRoles', 'industries', 'employmentType',
    'remotePreference', 'technicalSkills', 'githubUrl', 'linkedinUrl', 'resumeUrl',
  ]
  let filled = 0
  for (const f of fields) {
    const v = p[f]
    if (v !== null && v !== undefined && v !== '' && !(typeof v === 'number' && v === 0 && f === 'cgpa')) filled++
  }
  return Math.round((filled / fields.length) * 100)
}

export function employmentTypeLabel(t: string | null): string {
  if (!t) return ''
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function remoteTypeLabel(t: string | null): string {
  if (!t) return ''
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
