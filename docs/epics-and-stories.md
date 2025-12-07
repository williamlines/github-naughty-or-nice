# Epics & Stories: Naughty or Nice

> **Sprint-ready work breakdown for the MVP**
>
> **Version:** 1.0  
> **Created:** 2025-12-07  
> **Author:** PM Agent (BMAD Method)  
> **Based on:** PRD v1.0, Architecture v1.1

---

## Overview

| Metric            | Count |
| ----------------- | ----- |
| **Total Epics**   | 8     |
| **Total Stories** | 24    |
| **P0 Stories**    | 18    |
| **P1 Stories**    | 4     |
| **P2 Stories**    | 2     |

### Epic Summary

| #   | Epic                   | Stories | Priority | Estimate  |
| --- | ---------------------- | ------- | -------- | --------- |
| E1  | Project Setup          | 2       | P0       | 1-2 hours |
| E2  | GitHub API Integration | 3       | P0       | 3-4 hours |
| E3  | Scoring Engine         | 3       | P0       | 3-4 hours |
| E4  | AI Integration         | 2       | P0       | 1-2 hours |
| E5  | Landing Page           | 3       | P0       | 2-3 hours |
| E6  | Loading State          | 2       | P0       | 1-2 hours |
| E7  | Results Page           | 5       | P0       | 4-5 hours |
| E8  | Social Sharing         | 4       | P0/P1    | 2-3 hours |

**Total Estimated Time:** 17-25 hours

---

## E1: Project Setup & Infrastructure

> **Goal:** Establish the Next.js project with all dependencies, configuration, and base structure.

### Story 1.1: Initialize Next.js Project

**Priority:** P0  
**Estimate:** 30 min

**As a** developer  
**I want** a properly configured Next.js 14 project  
**So that** I can start building features immediately

**Acceptance Criteria:**

- [ ] Next.js 14 with App Router initialized
- [ ] TypeScript configured with strict mode
- [ ] Tailwind CSS installed and configured
- [ ] Framer Motion installed
- [ ] ESLint and Prettier configured
- [ ] Project structure matches architecture spec:
  ```
  app/
  ├── page.tsx
  ├── [username]/page.tsx
  ├── api/analyze/[username]/route.ts
  ├── api/og/[username]/route.tsx
  ├── layout.tsx
  └── globals.css
  components/
  lib/
  types/
  ```
- [ ] `.env.local.example` created with required variables

**Technical Notes:**

- Use `npx create-next-app@latest --typescript --tailwind --app`
- Install: `framer-motion`, `clsx`, `tailwind-merge`, `openai`

---

### Story 1.2: Configure Environment & Types

**Priority:** P0  
**Estimate:** 30 min

**As a** developer  
**I want** type definitions and environment validation  
**So that** the codebase is type-safe and configuration errors are caught early

**Acceptance Criteria:**

- [ ] `types/index.ts` created with all core types from architecture:
  - `VerdictTier`, `Verdict`
  - `CategoryId`, `CategoryScore`, `CategoryScores`
  - `UserAnalysis`
  - `AnalysisResponse`, `AnalysisSuccess`, `AnalysisError`
  - `ErrorCode`
- [ ] `types/github.ts` created with GitHub API types
- [ ] `lib/env.ts` created with environment validation
- [ ] Environment variables validated on app start

**Technical Notes:**

- Reference Architecture Section 4 for exact type definitions

---

## E2: GitHub API Integration

> **Goal:** Implement GitHub API client to fetch all required user data.

### Story 2.1: Create GitHub API Client

**Priority:** P0  
**Estimate:** 1 hour

**As a** developer  
**I want** a robust GitHub API client  
**So that** I can fetch user data reliably with proper error handling

**Acceptance Criteria:**

- [ ] `lib/github.ts` implements `GitHubClient` class
- [ ] Authentication via `GITHUB_TOKEN` environment variable
- [ ] Proper headers set (`Accept`, `Authorization`, `X-GitHub-Api-Version`)
- [ ] Error handling for:
  - 404 → `USER_NOT_FOUND` error
  - 403 → `RATE_LIMITED` error with retry-after
  - 5xx → `GITHUB_ERROR`
- [ ] Rate limit headers extracted and logged

**Technical Notes:**

- Use native `fetch` (no external HTTP library needed)
- Reference Architecture Section 7.1

---

### Story 2.2: Implement Data Fetching Functions

**Priority:** P0  
**Estimate:** 1.5 hours

