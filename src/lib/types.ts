// CareerHub AI — shared TypeScript types (used across API + UI)

export type Role = 'candidate' | 'recruiter' | 'company_admin' | 'admin' | 'moderator'

export type View =
  | 'landing'
  | 'search'
  | 'job'
  | 'dashboard'
  | 'profile'
  | 'profile-edit'
  | 'saved'
  | 'applications'
  | 'alerts'
  | 'resume'
  | 'resume-analyzer'
  | 'resume-builder'
  | 'career-ai'
  | 'companies'
  | 'company'
  | 'recruiter'
  | 'recruiter-jobs'
  | 'recruiter-new-job'
  | 'recruiter-applications'
  | 'admin'
  | 'admin-users'
  | 'admin-jobs'
  | 'admin-sources'
  | 'admin-companies'
  | 'admin-reports'
  | 'admin-analytics'
  | 'settings'
  | 'internships'
  | 'remote-jobs'
  | 'freshers'
  | 'government-jobs'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
  avatarUrl?: string | null
}

// ---------- Filter state (URL-shareable) ----------
export interface JobFilter {
  q?: string
  location?: string
  city?: string
  remoteType?: string[]      // remote | hybrid | onsite | work_from_home
  employmentType?: string[] // full_time | internship | etc.
  degree?: string[]
  branch?: string[]
  experience?: string        // fresher | 0-1 | 1-2 | 2-3 | 3-5 | 5-10 | 10+
  fresherFriendly?: boolean
  isInternship?: boolean
  minSalary?: number
  maxSalary?: number
  minStipend?: number
  stipendPaid?: 'paid' | 'unpaid' | 'not_disclosed'
  internshipDuration?: number
  ppoAvailable?: boolean
  source?: string[]          // source names
  companyType?: string[]     // startup | mnc | government | psu ...
  companySize?: string[]
  companyVerified?: boolean
  backlogPolicy?: string[]   // allowed | not_allowed | current_allowed | not_specified
  cgpaRequirement?: 'none' | 'not_specified' | number
  minCgpa?: number
  sort?: 'relevance' | 'newest' | 'salary_high' | 'salary_low' | 'best_match' | 'closing_soon' | 'recently_updated'
  page?: number
  pageSize?: number
}

export interface JobCardData {
  id: string
  slug: string
  title: string
  companyName: string
  companyLogoUrl: string | null
  companyVerified: boolean
  companyId: string | null
  city: string | null
  state: string | null
  country: string | null
  remoteType: string | null
  employmentType: string | null
  experienceMin: number | null
  experienceMax: number | null
  fresherFriendly: boolean
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
  salaryPeriod: string | null
  salaryDisclosed: boolean
  degree: string | null
  branch: string | null
  skills: string[]
  isInternship: boolean
  internshipDurationMonths: number | null
  internshipPaid: string | null
  stipendMin: number | null
  stipendMax: number | null
  ppoAvailable: boolean
  backlogPolicy: string | null
  cgpaRequirement: number | null
  postedAt: string
  applicationDeadline: string | null
  lastVerifiedAt: string | null
  sourceName: string | null
  sourceUrl: string | null
  isDemo: boolean
  viewCount: number
  applicationCount: number
  // duplicate info
  duplicateCount?: number
  duplicateSources?: string[]
}

export interface JobDetails extends JobCardData {
  description: string
  responsibilities: string | null
  requirements: string | null
  benefits: string[] | null
  sourceId: string | null
  sourceJobId: string | null
  status: string
  expiresAt: string | null
  updatedAt: string
  postedById: string | null
  createdAt: string
  company?: {
    id: string
    name: string
    industry: string | null
    companySize: string | null
    companyType: string | null
    headquarters: string | null
    description: string | null
    website: string | null
    verified: boolean
  } | null
  // match score (candidate only)
  matchScore?: MatchScore
  savedByMe?: boolean
  appliedByMe?: boolean
}

export interface MatchScore {
  total: number
  label: 'Excellent match' | 'Good match' | 'Partial match' | 'Low match'
  breakdown: {
    education: number
    skills: number
    experience: number
    location: number
    salary: number
    career: number
  }
  eligibility: { label: string; ok: boolean; warn?: boolean }[]
}

export interface SavedJobItem extends JobCardData {
  savedAt: string
  folder: string
  notes: string | null
}

export interface ApplicationItem extends JobCardData {
  status: string
  appliedAt: string
  updatedAt: string
  deadline: string | null
  interviewDate: string | null
  notes: string | null
}

export interface CompanyListItem {
  id: string
  name: string
  logoUrl: string | null
  industry: string | null
  companySize: string | null
  companyType: string | null
  headquarters: string | null
  description: string | null
  verified: boolean
  openJobs: number
}

export interface CompanyDetails extends CompanyListItem {
  website: string | null
  jobs: JobCardData[]
}

export interface JobSourceHealth {
  id: string
  name: string
  kind: string
  enabled: boolean
  lastSyncAt: string | null
  lastSuccessAt: string | null
  lastErrorAt: string | null
  lastErrorMessage: string | null
  jobsFetched: number
  jobsUpdated: number
  jobsFailed: number
  errorRate: number
  quotaUsed: number
  quotaLimit: number
  syncFrequency: string
  parserVersion: string
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
}

export interface NotificationItem {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  read: boolean
  createdAt: string
}

export interface AlertItem {
  id: string
  name: string
  query: string
  frequency: string
  channels: string
  paused: boolean
  lastTriggeredAt: string | null
  createdAt: string
}

export interface ProfileData {
  id: string
  userId: string
  headline: string | null
  phone: string | null
  currentLocation: string | null
  preferredLocations: string | null
  highestQualification: string | null
  degree: string | null
  specialization: string | null
  branch: string | null
  university: string | null
  college: string | null
  graduationYear: number | null
  cgpa: number | null
  percentage: number | null
  backlogs: number
  activeBacklogs: number
  gapYears: number
  experienceKind: string | null
  totalExperienceYears: number | null
  desiredJobTitle: string | null
  desiredRoles: string | null
  industries: string | null
  salaryExpectationMin: number | null
  salaryExpectationMax: number | null
  employmentType: string | null
  remotePreference: string | null
  willingToRelocate: boolean
  shiftPreference: string | null
  technicalSkills: string | null
  softSkills: string | null
  tools: string | null
  certifications: string | null
  githubUrl: string | null
  linkedinUrl: string | null
  portfolioUrl: string | null
  behanceUrl: string | null
  dribbbleUrl: string | null
  kaggleUrl: string | null
  researchgateUrl: string | null
  resumeUrl: string | null
  completionPct: number
}

export interface AdminMetrics {
  totalUsers: number
  activeUsers: number
  jobsIndexed: number
  jobsToday: number
  jobsUpdated: number
  jobsExpired: number
  sourcesActive: number
  sourceFailures: number
  applications: number
  savedJobs: number
  reportedJobs: number
  duplicateJobs: number
  searches: number
  // distributions
  byRole: Record<string, number>
  bySource: Record<string, number>
  byCity: Record<string, number>
  byBranch: Record<string, number>
  byEmploymentType: Record<string, number>
  // time series (last 14 days of jobs posted)
  jobsTimeline: { date: string; count: number }[]
  topSearches: { term: string; count: number }[]
}

export interface AIAssistantTurn {
  role: 'user' | 'assistant'
  content: string
  filters?: Partial<JobFilter>
  jobId?: string
  resultsCount?: number
  createdAt: string
}
