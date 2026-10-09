# CareerHub AI

> **Every Opportunity. One Smart Search.**

A premium job, internship, apprenticeship, fellowship, and career-opportunity discovery platform that aggregates listings from multiple trusted sources into one unified, AI-powered interface.

## Features

### Core Platform
- **Universal Job Search** — Search across 9+ sources (LinkedIn, Indeed, Naukri, Internshala, Unstop, Wellfound, Glassdoor, Company Websites, Government Portals)
- **Advanced Filters** — Degree, branch, CGPA, backlog policy, experience, salary, stipend, source, company type, and more — all combinable
- **Job Details** — Full job view with honest eligibility assessment, source attribution, and "Apply on [source]" buttons
- **Application Tracker** — Kanban-style pipeline (Saved → Applied → Assessment → Interview → Offer)
- **Saved Jobs** — Folder organization (High Priority, Apply Today, Internship, Full Time, Remote, Government, Custom)
- **Job Alerts** — Create alerts from any search with instant/daily/weekly frequency + email preview

### AI-Powered Features
- **AI Career Assistant** — Natural-language search → structured filters → explainable results
- **AI Match Score** — Per-job match breakdown (education, skills, experience, location, salary, career fit)
- **AI Resume Analyzer** — ATS scoring, missing keywords, actionable suggestions
- **Resume Builder** — 7 templates with live preview and PDF export
- **AI Interview Prep** — Role-specific technical + behavioral questions with hints, topics, tips, and salary negotiation advice
- **AI Career Roadmap** — Personalized 5-phase career path with milestones, skill gaps, certifications, and salary projections
- **Skill Gap Analysis** — Cross-references your skills against real job market demand

### Analytics & Insights
- **Salary Insights** — Average, median, percentiles, distribution histograms, breakdowns by branch/city/experience/type
- **Trending Jobs** — Most-viewed opportunities on the landing page
- **Browse by Industry** — Discover companies by industry sector

### Company Features
- **Company Directory** — Filterable by industry, type, size, verification
- **Company Details** — Full profile with open jobs, quick facts, verification status
- **Company Reviews** — Rate and review companies (1-5 stars, pros/cons, employment status)
- **Company Comparison** — Compare 2-3 companies side-by-side

### Job Comparison
- **Side-by-Side Comparison** — Compare up to 3 jobs with 14 comparison rows

### Candidate Experience
- **Personalized Dashboard** — Recommended jobs matched to your profile (branch, degree, location, remote preference)
- **Profile Completion CTA** — Encourages profile completion for better matches
- **Search History** — Quick re-run of previous searches
- **Recently Viewed Jobs** — Pick up where you left off
- **5-Step Onboarding Wizard** — Education → Skills → Experience → Career goals → Location
- **Command Palette (⌘K)** — Global keyboard shortcut for navigation and quick actions

### Recruiter Portal
- **Dashboard** — Active jobs, applications, interviews, offers stats
- **Job Posting** — Full form with 5 sections (Basic, Compensation, Eligibility, Internship, Content)
- **Application Management** — Update status, add notes, schedule interviews, contact candidates

### Admin Dashboard
- **Overview** — 10+ metrics with charts (jobs timeline, source distribution, employment type pie, city/branch bars)
- **Users / Jobs / Companies / Sources / Reports** — Full management tables
- **Source Health** — Real-time source status (healthy/degraded/down) with sync metrics
- **Analytics** — Recharts visualizations with CSS variable theming

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York style)
- **Database**: Prisma ORM (SQLite client)
- **AI**: z-ai-web-dev-sdk (LLM, VLM, TTS, ASR, Image Generation, Web Search)
- **Charts**: Recharts
- **State**: Zustand (client) + TanStack Query (server)
- **Auth**: Cookie-based session with RBAC (candidate, recruiter, company_admin, admin, moderator)
- **Icons**: Lucide React
- **Animations**: Framer Motion + Tailwind CSS animations

## AI & API Keys

### AI Integration
All AI features are powered by the **z-ai-web-dev-sdk** which is pre-configured in the sandbox environment. The SDK reads its configuration (API key, base URL, token) from a system-level config file at `/etc/.z-ai-config` — **no API keys are needed in the project's `.env` file**.

### AI Endpoints
| Endpoint | Feature | SDK Method |
|----------|---------|------------|
| `POST /api/ai/assistant` | NL → filters → job search | `zai.chat.completions.create()` |
| `POST /api/ai/interview-prep` | Interview question generator | `zai.chat.completions.create()` |
| `POST /api/ai/career-roadmap` | Career path generator | `zai.chat.completions.create()` |
| `POST /api/ai/resume-analyze` | ATS resume scoring | `zai.chat.completions.create()` |
| `POST /api/ai/match-score` | Job match explanation | `zai.chat.completions.create()` |
| `POST /api/ai/search-suggest` | Autocomplete suggestions | DB query (no LLM) |

### External Source Integrations
The platform uses a **modular source adapter architecture**. Currently, sources are seeded with demo data. In production, each source would use:
- Official APIs (where available)
- Licensed feeds
- Partner APIs
- Public feeds
- Permitted crawling (where legally allowed)
- Manually imported job feeds
- Company-provided jobs

**No external API keys are required for the demo.** The seed script (`prisma/seed.ts`) creates 41 realistic demo jobs across 16 companies and 9 sources.

## Getting Started

### Prerequisites
- Node.js 18+ (or Bun)
- SQLite (included — no separate database server needed)

### Installation

```bash
# Install dependencies
bun install

# Set up the database
bun run db:push
bun run db:seed

# Start the dev server
bun run dev
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=file:/home/z/my-project/db/custom.db
```

That's the only variable needed. AI keys are handled automatically by the z-ai-web-dev-sdk.

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Candidate | `candidate@demo.careerhub.ai` | `demo1234` |
| Recruiter | `recruiter@demo.careerhub.ai` | `demo1234` |
| Admin | `admin@demo.careerhub.ai` | `demo1234` |

## Architecture

```
src/
├── app/
│   ├── api/          # 55+ API routes (auth, jobs, profile, admin, recruiter, AI, analytics)
│   ├── globals.css   # Tailwind 4 theme with premium design tokens
│   ├── layout.tsx    # Root layout with ThemeProvider + Toaster
│   └── page.tsx      # Single-page app entry (SPA)
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── views/        # 22+ view components (landing, search, dashboard, etc.)
│   ├── app-shell.tsx # SPA shell with hash-based routing
│   ├── command-palette.tsx
│   ├── compare-bar.tsx
│   ├── company-compare-bar.tsx
│   ├── onboarding-wizard.tsx
│   └── ai-history-section.tsx
├── lib/
│   ├── api.ts        # API client wrapper
│   ├── store.ts      # Zustand global state
│   ├── types.ts      # Shared TypeScript types
│   ├── auth.ts       # Cookie-based session
│   ├── jobs.ts       # Job filter helpers
│   └── db.ts         # Prisma client
└── prisma/
    ├── schema.prisma  # 18 models
    └── seed.ts        # Seed data (41 jobs, 16 companies, 9 sources, 3 users, 7 reviews)
```

## Database Schema

18 Prisma models:
- User, Profile, Company, CompanyMember, CompanyReview
- Job, JobSource, SavedJob, Application, JobAlert
- Notification, JobReport, ResumeVersion, AuditLog
- SearchHistory, AiGeneration

## Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start dev server on port 3000 |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push schema to SQLite |
| `bun run db:seed` | Seed demo data |
| `bun run db:generate` | Generate Prisma client |

## License

This is a demo project. All job listings are illustrative seed data.