**As a** developer  
**I want** functions to fetch all required GitHub data  
**So that** the scoring engine has the data it needs

**Acceptance Criteria:**

- [ ] `getUser(username)` - Fetch user profile
- [ ] `getEvents(username)` - Fetch public events (paginated, up to 300)
- [ ] `getRepos(username)` - Fetch user's public repos
- [ ] `getRepoCommits(owner, repo, author, since)` - Fetch commits
- [ ] `getPullRequests(owner, repo, author)` - Fetch PRs
- [ ] `getReviewCount(username, since)` - Count PRs reviewed via Search API
- [ ] `getIssues(username, since)` - Fetch issues via Search API
- [ ] All functions filter to current year (2025)

**Technical Notes:**

- Search API has stricter rate limits (30/min) - use sparingly
- Limit active repos to top 10 by `pushed_at`

---

### Story 2.3: Create Aggregated Data Fetcher

**Priority:** P0  
**Estimate:** 1 hour

**As a** developer  
**I want** a single function to fetch all user data efficiently  
**So that** the API route can get everything in one call

**Acceptance Criteria:**

- [ ] `fetchUserData(username, year)` implemented
- [ ] Parallel fetching for independent requests
- [ ] Returns `RawGitHubData` type with all required fields
- [ ] Includes `dataCompleteness` indicators:
  - `eventsLimited` (true if 300+ events)
  - `reposAnalyzed` (number of repos fetched)
  - `reposTotal` (total public repos)
- [ ] Handles users with no activity gracefully

**Technical Notes:**

- Use `Promise.all` for parallel requests
- Reference Architecture Section 7.2

---

## E3: Scoring Engine

> **Goal:** Implement the 6-category scoring algorithms and verdict determination.

### Story 3.1: Implement Category Scoring Functions

**Priority:** P0  
**Estimate:** 2 hours

**As a** developer  
**I want** scoring functions for each category  
**So that** users get accurate, fair assessments

**Acceptance Criteria:**

- [ ] `lib/scoring.ts` created
- [ ] `scoreCommitConsistency(commits, year)` implemented:
  - Week coverage (70% weight)
  - Variance penalty (30% weight)
  - Returns score 0-100 + stats
- [ ] `scoreMessageQuality(commits)` implemented:
  - Average message length scoring
  - Short message penalty
  - Conventional commits bonus
- [ ] `scorePRHygiene(prs)` implemented:
  - Average lines changed scoring
  - Small PR bonus, mega PR penalty
- [ ] `scoreReviewKarma(reviewCount, prs, username)` implemented:
  - Reviews given bonus
  - Karma ratio bonus
- [ ] `scoreIssueCitizenship(issues, username)` implemented:
  - Close ratio scoring
  - Fast close bonus
- [ ] `scoreCollaborationSpirit(events, username)` implemented:
  - External contribution percentage
  - Diversity bonus
- [ ] All functions return `CategoryResult` type

**Technical Notes:**

- Reference Architecture Section 6.2 for exact algorithms
- Use `clamp(value, 0, 100)` helper for bounds

---

### Story 3.2: Implement Verdict Calculation

**Priority:** P0  
**Estimate:** 30 min

**As a** developer  
**I want** overall score and verdict tier calculation  
**So that** users get their final naughty/nice determination

**Acceptance Criteria:**

- [ ] `calculateOverallScore(categories)` - Unweighted average
- [ ] `getVerdictTier(score)` - Returns tier based on score ranges:
  - 90-100 → `extremely-nice`
  - 75-89 → `very-nice`
  - 60-74 → `sort-of-nice`
  - 45-59 → `borderline`
  - 30-44 → `sort-of-naughty`
  - 15-29 → `very-naughty`
  - 0-14 → `extremely-naughty`
- [ ] `getVerdictDetails(tier)` - Returns label, emoji, flavor text

**Technical Notes:**

- Reference Architecture Section 6.1 and PRD Section 6.3

---

### Story 3.3: Implement Quip Generation

**Priority:** P0  
**Estimate:** 30 min

**As a** developer  
**I want** contextual quips for each category  
**So that** results feel personalized and fun

**Acceptance Criteria:**

- [ ] `lib/quips.ts` created
- [ ] Quips defined for all 6 categories with 3 tiers each:
  - `high` (score ≥70)
  - `medium` (score 40-69)
  - `low` (score <40)
- [ ] `getQuip(categoryId, score)` function implemented
- [ ] Quips match the festive, playful tone

**Example Quips:**

