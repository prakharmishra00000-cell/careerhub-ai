# CareerHub AI

> **Every Opportunity. One Smart Search.**

A high-performance live career aggregation engine and discovery platform that connects directly to authentic, real-time job listings from LinkedIn, Indeed, Glassdoor, ZipRecruiter, Shine, Apna, Jobicy, Arbeitnow, and Remotive into one unified interface.

---

## Live Real-Time Architecture

### 1. Live Job Aggregation Engine (`src/lib/live-jobs.ts`)
- **Real-Time Feeds:** Connects directly via RapidAPI JSearch (`/search-v2`) to stream live jobs from **LinkedIn, Indeed, Glassdoor, ZipRecruiter, Shine, and Apna**.
- **Public Remote Feeds:** Integrates live remote feeds from **Jobicy**, **Arbeitnow**, and **Remotive**.
- **Universal Branch Support:** Supports all engineering disciplines (*Mechanical, Civil, Electrical, Chemical, ECE, IoT, Aerospace, Automobile, Robotics, Metallurgy, Mining, Biotech*) and business domains (*UI/UX, Finance, HR, Marketing*).
- **Direct Application:** Every job card links directly to its authentic external hiring portal with no login or signup barriers.

### 2. Multi-Provider AI Engine (`src/lib/ai-provider.ts`)
- **Google Gemini AI:** Native integration with multi-key rotation (`GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`) to ensure high availability.
- **Provider Fallbacks:** Resilient failover supporting OpenAI, Groq, OpenRouter, and heuristic fallback parsers.

### 3. Serverless Resilient Database (`src/lib/db.ts`)
- **Zero-DB Serverless Mode:** Built-in in-memory model proxy intercepts queries (`count()`, `findMany()`, `groupBy()`, `aggregate()`, `$transaction()`) to prevent filesystem errors (`Prisma Error 14`) on cloud deployments.
- **Remote PostgreSQL Compatible:** Automatically switches to remote PostgreSQL when `DATABASE_URL` is configured.

---

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Git

### Environment Variables
Configure the following in your `.env` or Vercel Environment Variables:

```env
# Session security
NEXTAUTH_SECRET=cd7194e1f46356ff6130ed5868dfbd04
AUTH_SECRET=cd7194e1f46356ff6130ed5868dfbd04

# Live job aggregation (LinkedIn, Indeed, Glassdoor via JSearch)
RAPIDAPI_KEY=96ce1f062amsh3f3fc82804b6aaap1a0ad3jsn76ffac545710
ENABLE_LIVE_JOBS=true

# AI Provider (Google Gemini with Key Rotation)
GEMINI_API_KEY_1=your_gemini_api_key
```

### Installation & Run

```bash
# Install dependencies
npm install

# Build
npm run build

# Start local server
npm run dev
```

---

## Production Deployment (Vercel)

Deploy in one click:
👉 **[Deploy CareerHub AI on Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fprakharmishra00000-cell%2Fcareerhub-ai&project-name=careerhub-ai&env=NEXTAUTH_SECRET,AUTH_SECRET,GEMINI_API_KEY_1,RAPIDAPI_KEY,ENABLE_LIVE_JOBS)**
