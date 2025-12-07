# MVP-4: Landing Page + API Route

**Status:** complete  
**Priority:** P0 — User Entry Point  
**Estimate:** 1.5 hours

---

## Goal

Create the landing page with username input and the main API route that orchestrates analysis.

---

## Acceptance Criteria

- [x] Landing page with festive headline and username input
- [x] Client-side username validation (alphanumeric + hyphens)
- [x] Submit navigates to `/[username]` page
- [x] API route `/api/analyze/[username]` returns full analysis
- [x] API handles all error cases with proper error responses
- [x] Responsive design (mobile-first)

---

## Tasks

### 1. Update `app/globals.css` ✅

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #0a0a0a;
  --foreground: #fafafa;
  --accent: #22c55e;
  --accent-red: #ef4444;
}

body {
  background: linear-gradient(to bottom, #0f172a, #1e1b4b);
  min-height: 100vh;
}
```

### 2. Update `app/layout.tsx` ✅

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Naughty or Nice - GitHub Edition',
  description:
    'Find out if your GitHub activity lands you on the nice list or the naughty list this year!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

### 3. Create `app/page.tsx` ✅

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const validateUsername = (value: string) => {
    const pattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
    if (!value) return 'Username is required';
    if (value.length > 39) return 'Username is too long';
    if (!pattern.test(value)) return 'Invalid username format';
    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateUsername(username.trim());
    if (validationError) {
      setError(validationError);
      return;
    }
    router.push(`/${username.trim()}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="text-center max-w-2xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-green-400 via-white to-red-400 bg-clip-text text-transparent">
          Naughty or Nice?
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-8">
          Enter your GitHub username to find out if you&apos;re getting code or
          coal this year 🎄
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="username"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                autoComplete="off"
                autoFocus
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={!username.trim()}
              className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Check My List 🎅
            </button>
          </div>
        </form>

        {/* Footer hint */}
        <p className="mt-8 text-sm text-gray-500">
          We analyze your public GitHub activity for {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
```

### 4. Create `app/api/analyze/[username]/route.ts` ✅

```typescript
import { NextResponse } from 'next/server';
import { fetchUserData } from '@/lib/github';
import {
  calculateAllScores,
  calculateOverallScore,
  getVerdictTier,
  getVerdictDetails,
} from '@/lib/scoring';
import { generateAIVerdict } from '@/lib/ai';
import { AppError } from '@/lib/errors';
import { UserAnalysis, AnalysisResponse } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // Validate username
  const usernamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
  if (!username || !usernamePattern.test(username)) {
    return NextResponse.json<AnalysisResponse>(
      {
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Invalid username format' },
      },
      { status: 400 }
    );
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new AppError('INTERNAL_ERROR', 'GitHub token not configured', 500);
    }

    // Fetch GitHub data
    const data = await fetchUserData(username, token);

    // Calculate scores
    const categories = calculateAllScores(
      data.commits,
      data.pullRequests,
      data.reviewCount,
      data.issues,
      data.events,
      username
    );

    const overallScore = calculateOverallScore(categories);
    const verdictTier = getVerdictTier(overallScore);
    const verdictDetails = getVerdictDetails(verdictTier);

    // Check if user has activity
    const hasActivity =
      data.commits.length > 0 ||
      data.pullRequests.length > 0 ||
      data.events.length > 0;

    // Generate AI verdict
    const summary = {
      totalCommits: data.commits.length,
      totalPRs: data.pullRequests.length,
      totalReviews: data.reviewCount,
      totalIssues: data.issues.length,
    };

    const aiSummary = await generateAIVerdict({
      username,
      overallScore,
      verdictTier,
      categories,
      summary,
    });

    // Build response
    const analysis: UserAnalysis = {
      username: data.user.login,
      avatarUrl: data.user.avatar_url,
      profileUrl: data.user.html_url,
      analyzedAt: new Date().toISOString(),
      yearAnalyzed: new Date().getFullYear(),
      hasActivity,
      verdict: {
        tier: verdictTier,
        label: verdictDetails.label,
        emoji: verdictDetails.emoji,
        score: overallScore,
        flavor: verdictDetails.flavor,
        aiSummary,
      },
      categories,
      summary,
      dataCompleteness: data.dataCompleteness,
    };

    return NextResponse.json<AnalysisResponse>({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Analysis error:', error);

    if (error instanceof AppError) {
      return NextResponse.json<AnalysisResponse>(
        {
          success: false,
          error: { code: error.code, message: error.message, ...error.meta },
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json<AnalysisResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
```

---

## Done When

- [x] Landing page renders with festive design
- [x] Username input validates and submits
- [x] `/api/analyze/octocat` returns full JSON response
- [x] Error cases return proper error objects
- [x] Mobile responsive

---

## Dev Agent Record

### Implementation Notes

- Landing page uses gradient text for festive header (green/white/red)
- Dark background gradient (slate to indigo) for atmosphere
- Client-side validation prevents invalid username submission
- API route uses Next.js 14 App Router async params pattern
- Error handling distinguishes AppError from generic errors
- All responses typed with AnalysisResponse for consistency

### Completion Notes

All 4 tasks completed successfully:

- ✅ app/globals.css - CSS variables and dark gradient background
- ✅ app/layout.tsx - Metadata and Inter font
- ✅ app/page.tsx - Landing page with form and validation
- ✅ app/api/analyze/[username]/route.ts - Full analysis endpoint
- ✅ Build passes with no TypeScript errors
- ✅ Lint passes with no warnings
- ✅ All 61 tests pass

---

## File List

### Modified Files

- app/globals.css
- app/layout.tsx
- app/page.tsx

### New Files

- app/api/analyze/[username]/route.ts

---

## Change Log

| Date       | Change                                       |
| ---------- | -------------------------------------------- |
| 2025-12-07 | Initial implementation - all tasks completed |
