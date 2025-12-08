# Story: External Contributions Scoring

> **Capture and score contributions to repositories the user doesn't own**
>
> **Priority:** P1  
> **Estimate:** 3-4 hours  
> **Based on:** `docs/tech-spec-external-contributions.md`

---

## Description

**As a** GitHub user  
**I want** my contributions to external repos (OSS, team projects) included in my score  
**So that** my full developer activity is recognized

### Problem

Current scoring only analyzes repos owned by the user. A developer with 500 commits to `kubernetes/kubernetes` appears as having minimal activity.

### Solution

1. Fetch PRs via Search API across ALL public repos
2. Parse Events API for external push/PR activity  
3. Update scoring to reward external contributions

---

## Acceptance Criteria

### Data Fetching
- [ ] `searchUserPRs()` fetches PRs authored across all repos via Search API
- [ ] `parseExternalContributions()` extracts external activity from Events
- [ ] External data fetched in parallel with existing calls
- [ ] Graceful degradation if Search API fails (continue with existing data)

### Scoring Updates
- [ ] **PR Hygiene** includes merge rate bonus (+15 max) and external merged PRs (+10 max)
- [ ] **Collaboration Spirit** rewards repo diversity (+20), merged external PRs (+25), external commits (+15)
- [ ] All scores remain clamped 0-100

### Response Updates
- [ ] `externalPRs` array in response
- [ ] `externalContributions` summary in response
- [ ] `dataCompleteness.externalPRsFound` count added

### Tests
- [ ] Unit tests for new functions
- [ ] Updated tests for modified scoring functions

---

## Implementation Checklist

### 1. Add Types (`types/github.ts`) — 10 min

```typescript
// Add these types
export interface SearchPRItem {
  id: number;
  title: string;
  state: 'open' | 'closed';
  created_at: string;
  closed_at: string | null;
  repository_url: string;
  pull_request?: { merged_at: string | null };
}

export interface ExternalPR {
  id: number;
  title: string;
  state: 'open' | 'closed';
  created_at: string;
  closed_at: string | null;
  merged_at: string | null;
  repository: string;
  isExternal: boolean;
}

export interface ExternalContributionSummary {
  externalPushes: Array<{ repo: string; commitCount: number; date: string }>;
  externalPRActions: Array<{ repo: string; action: string; merged: boolean; date: string }>;
  uniqueExternalRepos: number;
  totalExternalCommits: number;
}

export interface PushEventPayload {
  push_id: number;
  size: number;
  commits?: Array<{ sha: string; message: string }>;
}

export interface PREventPayload {
  action: 'opened' | 'closed' | 'merged' | 'reopened';
  pull_request?: { merged: boolean };
}
```

Update `RawGitHubData`:
```typescript
export interface RawGitHubData {
  // ... existing fields ...
  externalPRs: ExternalPR[];
  externalContributions: ExternalContributionSummary;
  dataCompleteness: {
    // ... existing fields ...
    externalPRsFound: number;
  };
}
```

---

### 2. Add GitHub Functions (`lib/github.ts`) — 30 min

```typescript
function extractRepoFromUrl(url: string): string {
  const match = url.match(/repos\/(.+)$/);
  return match ? match[1] : url;
}

export async function searchUserPRs(
  username: string,
  since: string,
  token: string
): Promise<ExternalPR[]> {
  try {
    const result = await fetchGitHub<GitHubSearchResult<SearchPRItem>>(
      `/search/issues?q=author:${username}+type:pr+created:>=${since}&per_page=100`,
      token
    );
    
    return result.items.map((item) => ({
      id: item.id,
      title: item.title,
      state: item.state,
      created_at: item.created_at,
      closed_at: item.closed_at,
      merged_at: item.pull_request?.merged_at || null,
      repository: extractRepoFromUrl(item.repository_url),
      isExternal: !item.repository_url.toLowerCase().includes(`/${username.toLowerCase()}/`),
    }));
  } catch (error) {
    console.error('Failed to fetch external PRs:', error);
    return [];
  }
}

export function parseExternalContributions(
  events: GitHubEvent[],
  username: string
): ExternalContributionSummary {
  const externalPushes: Array<{ repo: string; commitCount: number; date: string }> = [];
  const externalPRActions: Array<{ repo: string; action: string; merged: boolean; date: string }> = [];
  
  const usernamePrefix = `${username.toLowerCase()}/`;
  
  events.forEach((event) => {
    const isExternal = !event.repo.name.toLowerCase().startsWith(usernamePrefix);
    if (!isExternal) return;
    
    if (event.type === 'PushEvent') {
      const payload = event.payload as PushEventPayload;
      externalPushes.push({
        repo: event.repo.name,
        commitCount: payload.commits?.length || payload.size || 0,
        date: event.created_at,
      });
    }
    
    if (event.type === 'PullRequestEvent') {
      const payload = event.payload as PREventPayload;
      externalPRActions.push({
        repo: event.repo.name,
        action: payload.action || 'opened',
        merged: payload.pull_request?.merged || false,
        date: event.created_at,
      });
    }
  });
  
  return {
    externalPushes,
    externalPRActions,
    uniqueExternalRepos: new Set([
      ...externalPushes.map(p => p.repo),
      ...externalPRActions.map(p => p.repo),
    ]).size,
    totalExternalCommits: externalPushes.reduce((sum, p) => sum + p.commitCount, 0),
  };
}
```

