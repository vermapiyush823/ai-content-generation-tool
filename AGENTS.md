# Build: AI Content Factory

You are a senior full-stack engineer, AI application architect, and product designer.

Build a production-ready web application called **AI Content Factory**.

The purpose of this application is to help a content creator operate multiple short-form content channels across YouTube and Instagram.

The application does NOT need to publish videos automatically.

Its primary responsibility is:

1. Manage multiple content channels.
2. Generate content ideas.
3. Create multi-part/serialized stories.
4. Maintain story and character continuity.
5. Generate scripts.
6. Convert scripts into scene-by-scene video-generation prompts.
7. Generate prompts optimized for different AI video generators such as Gemini and Grok.
8. Analyze manually entered content-performance data.
9. Generate actionable content insights.
10. Automatically generate a daily content package.
11. Send that daily content package to the user by email using Resend.
12. Allow the user to review, edit, regenerate, approve, and copy prompts.

The core philosophy is:

> **AI Content Factory is not a video generator. It is an AI content strategy + prompt production system.**

The user will manually take the generated prompts and use external AI video-generation tools.

---

# 1. TECH STACK

Use exactly this primary stack:

### Frontend

* Next.js
* App Router
* TypeScript
* Tailwind CSS
* Modern responsive UI
* Prefer server components where appropriate
* Client components only where interactivity is required

### Package manager

* pnpm

### Database

* MongoDB Atlas
* MongoDB native driver or Mongoose
* Prefer Mongoose if it improves schema clarity and validation

### AI

* NVIDIA AI API
* Use NVIDIA-hosted models/API for LLM generation
* The initial model should be configurable through environment variables
* The system should refer to the model as the "AI Brain"
* Do not hardcode model names throughout the application

### Email

* Resend

### Validation

* Zod

### Authentication

Implement a simple secure authentication system suitable for a single-owner application.
Do not build unnecessary multi-tenant enterprise authentication for V1.

### UI

Use Tailwind CSS.
The UI should feel like a polished modern SaaS dashboard, not a basic CRUD application.

---

# 2. IMPORTANT DEVELOPMENT PRINCIPLES

Follow these principles throughout the implementation.

## Do not over-engineer V1

Do NOT build:

* Automatic YouTube publishing
* Automatic Instagram publishing
* Automatic video generation
* Complex microservices
* Kubernetes
* Event-driven distributed infrastructure
* Excessive abstractions
* Multiple backend services

Build one clean Next.js application with clear modules.

The architecture should, however, make future expansion possible.

---

# 3. CORE USER FLOW

The main workflow should be:

```text
Create Channel
      ↓
Define Channel DNA
      ↓
Create Content Strategy
      ↓
Generate Ideas
      ↓
Select Idea
      ↓
Create Series OR Standalone Video
      ↓
Generate Episode
      ↓
Generate Script
      ↓
Break Script Into Scenes
      ↓
Generate Video Prompts
      ↓
Generate Platform/Model-specific prompts
      ↓
Review / Edit
      ↓
Copy prompts
      ↓
Generate video externally
      ↓
Upload video manually
      ↓
Enter performance metrics
      ↓
AI analyzes performance
      ↓
Update Content Insights
      ↓
Generate better content next time
      ↓
Daily email
```

---

# 4. DASHBOARD

Create a central dashboard.

The dashboard should immediately answer:

* What should I create today?
* Which channels are active?
* How many videos are ready?
* Which series are currently running?
* What performed best recently?
* What does the AI recommend?
* When is the next daily email?
* Are there any failed AI generations/email jobs?

Example dashboard sections:

### Overview cards

* Active Channels
* Videos Generated
* Prompts Ready
* Current Series
* Average Views
* Best Performing Channel

### Today's Content

Show today's generated content packages.

Each item should display:

* Channel
* Title
* Hook
* Format
* Series
* Episode number
* Status
* Prompt count
* AI score