```typescript
commitConsistency: {
  high: "Steady as a reindeer",
  medium: "Mostly consistent, with some hibernation",
  low: "Feast or famine commits"
}
```

**Technical Notes:**

- Reference Architecture Section 6.3

---

## E4: AI Integration

> **Goal:** Generate personalized Santa verdicts using OpenAI.

### Story 4.1: Implement OpenAI Client

**Priority:** P0  
**Estimate:** 45 min

**As a** developer  
**I want** an OpenAI client for verdict generation  
**So that** users get unique, personalized summaries

**Acceptance Criteria:**

- [ ] `lib/ai.ts` created
- [ ] OpenAI client initialized with `OPENAI_API_KEY`
- [ ] `generateAIVerdict(input)` function implemented
- [ ] System prompt sets Santa persona
- [ ] User prompt includes:
  - Username
  - Overall score and tier
  - All 6 category scores
  - Summary stats (commits, PRs, reviews, issues)
- [ ] Response limited to 200 tokens
- [ ] Temperature set to 0.8 for creativity

**Technical Notes:**

- Use `gpt-4o-mini` model
- Reference Architecture Section 8.1

---

### Story 4.2: Implement Fallback Verdict

**Priority:** P0  
**Estimate:** 15 min

**As a** developer  
**I want** template fallback verdicts  
**So that** the app works even if OpenAI fails

**Acceptance Criteria:**

- [ ] `getFallbackVerdict(input)` implemented
- [ ] Template for each verdict tier
- [ ] Templates include username
- [ ] OpenAI errors caught and logged
- [ ] Fallback returned on any OpenAI failure

**Example:**

```typescript
'very-nice': `@${username}, Santa is impressed with your ${totalCommits} commits!`
```

---

## E5: Landing Page

> **Goal:** Create the entry point with username input and festive atmosphere.

### Story 5.1: Create Landing Page Layout

**Priority:** P0  
**Estimate:** 1 hour

**As a** user  
**I want** a festive, inviting landing page  
**So that** I'm excited to check my GitHub stats

**Acceptance Criteria:**

- [ ] `app/page.tsx` created
- [ ] Headline: "Have you been Naughty or Nice on GitHub?"
- [ ] Subhead: "Enter your username to find out if you're getting code or coal this year"
- [ ] Festive color scheme and typography
- [ ] Responsive design (mobile-first)
- [ ] Page loads in <2 seconds

**Design Notes:**

- Use holiday colors (red, green, gold, white)
- Consider dark theme with accent colors
- Keep layout minimal and focused

---

### Story 5.2: Implement Username Form

**Priority:** P0  
**Estimate:** 1 hour

**As a** user  
**I want** to enter my GitHub username easily  
**So that** I can see my results

**Acceptance Criteria:**

- [ ] `components/UsernameForm.tsx` created
- [ ] Single text input with placeholder "Enter GitHub username"
- [ ] "Check My List" submit button
- [ ] Client-side validation:
  - Alphanumeric + hyphens only
  - 1-39 characters
  - Trim whitespace
- [ ] Submit button disabled until valid input
- [ ] Enter key submits form
- [ ] Inline error message for invalid format
- [ ] Navigates to `/[username]` on submit

**Technical Notes:**

- Use `useRouter` for navigation
- Validate with regex: `/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/`

---

### Story 5.3: Add Snowfall Animation (Nice-to-have)

**Priority:** P2  
**Estimate:** 30 min

**As a** user  
**I want** subtle festive animations  
**So that** the experience feels magical

**Acceptance Criteria:**

- [ ] `components/ui/Snowfall.tsx` created
- [ ] CSS-only or lightweight animation
- [ ] Respects `prefers-reduced-motion`
- [ ] Does not impact page performance
- [ ] Subtle, not distracting

**Technical Notes:**

- Consider CSS keyframes over JS animation
- Limit particle count

---

## E6: Loading State

> **Goal:** Create an engaging loading experience that builds anticipation.

### Story 6.1: Create Loading Component

**Priority:** P0  
**Estimate:** 45 min

**As a** user  
**I want** an entertaining loading screen  
**So that** waiting for results feels fun, not frustrating

**Acceptance Criteria:**

- [ ] `components/LoadingState.tsx` created
- [ ] Festive progress indicator (spinner, progress bar, or animation)
- [ ] Rotating messages every 2 seconds:
  - "Checking your commits..."
  - "Reviewing your PRs..."
  - "Consulting the elves..."
  - "Analyzing your contributions..."
  - "Calculating your niceness..."
