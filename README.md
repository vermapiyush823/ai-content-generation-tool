# AI Content Factory 🎬

> **AI Content Factory is not a video generator. It is an AI content strategy + prompt production system.**

Operate multiple serialized short-form channels across YouTube Shorts and Instagram Reels with strict story continuity, character lore, high-retention scriptwriting, multi-model video generation prompts (Generic, Gemini Veo, Grok Aurora), performance analytics, and automated daily email packages.

---

## ⚡ Key Features

- **Multi-Channel Management**: Configure distinct channels with full **Channel DNA** (content pillars, visual identities, narration styles, forbidden topics).
- **Series Engine & Lore Bible**: Manage serialized content arcs with canon characters, visual identity tags, locations, and world rules.
- **AI Continuity Validator**: Audit new scripts against series canon to prevent contradictions and catch plot holes before publishing.
- **Retention Scriptwriter**: Structured short-form scripts (`Hook` → `Setup` → `Escalation` → `Payoff` → `Cliffhanger`) tailored to channel duration and language.
- **Cinematic Scene Breakdown**: Converts scripts into scenes with camera angles, lighting, environment, and sound design.
- **Multi-Model Prompt Engine**: Generates model-specific prompts for **Generic**, **Gemini (Veo)**, and **Grok (Aurora)**, with individual scene prompt re-engineering.
- **Performance Tracking**: Fast manual metrics entry (views, likes, shares, retention/completion rate).
- **AI Insight Engine & Learning Loop**: Analyzes historical performance to detect winning duration windows and hook styles, feeding the next strategic cycle.
- **Daily Content Package**: Automated daily pipeline that synthesizes strategy, continues active series, creates scripts, breaks scenes, and generates prompts.
- **Daily Email via Resend**: Mobile-optimized dark-mode HTML emails delivering daily packages directly to your inbox.
- **Secure Cron**: Protected cron endpoint (`/api/cron/daily-content`) for serverless scheduled runs.
- **Seed Data Engine**: One-click seeding of **DarkVerse** (Horror/Hinglish) and **Future Files** (Sci-Fi/English).

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom Dark-Theme Design System
- **Database**: MongoDB Atlas via Mongoose
- **AI Brain**: NVIDIA AI API (configurable model, default `nvidia/llama-3.1-nemotron-70b-instruct`)
- **Validation**: Zod schema validation on all AI outputs
- **Email Delivery**: Resend
- **Auth**: Single-owner secure JWT & bcrypt authentication
- **Package Manager**: pnpm

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your configuration:
```env
MONGODB_URI=your-mongodb-atlas-connection-string
NVIDIA_API_KEY=your-nvidia-api-key
NVIDIA_MODEL=nvidia/llama-3.1-nemotron-70b-instruct
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM="AI Content Factory <onboarding@resend.dev>"
DAILY_CRON_SECRET=your-secure-cron-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your-secure-jwt-secret
```

### 3. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Seed Demo Data
To instantly populate **DarkVerse** (Horror, Hinglish) and **Future Files** (Sci-Fi, English) with a complete series ("The 3:17 AM Room"), episodes, scenes, prompts, performance metrics, and insights:

Visit `http://localhost:3000/api/seed` in your browser, or run:
```bash
pnpm seed
```

**Default Demo Credentials:**
- Email: `creator@aicontentfactory.com`
- Password: `password123`
*(You can also register your own account via `/register`)*

---

## 🧪 Production Build Verification

```bash
pnpm build
```
Builds all 37 routes with zero TypeScript or compilation errors.

---

## 🔒 Automated Cron Setup

For automated daily package generation and email delivery, configure an external cron job (e.g. GitHub Actions, Vercel Cron, Cron-job.org) to trigger:

```http
POST /api/cron/daily-content
Authorization: Bearer <DAILY_CRON_SECRET>
```
or via query parameter:
```http
POST /api/cron/daily-content?secret=<DAILY_CRON_SECRET>
```

---

## 📋 Core Workflow

```
1. Create Channel & Define Channel DNA
             ↓
2. Generate Ideas & Convert to Series
             ↓
3. Build Series Bible (Characters, Locations, World Rules)
             ↓
4. AI Generates Structured Episode Script
             ↓
5. Run AI Continuity Audit (Canon Verification)
             ↓
6. Break Script into Scenes & Generate Video Prompts
             ↓
7. Copy Prompts (Gemini / Grok / Generic) → Generate Externally
             ↓
8. Publish Video & Log Performance Metrics
             ↓
9. AI Insight Engine Analyzes Retention Patterns
             ↓
10. Insights Feed Tomorrow's Daily Content Package & Email
```
