# CareerHub AI

> **Every Opportunity. One Smart Search.**

A live job aggregation engine that fetches real, real-time job listings from multiple sources into one unified interface.

## Real Job Sources

### Direct API Integration (no API keys needed)
| Source | Type | Jobs |
|--------|------|------|
| **Remotive** | Free API | Remote jobs worldwide |
| **Arbeitnow** | Free API | EU jobs |
| **RemoteOK** | Free API | Remote tech jobs |
| **Jobicy** | Free API | Remote professional jobs |

### Web Search Integration (via z-ai-web-dev-sdk)
| Source | Method | Jobs |
|--------|--------|------|
| **LinkedIn** | Web search | Jobs from linkedin.com/jobs |
| **Indeed** | Web search | Jobs from indeed.com |
| **Naukri** | Web search | Jobs from naukri.com |
| **Internshala** | Web search | Internships from internshala.com |
| **Wellfound** | Web search | Startup jobs from wellfound.com |
| **Glassdoor** | Web search | Jobs from glassdoor.com |
| **Company Website** | Web search | Direct company career pages |
| **Government Portal** | Web search | Government recruitment pages |

### How It Works
1. On app load, `/api/cron/sync` fetches from all sources
2. Direct API sources (Remotive, Arbeitnow, RemoteOK, Jobicy) return structured job data
3. Web search sources (LinkedIn, Indeed, Naukri, etc.) use the z-ai web search SDK to find real job listing URLs
4. All jobs are stored in SQLite with `isDemo=false`
5. Auto-sync runs every 10 minutes (client-side interval + Vercel cron)
6. No mock data — every job is from a real public API or web search

## Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: SQLite via Prisma ORM
- **AI**: z-ai-web-dev-sdk (LLM + Web Search)
- **UI**: Tailwind CSS 4 + shadcn/ui
- **State**: Zustand
- **Charts**: Recharts

## Setup

```bash
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

## Environment Variables
Only one required:
```
DATABASE_URL=file:./db/custom.db
```

AI keys are handled automatically by z-ai-web-dev-sdk.

## Deploy to Vercel
1. Push to GitHub
2. Import on Vercel
3. `vercel.json` is pre-configured with a cron job that syncs jobs every 10 minutes
