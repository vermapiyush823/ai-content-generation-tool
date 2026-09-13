# AI Content Factory — Implementation Plan

> An AI content strategy + prompt production system for short-form video creators managing multiple channels across YouTube and Instagram.

## Summary

Build a production-ready Next.js application (App Router, TypeScript, Tailwind CSS, pnpm) with MongoDB Atlas, NVIDIA AI API, and Resend email. The app manages channels, generates ideas/series/episodes/scripts/scenes/prompts, tracks performance, produces AI insights, and delivers daily content packages via email.

The workspace is currently empty — we start from scratch.

---

## Proposed Changes — Phased Execution

### Phase 1: Project Scaffold & Foundation

Set up the Next.js project, core configuration, DB connection, and design system.

#### [NEW] Project initialization via `npx`
- `npx -y create-next-app@latest ./` with TypeScript, Tailwind CSS, App Router, ESLint, `src/` directory
- Switch to pnpm as package manager
- Install core dependencies: `mongoose`, `zod`, `resend`, `bcryptjs`, `jsonwebtoken`, `lucide-react`

#### [NEW] `.env.example`
```
MONGODB_URI=
NVIDIA_API_KEY=
NVIDIA_MODEL=meta/llama-3.1-70b-instruct
RESEND_API_KEY=
EMAIL_FROM=onboarding@resend.dev
EMAIL_TO=
DAILY_CRON_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=
```

#### [NEW] `src/lib/db.ts`
- Mongoose connection singleton with caching for serverless

#### [NEW] `src/lib/ai/client.ts`
- NVIDIA AI API client (OpenAI-compatible endpoint at `https://integrate.api.nvidia.com/v1`)
- Model name from `NVIDIA_MODEL` env var
- Structured JSON output with Zod validation + retry logic

#### [NEW] `src/lib/ai/prompts/` directory
- Versioned prompt templates: `idea.ts`, `series.ts`, `episode.ts`, `script.ts`, `scene.ts`, `videoPrompt.ts`, `continuity.ts`, `insights.ts`, `experiments.ts`

#### [NEW] `src/lib/ai/adapters/` directory
- `base.ts` — PromptAdapter interface
- `generic.ts`, `gemini.ts`, `grok.ts` — model-specific prompt formatters

#### [NEW] Design system in `src/app/globals.css`
- Dark-first premium SaaS theme (deep navy/slate backgrounds, violet/cyan accents)
- Custom CSS variables, typography scale, glassmorphism utilities

#### [NEW] `tailwind.config.ts`
- Extended theme with custom color palette, fonts (Inter + JetBrains Mono from Google Fonts)

---

### Phase 2: Authentication & App Shell Layout

#### [NEW] `src/models/User.ts`
- Mongoose schema: email, passwordHash, name, createdAt

#### [NEW] `src/lib/auth.ts`
- JWT-based auth utilities: sign, verify, hash password, compare
- Middleware helper for protected API routes/server actions

#### [NEW] `src/app/(auth)/login/page.tsx` & `src/app/(auth)/register/page.tsx`
- Clean login/register forms (client components)

#### [NEW] `src/app/(dashboard)/layout.tsx`
- Sidebar navigation (Dashboard, Channels, Ideas, Series, Content, Insights, Performance, Experiments, Daily Email, Settings)
- Top bar with user info, AI usage stats
- Responsive: collapsible sidebar on mobile
- Dark mode by default

#### [NEW] `src/components/ui/` shared components
- `Button`, `Card`, `Badge`, `Input`, `Textarea`, `Select`, `Modal`, `Toast`, `Tabs`, `SkeletonLoader`, `EmptyState`, `ConfirmDialog`, `ProgressBar`

---

### Phase 3: Channel Management (Spec §5–6)

#### [NEW] `src/models/Channel.ts`
- Full schema per spec: name, slug, platforms, genre, subgenre, language, audience, ageRange, geography, tone, narrationStyle, visualStyle, videoLength, contentFrequency, seriesPreference, hookStyle, endingStyle, ctaStyle, contentRules, forbiddenTopics, active, channelDNA (embedded object)

#### [NEW] `src/app/api/channels/route.ts` — GET (list), POST (create)
#### [NEW] `src/app/api/channels/[id]/route.ts` — GET, PUT, DELETE

