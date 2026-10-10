// CareerHub AI — seed script
// Generates realistic demo data. All jobs are marked isDemo=true (honest about demo data).
// Run: bun run db:seed

import { PrismaClient } from '@prisma/client'
import { createHash, randomBytes } from 'crypto'

const db = new PrismaClient()

// ---------- helpers ----------
const now = new Date()
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400_000)
const hoursAgo = (n: number) => new Date(now.getTime() - n * 3600_000)
const daysFromNow = (n: number) => new Date(now.getTime() + n * 86400_000)
const hash = (pw: string) => createHash('sha256').update(pw + 'careerhub_salt_v1').digest('hex')

async function main() {
  console.log('🌱 Seeding CareerHub AI...')

  // ---------- USERS ----------
  const candidate = await db.user.upsert({
    where: { email: 'candidate@demo.careerhub.ai' },
    update: {},
    create: {
      email: 'candidate@demo.careerhub.ai',
      name: 'Aarav Sharma',
      role: 'candidate',
      passwordHash: hash('demo1234'),
      emailVerified: true,
      lastLoginAt: hoursAgo(2),
      profile: {
        create: {
          headline: 'BTech CSE • Full-stack & AI enthusiast',
          phone: '+91 98765 43210',
          currentLocation: 'Bangalore, Karnataka, India',
          preferredLocations: 'Bangalore,Pune,Remote',
          highestQualification: 'BTech',
          degree: 'BTech',
          specialization: 'Computer Science',
          branch: 'CSE',
          university: 'Visvesvaraya Technological University',
          college: 'RV College of Engineering',
          graduationYear: 2025,
          cgpa: 8.4,
          percentage: 84,
          backlogs: 0,
          activeBacklogs: 0,
          gapYears: 0,
          experienceKind: 'fresher',
          totalExperienceYears: 0,
          desiredJobTitle: 'Software Engineer',
          desiredRoles: 'Software Engineer,Full-stack Developer,Backend Engineer',
          industries: 'IT,Software,Product',
          salaryExpectationMin: 600000,
          salaryExpectationMax: 1200000,
          employmentType: 'full_time',
          remotePreference: 'hybrid',
          willingToRelocate: true,
          technicalSkills: 'JavaScript,TypeScript,React,Node.js,Python,SQL,Express,MongoDB',
          softSkills: 'Communication,Teamwork,Problem-solving',
          tools: 'Git,Docker,VS Code,Jest',
          certifications: 'AWS Cloud Practitioner',
          githubUrl: 'https://github.com/aarav-demo',
          linkedinUrl: 'https://linkedin.com/in/aarav-demo',
          portfolioUrl: 'https://aarav.dev',
        },
      },
    },
  })

  const recruiter = await db.user.upsert({
    where: { email: 'recruiter@demo.careerhub.ai' },
    update: {},
    create: {
      email: 'recruiter@demo.careerhub.ai',
      name: 'Priya Nair',
      role: 'recruiter',
      passwordHash: hash('demo1234'),
      emailVerified: true,
      lastLoginAt: hoursAgo(5),
    },
  })

  const admin = await db.user.upsert({
    where: { email: 'admin@demo.careerhub.ai' },
    update: {},
    create: {
      email: 'admin@demo.careerhub.ai',
      name: 'Admin User',
      role: 'admin',
      passwordHash: hash('demo1234'),
      emailVerified: true,
      lastLoginAt: hoursAgo(1),
    },
  })

  // ---------- COMPANIES ----------
  const companies = [
    { name: 'TechVedika Systems', industry: 'IT', companySize: '201-500', companyType: 'product', headquarters: 'Hyderabad', verified: true, description: 'Product engineering studio building developer tools and cloud-native platforms.' },
    { name: 'Nimbus Labs', industry: 'Software', companySize: '11-50', companyType: 'startup', headquarters: 'Bangalore', verified: true, description: 'Seed-stage AI infrastructure startup. Remote-first.' },
    { name: 'Fintech Pe Solutions', industry: 'Finance', companySize: '51-200', companyType: 'startup', headquarters: 'Mumbai', verified: true, description: 'Embedded finance and lending infrastructure for emerging markets.' },
    { name: 'GreenGrid Energy', industry: 'Energy', companySize: '201-500', companyType: 'product', headquarters: 'Pune', verified: false, description: 'Renewable energy analytics and grid optimization platform.' },
    { name: 'MediCore Health', industry: 'Healthcare', companySize: '501-1000', companyType: 'product', headquarters: 'Chennai', verified: true, description: 'Digital health records and clinical workflow platform.' },
    { name: 'Bharat Steel Works', industry: 'Manufacturing', companySize: '1001-5000', companyType: 'mnc', headquarters: 'Kolkata', verified: true, description: 'Integrated steel manufacturer with pan-India operations.' },
    { name: 'DRDO Aviation', industry: 'Government', companySize: '5000+', companyType: 'government', headquarters: 'Bangalore', verified: true, description: 'Defence research & development organisation — aeronautics division.' },
    { name: 'IOCL Refineries', industry: 'Government', companySize: '5000+', companyType: 'psu', headquarters: 'New Delhi', verified: true, description: 'Indian Oil Corporation Limited — refining & pipelines.' },
    { name: 'Pinnacle Consulting', industry: 'Consulting', companySize: '201-500', companyType: 'consulting', headquarters: 'Gurgaon', verified: true, description: 'Strategy and digital transformation consultancy.' },
    { name: 'Pixel & Curve Studio', industry: 'Design', companySize: '11-50', companyType: 'agency', headquarters: 'Remote', verified: false, description: 'Boutique product design & brand studio.' },
    { name: 'EduSpark', industry: 'Education', companySize: '51-200', companyType: 'startup', headquarters: 'Bangalore', verified: true, description: 'EdTech platform for K-12 and competitive exam prep.' },
    { name: 'AgriNext Coop', industry: 'Agriculture', companySize: '11-50', companyType: 'ngo', headquarters: 'Indore', verified: false, description: 'Farmer-producer cooperative building agri-supply chain tools.' },
    { name: 'QuantEdge Capital', industry: 'Finance', companySize: '51-200', companyType: 'product', headquarters: 'Mumbai', verified: true, description: 'Quantitative trading and research firm.' },
    { name: 'Northwind Logistics', industry: 'Logistics', companySize: '201-500', companyType: 'service', headquarters: 'Delhi', verified: false, description: 'Pan-India 3PL and last-mile delivery network.' },
    { name: 'BioVerse Research', industry: 'Research', companySize: '51-200', companyType: 'research', headquarters: 'Hyderabad', verified: true, description: 'Biotech research org focused on industrial enzymes.' },
    { name: 'Indus University', industry: 'Education', companySize: '201-500', companyType: 'university', headquarters: 'Ahmedabad', verified: true, description: 'Multi-disciplinary private university.' },
  ]

  const companyRecords = []
  for (const c of companies) {
    const rec = await db.company.create({
      data: {
        ...c,
        logoUrl: null,
        website: `https://${c.name.toLowerCase().replace(/[^a-z]+/g, '')}.example`,
      },
    })
    companyRecords.push(rec)
  }

  // link recruiter to a company
  const techVedika = companyRecords[0]
  await db.companyMember.create({
    data: { companyId: techVedika.id, userId: recruiter.id, role: 'recruiter' },
  })

  // ---------- JOB SOURCES (only real, connected sources) ----------
  const sources = [
    { name: 'Remotive', kind: 'api', baseUrl: 'https://remotive.com', logoUrl: '🌍', description: 'Remote jobs worldwide — live API integration.', lastSyncAt: hoursAgo(1), lastSuccessAt: hoursAgo(1), jobsFetched: 17, jobsUpdated: 17, errorRate: 0.0, syncFrequency: 'hourly', parserVersion: '2.0.0' },
    { name: 'Arbeitnow', kind: 'api', baseUrl: 'https://www.arbeitnow.com', logoUrl: '🇪🇺', description: 'EU job board — live API integration.', lastSyncAt: hoursAgo(1), lastSuccessAt: hoursAgo(1), jobsFetched: 100, jobsUpdated: 100, errorRate: 0.0, syncFrequency: 'hourly', parserVersion: '2.0.0' },
  ]
  const sourceMap: Record<string, string> = {}
  for (const s of sources) {
    const rec = await db.jobSource.create({ data: s })
    sourceMap[s.name] = rec.id
  }

  // ---------- JOBS ----------
  // NOTE: No demo/mock jobs are created. Real jobs are fetched automatically
  // from live public APIs (Remotive, Arbeitnow, RemoteOK) via the auto-sync
  // cron endpoint at /api/cron/sync. The sync runs on app load and every 10 minutes.


  // ---------- notifications for candidate ----------
  await db.notification.createMany({
    data: [
      { userId: candidate.id, type: 'new_match', title: 'New matching job', body: 'Software Engineer (Full-stack) at TechVedika matches your profile — 92% match', link: 'view=job&id=', read: false },
      { userId: candidate.id, type: 'closing_soon', title: 'Closing soon', body: 'Graduate Engineer Trainee — DRDO closes in 4 days', read: false },
      { userId: candidate.id, type: 'profile_completion', title: 'Complete your profile', body: 'Add your resume to boost match accuracy by ~30%', read: true },
      { userId: candidate.id, type: 'application_reminder', title: 'Application reminder', body: 'You saved a job 3 days ago — consider applying today.', read: false },
    ],
  })

  // ---------- an alert for candidate ----------
  await db.jobAlert.create({
    data: {
      userId: candidate.id,
      name: 'BTech CSE Fresher • Bangalore • Remote',
      query: JSON.stringify({ degree: 'BTech', branch: 'CSE', fresherFriendly: true, location: 'Bangalore', remoteType: ['remote', 'hybrid'] }),
      frequency: 'daily',
      channels: 'in_app,email',
      lastTriggeredAt: hoursAgo(20),
    },
  })

  // ---------- audit logs ----------
  await db.auditLog.createMany({
    data: [
      { actorId: admin.id, action: 'login', entity: 'auth', metadata: '{}', createdAt: hoursAgo(1) },
      { actorId: admin.id, action: 'source.sync', entity: 'JobSource', metadata: JSON.stringify({ source: 'LinkedIn' }), createdAt: hoursAgo(2) },
      { actorId: recruiter.id, action: 'job.create', entity: 'Job', metadata: JSON.stringify({ title: 'Software Engineer (Full-stack)' }), createdAt: hoursAgo(3) },
    ],
  })

  console.log('✅ Seed complete.')
  console.log('  Users: candidate, recruiter (password: demo1234)')
  console.log('  Companies:', companyRecords.length)
  console.log('  Sources:', Object.keys(sourceMap).length, '(Remotive, Arbeitnow — real APIs)')
  console.log('  Jobs: 0 (auto-fetched from live APIs on app load)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