- [ ] Minimum display time: 2 seconds (theatrical delay)
- [ ] Smooth transitions between messages

**Technical Notes:**

- Use `useEffect` with interval for message rotation
- Track start time to ensure minimum display

---

### Story 6.2: Implement Results Page Data Fetching

**Priority:** P0  
**Estimate:** 45 min

**As a** developer  
**I want** the results page to fetch and display analysis  
**So that** users see their verdict

**Acceptance Criteria:**

- [ ] `app/[username]/page.tsx` created
- [ ] Fetches from `/api/analyze/[username]` on mount
- [ ] Shows `LoadingState` during fetch
- [ ] Handles all error states (show `ErrorState`)
- [ ] Shows results on success
- [ ] Minimum loading time of 2 seconds enforced

**Technical Notes:**

- Use client component with `useEffect` or React Query
- Consider `useSWR` for caching

---

## E7: Results Page

> **Goal:** Create the main results display with verdict, breakdown, and sharing.

### Story 7.1: Create Envelope Reveal Animation

**Priority:** P0  
**Estimate:** 1.5 hours

**As a** user  
**I want** a dramatic reveal of my verdict  
**So that** the moment feels special and exciting

**Acceptance Criteria:**

- [ ] `components/EnvelopeReveal.tsx` created
- [ ] Animation sequence:
  1. Envelope slides in from bottom (0.5s)
  2. Brief pause for anticipation (0.5s)
  3. Envelope opens with 3D flip effect (0.8s)
  4. Verdict card emerges and scales (0.5s)
- [ ] Total duration: 2-3 seconds
- [ ] 60fps smooth animation
- [ ] Click/tap to skip animation
- [ ] Works on mobile devices
- [ ] Respects `prefers-reduced-motion` (skip to final state)

**Technical Notes:**

- Use Framer Motion for orchestration
- Use CSS 3D transforms for flip effect

---

### Story 7.2: Create Verdict Card Component

**Priority:** P0  
**Estimate:** 45 min

**As a** user  
**I want** to see my overall verdict prominently  
**So that** I immediately know my status

**Acceptance Criteria:**

- [ ] `components/VerdictCard.tsx` created
- [ ] Displays:
  - User avatar (from GitHub)
  - @username with link to profile
  - Verdict emoji (large, prominent)
  - Verdict label ("Very Nice", etc.)
  - Overall score (X/100)
  - Flavor text ("Definitely on the nice list")
- [ ] Visually striking design
- [ ] Responsive layout

**Technical Notes:**

- Use Next.js Image component for avatar
- Consider gradient backgrounds based on verdict tier

---

### Story 7.3: Create Score Breakdown Component

**Priority:** P0  
**Estimate:** 1 hour

**As a** user  
**I want** to see my score for each category  
**So that** I understand what I did well and what I can improve

**Acceptance Criteria:**

- [ ] `components/ScoreBreakdown.tsx` created
- [ ] `components/CategoryRow.tsx` created
- [ ] Each category displays:
  - Category icon (📅, 📝, ✂️, 🤝, 🧹, 🌍)
  - Category name
  - Score (0-100)
  - Progress bar (filled to score %)
  - Quip based on score
- [ ] Categories animate in sequentially after reveal
- [ ] Staggered animation delay (0.1s per category)
- [ ] Progress bars animate from 0 to score

**Technical Notes:**

- Use Framer Motion `stagger` for sequential animation
- Color progress bar based on score (red → yellow → green)

---

### Story 7.4: Create AI Summary Component

**Priority:** P0  
**Estimate:** 30 min

**As a** user  
**I want** a personalized Santa verdict  
**So that** my results feel unique and shareable

**Acceptance Criteria:**

- [ ] `components/AISummary.tsx` created
- [ ] Displays AI-generated 2-3 sentence summary
- [ ] Styled as a "quote" or "letter from Santa"
- [ ] Fallback text if AI generation failed
- [ ] Typewriter animation (optional, P2)

**Technical Notes:**

- Use italic or handwriting-style font for personality
- Consider quotation marks or decorative elements

---

### Story 7.5: Create Error State Component

**Priority:** P0  
**Estimate:** 30 min

**As a** user  
**I want** helpful error messages  
**So that** I know what went wrong and what to do

**Acceptance Criteria:**