#### [NEW] `src/app/(dashboard)/channels/page.tsx`
- Grid of channel cards with DNA summary, active badge, stats
- "Create Channel" button → modal/page

#### [NEW] `src/app/(dashboard)/channels/[id]/page.tsx`
- Channel detail view with editable Channel DNA (JSON editor + form)
- Tabs: Overview, DNA, Content, Performance

---

### Phase 4: Ideas Engine (Spec §7)

#### [NEW] `src/models/ContentIdea.ts`
- Schema: title, concept, hook, genre, format, seriesPotential, visualPotential, noveltyScore, retentionPotential, productionDifficulty, overallScore, reasoning, status (draft/approved/rejected), channelId

#### [NEW] `src/app/api/ideas/route.ts` — CRUD + generate endpoint
#### [NEW] `src/app/api/ideas/generate/route.ts` — batch AI generation (1–10 ideas)

#### [NEW] `src/app/(dashboard)/ideas/page.tsx`
- Filterable idea list with AI scores, status badges
- Batch generate (5/10 ideas), approve/reject inline
- Convert idea → series or standalone video

---

### Phase 5: Series + Continuity Engine (Spec §8–10)

#### [NEW] `src/models/Series.ts`
- title, concept, genre, premise, theme, status, plannedEpisodes, currentEpisode, seriesBible (embedded), channelId

#### [NEW] `src/models/Character.ts`
- name, age, appearance, clothing, personality, role, relationships, visualIdentity, seriesId

#### [NEW] `src/models/Location.ts`
- name, description, visualIdentity, importantDetails, seriesId

#### [NEW] `src/lib/ai/prompts/continuity.ts`
- Context builder: Channel DNA + Series Bible + Characters + Locations + World Rules + Story State + Previous Episode Summaries
- Continuity checker: returns score + warnings

#### [NEW] `src/app/api/series/` routes — full CRUD, bible management
#### [NEW] `src/app/(dashboard)/series/page.tsx` & `[id]/page.tsx`
- Series list, detail with bible editor, character/location management, episode list, continuity dashboard

---

### Phase 6: Episode + Script Engine (Spec §11–12)

#### [NEW] `src/models/Episode.ts`
- episodeNumber, title, hook, objective, script (structured: hook/setup/escalation/payoff/cliffhanger), duration, ending, cliffhanger, status, seriesId, channelId

#### [NEW] `src/app/api/episodes/` — CRUD + generate/regenerate
#### [NEW] `src/app/(dashboard)/series/[id]/episodes/[episodeId]/page.tsx`
- Episode editor with AI script generation
- Script structured sections, editable inline
- Continuity check panel

---

### Phase 7: Scene + Video Prompt Engine (Spec §13–16)

#### [NEW] `src/models/Scene.ts`
- sceneNumber, duration, narration, dialogue, visualDescription, camera, lighting, environment, characterActions, soundDesign, transition, prompts (map of model → prompt text), episodeId

#### [NEW] `src/lib/ai/adapters/` — PromptAdapter implementations
- Each adapter formats scene data into model-specific prompt syntax
- Gemini: emphasis on visual description + camera + lighting
- Grok: emphasis on action + mood + character consistency

#### [NEW] `src/app/api/scenes/` — CRUD, generate prompts per model
#### [NEW] Scene UI within episode detail
- Scene cards with narration, visual, model-specific prompts
- Copy / Edit / Regenerate / Regenerate-with-instruction per prompt
- Model selector dropdown
- "Copy All Prompts" button

---

### Phase 8: Content Detail / Review UI (Spec §32, §39)

#### [NEW] `src/app/(dashboard)/content/page.tsx`
- Master content list across channels with search/filter (channel, genre, series, status, date, platform)

#### [NEW] `src/app/(dashboard)/content/[id]/page.tsx`
- Rich detail page: Title → Channel → Series/Episode → Hook → Script → Scenes → Quality Check → Continuity Check → Caption → Title Options → CTA
- Quality checker panel with scores + "Fix All" button

---

### Phase 9: Performance Tracking (Spec §21–22)

#### [NEW] `src/models/ContentPerformance.ts`
- views, likes, comments, shares, saves, followersGained, watchTime, averageViewDuration, averagePercentageViewed, completionRate, swipeAwayRate, videoDuration, publishDate, platform, episodeId, channelId
- All metrics optional

