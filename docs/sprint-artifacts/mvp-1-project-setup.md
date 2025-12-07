# MVP-1: Project Setup & Types

**Status:** complete  
**Priority:** P0 — Foundation  
**Estimate:** 30 minutes

---

## Goal

Initialize Next.js 14 project with all dependencies, TypeScript types, and project structure.

---

## Acceptance Criteria

- [x] Next.js 14 with App Router, TypeScript strict mode, Tailwind CSS
- [x] All dependencies installed (framer-motion, clsx, tailwind-merge, openai)
- [x] ESLint + Prettier configured
- [x] Project structure created (app/, components/, lib/, types/)
- [x] All TypeScript types defined in `types/index.ts`
- [x] `.env.local.example` with required variables
- [x] `lib/utils.ts` with `cn()` helper

---

## Tasks

### 1. Initialize Project ✅

```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*"
```

When prompted:

- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: No
- App Router: Yes
- Import alias: @/\*

### 2. Install Dependencies ✅

```bash
npm install framer-motion clsx tailwind-merge openai
npm install --save-dev prettier eslint-config-prettier
```

### 3. Configure Prettier ✅

Create `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

Update `.eslintrc.json`:

```json
{
  "extends": ["next/core-web-vitals", "prettier"]
}
```

Add to `package.json` scripts:

```json
"format": "prettier --write ."
```

### 4. Create Project Structure ✅

```bash
mkdir -p components/ui lib types app/api/analyze/[username] app/[username]
```

### 5. Create `lib/utils.ts` ✅

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 6. Create `types/index.ts` ✅

```typescript
// ============ VERDICT SYSTEM ============

export type VerdictTier =
  | 'extremely-nice'
  | 'very-nice'
  | 'sort-of-nice'
  | 'borderline'
  | 'sort-of-naughty'
  | 'very-naughty'
  | 'extremely-naughty';

export interface Verdict {
  tier: VerdictTier;
  label: string;
  emoji: string;
  score: number;
  flavor: string;
  aiSummary: string;
}

// ============ SCORING CATEGORIES ============

export type CategoryId =
  | 'commitConsistency'
  | 'messageQuality'
  | 'prHygiene'
  | 'reviewKarma'
  | 'issueCitizenship'
  | 'collaborationSpirit';

export interface CategoryScore {
  score: number;
  quip: string;
  stats: Record<string, number | string>;
}

export type CategoryScores = Record<CategoryId, CategoryScore>;

// ============ USER ANALYSIS ============

export interface UserAnalysis {
  username: string;
  avatarUrl: string;
  profileUrl: string;
  analyzedAt: string;
  yearAnalyzed: number;
  hasActivity: boolean;
  verdict: Verdict;
  categories: CategoryScores;
  summary: {
    totalCommits: number;
    totalPRs: number;
    totalReviews: number;
    totalIssues: number;
  };
  dataCompleteness: {
    eventsLimited: boolean;
    reposAnalyzed: number;
    reposTotal: number;
    note?: string;
  };
}

// ============ API RESPONSE ============

export interface AnalysisSuccess {
  success: true;
  data: UserAnalysis;
}

export interface AnalysisError {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    retryAfter?: number;
  };
}

export type AnalysisResponse = AnalysisSuccess | AnalysisError;

export type ErrorCode =
  | 'USER_NOT_FOUND'
  | 'NO_ACTIVITY'
  | 'RATE_LIMITED'
  | 'GITHUB_ERROR'
  | 'OPENAI_ERROR'
  | 'INTERNAL_ERROR';
```

### 7. Create `types/github.ts` ✅

```typescript
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  created_at: string;
}

export interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  repo: { id: number; name: string };
  payload: Record<string, unknown>;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { date: string };
  };
  author: { login: string } | null;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  state: 'open' | 'closed';
  created_at: string;
  merged_at: string | null;
  additions: number;
  deletions: number;
  user: { login: string };
}

export interface GitHubIssue {
  id: number;
  number: number;
  state: 'open' | 'closed';
  created_at: string;
  closed_at: string | null;
  user: { login: string };
  pull_request?: unknown;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  pushed_at: string;
  default_branch: string;
}

export interface GitHubSearchResult<T> {
  total_count: number;
  incomplete_results: boolean;
  items: T[];
}
```

### 8. Create `.env.local.example` ✅

```bash
# GitHub API - Get from https://github.com/settings/tokens
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# OpenAI API - Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 9. Create `lib/env.ts` ✅

```typescript
export function validateEnv() {
  const required = ['GITHUB_TOKEN', 'OPENAI_API_KEY'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}

export const env = {
  githubToken: process.env.GITHUB_TOKEN!,
  openaiApiKey: process.env.OPENAI_API_KEY!,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};
```

### 10. Verify Setup ✅

```bash
npm run dev
npm run build
npm run lint
```

---

## Done When

- [x] `npm run dev` starts without errors
- [x] `npm run build` succeeds
- [x] All types importable with `@/types`
- [x] `cn()` helper works
- [x] **Unit tests written and passing** (`lib/utils.test.ts` - 8 tests, `lib/env.test.ts` - 4 tests)

---

## Dev Agent Record

### Implementation Notes

- Created Next.js 14 project manually (not via create-next-app) to preserve existing .bmad/.cursor/.claude directories
- Used Inter + JetBrains Mono fonts instead of Geist (not available in Next.js 14)
- Used next.config.mjs instead of next.config.ts (TS config not supported in Next 14)
- All dependencies installed and verified
- TypeScript strict mode enabled in tsconfig.json
- Tailwind CSS configured with app/, components/ content paths

### Completion Notes

All 10 tasks completed successfully:

- ✅ Project initialized with Next.js 14 App Router
- ✅ Dependencies installed (framer-motion, clsx, tailwind-merge, openai, prettier)
- ✅ ESLint + Prettier configured with eslint-config-prettier
- ✅ Project structure created (app/, components/ui/, lib/, types/)
- ✅ TypeScript types defined in types/index.ts and types/github.ts
- ✅ Environment template created in .env.local.example
- ✅ cn() helper implemented in lib/utils.ts
- ✅ All verification commands pass (dev, build, lint)
- ✅ Unit tests for lib/utils.ts (8 tests) and lib/env.ts (4 tests)

---

## File List

### New Files

- package.json
- package-lock.json
- next.config.mjs
- tsconfig.json
- tailwind.config.ts
- postcss.config.mjs
- next-env.d.ts
- .eslintrc.json
- .prettierrc
- .gitignore
- .env.local.example
- app/globals.css
- app/layout.tsx
- app/page.tsx
- lib/utils.ts
- lib/utils.test.ts (8 unit tests)
- lib/env.ts
- lib/env.test.ts (4 unit tests)
- types/index.ts
- types/github.ts

### Directories Created

- app/
- app/api/analyze/[username]/
- app/[username]/
- components/
- components/ui/
- lib/
- types/

---

## Change Log

| Date       | Change                                       |
| ---------- | -------------------------------------------- |
| 2025-12-07 | Initial implementation - all tasks completed |
| 2025-12-07 | Added unit tests for utils.ts and env.ts (12 tests) |
