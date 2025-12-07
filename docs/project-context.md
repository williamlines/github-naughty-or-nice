# Project Context: Naughty or Nice

> **This file captures the core project vision and context. All BMAD agents should reference this as the source of truth for what we're building.**

---

## 🎯 Project Overview

**Name:** Naughty or Nice  
**Type:** Web Application  
**Timeline:** Hackathon (must be completed quickly)  
**Target Users:** Developers

---

## 💡 The Idea

A web app where users provide their **GitHub username** and receive a fun, data-driven assessment of whether they've been **"naughty or nice"** on GitHub over the current year.

### How It Works

1. User enters their GitHub username
2. App connects to the **GitHub API** to gather activity data for the current year
3. App analyzes their behavior against **industry best practices**
4. User receives:
   - A **breakdown of their GitHub activity**
   - A **"Naughty or Nice" score** on a scale (e.g., "somewhat naughty", "extremely nice")

---

## 📊 Scoring System

### Overall Score Format

Users receive a **breakdown by category** plus an **overall niceness verdict**:

| Verdict                  | Score Range | Flavor                              |
| ------------------------ | ----------- | ----------------------------------- |
| 🎅 **Extremely Nice**    | 90-100%     | "Santa's putting you on speed dial" |
| 😇 **Very Nice**         | 75-89%      | "Definitely on the nice list"       |
| 🙂 **Sort of Nice**      | 60-74%      | "Nice-ish... we'll allow it"        |
| 😬 **Borderline**        | 45-59%      | "The elves are debating"            |
| 😈 **Sort of Naughty**   | 30-44%      | "Coal is looking likely"            |
| 👿 **Very Naughty**      | 15-29%      | "Santa's disappointed"              |
| 💀 **Extremely Naughty** | 0-14%       | "Krampus has entered the chat"      |

---

### Scoring Categories (MVP)

Each category scores 0-100, weighted equally for the overall score.

#### 1. 📅 Commit Consistency

**What it measures:** Steady contributions vs. sporadic code dumps  
**Nice:** Commits spread across weeks/months  
**Naughty:** Long gaps followed by massive commit bursts  
**API Source:** Events API / Commits with timestamps

#### 2. 📝 Commit Message Quality

**What it measures:** Descriptive, meaningful commit messages  
**Nice:** Average message length >20 chars, descriptive language  
**Naughty:** High % of "fix", "wip", "asdf", "update", single-word messages  
**API Source:** Commits API (message field)

#### 3. ✂️ PR Hygiene

**What it measures:** Reviewable, reasonably-sized pull requests  
**Nice:** Average PR < 400 lines changed, most PRs < 500 lines  
**Naughty:** Mega-PRs (>1000 lines), frequent massive changesets  
**API Source:** Pull Requests API (additions/deletions)

#### 4. 🤝 Review Karma

**What it measures:** Participation in reviewing others' code  
**Nice:** Reviews given on PRs they didn't author  
**Naughty:** Only opens PRs, never reviews others  
**API Source:** Pull Request Reviews API

#### 5. 🧹 Issue Citizenship

**What it measures:** Engagement with issues (not just opening them)  
**Nice:** Closes issues, comments helpfully, good close ratio  
**Naughty:** Opens issues and ghosts, never closes anything  
**API Source:** Issues API + Issue Comments

#### 6. 🌍 Collaboration Spirit

**What it measures:** Contributing beyond personal repos  
**Nice:** Contributions to repos they don't own, diverse activity  
**Naughty:** Only works in own repos, no community involvement  
**API Source:** Events API (PushEvent, PullRequestEvent on external repos)

---

### Stretch Goals (Post-MVP)

**Scoring:**

- **Test coverage detection** — Heuristic analysis for test file presence
- **Documentation score** — README quality, update frequency
- **Response time** — How quickly they respond to PR feedback

**Features:**

- **Compare Mode** — "Who's nicer?" head-to-head battles between users
- **Roast Mode** — Toggle between Santa's kind verdict vs. brutal comedy roast
- **OAuth integration** — Private repo access for complete analysis
- **Year-over-year** — Compare previous years if data available

---

## 🎨 Tone & Personality

- **Fun & playful** — It's a hackathon project with a holiday theme
- **Non-judgmental** — Encouraging, not shaming
- **Shareable** — Users should want to share their results

---

