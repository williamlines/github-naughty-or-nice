# MVP-3: OpenAI Integration

**Status:** complete  
**Priority:** P0 — AI Verdict  
**Estimate:** 30 minutes

---

## Goal

Generate personalized Santa verdicts using OpenAI GPT-4o-mini with fallback templates.

---

## Acceptance Criteria

- [x] OpenAI client configured with API key
- [x] `generateAIVerdict()` creates 2-3 sentence Santa verdict
- [x] Prompt includes username, scores, and stats
- [x] Fallback template verdict if OpenAI fails
- [x] Response limited to ~200 tokens
- [x] **Unit tests written and passing** (`lib/ai.test.ts` - 10 tests)

---

## Tasks

### 1. Create `lib/ai.ts` ✅

```typescript
import OpenAI from 'openai';
import { CategoryScores, VerdictTier } from '@/types';

// Lazy initialization to avoid errors when OPENAI_API_KEY is not set
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export interface VerdictInput {
  username: string;
  overallScore: number;
  verdictTier: VerdictTier;
  categories: CategoryScores;
  summary: {
    totalCommits: number;
    totalPRs: number;
    totalReviews: number;
    totalIssues: number;
  };
}

export async function generateAIVerdict(input: VerdictInput): Promise<string> {
  const systemPrompt = `You are Santa Claus reviewing a developer's GitHub activity for the year.
Write a 2-3 sentence personalized, festive verdict. Be warm but honest.
Reference specific metrics when relevant (commits, PRs, reviews).
Keep it fun, playful, and shareable.
Do NOT use generic platitudes - make it specific to their data.
End with a forward-looking comment about next year.`;

  const userPrompt = `Developer: @${input.username}
Overall Score: ${input.overallScore}/100 (${input.verdictTier})

Category Breakdown:
- Commit Consistency: ${input.categories.commitConsistency.score}/100
- Message Quality: ${input.categories.messageQuality.score}/100
- PR Hygiene: ${input.categories.prHygiene.score}/100
- Review Karma: ${input.categories.reviewKarma.score}/100
- Issue Citizenship: ${input.categories.issueCitizenship.score}/100
- Collaboration Spirit: ${input.categories.collaborationSpirit.score}/100

Stats:
- Total Commits: ${input.summary.totalCommits}
- Total PRs: ${input.summary.totalPRs}
- Total Reviews: ${input.summary.totalReviews}
- Total Issues: ${input.summary.totalIssues}`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 200,
      temperature: 0.8,
    });

    return response.choices[0]?.message?.content || getFallbackVerdict(input);
  } catch (error) {
    console.error('OpenAI error:', error);
    return getFallbackVerdict(input);
  }
}

export function getFallbackVerdict(input: VerdictInput): string {
  const templates: Record<VerdictTier, string> = {
    'extremely-nice': `Ho ho ho! @${input.username}, you've been absolutely wonderful this year with ${input.summary.totalCommits} commits! Santa's workshop could use someone like you. Keep spreading the code cheer in the new year!`,
    'very-nice': `@${input.username}, Santa is impressed! ${input.summary.totalCommits} commits and ${input.summary.totalPRs} PRs show real dedication. You're definitely on the nice list this year. Keep up the great work!`,
    'sort-of-nice': `@${input.username}, you've been mostly nice this year. ${input.summary.totalCommits} commits show effort, though the elves noticed some room for improvement. A little more consistency next year and you'll be golden!`,
    borderline: `@${input.username}, the elves are still debating your case. ${input.summary.totalCommits} commits is a start, but Santa sees untapped potential. New year, new opportunities to shine!`,
    'sort-of-naughty': `@${input.username}, coal is looking likely this year. Only ${input.summary.totalCommits} commits and ${input.summary.totalReviews} reviews? The elves expected more. But hey, there's always next year to redeem yourself!`,
    'very-naughty': `@${input.username}, Santa's a bit disappointed. The workshop records show minimal activity this year. But remember, every commit journey starts with a single push. Make next year count!`,
    'extremely-naughty': `@${input.username}... we need to talk. The elves found almost nothing in your GitHub stocking this year. But fear not! Even Scrooge got a redemption arc. Let's make next year legendary!`,
  };
  return templates[input.verdictTier];
}
```

---

## Done When

- [x] `generateAIVerdict()` returns personalized Santa message
- [x] Fallback works when OpenAI key missing or API fails
- [x] Messages reference actual user stats
- [x] Response is 2-3 sentences, festive tone
- [x] Unit tests pass (10 tests)

---

## Dev Agent Record

### Implementation Notes

- Used lazy initialization for OpenAI client to avoid errors during test runs
- `getOpenAI()` function creates client on first use only
- Fallback verdicts are tier-specific, personalized with username and stats
- All 7 verdict tiers have unique fallback templates

### Completion Notes

All tasks completed successfully:

- ✅ lib/ai.ts - OpenAI integration with lazy client initialization
- ✅ lib/ai.test.ts - 10 unit tests for getFallbackVerdict
- ✅ Build passes with no TypeScript errors
- ✅ All tests pass (61 total)

---

## File List

### New Files

- lib/ai.ts
- lib/ai.test.ts (10 unit tests)

---

## Change Log

| Date       | Change                                       |
| ---------- | -------------------------------------------- |
| 2025-12-07 | Initial implementation - all tasks completed |