### AI Insights

Example:

```text
Your strongest format this week:
First-person horror

Best duration:
25–35 seconds

Recommendation:
Generate more mystery-driven hooks.

Weak pattern:
Slow exposition in first 5 seconds.
```

### Upcoming

Show:

* Next email generation
* Scheduled content package
* Series episodes pending

---

# 5. CHANNEL MANAGEMENT

Create a full Channel Management section.

The user can create multiple channels.

Example channels:

```text
DarkVerse
Future Files
Desi AI
Alternate History
AI Comedy
```

Each channel must have its own configuration.

## Channel fields

```text
name
slug
platforms
genre
subgenre
language
audience
ageRange
geography
tone
narrationStyle
visualStyle
videoLength
contentFrequency
seriesPreference
hookStyle
endingStyle
ctaStyle
contentRules
forbiddenTopics
active
```

Also store:

```text
channelDNA
```

This should be a structured object describing the identity of the channel.

---

# 6. CHANNEL DNA

Channel DNA is extremely important.

The AI should use Channel DNA whenever generating content.

Example:

```json
{
  "genre": "horror",
  "audience": "18-34",
  "language": "Hinglish",
  "tone": "dark cinematic suspense",
  "visualStyle": "photorealistic cinematic",
  "preferredDuration": "25-35 seconds",
  "narration": "first-person male",
  "hookStyle": "immediate mystery",
  "endingStyle": "cliffhanger",
  "seriesPreference": "high"
}
```

Allow the user to edit this manually.

---

# 7. CONTENT IDEAS

Build an Ideas module.

The user can:

* Generate ideas
* Save ideas
* Edit ideas
* Reject ideas
* Approve ideas
* Convert an idea into a series
* Convert an idea into a standalone video

Each idea should have:

```text
title
concept
hook
genre
format
seriesPotential
visualPotential
noveltyScore
retentionPotential
productionDifficulty
overallScore
reasoning
status
channelId
```

The AI should score ideas.

Example:

```text
Virality Potential: 8.7
Series Potential: 9.4
Visual Potential: 9.0
Novelty: 7.8
Production Difficulty: 3.5
Overall: 8.8
```

Do not present these scores as guaranteed predictions.

Label them as:

> AI estimates

---

# 8. SERIES ENGINE

The application must support serialized content.

A series contains:

```text
Series
 ├── Series Bible
 ├── Characters
 ├── Locations
 ├── Objects
 ├── World Rules
 ├── Timeline
 ├── Story Arc
 └── Episodes
```

## Series fields

```text
title
concept
genre
premise
theme
status
plannedEpisodes
currentEpisode
seriesBible
channelId
```

---

# 9. SERIES BIBLE

The Series Bible should maintain continuity.

Store:

### Characters

```text
name
age
appearance
clothing
personality
role
relationships
visualIdentity
```

### Locations

```text
name
description
visualIdentity
importantDetails
```

### Objects

```text
name
description
importance
visualIdentity
```

### World rules

Examples:

```text
The entity cannot appear in daylight.
The door only opens at 3:17 AM.
The protagonist cannot leave the building.
```

### Story state

Maintain:

```text
what has happened
current mystery
known information
unknown information
open threads
resolved threads
future clues
```

This information must be injected into AI prompts when generating future episodes.

---

# 10. CONTINUITY ENGINE

Before generating a new episode, the AI must receive relevant context.

Context should include:

```text
Channel DNA
+
Series Bible
+
Characters
+
Locations
+
World Rules
+
Story State
+
Previous Episode Summaries
+
Current Episode Objective
```

The AI should explicitly check:

1. Character consistency
2. Location consistency
3. Timeline consistency
4. Object consistency
5. Personality consistency
6. World-rule consistency
7. Previous plot points
8. Unresolved story threads

Return a continuity score and warnings.

Example:

