import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { profileCompletionPct } from '@/lib/jobs'
import type { ProfileData } from '@/lib/types'

const UPDATABLE_FIELDS = [
  'headline', 'phone', 'currentLocation', 'preferredLocations', 'dateOfBirth', 'gender',
  'highestQualification', 'degree', 'specialization', 'branch', 'university', 'college',
  'graduationYear', 'cgpa', 'percentage', 'backlogs', 'activeBacklogs', 'gapYears',
  'experienceKind', 'totalExperienceYears',
  'desiredJobTitle', 'desiredRoles', 'industries', 'salaryExpectationMin', 'salaryExpectationMax',
  'employmentType', 'remotePreference', 'willingToRelocate', 'shiftPreference',
  'technicalSkills', 'softSkills', 'tools', 'certifications',
  'githubUrl', 'linkedinUrl', 'portfolioUrl', 'behanceUrl', 'dribbbleUrl', 'kaggleUrl',
  'researchgateUrl', 'resumeUrl',
] as const

function serialize(p: any): ProfileData {
  return {
    id: p.id,
    userId: p.userId,
    headline: p.headline,
    phone: p.phone,
    currentLocation: p.currentLocation,
    preferredLocations: p.preferredLocations,
    highestQualification: p.highestQualification,
    degree: p.degree,
    specialization: p.specialization,
    branch: p.branch,
    university: p.university,
    college: p.college,
    graduationYear: p.graduationYear,
    cgpa: p.cgpa,
    percentage: p.percentage,
    backlogs: p.backlogs,
    activeBacklogs: p.activeBacklogs,
    gapYears: p.gapYears,
    experienceKind: p.experienceKind,
    totalExperienceYears: p.totalExperienceYears,
    desiredJobTitle: p.desiredJobTitle,
    desiredRoles: p.desiredRoles,
    industries: p.industries,
    salaryExpectationMin: p.salaryExpectationMin,
    salaryExpectationMax: p.salaryExpectationMax,
    employmentType: p.employmentType,
    remotePreference: p.remotePreference,
    willingToRelocate: p.willingToRelocate,
    shiftPreference: p.shiftPreference,
    technicalSkills: p.technicalSkills,
    softSkills: p.softSkills,
    tools: p.tools,
    certifications: p.certifications,
    githubUrl: p.githubUrl,
    linkedinUrl: p.linkedinUrl,
    portfolioUrl: p.portfolioUrl,
    behanceUrl: p.behanceUrl,
    dribbbleUrl: p.dribbbleUrl,
    kaggleUrl: p.kaggleUrl,
    researchgateUrl: p.researchgateUrl,
    resumeUrl: p.resumeUrl,
    completionPct: profileCompletionPct(p),
  }
}

export async function GET() {
  try {
    const user = await requireUser(['candidate'])
    if (!user) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 })
    }
    let profile = await db.profile.findUnique({ where: { userId: user.id } })
    if (!profile) {
      profile = await db.profile.create({ data: { userId: user.id } })
    }
    return NextResponse.json(serialize(profile))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'profile fetch failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser(['candidate'])
    if (!user) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 })
    }
    const body = await req.json().catch(() => ({}))
    const data: Record<string, unknown> = {}
    for (const f of UPDATABLE_FIELDS) {
      if (f in body) {
        const v = (body as any)[f]
        if (v === null || v === undefined) {
          data[f] = null
        } else if (typeof v === 'number') {
          data[f] = Number.isFinite(v) ? v : null
        } else if (typeof v === 'boolean') {
          data[f] = v
        } else if (typeof v === 'string') {
          data[f] = v
        }
      }
    }

    let profile = await db.profile.findUnique({ where: { userId: user.id } })
    if (!profile) {
      profile = await db.profile.create({ data: { userId: user.id, ...(data as any) } })
    } else if (Object.keys(data).length > 0) {
      profile = await db.profile.update({ where: { userId: user.id }, data: data as any })
    }

    return NextResponse.json(serialize(profile))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'profile update failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