## 🖼️ User Experience Flow

### Screen 1: Landing Page

**Purpose:** Get the username, set the festive tone

- **Headline:** "Have you been Naughty or Nice on GitHub?"
- **Subhead:** "Enter your username to find out if you're getting code or coal this year"
- **Input:** Single text field for GitHub username
- **CTA:** "Check My List" button
- **Atmosphere:** Festive, playful, minimal — one clear action
- **Nice-to-have:** Subtle snowfall animation, avatar preview on valid username

---

### Screen 2: Loading / Analysis State

**Purpose:** Build anticipation, hide API latency

- **Animation:** Progress indicator with festive theming
- **Rotating messages:** "Checking your commits...", "Reviewing your PRs...", "Consulting the elves..."
- **Duration:** 3-10 seconds (add theatrical delay even if API is fast)

---

### Screen 3: Results Page — The Reveal ✨

**Purpose:** The hero moment. Delightful reveal, detailed breakdown, shareable.

#### The Reveal Animation

- **Style:** Card flip / envelope opening effect 📨
- **Flow:** Envelope appears → opens dramatically → verdict card emerges
- **Sound:** Optional festive sound effect (sleigh bells?)

#### Results Layout

```
┌────────────────────────────────────────────┐
│                                            │
│         [Avatar]                           │
│         @username                          │
│                                            │
│    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                            │
│           🎅 SORT OF NICE 🎅               │
│              Score: 68/100                 │
│                                            │
│    "Nice-ish... we'll allow it"            │
│                                            │
│    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                            │
│    📊 YOUR BREAKDOWN                       │
│                                            │
│    📅 Commit Consistency    ████████░░ 78  │
│       "Steady as a reindeer"               │
│                                            │
│    📝 Message Quality       ██████░░░░ 62  │
│       "Your commits tell a story...        │
│        mostly in single words"             │
│                                            │
│    ✂️ PR Hygiene            ███████░░░ 71  │
│       "Reviewers appreciate you"           │
│                                            │
│    🤝 Review Karma          ████░░░░░░ 45  │
│       "The elves want more reviews"        │
│                                            │
│    🧹 Issue Citizenship     ████████░░ 82  │
│       "A tidy workshop indeed"             │
│                                            │
│    🌍 Collaboration         ██████░░░░ 65  │
│       "Spreading holiday cheer"            │
│                                            │
│    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                            │
│    [🐦 Share on X]  [📋 Copy Link]         │
│                                            │
│    [Check Another User]                    │
│                                            │
└────────────────────────────────────────────┘
```

#### Per-Category Insights (MVP)

Each category includes a **one-liner quip** based on score:

- Adds personality and humor
- Makes results feel personalized
- Gives users something quotable to share

---

### Screen 4: Error States

| Error Type             | Message                                                         | Tone       |
| ---------------------- | --------------------------------------------------------------- | ---------- |
| **User not found**     | "Hmm, Santa can't find that username. Are you sure they exist?" | Helpful    |
| **No public activity** | "This account has been very quiet... suspiciously quiet. 🤔"    | Playful    |
| **Rate limited**       | "The elves are overwhelmed! Try again in a few minutes."        | Apologetic |
| **API down**           | "GitHub's workshop is closed for maintenance. Check back soon!" | Reassuring |

---

### Shareable Results Image (MVP)

Generate a **share card image** for social media virality:

- Rendered as PNG/JPG for easy screenshotting
- Includes: username, avatar, verdict, overall score, festive design
- Optimized for Twitter/X card dimensions
- Implementation: Canvas API or server-side rendering

---

### UX Stretch Goals

- **Compare Mode** — Check another user, enable "Who's nicer?" battles
- **Leaderboards** — Community rankings (requires opt-in)
- **Year-over-year** — Compare 2024 vs 2025 (if data available)

---

## 🔧 Technical Context

### External APIs

| API                 | Purpose                                             | Auth                              |
| ------------------- | --------------------------------------------------- | --------------------------------- |
| **GitHub REST API** | Fetch user activity (commits, PRs, issues, reviews) | Personal Access Token (5k req/hr) |
| **OpenAI API**      | Generate personalized verdict summary               | API Key (provided)                |

### Data Scope

- **Time Range:** Current calendar year (2025)
- **Repo Scope:** Public repositories only (MVP)
- **Rate Limiting:** GitHub PAT = 5,000 requests/hour

