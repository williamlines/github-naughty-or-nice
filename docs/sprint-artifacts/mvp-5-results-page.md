# MVP-5: Results Page

**Status:** complete  
**Priority:** P0 — Show the Verdict  
**Estimate:** 1 hour

---

## Goal

Display the analysis results with verdict card, score breakdown, and AI summary.

---

## Acceptance Criteria

- [x] Results page fetches data from API on load
- [x] Shows loading spinner while fetching
- [x] Displays verdict card (avatar, username, emoji, score, label)
- [x] Shows all 6 category scores with progress bars
- [x] Displays AI-generated summary
- [x] Shows error state for failed analyses
- [x] "Check Another" button returns to home

---

## Tasks

### 1. Create `components/LoadingSpinner.tsx`

```tsx
export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 animate-pulse">Consulting the elves...</p>
    </div>
  );
}
```

### 2. Create `components/ErrorState.tsx`

```tsx
import Link from 'next/link';
import { ErrorCode } from '@/types';

const errorMessages: Record<ErrorCode, { title: string; message: string }> = {
  USER_NOT_FOUND: {
    title: "Hmm, Santa can't find that username",
    message: 'Are you sure they exist on GitHub?',
  },
  NO_ACTIVITY: {
    title: 'This account has been very quiet...',
    message: 'No public activity found for this year.',
  },
  RATE_LIMITED: {
    title: 'The elves are overwhelmed!',
    message: 'Too many requests. Try again in a few minutes.',
  },
  GITHUB_ERROR: {
    title: "GitHub's workshop is closed",
    message: 'Having trouble reaching GitHub. Try again soon.',
  },
  OPENAI_ERROR: {
    title: 'Santa lost his glasses',
    message:
      "Couldn't generate the AI verdict, but scores are still available.",
  },
  INTERNAL_ERROR: {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
  },
};

export function ErrorState({ code }: { code: ErrorCode }) {
  const { title, message } =
    errorMessages[code] || errorMessages.INTERNAL_ERROR;

  return (
    <div className="text-center">
      <div className="text-6xl mb-4">😅</div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-gray-400 mb-6">{message}</p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
      >
        Try Another Username
      </Link>
    </div>
  );
}
```

### 3. Create `components/VerdictCard.tsx`

```tsx
import Image from 'next/image';
import { Verdict } from '@/types';

interface VerdictCardProps {
  username: string;
  avatarUrl: string;
  profileUrl: string;
  verdict: Verdict;
}

export function VerdictCard({
  username,
  avatarUrl,
  profileUrl,
  verdict,
}: VerdictCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 text-center border border-white/10">
      {/* Avatar */}
      <a href={profileUrl} target="_blank" rel="noopener noreferrer">
        <Image
          src={avatarUrl}
          alt={username}
          width={120}
          height={120}
          className="rounded-full mx-auto mb-4 border-4 border-white/20"
        />
      </a>

      {/* Username */}
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xl text-gray-300 hover:text-white transition-colors"
      >
        @{username}
      </a>

      {/* Emoji */}
      <div className="text-7xl my-6">{verdict.emoji}</div>

      {/* Label and Score */}
      <h1 className="text-3xl md:text-4xl font-bold mb-2">{verdict.label}</h1>
      <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-2">
        {verdict.score}/100
      </div>
      <p className="text-gray-400 italic">{verdict.flavor}</p>
    </div>
  );
}
```

### 4. Create `components/CategoryRow.tsx`

```tsx
import { CategoryId, CategoryScore } from '@/types';

const categoryIcons: Record<CategoryId, string> = {
  commitConsistency: '📅',
  messageQuality: '📝',
  prHygiene: '✂️',
  reviewKarma: '🤝',
  issueCitizenship: '🧹',
  collaborationSpirit: '🌍',
};

const categoryLabels: Record<CategoryId, string> = {
  commitConsistency: 'Commit Consistency',
  messageQuality: 'Message Quality',
  prHygiene: 'PR Hygiene',
  reviewKarma: 'Review Karma',
  issueCitizenship: 'Issue Citizenship',
  collaborationSpirit: 'Collaboration Spirit',
};

interface CategoryRowProps {
  id: CategoryId;
  data: CategoryScore;
}

export function CategoryRow({ id, data }: CategoryRowProps) {
  const getBarColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span>{categoryIcons[id]}</span>
          <span className="font-medium">{categoryLabels[id]}</span>
        </div>
        <span className="font-bold">{data.score}</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1">
        <div
          className={`h-full ${getBarColor(
            data.score
          )} transition-all duration-500`}
          style={{ width: `${data.score}%` }}
        />
      </div>

      {/* Quip */}
      <p className="text-sm text-gray-400 italic">{data.quip}</p>
    </div>
  );
}
```

### 5. Create `components/ScoreBreakdown.tsx`

```tsx
import { CategoryId, CategoryScores } from '@/types';
import { CategoryRow } from './CategoryRow';

const categoryOrder: CategoryId[] = [
  'commitConsistency',
  'messageQuality',
  'prHygiene',
  'reviewKarma',
  'issueCitizenship',
  'collaborationSpirit',
];

export function ScoreBreakdown({ categories }: { categories: CategoryScores }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <h2 className="text-xl font-bold mb-4">Score Breakdown</h2>
      <div className="divide-y divide-white/10">
        {categoryOrder.map((id) => (
          <CategoryRow key={id} id={id} data={categories[id]} />
        ))}
      </div>
    </div>
  );
}
```

### 6. Create `components/AISummary.tsx`

```tsx
export function AISummary({ summary }: { summary: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <h2 className="text-xl font-bold mb-4">🎅 Santa Says...</h2>
      <blockquote className="text-lg text-gray-300 italic leading-relaxed">
        &ldquo;{summary}&rdquo;
      </blockquote>
    </div>
  );
}
```

### 7. Create `app/[username]/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnalysisResponse, UserAnalysis } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorState } from '@/components/ErrorState';
import { VerdictCard } from '@/components/VerdictCard';
import { ScoreBreakdown } from '@/components/ScoreBreakdown';
import { AISummary } from '@/components/AISummary';

export default function ResultsPage({
  params,
}: {
  params: { username: string };
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch(`/api/analyze/${params.username}`);
        const result: AnalysisResponse = await res.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error.code);
        }
      } catch {
        setError('INTERNAL_ERROR');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [params.username]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <LoadingSpinner />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <ErrorState code={error as any} />
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Verdict Card */}
        <VerdictCard
          username={data.username}
          avatarUrl={data.avatarUrl}
          profileUrl={data.profileUrl}
          verdict={data.verdict}
        />

        {/* AI Summary */}
        <AISummary summary={data.verdict.aiSummary} />

        {/* Score Breakdown */}
        <ScoreBreakdown categories={data.categories} />

        {/* Actions */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition-colors"
          >
            Check Another Username
          </Link>
        </div>
      </div>
    </main>
  );
}
```

### 8. Update `next.config.js` for Images

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
};

module.exports = nextConfig;
```

---

## Done When

- `/octocat` shows loading, then results
- Verdict card displays with avatar, score, emoji
- All 6 categories shown with progress bars
- AI summary displayed
- "Check Another" works
- Error states display correctly
- Mobile responsive
