# Technical Specification: External Contributions Scoring

> **Feature:** Capture and score contributions to repositories the user doesn't own  
> **Version:** 1.0  
> **Author:** BMAD Architect Agent  
> **Date:** 2025-12-07  
> **Status:** Draft

---

## 1. Problem Statement

### Current Limitation

The scoring engine only analyzes activity from **repositories owned by the user**:

```typescript
// Current implementation in lib/github.ts
const activeRepos = repos
  .filter((r) => new Date(r.pushed_at) >= new Date(since))
  .slice(0, 10);
```

This misses a significant portion of developer activity:
- **Open source contributions** — PRs to React, Next.js, etc.
- **Workplace collaboration** — Commits to team/org repos
- **Community engagement** — Issues and discussions on external projects

### Impact

| Affected Category | Current State | Missing Data |
|-------------------|---------------|--------------|
| Commit Consistency | Only own repos | External repo commits |
| Message Quality | Only own repos | External repo commit messages |
| PR Hygiene | Only own repos | External PRs (often highest quality!) |
| Collaboration Spirit | Events-based heuristic | Actual PR/commit data |

A developer with 500 commits to kubernetes/kubernetes would appear as having minimal activity.

---

## 2. Proposed Solution

### 2.1 Data Sources

#### Primary: GitHub Search API for PRs

```
GET /search/issues?q=author:{username}+type:pr+created:>={since}
```

**Returns:** All PRs opened by the user across ALL public repositories.

**Rate Limit:** 30 requests/minute (authenticated)

**Fields Available:**
- `repository_url` — Link to the repo
- `state` — open/closed
- `pull_request.merged_at` — Merge timestamp (if merged)
- `created_at` — When PR was opened

#### Secondary: Events API (Already Fetched)

We already fetch up to 300 events. Parse `PullRequestEvent` and `PushEvent` payloads for:
- External repo identification
- Commit counts in push events
- PR actions (opened, merged, closed)

### 2.2 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     CURRENT FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  getRepos(username)  ─────►  User's own repos only          │
│         │                                                   │
│         ▼                                                   │
│  For each repo:                                             │
│    - getRepoCommits()                                       │
│    - getRepoPRs()                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

                            │
                            ▼

┌─────────────────────────────────────────────────────────────┐
│                     ENHANCED FLOW                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PARALLEL FETCH:                                            │
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────────┐    │
│  │ Own Repos Path      │    │ External Contribs Path  │    │
│  │ (existing)          │    │ (NEW)                   │    │
│  └─────────────────────┘    └─────────────────────────┘    │
│           │                            │                    │
│           ▼                            ▼                    │
│  - getRepos()               - searchUserPRs() (Search API)  │
│  - getRepoCommits()         - parseExternalFromEvents()     │
│  - getRepoPRs()                                             │
│           │                            │                    │
│           └────────────┬───────────────┘                    │
│                        ▼                                    │
│              ┌─────────────────┐                            │
│              │ Merged Dataset  │                            │
│              │ - ownRepoPRs    │                            │
│              │ - externalPRs   │                            │
│              │ - allCommits    │                            │
│              └─────────────────┘                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. API Changes

### 3.1 New GitHub API Functions

```typescript
// lib/github.ts

/**
 * Fetch all PRs authored by user across ALL repos (not just owned)
 * Uses Search API - stricter rate limit (30/min)
 */
export async function searchUserPRs(
  username: string,
  since: string,
  token: string
): Promise<ExternalPR[]> {
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
    isExternal: !item.repository_url.includes(`/${username}/`),
  }));
}

/**
 * Parse Events for external contribution signals
 */
export function parseExternalContributions(
  events: GitHubEvent[],
  username: string
): ExternalContributionSummary {
  const externalPushes: ExternalPush[] = [];
  const externalPRActions: ExternalPRAction[] = [];
  
  events.forEach((event) => {
    const isExternal = !event.repo.name.startsWith(`${username}/`);
    if (!isExternal) return;
    
    if (event.type === 'PushEvent') {
      const payload = event.payload as PushEventPayload;
      externalPushes.push({
        repo: event.repo.name,
        commitCount: payload.commits?.length || 0,
        date: event.created_at,
      });
    }
    
    if (event.type === 'PullRequestEvent') {
      const payload = event.payload as PREventPayload;
      externalPRActions.push({
        repo: event.repo.name,
        action: payload.action,
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

### 3.2 New Types

```typescript
// types/github.ts