- [ ] `components/ErrorState.tsx` created
- [ ] Handles all error codes:
  - `USER_NOT_FOUND`: "Hmm, Santa can't find that username..."
  - `NO_ACTIVITY`: "This account has been very quiet..."
  - `RATE_LIMITED`: "The elves are overwhelmed..."
  - `GITHUB_ERROR`: "GitHub's workshop is closed..."
  - `INTERNAL_ERROR`: Generic friendly message
- [ ] "Try Again" button for retryable errors
- [ ] "Check Another User" link back to home
- [ ] Festive styling (not jarring or scary)

---

## E8: Social Sharing

> **Goal:** Enable users to share their results on social media.

### Story 8.1: Create Share Buttons Component

**Priority:** P0  
**Estimate:** 45 min

**As a** user  
**I want** to share my results easily  
**So that** my friends can see and try it too

**Acceptance Criteria:**

- [ ] `components/ShareButtons.tsx` created
- [ ] "Share on X" button:
  - Opens Twitter intent URL
  - Pre-filled text: "I scored [X]/100 on GitHub Naughty or Nice! I'm [VERDICT] 🎅 Check yours: [URL]"
  - Includes hashtag #GitHubWrapped or similar
- [ ] "Copy Link" button:
  - Copies shareable URL to clipboard
  - Shows "Copied!" confirmation
- [ ] "Check Another User" button:
  - Navigates back to home page
- [ ] Buttons are prominent and accessible

**Technical Notes:**

- Twitter intent: `https://twitter.com/intent/tweet?text=...&url=...`
- Use `navigator.clipboard.writeText()` for copy

---

### Story 8.2: Create OG Image Route

**Priority:** P0  
**Estimate:** 1 hour

**As a** user  
**I want** beautiful social preview images  
**So that** my shared links look great on Twitter/X

**Acceptance Criteria:**

- [ ] `app/api/og/[username]/route.tsx` created
- [ ] Uses `@vercel/og` (ImageResponse)
- [ ] Image dimensions: 1200x630
- [ ] Image includes:
  - Username and avatar
  - Verdict emoji and label
  - Overall score
  - App branding
  - Festive design
- [ ] Cache headers: `max-age=86400` (24 hours)
- [ ] Handles missing user gracefully

**Technical Notes:**

- Edge runtime for performance
- Reference Vercel OG documentation

---

### Story 8.3: Configure Meta Tags

**Priority:** P0  
**Estimate:** 30 min

**As a** developer  
**I want** proper Open Graph and Twitter meta tags  
**So that** social shares display correctly

**Acceptance Criteria:**

- [ ] `app/[username]/page.tsx` exports metadata
- [ ] Dynamic OG tags based on username:
  - `og:title`: "@username is [VERDICT] on GitHub!"
  - `og:description`: "Score: X/100 - [FLAVOR_TEXT]"
  - `og:image`: `/api/og/[username]`
  - `twitter:card`: "summary_large_image"
- [ ] Fallback tags for home page
- [ ] Tags validate with Twitter Card Validator

**Technical Notes:**

- Use Next.js `generateMetadata` function
- May need to fetch analysis data for dynamic tags

---

### Story 8.4: Add Download Image Feature (Nice-to-have)

**Priority:** P2  
**Estimate:** 30 min

**As a** user  
**I want** to download my results as an image  
**So that** I can share it anywhere, not just Twitter

**Acceptance Criteria:**

- [ ] "Download" button added to ShareButtons
- [ ] Downloads OG image as PNG
- [ ] Filename: `github-naughty-nice-[username].png`
- [ ] Works on mobile browsers

**Technical Notes:**

- Fetch OG image URL and trigger download
- Use `download` attribute on anchor tag

---

## E-API: Analysis API Route

> **Goal:** Create the main API endpoint that orchestrates everything.

### Story API.1: Create Analysis Endpoint

**Priority:** P0  
**Estimate:** 1 hour

**As a** developer  
**I want** a single API endpoint for analysis  
**So that** the frontend has one place to fetch results

**Acceptance Criteria:**

- [ ] `app/api/analyze/[username]/route.ts` created
- [ ] GET endpoint accepts username parameter
- [ ] Validates username format (return 400 if invalid)
- [ ] Orchestrates:
  1. Check cache → return if fresh
  2. Fetch GitHub data
  3. Calculate all scores
  4. Generate AI verdict
  5. Assemble `UserAnalysis` response
  6. Cache result
  7. Return response
- [ ] Returns `AnalysisResponse` type
- [ ] Error handling for all failure modes
- [ ] Response time <10s for fresh requests