```text
Continuity Score: 94/100

Warnings:
- Episode mentions the character entering Room 307,
  but Episode 5 established that Room 307 was locked.

[Fix Automatically]
```

---

# 11. EPISODE ENGINE

Each episode should contain:

```text
episodeNumber
title
hook
objective
script
duration
ending
cliffhanger
status
seriesId
channelId
```

The user should be able to:

* Generate
* Regenerate
* Edit
* Approve
* Duplicate
* Delete

---

# 12. SCRIPT GENERATION

Generate short-form scripts optimized for retention.

The AI should structure the script as:

```text
HOOK
SETUP
ESCALATION
PAYOFF
CLIFFHANGER / CTA
```

Do not force every video to have all sections if the format doesn't require them.

The system should respect channel-specific preferences.

---

# 13. SCENE BREAKDOWN

Convert each script into scenes.

Each scene should contain:

```text
sceneNumber
duration
narration
dialogue
visualDescription
camera
lighting
environment
characterActions
soundDesign
transition
```

Example:

```json
{
  "sceneNumber": 1,
  "duration": 5,
  "narration": "At 3:17 AM...",
  "visualDescription": "...",
  "camera": "slow handheld push-in",
  "lighting": "dim practical lighting",
  "characterActions": "...",
  "soundDesign": "low room tone + distant knock"
}
```

---

# 14. VIDEO PROMPT ENGINE

This is the most important feature.

Turn every scene into a production-ready AI video prompt.

Each prompt should contain relevant information such as:

```text
aspect ratio
duration
subject
character appearance
environment
action
camera movement
lens/cinematography
lighting
color/visual mood
physics/motion
background
sound if supported
negative constraints
continuity constraints
```

Avoid unnecessary generic adjectives.

Prompts should be specific and visually executable.

---

# 15. MULTI-MODEL PROMPT SUPPORT

The user may use different video generation models.

Support a prompt adapter system.

Initially support:

```text
Generic
Gemini
Grok
```

The architecture should allow future providers.

Create:

```text
PromptAdapter
```

interface.

Example:

```text
generatePrompt(scene, model="gemini")
generatePrompt(scene, model="grok")
```

The actual wording can differ per model.

Do not assume all models interpret prompts identically.

---

# 16. PROMPT OUTPUT UI

Every generated prompt should have:

* Copy button
* Edit button
* Regenerate button
* Regenerate with instruction
* Model selector
* Character/continuity indicator

Example:

```text
SCENE 03

Gemini Prompt

[ PROMPT TEXT ]

[ COPY ]
[ EDIT ]
[ REGENERATE ]
```

The user should be able to copy prompts individually.

Also provide:

> Copy All Prompts

---

# 17. DAILY CONTENT PACKAGE

This is the core automation.

Every day the system should generate a content package for every active channel according to its configured frequency.

Example:

```text
DarkVerse
3 videos

Future Files
2 videos

Desi AI
3 videos

Alternate History
2 videos
```

The package should contain:

```text
strategy
ideas
videos
scripts
scene prompts
captions
titles
hooks
AI insights
experiment recommendation
```

---

# 18. DAILY EMAIL

Use Resend.

Every day send an email containing the generated content package.

The email should be visually clean and mobile-friendly.

Subject example:

```text
🎬 Your Daily Content Pack — September 14
```

For every channel:

```text
CHANNEL: DARKVERSE

Today's Strategy:
Focus on first-person mystery stories.

VIDEO #1

Title:
The Door That Opened Tomorrow

Hook:
...

Script:
...

Scene 1:
[Prompt]

Scene 2:
[Prompt]

Scene 3:
[Prompt]

Caption:
...

CTA:
...
```

Include a button/link:

```text
OPEN IN DASHBOARD
```

The dashboard URL should come from an environment variable.

Do not expose secrets in email.

---

# 19. DAILY EMAIL CONFIGURATION

Allow the user to configure:

```text
enabled
time
timezone
channels
videosPerChannel
includeInsights
includeScripts
includePrompts
includeCaptions
```

Use a scheduler/cron-compatible architecture.

Do not rely on an in-memory Node.js timer because it will not be reliable in production/serverless environments.

Create a server-side job endpoint that can be triggered by a production cron service.

The exact deployment provider should not be hardcoded.

---

# 20. EMAIL GENERATION FAILURE HANDLING

If AI generation fails:

* Retry safely
* Do not send duplicate emails
* Record job status
* Record error
* Show error in dashboard
* Allow manual retry

Use idempotency where appropriate.

Example job statuses:

```text
pending
generating
completed
failed
emailed
```

---

# 21. PERFORMANCE ANALYTICS

The user will manually enter performance data after publishing.

Create a Performance module.

Metrics should support:

```text
views
likes
comments
shares
saves
followersGained
watchTime
averageViewDuration
averagePercentageViewed
completionRate
swipeAwayRate
videoDuration
publishDate
platform
```

Not every metric is required.

Allow missing values.

---

# 22. PERFORMANCE DATA ENTRY

Make entering results extremely easy.

Example:

```text
Channel: DarkVerse
Video: EP07
Platform: YouTube Shorts

Views: 183420
Likes: 14821
Comments: 3912
Shares: 8102
Followers gained: 1920
Average percentage viewed: 84%
Video duration: 31 sec

[ SAVE PERFORMANCE ]
```

---

# 23. INSIGHT ENGINE

This is the second major AI component.

Analyze historical content performance.

The system should identify patterns such as:

* Best duration
* Best hook type
* Best genre
* Best storytelling structure
* Best narration style
* Best visual style
* Best ending
* Best series vs standalone performance
* Best posting time if enough data exists
* Best topic clusters
* Underperforming patterns

Do not claim statistical certainty when sample sizes are small.

For example:

```text
INSIGHT

First-person horror videos between 25–35 seconds
have performed better than your longer horror videos.

Confidence:
Medium

Sample:
12 videos
```

---

# 24. AI INSIGHT FORMAT

Every insight should contain:

```text
category
observation
evidence
confidence
recommendation
```

Example:

```text
Observation:
Videos with immediate mystery hooks are outperforming
slow setup videos.

Evidence:
8 of the top 10 videos used an unexplained event
within the first 3 seconds.

Confidence:
Medium

Recommendation:
Generate the next 5 videos with immediate mystery hooks.
```

---

# 25. CONTENT LEARNING LOOP

The most important strategic loop is:

```text
CONTENT GENERATED
        ↓
CONTENT PUBLISHED
        ↓
PERFORMANCE ENTERED
        ↓
AI ANALYSIS
        ↓
INSIGHTS
        ↓
NEXT CONTENT STRATEGY
        ↓
NEW CONTENT
```

The AI should receive relevant historical insights when generating new content.

Therefore, content generation should not happen in isolation.

---

# 26. EXPERIMENT ENGINE

Allow the AI to suggest experiments.

Example:

```text
EXPERIMENT

Hypothesis:
First-person narration will improve completion rate.

Test:
Generate 5 first-person videos.

Baseline:
Current average completion = 67%

Success metric:
Average completion rate.

Duration:
5 videos.
```

Store experiments and their outcomes.

---

# 27. CONTENT STATUS SYSTEM

Use clear statuses.

Ideas:

```text
draft
approved
rejected
```

Episodes:

```text
draft
script_ready
prompts_ready
approved
generated
published
```

Performance:

```text
pending
recorded
analyzed
```

---

# 28. AI GENERATION ARCHITECTURE

Create a dedicated AI service layer.

Do not scatter NVIDIA API calls throughout UI components.

Example conceptual structure:

```text
lib/
  ai/
    client.ts
    prompts/
      idea.ts
      series.ts
      episode.ts
      script.ts
      scene.ts
      videoPrompt.ts
      continuity.ts
      insights.ts
      experiments.ts
    adapters/
      generic.ts
      gemini.ts
      grok.ts
```