#### [NEW] `src/app/api/performance/` — CRUD
#### [NEW] `src/app/(dashboard)/performance/page.tsx`
- Easy data entry form per video
- Performance history table with sparklines
- Channel comparison charts

---

### Phase 10: Insight Engine (Spec §23–26)

#### [NEW] `src/models/Insight.ts`
- category, observation, evidence, confidence (low/medium/high), recommendation, channelId, createdAt

#### [NEW] `src/models/Experiment.ts`
- hypothesis, test, baseline, successMetric, duration, status, outcome, channelId

#### [NEW] `src/app/api/insights/generate/route.ts` — AI analysis of performance data
#### [NEW] `src/app/(dashboard)/insights/page.tsx` & `experiments/page.tsx`
- Insight cards with confidence badges
- Experiment tracker with status flow

---

### Phase 11: Daily Content Package (Spec §17, §41–42)

#### [NEW] `src/models/DailyContentPackage.ts`
- date, channels[], strategy, ideas[], episodes[], scripts[], prompts[], captions[], status (pending/generating/completed/failed), channelId

#### [NEW] `src/lib/daily-package.ts`
- Orchestrator: load DNA → load series → load performance → load insights → determine strategy → generate ideas → score → select → generate scripts → validate → generate scenes → generate prompts → quality check → save

#### [NEW] `src/app/api/daily-package/` — generate, list, view
#### [NEW] `src/app/(dashboard)/daily-email/page.tsx`
- Today's package view, history list, manual trigger

---

### Phase 12: Resend Email (Spec §18–20)

#### [NEW] `src/lib/email.ts`
- Resend client, email template builder (responsive HTML)

#### [NEW] `src/models/EmailJob.ts`
- date, status (pending/generating/completed/failed/emailed), error, sentAt, packageId
- Idempotency via date-based dedup

#### [NEW] `src/app/api/email/send/route.ts` — send daily email
#### Email history in Daily Email page

---

### Phase 13: Cron / Job Reliability (Spec §19–20, §44–45)

#### [NEW] `src/app/api/cron/daily-content/route.ts`
- Protected by `DAILY_CRON_SECRET`
- Triggers daily package generation + email for all active channels
- Idempotent: checks if today's package already exists

#### [NEW] `src/models/Settings.ts`
- Daily email config: enabled, time, timezone, channels[], videosPerChannel, includeInsights, includeScripts, includePrompts, includeCaptions

#### AI usage tracking in Settings page

---

### Phase 14: Dashboard, Seed Data, Quality & Polish (Spec §4, §49–50)

#### [NEW] `src/app/(dashboard)/dashboard/page.tsx`
- Overview cards: Active Channels, Videos Generated, Prompts Ready, Current Series, Average Views, Best Channel
- Today's Content section with package items
- AI Insights panel
- Upcoming: next email, pending episodes

#### [NEW] `scripts/seed.ts`
- Seed DarkVerse (Horror/Hinglish) + Future Files (Sci-Fi/English)
- Example series, characters, episodes, performance data, insights

#### [NEW] `README.md`
- Full documentation per spec §50

---

## Open Questions

> [!IMPORTANT]
> **MongoDB Atlas**: Do you already have a MongoDB Atlas cluster set up, or should I configure the app to also work with a local MongoDB instance for development?

> [!IMPORTANT]
> **NVIDIA AI API Key**: Do you have an NVIDIA AI API key ready? The app will need this to function. Which model do you prefer as default? (e.g., `meta/llama-3.1-70b-instruct`, `nvidia/llama-3.1-nemotron-70b-instruct`)

> [!IMPORTANT]
> **Resend**: Do you have a Resend account/API key, or should we defer email functionality and build it as a pluggable module?

> [!IMPORTANT]
> **Phasing approach**: Given the scale (55 spec sections), I plan to build Phases 1–4 first (scaffold + auth + channels + ideas) as a working foundation, then continue iteratively. Should I proceed with this approach, or do you want all phases built in one go?

---

## Verification Plan

### Automated Tests
- `pnpm test` — Zod schema validation, AI response parsing, continuity checks, prompt adapter output
- `pnpm lint` — ESLint

### Manual Verification
- `pnpm dev` — verify each page renders correctly
- Test end-to-end flow: login → create channel → generate ideas → create series → generate episode → generate prompts → copy prompts
- Test daily package generation via API
- Test email sending via Resend (with real key)

### Build Verification
- `pnpm build` — ensure production build passes with no errors