---

## 🤖 AI Integration

### Personalized Verdict Summary

After calculating all scores, the app sends data to **OpenAI GPT-4o-mini** to generate a unique, personalized "Santa's Verdict" paragraph.

**What it receives:**

- Username
- All 6 category scores
- Overall verdict tier
- Key stats (total commits, PRs, etc.)

**What it generates:**
A 2-3 sentence festive summary in Santa's voice, unique to each user.

**Example output:**

> _"Ah, @williamcodes, Santa's been watching! Your commits flow as steady as hot cocoa on Christmas Eve, but those commit messages? Let's just say the elves had to squint. Your code reviews are rarer than a snowflake in July, but when you do close issues, you really clean house. Overall verdict: You're on the Nice List, but Santa's got his eye on you for 2026."_

**Implementation:**

```typescript
// lib/ai.ts
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    {
      role: 'system',
      content: `You are Santa Claus reviewing a developer's GitHub activity for the year. 
                Write a 2-3 sentence personalized, festive verdict. Be warm but honest. 
                Reference specific metrics when relevant. Keep it fun and shareable.`,
    },
    {
      role: 'user',
      content: JSON.stringify({ username, scores, stats }),
    },
  ],
  max_tokens: 200,
});
```

**Why this approach:**

- Single API call (fast, cost-efficient)
- Unique per user (highly shareable)
- Festive personality that's hard to achieve with templates
- The "hero text" for the share card

---

## 🏗️ Tech Stack

| Layer                | Technology              | Rationale                               |
| -------------------- | ----------------------- | --------------------------------------- |
| **Framework**        | Next.js 14 (App Router) | Full-stack in one, fast deployment      |
| **Styling**          | Tailwind CSS            | Rapid iteration, easy theming           |
| **Animations**       | Framer Motion           | Envelope reveal, micro-interactions     |
| **Image Generation** | @vercel/og              | Built-in social card generation         |
| **AI**               | OpenAI GPT-4o-mini      | Personalized verdict generation         |
| **Caching**          | In-memory (MVP)         | Simple, upgrade to Redis if needed      |
| **Deployment**       | Vercel                  | Zero-config, free tier, instant deploys |

---

## 📁 Project Structure

```
github-naughty-or-nice/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── [username]/
│   │   └── page.tsx                # Results page
│   ├── api/
│   │   ├── analyze/
│   │   │   └── [username]/
│   │   │       └── route.ts        # Main analysis endpoint
│   │   └── og/
│   │       └── [username]/
│   │           └── route.tsx       # Social image generation
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── UsernameForm.tsx
│   ├── LoadingState.tsx
│   ├── ResultsCard.tsx
│   ├── ScoreBreakdown.tsx
│   ├── EnvelopeReveal.tsx          # The dramatic reveal animation
│   └── ShareButtons.tsx
├── lib/
│   ├── github.ts                   # GitHub API client
│   ├── scoring.ts                  # Score calculation logic
│   ├── ai.ts                       # OpenAI integration
│   ├── quips.ts                    # Per-category one-liners
│   └── cache.ts                    # Caching layer
├── public/
│   └── (festive assets)
├── .env.local                      # API keys (GITHUB_TOKEN, OPENAI_API_KEY)
├── tailwind.config.ts
├── next.config.js
└── package.json
```

---

## 🔄 Data Flow

```
User Input (username)
        │
        ▼
┌───────────────────┐
│   /api/analyze    │
│   [username]      │
└───────────────────┘
        │
        ├──▶ Check cache ──▶ Return cached if fresh
        │
        ▼
┌───────────────────┐
│  GitHub API       │
│  - Events         │
│  - Commits        │
│  - PRs            │
│  - Issues         │
│  - Reviews        │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Scoring Engine   │
│  (6 categories)   │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  OpenAI API       │
│  (GPT-4o-mini)    │
│  Generate verdict │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Response         │
│  - Scores         │
│  - Quips          │
│  - AI Summary     │
│  - Verdict tier   │
└───────────────────┘
        │
        ▼
    Frontend renders results
```

---

## 📅 Constraints

- **Hackathon timeline** — Speed is critical
- **MVP focus** — Core features only, polish later
- **Single developer** — Solo build

---

_Last updated: 2025-12-07 (Tech stack finalized, AI integration defined, full architecture documented)_