The actual implementation can differ if there is a cleaner architecture.

---

# 29. STRUCTURED AI OUTPUT

Prefer structured JSON outputs from the AI.

Validate every AI response using Zod.

Never blindly trust model output.

Example:

```text
AI response
     ↓
JSON parse
     ↓
Zod validation
     ↓
Business-rule validation
     ↓
MongoDB
```

If validation fails:

* retry with correction
* log the failure
* do not save malformed content

---

# 30. PROMPT ENGINEERING

The AI system prompt should emphasize:

* Specificity
* Visual clarity
* Short-form retention
* Strong hooks
* Originality
* Continuity
* Avoiding repetitive plots
* Avoiding generic AI clichés
* Respecting channel DNA
* Respecting user-defined forbidden topics
* Never pretending predictions are guaranteed

For serialized content, always prioritize continuity.

---

# 31. CONTEXT MANAGEMENT

Do not send the entire database history to the AI.

Build a context-selection layer.

For example:

```text
Channel DNA
+
Relevant Series Bible
+
Last N episode summaries
+
Relevant historical insights
+
Best-performing content patterns
+
Current objective
```

Summarize old episodes rather than sending unlimited raw content.

This will control token usage and improve consistency.

---

# 32. CONTENT QUALITY CHECKER

Before marking content as ready, run automated checks.

Check:

### Script

* Hook exists
* Duration reasonable
* No obvious contradictions
* No unnecessary exposition
* Ending exists

### Scene prompts

* Character consistency
* Location consistency
* Scene duration
* Visual clarity
* No contradictory instructions

### Series

* Continuity
* Timeline
* Character consistency
* Open threads

Return:

```text
Quality Score
Continuity Score
Warnings
Suggestions
```

Allow:

```text
[ FIX ALL ]
```

where the AI regenerates only problematic portions.

---

# 33. SEARCH / FILTERING

The dashboard should allow filtering by:

```text
channel
genre
series
status
date
platform
performance
```

Search by:

* title
* hook
* episode
* series
* channel

---

# 34. DATABASE MODELS

Create clean MongoDB models/collections for at least:

```text
User
Channel
Series
Character
Location
ContentIdea
Episode
Scene
ContentPerformance
Insight
Experiment
DailyContentPackage
EmailJob
Settings
```

Avoid unnecessary duplication.

Use references where appropriate but denormalize carefully where performance requires it.

---

# 35. SECURITY

Never expose:

```text
NVIDIA API key
MongoDB URI
Resend API key
auth secrets
```

to the client.

Use environment variables.

Example:

```text
MONGODB_URI=
NVIDIA_API_KEY=
NVIDIA_MODEL=
RESEND_API_KEY=
EMAIL_FROM=
DAILY_CRON_SECRET=
NEXT_PUBLIC_APP_URL=
```

Protect cron endpoints using a secret.

Validate all user input.

Sanitize/validate AI output.

---

# 36. ENVIRONMENT CONFIGURATION

Provide:

```text
.env.example
```

with all required variables.

Do not commit secrets.

---

# 37. ERROR HANDLING

Implement consistent error handling.

The UI should show useful errors such as:

```text
AI generation failed.
Try again.

Email delivery failed.
Retry email.

Database connection unavailable.
Please try again later.
```

Do not expose stack traces to users.

Log useful server-side information.

---

# 38. UI/UX

The interface should feel premium.

Use:

* Clean typography
* Cards
* Tabs
* Badges
* Progress indicators
* Empty states
* Skeleton loaders
* Toast notifications
* Confirmation dialogs
* Responsive layouts
* Dark mode if straightforward

Main navigation:

```text
Dashboard
Channels
Ideas
Series
Content
Insights
Performance
Experiments
Daily Email
Settings
```

---