---

### 3. Update `fetchUserData()` (`lib/github.ts`) — 15 min

Add to parallel fetch:
```typescript
const [events, repos, externalPRsResult] = await Promise.all([
  getEvents(username, token),
  getRepos(username, token),
  searchUserPRs(username, sinceDate, token),  // NEW
]);

const externalContributions = parseExternalContributions(events, username);  // NEW
```

Add to return object:
```typescript
return {
  // ... existing ...
  externalPRs: externalPRsResult,
  externalContributions,
  dataCompleteness: {
    // ... existing ...
    externalPRsFound: externalPRsResult.length,
  },
};
```

---

### 4. Update Scoring (`lib/scoring.ts`) — 30 min

**Update `scorePRHygiene()`:**
```typescript
export function scorePRHygiene(
  ownPRs: GitHubPullRequest[],
  externalPRs: ExternalPR[] = []  // NEW parameter with default
): CategoryResult {
  const totalPRCount = ownPRs.length + externalPRs.length;
  
  if (totalPRCount === 0) {
    return { score: 50, stats: { totalPRs: 0, mergeRate: 0 }, quip: getQuip('prHygiene', 50) };
  }
  
  // Existing base score logic for own PRs...
  let score = calculateBasePRScore(ownPRs);
  
  // NEW: Merge rate bonus
  const ownMerged = ownPRs.filter(pr => pr.merged_at !== null).length;
  const externalMerged = externalPRs.filter(pr => pr.merged_at !== null).length;
  const mergeRate = (ownMerged + externalMerged) / totalPRCount;
  score += Math.round(mergeRate * 15);  // Up to +15
  
  // NEW: External merged PRs bonus
  score += Math.min(externalMerged * 2, 10);  // Up to +10
  
  return {
    score: clamp(Math.round(score), 0, 100),
    quip: getQuip('prHygiene', score),
    stats: {
      totalPRs: totalPRCount,
      ownPRs: ownPRs.length,
      externalPRs: externalPRs.length,
      mergedCount: ownMerged + externalMerged,
      mergeRate: Math.round(mergeRate * 100),
      avgLinesChanged: calculateAvgLines(ownPRs),
    },
  };
}
```

**Update `scoreCollaborationSpirit()`:**
```typescript
export function scoreCollaborationSpirit(
  events: GitHubEvent[],
  externalPRs: ExternalPR[] = [],  // NEW
  externalContributions: ExternalContributionSummary = { uniqueExternalRepos: 0, totalExternalCommits: 0, externalPushes: [], externalPRActions: [] },  // NEW
  username: string
): CategoryResult {
  // Existing base score from events...
  let score = calculateBaseCollaborationScore(events, username);
  
  // NEW: External repo diversity bonus (up to +20)
  const uniqueExternalRepos = new Set(externalPRs.map(pr => pr.repository)).size;
  score += Math.min(uniqueExternalRepos * 4, 20);
  
  // NEW: Merged external PRs bonus (up to +25)
  const mergedExternalPRs = externalPRs.filter(pr => pr.merged_at !== null).length;
  score += Math.min(mergedExternalPRs * 5, 25);
  
  // NEW: External commit activity bonus (up to +15)
  score += Math.min(externalContributions.totalExternalCommits * 0.3, 15);
  
  return {
    score: clamp(Math.round(score), 0, 100),
    quip: getQuip('collaborationSpirit', score),
    stats: {
      externalPRs: externalPRs.length,
      externalPRsMerged: mergedExternalPRs,
      uniqueExternalRepos,
      externalCommits: externalContributions.totalExternalCommits,
    },
  };
}
```

---

### 5. Update API Route — 10 min

Update the call site in `app/api/analyze/[username]/route.ts` to pass new parameters to scoring functions.

---

### 6. Write Tests — 45 min

Add to `lib/github.test.ts`:
```typescript
describe('searchUserPRs', () => {
  it('returns external PRs with isExternal flag');
  it('handles empty results');
  it('returns empty array on error');
});

describe('parseExternalContributions', () => {
  it('extracts PushEvents to external repos');
  it('ignores events to own repos');
  it('calculates unique repos correctly');
});
```

Update `lib/scoring.test.ts`:
```typescript
describe('scorePRHygiene with external PRs', () => {
  it('includes external PRs in count');
  it('applies merge rate bonus');
  it('caps bonuses correctly');
});

describe('scoreCollaborationSpirit with external data', () => {
  it('rewards repo diversity');
  it('rewards merged external PRs');
});
```

---

## Verification

After implementation, test with:

| Username | Expected |
|----------|----------|
| Active OSS contributor | Collaboration Spirit score ↑ |
| User with external PRs | PR count includes external |
| User with only own repos | No change (backwards compatible) |

---

## API Impact

- **+1 Search API call** (was 2, now 3)
- Still well within 30 req/min limit
- Graceful degradation if fails

---

_Condensed from 8 stories into 1 super story — Ready for implementation_

