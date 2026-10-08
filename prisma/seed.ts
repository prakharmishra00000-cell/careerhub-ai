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

  // ---------- JOB SOURCES ----------
  const sources = [
    { name: 'LinkedIn', kind: 'api', baseUrl: 'https://linkedin.com', logoUrl: '🔗', description: 'Professional network job listings.', lastSyncAt: hoursAgo(1), lastSuccessAt: hoursAgo(1), jobsFetched: 18420, jobsUpdated: 312, errorRate: 0.01 },
    { name: 'Indeed', kind: 'api', baseUrl: 'https://indeed.com', logoUrl: '🅒', description: 'Aggregated job board.', lastSyncAt: hoursAgo(2), lastSuccessAt: hoursAgo(2), jobsFetched: 12480, jobsUpdated: 198, errorRate: 0.02 },
    { name: 'Naukri', kind: 'feed', baseUrl: 'https://naukri.com', logoUrl: '🅝', description: 'India-focused job portal.', lastSyncAt: hoursAgo(3), lastSuccessAt: hoursAgo(3), jobsFetched: 9821, jobsUpdated: 145, errorRate: 0.03 },
    { name: 'Internshala', kind: 'api', baseUrl: 'https://internshala.com', logoUrl: '🎓', description: 'Internship & training platform.', lastSyncAt: hoursAgo(4), lastSuccessAt: hoursAgo(4), jobsFetched: 4210, jobsUpdated: 88, errorRate: 0.01 },
    { name: 'Unstop', kind: 'feed', baseUrl: 'https://unstop.com', logoUrl: '🏆', description: 'Student opportunities, competitions, hackathons.', lastSyncAt: hoursAgo(6), lastSuccessAt: hoursAgo(6), jobsFetched: 1820, jobsUpdated: 42, errorRate: 0.04 },
    { name: 'Wellfound', kind: 'api', baseUrl: 'https://wellfound.com', logoUrl: '🚀', description: 'Startup jobs (formerly AngelList).', lastSyncAt: hoursAgo(8), lastSuccessAt: hoursAgo(8), jobsFetched: 980, jobsUpdated: 22, errorRate: 0.02 },
    { name: 'Company Website', kind: 'company_provided', baseUrl: '', logoUrl: '🌐', description: 'Direct from company career pages.', lastSyncAt: hoursAgo(10), lastSuccessAt: hoursAgo(10), jobsFetched: 640, jobsUpdated: 14, errorRate: 0.01 },
    { name: 'Government Portal', kind: 'feed', baseUrl: 'https://govtjobs.gov.in', logoUrl: '🏛️', description: 'Government & PSU recruitment feeds.', lastSyncAt: hoursAgo(12), lastSuccessAt: hoursAgo(12), jobsFetched: 420, jobsUpdated: 9, errorRate: 0.05 },
    { name: 'Glassdoor', kind: 'api', baseUrl: 'https://glassdoor.com', logoUrl: '🔍', description: 'Jobs + company reviews.', lastSyncAt: daysAgo(1), lastSuccessAt: daysAgo(1), jobsFetched: 3120, jobsUpdated: 56, errorRate: 0.03 },
  ]
  const sourceMap: Record<string, string> = {}
  for (const s of sources) {
    const rec = await db.jobSource.create({ data: s })
    sourceMap[s.name] = rec.id
  }

  // ---------- JOBS ----------
  // Helper to create jobs quickly
  type JobSeed = {
    title: string
    company: number // index in companyRecords
    source: string
    city: string
    state?: string
    remoteType: string
    employmentType: string
    experienceMin: number
    experienceMax: number
    fresherFriendly: boolean
    salaryMin: number
    salaryMax: number
    salaryDisclosed: boolean
    degree?: string
    branch?: string
    cgpaRequirement?: number
    backlogPolicy?: string
    skills: string
    benefits?: string
    description: string
    responsibilities?: string
    requirements?: string
    postedHoursAgo: number
    deadlineDaysFromNow?: number
    isInternship?: boolean
    internshipDurationMonths?: number
    internshipPaid?: string
    stipendMin?: number
    stipendMax?: number
    ppoAvailable?: boolean
    sourceUrl?: string
  }

  const jobs: JobSeed[] = [
    // ===== Engineering / IT (CSE) =====
    {
      title: 'Software Engineer (Full-stack)',
      company: 0, source: 'LinkedIn',
      city: 'Bangalore', state: 'Karnataka', remoteType: 'hybrid', employmentType: 'full_time',
      experienceMin: 0, experienceMax: 2, fresherFriendly: true,
      salaryMin: 600000, salaryMax: 1000000, salaryDisclosed: true,
      degree: 'BTech', branch: 'CSE', cgpaRequirement: 7.0, backlogPolicy: 'current_allowed',
      skills: 'JavaScript,TypeScript,React,Node.js,SQL',
      benefits: 'Health insurance,Work from home stipend,Learning budget',
      description: 'We are building developer tools used by 40k+ engineers. You will own features end-to-end across our React + Node.js platform, ship to production weekly, and collaborate with a senior-heavy team.',
      responsibilities: 'Design and ship product features. Write well-tested, maintainable code. Participate in code reviews and architecture discussions.',
      requirements: 'Strong fundamentals in JavaScript/TypeScript. Understanding of REST & databases. Good problem-solving skills.',
      postedHoursAgo: 3, deadlineDaysFromNow: 21,
      sourceUrl: 'https://linkedin.com/jobs/view/techvedika-se-fullstack',
    },
    {
      title: 'Backend Engineer (Go)',
      company: 1, source: 'Wellfound',
      city: 'Remote', remoteType: 'remote', employmentType: 'full_time',
      experienceMin: 1, experienceMax: 3, fresherFriendly: false,
      salaryMin: 1200000, salaryMax: 1800000, salaryDisclosed: true,
      degree: 'BTech', branch: 'CSE', cgpaRequirement: undefined, backlogPolicy: 'not_specified',
      skills: 'Go,PostgreSQL,Docker,Kubernetes,gRPC',
      benefits: 'Equity,Remote-first,Unlimited PTO',
      description: 'Seed-stage startup building AI infra. We need a backend engineer to scale our job-ingestion & matching pipeline.',
      postedHoursAgo: 8, deadlineDaysFromNow: 30,
      sourceUrl: 'https://wellfound.com/jobs/nimbus-backend-go',
    },
    {
      title: 'Frontend Engineer (React)',
      company: 2, source: 'Naukri',
      city: 'Mumbai', state: 'Maharashtra', remoteType: 'onsite', employmentType: 'full_time',
      experienceMin: 1, experienceMax: 3, fresherFriendly: false,
      salaryMin: 900000, salaryMax: 1400000, salaryDisclosed: true,
      degree: 'BTech', branch: 'CSE', cgpaRequirement: 7.5, backlogPolicy: 'not_allowed',
      skills: 'React,TypeScript,Redux,Tailwind,Webpack',
      description: 'Fintech PE building dashboards for lending partners. Looking for a React engineer to own our partner portal.',
      postedHoursAgo: 26, deadlineDaysFromNow: 14,
      sourceUrl: 'https://naukri.com/job/fintechpe-frontend',
    },
    {
      title: 'DevOps Engineer',
      company: 0, source: 'Indeed',
      city: 'Hyderabad', state: 'Telangana', remoteType: 'hybrid', employmentType: 'full_time',
      experienceMin: 2, experienceMax: 5, fresherFriendly: false,
      salaryMin: 1200000, salaryMax: 2000000, salaryDisclosed: true,
      degree: 'BTech', branch: 'CSE', backlogPolicy: 'not_specified',
      skills: 'AWS,Terraform,Docker,Kubernetes,CICD',
      description: 'Own our cloud infrastructure. Automate deployments. Improve observability.',
      postedHoursAgo: 50, deadlineDaysFromNow: 18,
      sourceUrl: 'https://indeed.com/job/techvedika-devops',
    },
    // ===== Data / AI =====
    {
      title: 'Data Scientist',
      company: 13, source: 'LinkedIn',
      city: 'Mumbai', state: 'Maharashtra', remoteType: 'hybrid', employmentType: 'full_time',
      experienceMin: 1, experienceMax: 3, fresherFriendly: true,
      salaryMin: 1200000, salaryMax: 2000000, salaryDisclosed: true,
      degree: 'MTech', branch: 'Data Science', cgpaRequirement: 8.0, backlogPolicy: 'not_allowed',
      skills: 'Python,pandas,scikit-learn,SQL,statistics',
      description: 'Quant trading research. Build predictive models on market microstructure data.',
      postedHoursAgo: 5, deadlineDaysFromNow: 25,
      sourceUrl: 'https://linkedin.com/jobs/quantedge-ds',
    },
    {
      title: 'Machine Learning Engineer',
      company: 1, source: 'Wellfound',
      city: 'Remote', remoteType: 'remote', employmentType: 'full_time',
      experienceMin: 2, experienceMax: 4, fresherFriendly: false,
      salaryMin: 1800000, salaryMax: 3000000, salaryDisclosed: true,
      degree: 'MTech', branch: 'AI', backlogPolicy: 'not_specified',
      skills: 'PyTorch,TensorFlow,Python,MLOps,Hugging Face',
      description: 'Build LLM-powered matching for jobs. Fine-tune, evaluate, and ship models to production.',
      postedHoursAgo: 12, deadlineDaysFromNow: 40,
      sourceUrl: 'https://wellfound.com/jobs/nimbus-mle',
    },
    // ===== Mechanical / Core =====
    {
      title: 'Mechanical Design Engineer',
      company: 5, source: 'Naukri',
      city: 'Kolkata', state: 'West Bengal', remoteType: 'onsite', employmentType: 'full_time',
      experienceMin: 0, experienceMax: 2, fresherFriendly: true,
      salaryMin: 400000, salaryMax: 700000, salaryDisclosed: true,
      degree: 'BTech', branch: 'Mechanical', cgpaRequirement: 7.0, backlogPolicy: 'current_allowed',
      skills: 'SolidWorks,AutoCAD,GD&T,DFM',
      description: 'Design mechanical systems for steel plant operations. Freshers with strong CAD fundamentals welcome.',
      postedHoursAgo: 18, deadlineDaysFromNow: 20,
      sourceUrl: 'https://naukri.com/job/bharatsteel-mech',
    },
    {
      title: 'Graduate Engineer Trainee — Mechanical',
      company: 6, source: 'Government Portal',
      city: 'Bangalore', state: 'Karnataka', remoteType: 'onsite', employmentType: 'trainee',
      experienceMin: 0, experienceMax: 0, fresherFriendly: true,
      salaryMin: 500000, salaryMax: 600000, salaryDisclosed: true,
      degree: 'BTech', branch: 'Mechanical', cgpaRequirement: 7.5, backlogPolicy: 'not_allowed',
      skills: 'CATIA,FEA,Materials,Manufacturing',
      description: 'DRDO aeronautics division GET program. 1-year structured training in aerospace mechanical systems.',
      postedHoursAgo: 72, deadlineDaysFromNow: 10,
      sourceUrl: 'https://govtjobs.gov.in/drdo-get-mech',
    },
    {
      title: 'Civil Site Engineer',
      company: 5, source: 'Indeed',
      city: 'Pune', state: 'Maharashtra', remoteType: 'onsite', employmentType: 'full_time',
      experienceMin: 1, experienceMax: 3, fresherFriendly: false,
      salaryMin: 350000, salaryMax: 600000, salaryDisclosed: true,
      degree: 'BTech', branch: 'Civil', cgpaRequirement: undefined, backlogPolicy: 'not_specified',
      skills: 'AutoCAD,STAAD.pro,Site management,QA/QC',
      description: 'Steel plant civil works — foundations, structural, site coordination.',
      postedHoursAgo: 30, deadlineDaysFromNow: 15,
      sourceUrl: 'https://indeed.com/job/bharatsteel-civil',
    },
    // ===== Electrical / ECE / EEE =====
    {
      title: 'Electrical Maintenance Engineer',
      company: 3, source: 'Naukri',
      city: 'Pune', state: 'Maharashtra', remoteType: 'onsite', employmentType: 'full_time',
      experienceMin: 0, experienceMax: 2, fresherFriendly: true,
      salaryMin: 350000, salaryMax: 550000, salaryDisclosed: true,
      degree: 'BTech', branch: 'EEE', cgpaRequirement: 6.5, backlogPolicy: 'current_allowed',
      skills: 'SCADA,PLC,Preventive maintenance,Single-line diagrams',
      description: 'Renewable energy plant — electrical maintenance and grid sync operations.',
      postedHoursAgo: 44, deadlineDaysFromNow: 12,
      sourceUrl: 'https://naukri.com/job/greengrid-electrical',
    },
    {
      title: 'Embedded Firmware Engineer',
      company: 6, source: 'Company Website',
      city: 'Bangalore', state: 'Karnataka', remoteType: 'onsite', employmentType: 'full_time',
      experienceMin: 2, experienceMax: 5, fresherFriendly: false,
      salaryMin: 800000, salaryMax: 1500000, salaryDisclosed: true,
      degree: 'BTech', branch: 'ECE', cgpaRequirement: 7.5, backlogPolicy: 'not_allowed',
      skills: 'C,C++,RTOS,ARM,Embedded Linux',
      description: 'Avionics firmware — DO-178C safety-critical code for flight control systems.',
      postedHoursAgo: 60, deadlineDaysFromNow: 25,
      sourceUrl: 'https://drdo.gov.in/careers/embedded-firmware',
    },
    // ===== Chemical / Production / Automobile =====
    {
      title: 'Process Engineer — Chemical',
      company: 14, source: 'LinkedIn',
      city: 'Hyderabad', state: 'Telangana', remoteType: 'onsite', employmentType: 'full_time',
      experienceMin: 1, experienceMax: 3, fresherFriendly: true,
      salaryMin: 500000, salaryMax: 800000, salaryDisclosed: true,
      degree: 'BTech', branch: 'Chemical', cgpaRequirement: 7.0, backlogPolicy: 'not_specified',
      skills: 'Process simulation,Mass balance,HYSYS,Safety',
      description: 'Biotech research org — scale-up of industrial enzyme fermentation processes.',
      postedHoursAgo: 36, deadlineDaysFromNow: 22,
      sourceUrl: 'https://linkedin.com/jobs/bioverse-process',
    },
    {
      title: 'Production Engineer',
      company: 5, source: 'Indeed',
      city: 'Kolkata', state: 'West Bengal', remoteType: 'onsite', employmentType: 'full_time',
      experienceMin: 0, experienceMax: 2, fresherFriendly: true,
      salaryMin: 300000, salaryMax: 500000, salaryDisclosed: true,
      degree: 'BTech', branch: 'Production', cgpaRequirement: undefined, backlogPolicy: 'current_allowed',
      skills: 'Lean,Six Sigma,CNC,Quality',
      description: 'Steel production line — process improvement, yield optimization.',
      postedHoursAgo: 48, deadlineDaysFromNow: 16,
      sourceUrl: 'https://indeed.com/job/bharatsteel-production',
    },
    // ===== Finance / Business =====
    {
      title: 'Business Analyst',
      company: 8, source: 'LinkedIn',
      city: 'Gurgaon', state: 'Haryana', remoteType: 'hybrid', employmentType: 'full_time',
      experienceMin: 0, experienceMax: 2, fresherFriendly: true,
      salaryMin: 600000, salaryMax: 1000000, salaryDisclosed: true,
      degree: 'MBA', backlogPolicy: 'not_specified',
      skills: 'Excel,SQL,PowerPoint,Financial modeling',
      description: 'Strategy & digital transformation consulting. Client-facing role.',
      postedHoursAgo: 20, deadlineDaysFromNow: 18,
      sourceUrl: 'https://linkedin.com/jobs/pinnacle-ba',
    },
    {
      title: 'Financial Analyst',
      company: 2, source: 'Naukri',
      city: 'Mumbai', state: 'Maharashtra', remoteType: 'onsite', employmentType: 'full_time',
      experienceMin: 1, experienceMax: 3, fresherFriendly: false,
      salaryMin: 800000, salaryMax: 1400000, salaryDisclosed: true,
      degree: 'BCom', backlogPolicy: 'not_specified',
      skills: 'Excel,Financial modeling,Valuation,Accounting',
      description: 'Fintech PE — portfolio company financial analysis and due diligence.',
      postedHoursAgo: 28, deadlineDaysFromNow: 14,
      sourceUrl: 'https://naukri.com/job/fintechpe-fa',
    },
    {
      title: 'Associate — Marketing',
      company: 8, source: 'Internshala',
      city: 'Gurgaon', state: 'Haryana', remoteType: 'hybrid', employmentType: 'full_time',
      experienceMin: 0, experienceMax: 1, fresherFriendly: true,
      salaryMin: 500000, salaryMax: 700000, salaryDisclosed: true,
      degree: 'BBA', backlogPolicy: 'not_specified',
      skills: 'Content,SEO,Analytics,Email marketing',
      description: 'Marketing associate for consulting practice — content, events, ABM.',
      postedHoursAgo: 15, deadlineDaysFromNow: 20,
      sourceUrl: 'https://internshala.com/job/pinnacle-marketing',
    },
    // ===== Design =====
    {
      title: 'Product Designer',
      company: 9, source: 'Wellfound',
      city: 'Remote', remoteType: 'remote', employmentType: 'full_time',
      experienceMin: 2, experienceMax: 5, fresherFriendly: false,
      salaryMin: 1200000, salaryMax: 2200000, salaryDisclosed: true,
      degree: undefined, branch: undefined, backlogPolicy: 'not_specified',
      skills: 'Figma,Prototyping,Design systems,User research',
      description: 'Product design for SaaS clients. End-to-end from research to high-fidelity.',
      postedHoursAgo: 9, deadlineDaysFromNow: 35,
      sourceUrl: 'https://wellfound.com/jobs/pixelcurve-product-designer',
    },
    {
      title: 'UI/UX Intern',
      company: 10, source: 'Internshala',
      city: 'Remote', remoteType: 'remote', employmentType: 'internship',
      experienceMin: 0, experienceMax: 0, fresherFriendly: true,
      salaryMin: 15000, salaryMax: 25000, salaryDisclosed: true,
      degree: undefined, branch: undefined, backlogPolicy: 'not_specified',
      skills: 'Figma,Figma auto-layout,User flows',
      isInternship: true, internshipDurationMonths: 3, internshipPaid: 'paid', stipendMin: 15000, stipendMax: 25000, ppoAvailable: true,
      description: 'EdTech platform — design intern for student dashboard features. 3-month paid internship with PPO possibility.',
      postedHoursAgo: 6, deadlineDaysFromNow: 30,
      sourceUrl: 'https://internshala.com/internship/eduspark-uiux',
    },
    // ===== Healthcare / Biotech =====
    {
      title: 'Clinical Data Analyst',
      company: 4, source: 'Naukri',
      city: 'Chennai', state: 'Tamil Nadu', remoteType: 'hybrid', employmentType: 'full_time',
      experienceMin: 1, experienceMax: 3, fresherFriendly: false,
      salaryMin: 700000, salaryMax: 1200000, salaryDisclosed: true,
      degree: 'MSc', branch: 'Biotechnology', cgpaRequirement: 7.5, backlogPolicy: 'not_specified',
      skills: 'Python,SQL,Clinical data standards (CDISC),Statistics',
      description: 'Clinical workflow platform — analyze EHR data for care pathway optimization.',
      postedHoursAgo: 40, deadlineDaysFromNow: 25,
      sourceUrl: 'https://naukri.com/job/medicore-clinical-analyst',
    },
    // ===== Government / PSU =====
    {
      title: 'Management Trainee — HR (PSU)',
      company: 7, source: 'Government Portal',
      city: 'New Delhi', state: 'Delhi', remoteType: 'onsite', employmentType: 'graduate_program',
      experienceMin: 0, experienceMax: 0, fresherFriendly: true,
      salaryMin: 800000, salaryMax: 900000, salaryDisclosed: true,
      degree: 'MBA', branch: 'HR', cgpaRequirement: 6.5, backlogPolicy: 'not_allowed',
      skills: 'HRIS,Recruitment,Labor laws,Communication',
      description: 'IOCL management trainee program — HR stream. 1-year structured training.',
      postedHoursAgo: 96, deadlineDaysFromNow: 7,
      sourceUrl: 'https://iocl.com/careers/mt-hr',
    },
    {
      title: 'Graduate Apprentice — Electrical (PSU)',
      company: 7, source: 'Government Portal',
      city: 'New Delhi', state: 'Delhi', remoteType: 'onsite', employmentType: 'apprenticeship',
      experienceMin: 0, experienceMax: 0, fresherFriendly: true,
      salaryMin: 300000, salaryMax: 360000, salaryDisclosed: true,
      degree: 'Diploma', branch: 'Electrical', cgpaRequirement: 6.0, backlogPolicy: 'current_allowed',
      skills: 'Electrical maintenance,Transformers,Switchgear',
      description: 'IOCL apprenticeship — 1-year electrical maintenance apprenticeship at refinery.',
      postedHoursAgo: 120, deadlineDaysFromNow: 5,
      sourceUrl: 'https://iocl.com/careers/apprentice-electrical',
    },
    // ===== Internships =====
    {
      title: 'Software Engineering Intern',
      company: 0, source: 'Internshala',
      city: 'Remote', remoteType: 'remote', employmentType: 'internship',
      experienceMin: 0, experienceMax: 0, fresherFriendly: true,
      salaryMin: 25000, salaryMax: 35000, salaryDisclosed: true,
      degree: 'BTech', branch: 'CSE', cgpaRequirement: 7.5, backlogPolicy: 'current_allowed',
      skills: 'React,Node.js,TypeScript,SQL',
      isInternship: true, internshipDurationMonths: 6, internshipPaid: 'paid', stipendMin: 25000, stipendMax: 35000, ppoAvailable: true,
      description: 'Paid 6-month SWE internship. Real production work, weekly 1:1s, PPO track record.',
      postedHoursAgo: 7, deadlineDaysFromNow: 28,
      sourceUrl: 'https://internshala.com/internship/techvedika-swe-intern',
    },
    {
      title: 'Data Analyst Intern',
      company: 13, source: 'Internshala',
      city: 'Mumbai', state: 'Maharashtra', remoteType: 'hybrid', employmentType: 'internship',
      experienceMin: 0, experienceMax: 0, fresherFriendly: true,
      salaryMin: 20000, salaryMax: 30000, salaryDisclosed: true,
      degree: 'BSc', branch: 'Statistics', cgpaRequirement: 7.0, backlogPolicy: 'not_specified',
      skills: 'Python,SQL,Tableau,Excel',
      isInternship: true, internshipDurationMonths: 3, internshipPaid: 'paid', stipendMin: 20000, stipendMax: 30000, ppoAvailable: false,
      description: 'Quant firm — market data analysis internship. Strong learning curve.',
      postedHoursAgo: 4, deadlineDaysFromNow: 21,
      sourceUrl: 'https://internshala.com/internship/quantedge-da-intern',
    },
    {
      title: 'Marketing Intern (Unpaid, Academic Credit)',
      company: 11, source: 'Unstop',
      city: 'Indore', state: 'Madhya Pradesh', remoteType: 'hybrid', employmentType: 'internship',
      experienceMin: 0, experienceMax: 0, fresherFriendly: true,
      salaryMin: 0, salaryMax: 0, salaryDisclosed: true,
      degree: 'MBA', branch: 'Marketing', backlogPolicy: 'not_specified',
      skills: 'Content,Social media,Field research',
      isInternship: true, internshipDurationMonths: 2, internshipPaid: 'unpaid', stipendMin: 0, stipendMax: 0, ppoAvailable: false,
      description: 'Agri coop — 2-month marketing internship with academic credit. Field exposure to farmer networks.',
      postedHoursAgo: 11, deadlineDaysFromNow: 45,
      sourceUrl: 'https://unstop.com/opportunity/agrinext-marketing-intern',
    },
    {
      title: 'Research Intern — Biotech',
      company: 14, source: 'Unstop',
      city: 'Hyderabad', state: 'Telangana', remoteType: 'onsite', employmentType: 'internship',
      experienceMin: 0, experienceMax: 0, fresherFriendly: true,
      salaryMin: 15000, salaryMax: 20000, salaryDisclosed: true,
      degree: 'BSc', branch: 'Biotechnology', cgpaRequirement: 7.5, backlogPolicy: 'not_allowed',
      skills: 'Lab techniques,PCR,Spectrophotometry',
      isInternship: true, internshipDurationMonths: 6, internshipPaid: 'paid', stipendMin: 15000, stipendMax: 20000, ppoAvailable: true,
      description: 'Biotech research lab internship — enzyme characterization. Publication opportunity.',
      postedHoursAgo: 14, deadlineDaysFromNow: 33,
      sourceUrl: 'https://unstop.com/opportunity/bioverse-research-intern',
    },
    // ===== Fresher-friendly =====
    {
      title: 'Associate Software Engineer (Fresher)',
      company: 0, source: 'LinkedIn',
      city: 'Hyderabad', state: 'Telangana', remoteType: 'hybrid', employmentType: 'full_time',
      experienceMin: 0, experienceMax: 1, fresherFriendly: true,
      salaryMin: 500000, salaryMax: 800000, salaryDisclosed: true,
      degree: 'BTech', branch: 'CSE', cgpaRequirement: 7.0, backlogPolicy: 'current_allowed',
      skills: 'Java,SQL,Data structures,Algorithms',
      benefits: 'Health insurance,Relocation bonus',
      description: 'Fresher track — structured 3-month onboarding with mentor. 2025 batch welcome.',
      postedHoursAgo: 24, deadlineDaysFromNow: 30,
      sourceUrl: 'https://linkedin.com/jobs/techvedika-ase',
    },
    {
      title: 'Graduate Engineer — Civil',
      company: 5, source: 'Naukri',
      city: 'Kolkata', state: 'West Bengal', remoteType: 'onsite', employmentType: 'full_time',
      experienceMin: 0, experienceMax: 1, fresherFriendly: true,
      salaryMin: 350000, salaryMax: 480000, salaryDisclosed: true,
      degree: 'BTech', branch: 'Civil', cgpaRequirement: 7.0, backlogPolicy: 'current_allowed',
      skills: 'AutoCAD,STAAD.pro,Site survey',
      description: 'Civil engineer for steel plant expansion project. Fresher-friendly.',
      postedHoursAgo: 70, deadlineDaysFromNow: 12,
      sourceUrl: 'https://naukri.com/job/bharatsteel-civil-fresher',
    },
    // ===== More variety =====
    {
      title: 'SRE / Platform Engineer',
      company: 1, source: 'Company Website',
      city: 'Remote', remoteType: 'remote', employmentType: 'full_time',
      experienceMin: 3, experienceMax: 6, fresherFriendly: false,
      salaryMin: 2500000, salaryMax: 4000000, salaryDisclosed: true,
      degree: undefined, branch: undefined, backlogPolicy: 'not_specified',
      skills: 'Kubernetes,Terraform,Grafana,Prometheus,Go',
      description: 'Platform reliability for AI infra. On-call rotation. Strong observability culture.',
      postedHoursAgo: 16, deadlineDaysFromNow: 28,
      sourceUrl: 'https://nimbuslabs.example/careers/sre',
    },
    {
      title: 'QA Engineer (Automation)',
      company: 2, source: 'Indeed',
      city: 'Mumbai', state: 'Maharashtra', remoteType: 'hybrid', employmentType: 'full_time',
      experienceMin: 1, experienceMax: 3, fresherFriendly: false,
      salaryMin: 700000, salaryMax: 1100000, salaryDisclosed: true,
      degree: 'BTech', branch: 'CSE', cgpaRequirement: 7.0, backlogPolicy: 'not_specified',
      skills: 'Playwright,Cypress,Java,API testing',
      description: 'QA automation for fintech platform. E2E + API testing.',
      postedHoursAgo: 32, deadlineDaysFromNow: 17,
      sourceUrl: 'https://indeed.com/job/fintechpe-qa',
    },
    {
      title: 'Supply Chain Analyst',
      company: 13, source: 'Naukri',
      city: 'Delhi', state: 'Delhi', remoteType: 'onsite', employmentType: 'full_time',
      experienceMin: 0, experienceMax: 2, fresherFriendly: true,
      salaryMin: 450000, salaryMax: 650000, salaryDisclosed: true,
      degree: 'MBA', branch: 'Operations', backlogPolicy: 'not_specified',
      skills: 'Excel,Power BI,SQL,Forecasting',
      description: 'Logistics analytics — route optimization, demand forecasting.',
      postedHoursAgo: 22, deadlineDaysFromNow: 19,
      sourceUrl: 'https://naukri.com/job/northwind-sca',
    },
    {
      title: 'Customer Success Manager',
      company: 10, source: 'LinkedIn',
      city: 'Bangalore', state: 'Karnataka', remoteType: 'hybrid', employmentType: 'full_time',
      experienceMin: 2, experienceMax: 5, fresherFriendly: false,
      salaryMin: 1000000, salaryMax: 1600000, salaryDisclosed: true,
      degree: 'MBA', backlogPolicy: 'not_specified',
      skills: 'Account management,Onboarding,CRM',
      description: 'EdTech CSM — manage enterprise school accounts.',
      postedHoursAgo: 18, deadlineDaysFromNow: 23,
      sourceUrl: 'https://linkedin.com/jobs/eduspark-csm',
    },
    {
      title: 'Cybersecurity Analyst (SOC)',
      company: 0, source: 'Glassdoor',
      city: 'Hyderabad', state: 'Telangana', remoteType: 'onsite', employmentType: 'full_time',
      experienceMin: 1, experienceMax: 3, fresherFriendly: true,
      salaryMin: 800000, salaryMax: 1300000, salaryDisclosed: true,
      degree: 'BTech', branch: 'Cybersecurity', cgpaRequirement: 7.5, backlogPolicy: 'not_allowed',
      skills: 'SIEM,Incident response,Python,Network security',
      description: 'SOC analyst — monitor, triage, respond to security incidents.',
      postedHoursAgo: 38, deadlineDaysFromNow: 20,
      sourceUrl: 'https://glassdoor.com/job/techvedika-soc',
    },
    {
      title: 'Mobile Engineer (Android)',
      company: 4, source: 'Naukri',
      city: 'Chennai', state: 'Tamil Nadu', remoteType: 'hybrid', employmentType: 'full_time',
      experienceMin: 2, experienceMax: 5, fresherFriendly: false,
      salaryMin: 1200000, salaryMax: 2000000, salaryDisclosed: true,
      degree: 'BTech', branch: 'CSE', cgpaRequirement: 7.0, backlogPolicy: 'not_specified',
      skills: 'Kotlin,Jetpack Compose,Coroutines,Architecture',
      description: 'Android engineer for clinical app. Used by 50k+ clinicians.',
      postedHoursAgo: 26, deadlineDaysFromNow: 26,
      sourceUrl: 'https://naukri.com/job/medicore-android',
    },
    {
      title: 'Campus Ambassador Program',
      company: 10, source: 'Unstop',
      city: 'Remote', remoteType: 'remote', employmentType: 'part_time',
      experienceMin: 0, experienceMax: 0, fresherFriendly: true,
      salaryMin: 0, salaryMax: 0, salaryDisclosed: true,
      degree: undefined, branch: undefined, backlogPolicy: 'not_specified',
      skills: 'Social media,Events,Community',
      isInternship: false,
      description: 'EdTech campus ambassador — represent EduSpark on your campus. Stipend by milestones.',
      postedHoursAgo: 13, deadlineDaysFromNow: 60,
      sourceUrl: 'https://unstop.com/opportunity/eduspark-ambassador',
    },
    // ===== Education/Research =====
    {
      title: 'Research Assistant — AI/ML',
      company: 15, source: 'Company Website',
      city: 'Ahmedabad', state: 'Gujarat', remoteType: 'onsite', employmentType: 'research',
      experienceMin: 0, experienceMax: 1, fresherFriendly: true,
      salaryMin: 400000, salaryMax: 600000, salaryDisclosed: true,
      degree: 'MTech', branch: 'AI', cgpaRequirement: 8.0, backlogPolicy: 'not_allowed',
      skills: 'Python,PyTorch,Research methodology',
      description: 'University research assistant — publications expected. Stipend + tuition waiver.',
      postedHoursAgo: 56, deadlineDaysFromNow: 40,
      sourceUrl: 'https://indusuni.edu.in/careers/ra-aiml',
    },
    {
      title: 'Assistant Professor — Computer Science',
      company: 15, source: 'Company Website',
      city: 'Ahmedabad', state: 'Gujarat', remoteType: 'onsite', employmentType: 'full_time',
      experienceMin: 3, experienceMax: 99, fresherFriendly: false,
      salaryMin: 800000, salaryMax: 1500000, salaryDisclosed: true,
      degree: 'PhD', branch: 'CSE', backlogPolicy: 'not_specified',
      skills: 'Teaching,Publishing,Grant writing',
      description: 'Faculty position in CS department. Teaching + research + PhD guidance.',
      postedHoursAgo: 80, deadlineDaysFromNow: 30,
      sourceUrl: 'https://indusuni.edu.in/careers/asst-prof-cse',
    },
    // ===== Sales/Operations =====
    {
      title: 'Business Development Representative',
      company: 8, source: 'LinkedIn',
      city: 'Gurgaon', state: 'Haryana', remoteType: 'onsite', employmentType: 'full_time',
      experienceMin: 0, experienceMax: 1, fresherFriendly: true,
      salaryMin: 500000, salaryMax: 800000, salaryDisclosed: true,
      degree: 'BBA', backlogPolicy: 'not_specified',
      skills: 'Outbound,Cold email,Salesforce',
      description: 'BDR for consulting sales. Pipeline generation, account mapping.',
      postedHoursAgo: 10, deadlineDaysFromNow: 24,
      sourceUrl: 'https://linkedin.com/jobs/pinnacle-bdr',
    },
    {
      title: 'Operations Analyst',
      company: 13, source: 'Indeed',
      city: 'Delhi', state: 'Delhi', remoteType: 'onsite', employmentType: 'full_time',
      experienceMin: 1, experienceMax: 3, fresherFriendly: false,
      salaryMin: 500000, salaryMax: 800000, salaryDisclosed: true,
      degree: 'BCom', backlogPolicy: 'not_specified',
      skills: 'Excel,Operations,Process improvement,SQL',
      description: 'Logistics ops — hub productivity, SLA monitoring, vendor management.',
      postedHoursAgo: 34, deadlineDaysFromNow: 16,
      sourceUrl: 'https://indeed.com/job/northwind-ops-analyst',
    },
    // ===== More internships =====
    {
      title: 'HR Intern',
      company: 8, source: 'Internshala',
      city: 'Gurgaon', state: 'Haryana', remoteType: 'hybrid', employmentType: 'internship',
      experienceMin: 0, experienceMax: 0, fresherFriendly: true,
      salaryMin: 10000, salaryMax: 15000, salaryDisclosed: true,
      degree: 'MBA', branch: 'HR', backlogPolicy: 'not_specified',
      skills: 'ATS,Sourcing,Screening',
      isInternship: true, internshipDurationMonths: 3, internshipPaid: 'paid', stipendMin: 10000, stipendMax: 15000, ppoAvailable: true,
      description: 'HR internship — sourcing, screening, onboarding. 3 months, paid, PPO track.',
      postedHoursAgo: 9, deadlineDaysFromNow: 18,
      sourceUrl: 'https://internshala.com/internship/pinnacle-hr-intern',
    },
    {
      title: 'Content Writing Intern',
      company: 10, source: 'Internshala',
      city: 'Remote', remoteType: 'remote', employmentType: 'internship',
      experienceMin: 0, experienceMax: 0, fresherFriendly: true,
      salaryMin: 8000, salaryMax: 12000, salaryDisclosed: true,
      degree: 'BA', branch: 'English', backlogPolicy: 'not_specified',
      skills: 'Writing,SEO,Research',
      isInternship: true, internshipDurationMonths: 2, internshipPaid: 'paid', stipendMin: 8000, stipendMax: 12000, ppoAvailable: false,
      description: 'EdTech content internship — blog posts, study guides.',
      postedHoursAgo: 7, deadlineDaysFromNow: 22,
      sourceUrl: 'https://internshala.com/internship/eduspark-content',
    },
    // ===== Fellowship =====
    {
      title: 'Product Management Fellowship',
      company: 8, source: 'Wellfound',
      city: 'Gurgaon', state: 'Haryana', remoteType: 'hybrid', employmentType: 'fellowship',
      experienceMin: 0, experienceMax: 2, fresherFriendly: true,
      salaryMin: 800000, salaryMax: 1200000, salaryDisclosed: true,
      degree: 'MBA', backlogPolicy: 'not_specified',
      skills: 'Product sense,User research,Analytics,Roadmapping',
      benefits: 'Mentorship,Sponsored certifications',
      description: '6-month product fellowship with structured rotations across consulting product teams.',
      postedHoursAgo: 19, deadlineDaysFromNow: 35,
      sourceUrl: 'https://wellfound.com/jobs/pinnacle-pm-fellowship',
    },
  ]

  console.log(`Creating ${jobs.length} jobs...`)
  for (const j of jobs) {
    const company = companyRecords[j.company]
    const sourceId = sourceMap[j.source]
    const slug = j.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + randomBytes(4).toString('hex')
    await db.job.create({
      data: {
        sourceId,
        source: undefined,
        sourceJobId: 'demo-' + randomBytes(4).toString('hex'),
        sourceUrl: j.sourceUrl ?? `https://${j.source.toLowerCase()}.example/job/${slug}`,
        companyId: company.id,
        companyName: company.name,
        companyLogoUrl: company.logoUrl,
        title: j.title,
        slug,
        description: j.description,
        responsibilities: j.responsibilities,
        requirements: j.requirements,
        location: j.city,
        country: 'India',
        state: j.state,
        city: j.city,
        remoteType: j.remoteType,
        employmentType: j.employmentType,
        experienceMin: j.experienceMin,
        experienceMax: j.experienceMax,
        fresherFriendly: j.fresherFriendly,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        salaryCurrency: 'INR',
        salaryPeriod: j.isInternship ? 'monthly' : 'annual',
        salaryDisclosed: j.salaryDisclosed,
        degree: j.degree,
        branch: j.branch,
        cgpaRequirement: j.cgpaRequirement,
        cgpaExplicitNone: j.cgpaRequirement === undefined ? false : false, // explicit None not used here
        backlogPolicy: j.backlogPolicy ?? 'not_specified',
        skills: j.skills,
        isInternship: j.isInternship ?? false,
        internshipDurationMonths: j.internshipDurationMonths,
        internshipPaid: j.internshipPaid,
        stipendMin: j.stipendMin,
        stipendMax: j.stipendMax,
        ppoAvailable: j.ppoAvailable ?? false,
        benefits: j.benefits,
        postedAt: hoursAgo(j.postedHoursAgo),
        lastVerifiedAt: hoursAgo(Math.min(j.postedHoursAgo, 6)),
        applicationDeadline: j.deadlineDaysFromNow ? daysFromNow(j.deadlineDaysFromNow) : null,
        expiresAt: j.deadlineDaysFromNow ? daysFromNow(j.deadlineDaysFromNow + 30) : daysFromNow(60),
        status: 'active',
        postedById: j.company === 0 ? recruiter.id : null, // TechVedika jobs posted by recruiter demo
        isDemo: true,
        viewCount: Math.floor(Math.random() * 500) + 50,
      },
    })
  }

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
  console.log('  Users: candidate, recruiter, admin (password: demo1234)')
  console.log('  Companies:', companyRecords.length)
  console.log('  Sources:', Object.keys(sourceMap).length)
  console.log('  Jobs:', jobs.length)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
