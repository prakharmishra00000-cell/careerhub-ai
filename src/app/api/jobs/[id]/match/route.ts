import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import type { MatchScore } from '@/lib/types'

const RELATED_DEGREES: Record<string, string[]> = {
  BTech: ['BE', 'MTech', 'ME', 'MCA', 'BCA', 'BSc', 'MSc'],
  BE: ['BTech', 'ME', 'MTech', 'MCA'],
  MTech: ['BTech', 'BE', 'ME', 'MSc'],
  ME: ['BTech', 'BE', 'MTech', 'MSc'],
  BCA: ['MCA', 'BSc', 'BTech'],
  MCA: ['BCA', 'BTech', 'BE'],
  BSc: ['MSc', 'BCA', 'BTech'],
  MSc: ['BSc', 'MTech', 'ME'],
  BBA: ['MBA'],
  MBA: ['BBA', 'BCom', 'BA'],
  BCom: ['MCom', 'MBA'],
  MCom: ['BCom', 'MBA'],
  BA: ['MA'],
  MA: ['BA'],
}

function tokenize(s: string | null | undefined): string[] {
  if (!s) return []
  return s.toLowerCase().split(/[,\n/|;&]+/).map((t) => t.trim()).filter(Boolean)
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(['candidate'])
    if (!user) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 })
    }

    const { id } = await params
    const [job, profile] = await Promise.all([
      db.job.findUnique({ where: { id }, include: { company: true, source: true } }),
      db.profile.findUnique({ where: { userId: user.id } }),
    ])
    if (!job) {
      return NextResponse.json({ error: 'job not found' }, { status: 404 })
    }
    if (!profile) {
      return NextResponse.json({ error: 'profile not found' }, { status: 404 })
    }

    // --- Education ---
    let education = 30
    const jobDegree = job.degree?.trim()
    const profDegree = profile.degree?.trim()
    if (!jobDegree) {
      education = 100
    } else if (profDegree && profDegree === jobDegree) {
      education = 100
    } else if (profDegree && (RELATED_DEGREES[jobDegree]?.includes(profDegree) || RELATED_DEGREES[profDegree]?.includes(jobDegree))) {
      education = 70
    } else {
      education = 30
    }

    // --- Skills ---
    const jobSkills = tokenize(job.skills)
    let skills: number
    if (jobSkills.length === 0) {
      // No skills specified on the job — neutral score so users aren't penalized
      skills = 70
    } else {
      const profSkillsRaw = [
        ...tokenize(profile.technicalSkills),
        ...tokenize(profile.softSkills),
        ...tokenize(profile.tools),
      ]
      const profSkills = new Set(profSkillsRaw)
      let matched = 0
      for (const s of jobSkills) {
        // case-insensitive substring match against any profile skill
        for (const ps of profSkills) {
          if (ps.includes(s) || s.includes(ps)) {
            matched += 1
            break
          }
        }
      }
      skills = Math.round((matched / jobSkills.length) * 100)
    }

    // --- Experience ---
    const expYears = profile.totalExperienceYears ?? 0
    let experience = 40
    const min = job.experienceMin ?? 0
    const max = job.experienceMax ?? 0
    const isFresher = (profile.experienceKind ?? '') === 'fresher' || expYears === 0
    if (expYears >= min && (max === 0 || expYears <= max)) {
      experience = 100
    } else if (isFresher && job.fresherFriendly) {
      experience = 80
    } else {
      experience = 40
    }

    // --- Location ---
    const prefLocsRaw = (profile.preferredLocations ?? '').toLowerCase()
    const prefLocs = prefLocsRaw.split(/[,\n/|;&]+/).map((s) => s.trim()).filter(Boolean)
    const jobCity = (job.city ?? '').toLowerCase()
    const jobCountry = (job.country ?? '').toLowerCase()
    const remotePref = (profile.remotePreference ?? '').toLowerCase()
    const jobRemote = (job.remoteType ?? '').toLowerCase()
    let location = 40
    if (
      (jobCity && prefLocs.some((p) => p.includes(jobCity) || jobCity.includes(p))) ||
      (jobRemote && (remotePref === 'any' || remotePref === jobRemote || (remotePref === 'remote' && jobRemote === 'work_from_home')))
    ) {
      location = 100
    } else if (jobCountry && prefLocs.some((p) => p.includes(jobCountry) || jobCountry.includes(p))) {
      location = 70
    } else {
      location = 40
    }

    // --- Salary ---
    const expMin = profile.salaryExpectationMin ?? 0
    let salary = 50
    if (job.salaryDisclosed && (job.salaryMax != null || job.salaryMin != null)) {
      if (job.salaryMax != null && job.salaryMax >= expMin) {
        salary = 100
      } else if (job.salaryMin != null && job.salaryMin >= 0.7 * expMin) {
        salary = 70
      } else {
        salary = 40
      }
    } else {
      salary = 50
    }

    // --- Career ---
    const desiredJobTitle = (profile.desiredJobTitle ?? '').toLowerCase()
    const desiredRoles = tokenize(profile.desiredRoles)
    const jobTitle = (job.title ?? '').toLowerCase()
    let career = 40
    if (desiredJobTitle && jobTitle.includes(desiredJobTitle)) {
      career = 100
    } else if (desiredRoles.some((r) => jobTitle.includes(r) || r.includes(jobTitle))) {
      career = 100
    } else if (desiredJobTitle || desiredRoles.length) {
      // partial: any word overlap
      const titleWords = jobTitle.split(/\s+/).filter(Boolean)
      const allDesired = [desiredJobTitle, ...desiredRoles].flatMap((s) => s.split(/\s+/))
      const overlap = allDesired.some((w) => w.length > 2 && titleWords.includes(w))
      career = overlap ? 70 : 40
    } else {
      career = 40
    }

    const total = Math.round(
      education * 0.2 + skills * 0.25 + experience * 0.2 + location * 0.1 + salary * 0.1 + career * 0.15,
    )
    const label: MatchScore['label'] =
      total >= 85 ? 'Excellent match' : total >= 70 ? 'Good match' : total >= 50 ? 'Partial match' : 'Low match'

    // --- Eligibility checks (HONEST — never fabricate) ---
    const eligibility: MatchScore['eligibility'] = []

    // Degree
    if (!jobDegree) {
      eligibility.push({ label: 'Degree requirement: not specified', ok: true })
    } else if (profDegree === jobDegree) {
      eligibility.push({ label: `Degree matches (${profDegree})`, ok: true })
    } else if (profDegree && (RELATED_DEGREES[jobDegree]?.includes(profDegree) || RELATED_DEGREES[profDegree]?.includes(jobDegree))) {
      eligibility.push({ label: `Related degree (${profDegree} ↔ ${jobDegree})`, ok: true, warn: true })
    } else {
      eligibility.push({ label: profDegree ? `Degree mismatch (need ${jobDegree}, have ${profDegree})` : `Degree required: ${jobDegree}`, ok: false })
    }

    // Branch
    if (!job.branch) {
      eligibility.push({ label: 'Branch requirement: not specified', ok: true })
    } else {
      const jobBranches = job.branch.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
      const profBranch = (profile.branch ?? '').trim().toLowerCase()
      const matches = jobBranches.some((b) => profBranch.includes(b) || b.includes(profBranch))
      eligibility.push({
        label: matches ? `Branch matches (${profile.branch})` : `Branch required: ${job.branch}`,
        ok: matches,
      })
    }

    // Fresher eligible
    const isFresherCand = (profile.experienceKind ?? '') === 'fresher' || expYears === 0
    if (isFresherCand) {
      const ok = job.fresherFriendly || (min === 0 && max === 0) || expYears >= min
      eligibility.push({
        label: ok
          ? 'Fresher eligible for this role'
          : `Experience required: ${min}${max > min ? `–${max}` : ''} years`,
        ok,
      })
    } else {
      eligibility.push({
        label: `Experience: you have ${expYears} yrs (need ${min}${max > min ? `–${max}` : '+'})`,
        ok: expYears >= min && (max === 0 || expYears <= max),
      })
    }

    // Location
    if (location >= 100) {
      eligibility.push({ label: 'Location matches your preference', ok: true })
    } else if (location >= 70) {
      eligibility.push({ label: 'Location is in your country (relocation may be needed)', ok: true, warn: true })
    } else {
      eligibility.push({ label: 'Location may not match your preferences', ok: false, warn: true })
    }

    // Backlog policy
    const backlogPolicy = job.backlogPolicy ?? 'not_specified'
    if (backlogPolicy === 'not_specified' && profile.activeBacklogs > 0) {
      eligibility.push({ label: `Backlog policy not specified (you have ${profile.activeBacklogs} active backlog(s))`, ok: false, warn: true })
    } else if (backlogPolicy === 'not_allowed' && profile.activeBacklogs > 0) {
      eligibility.push({ label: `Active backlogs not allowed (you have ${profile.activeBacklogs})`, ok: false })
    } else {
      eligibility.push({ label: 'Backlog policy: OK', ok: true })
    }

    // CGPA
    if (job.cgpaRequirement != null && profile.cgpa != null && profile.cgpa < job.cgpaRequirement) {
      eligibility.push({
        label: `CGPA below requirement (need ${job.cgpaRequirement}, have ${profile.cgpa})`,
        ok: false,
        warn: true,
      })
    } else if (job.cgpaRequirement != null && profile.cgpa != null) {
      eligibility.push({ label: `CGPA meets requirement (${profile.cgpa} ≥ ${job.cgpaRequirement})`, ok: true })
    } else if (job.cgpaRequirement != null && profile.cgpa == null) {
      eligibility.push({ label: `CGPA required: ${job.cgpaRequirement} (not specified in your profile)`, ok: false, warn: true })
    } else {
      eligibility.push({ label: 'CGPA requirement: none', ok: true })
    }

    const score: MatchScore = {
      total,
      label,
      breakdown: { education, skills, experience, location, salary, career },
      eligibility,
    }

    return NextResponse.json(score)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'match failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