export interface SearchPRItem {
  id: number;
  title: string;
  state: 'open' | 'closed';
  created_at: string;
  closed_at: string | null;
  repository_url: string;
  pull_request?: {
    merged_at: string | null;
  };
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
  externalPushes: ExternalPush[];
  externalPRActions: ExternalPRAction[];
  uniqueExternalRepos: number;
  totalExternalCommits: number;
}

export interface ExternalPush {
  repo: string;
  commitCount: number;
  date: string;
}

export interface ExternalPRAction {
  repo: string;
  action: 'opened' | 'closed' | 'merged' | 'reopened';
  merged: boolean;
  date: string;
}
```

### 3.3 Updated RawGitHubData

```typescript
// lib/github.ts

export interface RawGitHubData {
  user: GitHubUser;
  events: GitHubEvent[];
  commits: GitHubCommit[];
  pullRequests: GitHubPullRequest[];
  reviewCount: number;
  issues: GitHubIssue[];
  
  // NEW: External contributions data
  externalPRs: ExternalPR[];
  externalContributions: ExternalContributionSummary;
  
  dataCompleteness: {
    eventsLimited: boolean;
    reposAnalyzed: number;
    reposTotal: number;
    externalPRsFound: number;  // NEW
  };
}
```

---

## 4. Scoring Algorithm Updates

### 4.1 Commit Consistency — Include External Commits

```typescript
export function scoreCommitConsistency(
  commits: GitHubCommit[],
  externalContributions: ExternalContributionSummary
): CategoryScore {
  // Existing logic for own repo commits...
  
  // NEW: Boost for external commit activity
  const externalCommitBonus = Math.min(
    externalContributions.totalExternalCommits * 0.5,
    15  // Cap bonus at 15 points
  );
  
  // Add to score (still capped at 100)
  score = clamp(score + externalCommitBonus, 0, 100);
  
  return {
    score,
    quip: getQuip(score),
    stats: {
      ...existingStats,
      externalCommits: externalContributions.totalExternalCommits,
    },
  };
}
```

### 4.2 PR Hygiene — Include External PRs + Merge Rate

```typescript
export function scorePRHygiene(
  ownPRs: GitHubPullRequest[],
  externalPRs: ExternalPR[]
): CategoryScore {
  const allPRs = [
    ...ownPRs.map(pr => ({
      additions: pr.additions,
      deletions: pr.deletions,
      merged: pr.merged_at !== null,
      isExternal: false,
    })),
    ...externalPRs.map(pr => ({
      additions: 0,  // Not available from Search API
      deletions: 0,
      merged: pr.merged_at !== null,
      isExternal: true,
    })),
  ];
  
  // Merge rate calculation
  const mergedCount = allPRs.filter(pr => pr.merged).length;
  const mergeRate = allPRs.length > 0 ? mergedCount / allPRs.length : 0;
  
  // External PR bonus (shows collaboration)
  const externalPRCount = externalPRs.length;
  const externalMergedCount = externalPRs.filter(pr => pr.merged_at).length;
  
  // Scoring adjustments
  let score = baseScore;
  
  // Merge rate bonus (up to +15)
  score += Math.round(mergeRate * 15);
  
  // External merged PRs bonus (up to +10)
  score += Math.min(externalMergedCount * 2, 10);
  
  return {
    score: clamp(score, 0, 100),
    quip: getQuip(score),
    stats: {
      totalPRs: allPRs.length,
      ownPRs: ownPRs.length,
      externalPRs: externalPRCount,
      mergedCount,
      mergeRate: Math.round(mergeRate * 100),
      avgLinesChanged: calculateAvgLines(ownPRs),  // Only from own PRs
    },
  };
}
```

### 4.3 Collaboration Spirit — Enhanced with External Data

```typescript
export function scoreCollaborationSpirit(
  events: GitHubEvent[],
  externalPRs: ExternalPR[],
  externalContributions: ExternalContributionSummary,
  username: string
): CategoryScore {
  // Existing events-based logic...
  
  // NEW: Concrete external contribution bonuses
  
  // Unique external repos (from PR data, more accurate)
  const uniqueExternalRepos = new Set(
    externalPRs.map(pr => pr.repository)
  ).size;
  
  // Merged external PRs (highest signal of accepted contribution)
  const mergedExternalPRs = externalPRs.filter(pr => pr.merged_at).length;
  
  let score = baseScore;
  
  // External repo diversity bonus (up to +20)
  score += Math.min(uniqueExternalRepos * 4, 20);
  
  // Merged external PRs bonus (up to +25) - highest weight
  score += Math.min(mergedExternalPRs * 5, 25);
  
  // External commit activity (up to +15)
  score += Math.min(externalContributions.totalExternalCommits * 0.3, 15);
  
  return {
    score: clamp(score, 0, 100),
    quip: getQuip(score),
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

## 5. Rate Limit Considerations

### Current API Calls per Analysis

| API | Calls | Rate Limit |
|-----|-------|------------|
| User | 1 | 5000/hr |
| Events | 3 (pages) | 5000/hr |
| Repos | 1 | 5000/hr |
| Commits | 10 (per repo) | 5000/hr |
| PRs | 10 (per repo) | 5000/hr |
| Reviews (Search) | 1 | 30/min |
| Issues (Search) | 1 | 30/min |
| **Total** | ~27 | — |

### With External Contributions

| API | Calls | Rate Limit |
|-----|-------|------------|
| Existing | ~27 | — |
| External PRs (Search) | 1 | 30/min |
| **New Total** | ~28 | — |

**Impact:** Minimal. Only 1 additional Search API call. Well within rate limits.

### Search API Limit Strategy

Current Search API usage: 2 calls (reviews + issues)
New Search API usage: 3 calls (+ external PRs)

At 30 requests/minute, we can handle ~10 analyses per minute before hitting Search API limits. For higher traffic, consider:
1. Caching results for 1 hour (already implemented)
2. Queuing Search API calls with backoff
3. Prioritizing core vs. external data on rate limit

---

## 6. Implementation Plan

### Phase 1: Core Implementation (MVP)

| Task | Effort | Priority |
|------|--------|----------|
| Add `searchUserPRs()` function | 30 min | P0 |
| Add `parseExternalContributions()` | 30 min | P0 |
| Update `RawGitHubData` type | 15 min | P0 |
| Update `fetchUserData()` to include external | 30 min | P0 |
| Update `scorePRHygiene()` with merge rate | 20 min | P0 |
| Update `scoreCollaborationSpirit()` | 30 min | P1 |
| Update tests | 45 min | P0 |

**Total Estimated Effort:** ~3.5 hours

### Phase 2: Enhanced (Post-MVP)

- Parse PushEvent payloads for commit messages (message quality on external)
- Add commit consistency bonus for external activity
- Fetch a sample of external repo PRs for line-change data

---

## 7. Testing Strategy

### Unit Tests

```typescript
describe('searchUserPRs', () => {
  it('returns PRs from external repos');
  it('correctly identifies merged PRs');
  it('handles empty results');
  it('handles API errors gracefully');
});

describe('parseExternalContributions', () => {
  it('extracts PushEvents to external repos');
  it('counts commits correctly from PushEvent payload');
  it('identifies PREvents actions');
  it('calculates unique external repos');
});

describe('scorePRHygiene with external', () => {
  it('includes external PRs in total count');
  it('calculates merge rate correctly');
  it('applies merge rate bonus');
  it('caps bonuses appropriately');
});
```

### Integration Tests

```typescript
describe('fetchUserData with external contributions', () => {
  it('fetches external PRs in parallel');
  it('handles Search API rate limits');
  it('degrades gracefully if external fetch fails');
});
```

---

## 8. Rollout Strategy

1. **Feature Flag:** `ENABLE_EXTERNAL_CONTRIBUTIONS=true`
2. **Gradual Rollout:** Enable for 10% of requests initially
3. **Monitoring:** Track Search API rate limit headers
4. **Fallback:** If external fetch fails, continue with current scoring

---

## 9. Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Avg Collaboration Spirit score | ~45 | ~55 (for active OSS contributors) |
| Data completeness for OSS devs | ~60% | ~85% |
| False "low activity" verdicts | Unknown | Reduced significantly |

---

## Appendix: Sample API Responses

### Search API for PRs

```json
GET /search/issues?q=author:octocat+type:pr+created:>=2025-01-01

{
  "total_count": 47,
  "items": [
    {
      "id": 123456,
      "title": "Fix typo in README",
      "state": "closed",
      "created_at": "2025-03-15T10:30:00Z",
      "closed_at": "2025-03-16T14:20:00Z",
      "repository_url": "https://api.github.com/repos/facebook/react",
      "pull_request": {
        "merged_at": "2025-03-16T14:20:00Z"
      }
    }
  ]
}
```

### PushEvent Payload (from Events API)

```json
{
  "type": "PushEvent",
  "repo": {
    "name": "vercel/next.js"
  },
  "payload": {
    "push_id": 123456,
    "size": 3,
    "commits": [
      {
        "sha": "abc123",
        "message": "fix: resolve hydration issue"
      },
      {
        "sha": "def456",
        "message": "test: add unit tests for fix"
      }
    ]
  }
}
```

---

_Technical Specification by BMAD Architect Agent — Ready for Implementation_