**Technical Notes:**

- Reference Architecture Sections 3.2, 7.2, 6, 8

---

### Story API.2: Implement Caching

**Priority:** P1  
**Estimate:** 30 min

**As a** developer  
**I want** response caching  
**So that** repeated requests are fast and API limits are preserved

**Acceptance Criteria:**

- [ ] `lib/cache.ts` created
- [ ] In-memory cache with TTL (1 hour)
- [ ] Cache key: `analysis:${username.toLowerCase()}`
- [ ] Cache stores full `UserAnalysis` object
- [ ] Cache invalidation on TTL expiry
- [ ] Log cache hits/misses

**Technical Notes:**

- Simple Map-based cache is fine for MVP
- Document limitation: doesn't persist across cold starts

---

## Story Dependencies

```
E1 (Setup) ──────────────────────────────────────────────┐
    │                                                    │
    ▼                                                    │
E2 (GitHub API) ───────────────────┐                     │
    │                              │                     │
    ▼                              ▼                     │
E3 (Scoring) ─────────────────> E-API (Analysis) <───────┤
    │                              │                     │
    ▼                              │                     │
E4 (AI) ───────────────────────────┘                     │
                                   │                     │
                                   ▼                     │
                         E5 (Landing) <──────────────────┘
                                   │
                                   ▼
                         E6 (Loading)
                                   │
                                   ▼
                         E7 (Results)
                                   │
                                   ▼
                         E8 (Sharing)
```

---

## Implementation Order (Recommended)

### Phase 1: Foundation (Stories to start immediately)

1. **1.1** Initialize Next.js Project
2. **1.2** Configure Environment & Types

### Phase 2: Backend Core (Parallel work possible)

3. **2.1** Create GitHub API Client
4. **2.2** Implement Data Fetching Functions
5. **2.3** Create Aggregated Data Fetcher
6. **3.1** Implement Category Scoring Functions
7. **3.2** Implement Verdict Calculation
8. **3.3** Implement Quip Generation
9. **4.1** Implement OpenAI Client
10. **4.2** Implement Fallback Verdict
11. **API.1** Create Analysis Endpoint
12. **API.2** Implement Caching

### Phase 3: Frontend (After API is working)

13. **5.1** Create Landing Page Layout
14. **5.2** Implement Username Form
15. **6.1** Create Loading Component
16. **6.2** Implement Results Page Data Fetching
17. **7.5** Create Error State Component
18. **7.2** Create Verdict Card Component
19. **7.3** Create Score Breakdown Component
20. **7.4** Create AI Summary Component
21. **7.1** Create Envelope Reveal Animation

### Phase 4: Sharing & Polish

22. **8.1** Create Share Buttons Component
23. **8.2** Create OG Image Route
24. **8.3** Configure Meta Tags

### Phase 5: Nice-to-haves (If time permits)

25. **5.3** Add Snowfall Animation
26. **8.4** Add Download Image Feature

---

## Definition of Done

A story is complete when:

- [ ] All acceptance criteria are met
- [ ] Code follows TypeScript strict mode (no `any`)
- [ ] **Unit tests written** for new functions/components
- [ ] **Tests pass** (`npm run test:run`)
- [ ] Component is responsive (mobile-first)
- [ ] No console errors or warnings
- [ ] Tested manually in Chrome and Safari
- [ ] Error states handled gracefully

### Testing Requirements

| Code Type | Required Tests |
|-----------|----------------|
| `lib/*.ts` | Unit tests for each exported function |
| `app/api/**` | Request/response tests |
| `components/*.tsx` | Render + interaction tests |

**Test commands:**
```bash
npm test           # Watch mode
npm run test:run   # Single run
npm run test:coverage  # With coverage
```

---

## Notes for Implementation

### Quick Wins

- Stories 1.1, 1.2, 3.2, 3.3, 4.2 are quick (<30 min each)
- Get these done early to build momentum

### Potential Blockers

- GitHub API rate limits during development (use caching)
- OpenAI API key needed for AI stories
- Avatar/OG image fetching may need CORS handling

### Testing Strategy

**Automated (Required):**
- Run `npm run test:run` before marking story complete
- Unit tests for all `lib/` functions
- Edge case tests (empty inputs, boundaries)

**Manual (Recommended):**
- Test with real GitHub usernames
- Test edge cases: inactive users, new users, heavy users
- Test error states by using invalid usernames

---

_Epics & Stories generated by BMAD PM Agent — Ready for sprint planning_