# 39. CONTENT DETAIL PAGE

Create a rich content page.

Layout:

```text
TITLE
CHANNEL
SERIES / EPISODE

HOOK

SCRIPT

SCENES

┌─────────────────────────────┐
│ Scene 1                     │
│                             │
│ Narration                   │
│ Visual                      │
│                             │
│ Gemini Prompt               │
│ [ COPY ] [ EDIT ]           │
│                             │
│ Grok Prompt                 │
│ [ COPY ] [ EDIT ]           │
└─────────────────────────────┘

...

QUALITY CHECK

CONTINUITY CHECK

CAPTION

TITLE OPTIONS

CTA
```

---

# 40. BATCH GENERATION

Allow:

```text
Generate 5 ideas
Generate 10 ideas
Generate 5 episodes
Generate today's content
```

Batch generation should show progress.

Example:

```text
Generating content...

Ideas      ✓
Series     ✓
Scripts    4/5
Scenes     17/25
Prompts    12/25
```

Do not block the entire application unnecessarily during long operations.

---

# 41. DAILY CONTENT STRATEGY

Before generating the daily package, the AI should determine:

```text
What worked recently?
What did not work?
What should be tested?
What should be repeated?
What should be avoided?
```

Then create a daily strategy.

Example:

```text
TODAY'S STRATEGY

Primary objective:
Increase completion rate.

Focus:
25–35 sec first-person mystery.

Avoid:
Long exposition.

Experiment:
Open with unexplained visual event.

Reason:
Recent high-performing videos show stronger
retention when the mystery appears immediately.
```

---

# 42. DAILY PACKAGE GENERATION ALGORITHM

For each active channel:

```text
1. Load Channel DNA
2. Load active series
3. Load recent content
4. Load performance data
5. Load relevant insights
6. Determine today's strategy
7. Generate ideas
8. Score ideas
9. Select ideas
10. Generate scripts
11. Validate scripts
12. Generate scenes
13. Generate model-specific prompts
14. Run quality checks
15. Save package
16. Send email
```

If a channel has an active series:

Prioritize continuation unless the user explicitly chooses otherwise.

---

# 43. MANUAL OVERRIDES

The user must always be able to override AI.

Allow:

* Edit Channel DNA
* Edit strategy
* Choose specific idea
* Change series
* Rewrite hook
* Rewrite script
* Edit prompts
* Regenerate individual scene
* Change video model
* Disable channel from daily generation

AI should assist, not lock the user into its decisions.

---

# 44. DAILY EMAIL HISTORY

Create a page showing:

```text
Date
Channels
Videos
Status
Sent time
```

Clicking a previous email should open its saved Daily Content Package.

Do not regenerate historical emails when viewing them.

---

# 45. COST CONTROL

AI generation can become expensive.

Track approximate AI usage where possible.

Show:

```text
AI generations today
AI generations this month
```

Avoid unnecessary calls.

For example:

* Do not regenerate an entire episode when only Scene 3 needs changing.
* Cache reusable Channel DNA.
* Cache series summaries.
* Generate only missing pieces.

---

# 46. DATABASE INDEXING

Add sensible indexes for:

```text
channelId
seriesId
status
createdAt
publishedAt
platform
```

Add compound indexes where useful for frequent queries.

---

# 47. API / SERVER ACTION STRUCTURE

Keep API routes clean.

Possible structure:

```text
/api/channels
/api/ideas
/api/series
/api/episodes
/api/content
/api/prompts
/api/performance
/api/insights
/api/experiments
/api/daily-package
/api/email
/api/cron/daily-content
```

Server actions are acceptable where they improve the Next.js architecture.

---

# 48. TESTING

Implement meaningful tests for:

* AI response validation
* Prompt generation
* Continuity checks
* Daily package generation
* Email generation
* Performance insight calculations
* Authentication
* API authorization

Do not waste time writing hundreds of trivial tests.

Prioritize critical business logic.

---

# 49. SEED DATA

Provide seed data demonstrating the application.

Create:

### Channel 1

DarkVerse

Genre:
Horror

Language:
Hinglish

### Channel 2

Future Files

Genre:
Sci-Fi

Language:
English

Create:

* One example series
* Several characters
* Several episodes
* Example performance data
* Example insights

The dashboard should look populated immediately after seeding.

---

# 50. README

Create a detailed README explaining:

* What the application does
* Architecture
* Tech stack
* Environment variables
* MongoDB setup
* NVIDIA API setup
* Resend setup
* Local development
* pnpm commands
* Database setup
* Seed command
* Cron setup
* Deployment considerations

Commands should use pnpm.

Example:

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm test
pnpm seed
```

---

# 51. DEVELOPMENT ORDER

Do not attempt to build everything randomly.

Implement in this order:

## Phase 1

Project setup

* Next.js
* TypeScript
* Tailwind
* pnpm
* MongoDB
* Environment configuration

## Phase 2

Authentication + layout

## Phase 3

Channel management

## Phase 4

Ideas engine

## Phase 5

Series + continuity engine

## Phase 6

Episode + script engine

## Phase 7

Scene + video prompt engine

## Phase 8

Content detail/review UI

## Phase 9

Performance tracking

## Phase 10

Insight engine

## Phase 11

Daily content package

## Phase 12

Resend email

## Phase 13

Cron/job reliability

## Phase 14

Quality improvements + testing

---

# 52. IMPORTANT: BUILD A WORKING MVP, NOT MOCK UI

Do not create fake buttons that do nothing.

Every major action should work.

For example:

```text
Generate Ideas
```

must actually call the NVIDIA AI API.

```text
Generate Episode
```

must actually generate and save an episode.

```text
Generate Prompts
```

must actually create prompts.

```text
Save Performance
```

must save data to MongoDB.

```text
Generate Insights
```

must analyze stored performance.

```text
Send Daily Email
```

must actually send via Resend.

If an external API cannot be used because credentials are missing, provide a clean configuration error rather than silently using fake data.

---

# 53. NO FAKE AI

Do not hardcode fake AI responses in production code.

You may use mock data only for:

* seed data
* tests
* local development when explicitly configured

The actual application must use the NVIDIA AI API when configured.

---

# 54. AI PROMPT TEMPLATES

Keep AI prompts/versioned templates in their own files.

Do not bury huge prompts inside React components.

Use versioned templates where possible.

Example:

```text
idea.v1
series.v1
episode.v1
scene.v1
videoPrompt.v1
insight.v1
```

This allows future prompt improvements without rewriting the application.

---

# 55. PRODUCT PRINCIPLE

Always optimize the application around this question:

> "Can the user open the app in the morning, understand what content to make, and receive production-ready prompts for multiple channels with minimal effort?"

If a feature does not contribute meaningfully to that workflow, deprioritize it.

---

# 56. FINAL ACCEPTANCE CRITERIA

The application is considered complete when the following workflow works end-to-end:

```text
User logs in
      ↓
Creates DarkVerse channel
      ↓
Defines Channel DNA
      ↓
Generates ideas
      ↓
Chooses an idea
      ↓
Creates a 5-episode series
      ↓
Creates Episode 1
      ↓
Generates script
      ↓
Generates scenes
      ↓
Generates Gemini/Grok prompts
      ↓
Reviews and copies prompts
      ↓
Manually publishes video
      ↓
Enters performance metrics
      ↓
AI generates insights
      ↓
User creates Episode 2
      ↓
AI maintains continuity
      ↓
Daily package is generated
      ↓
Resend sends daily email
      ↓
User opens email and sees
production-ready prompts
```

The final product should be clean, fast, reliable, and extensible.

Prioritize **working functionality, excellent prompt quality, continuity, useful insights, and the daily email workflow** over unnecessary features.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
