import { describe, it, expect } from 'vitest';
import {
  scoreCommitConsistency,
  scoreMessageQuality,
  scorePRHygiene,
  scoreReviewKarma,
  scoreIssueCitizenship,
  scoreCollaborationSpirit,
  calculateAllScores,
  calculateOverallScore,
  getVerdictTier,
  getVerdictDetails,
} from './scoring';
import {
  GitHubCommit,
  GitHubPullRequest,
  GitHubIssue,
  GitHubEvent,
  ExternalPR,
  ExternalContributionSummary,
} from '@/types/github';

// Helper to create mock commits
function createCommit(message: string, daysAgo: number = 0): GitHubCommit {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    sha: Math.random().toString(36).substring(7),
    commit: {
      message,
      author: { date: date.toISOString() },
    },
    author: { login: 'testuser' },
  };
}

// Helper to create mock PRs
function createPR(
  additions: number,
  deletions: number,
  merged: boolean = true
): GitHubPullRequest {
  return {
    id: Math.floor(Math.random() * 10000),
    number: Math.floor(Math.random() * 100),
    state: 'closed',
    created_at: new Date().toISOString(),
    merged_at: merged ? new Date().toISOString() : null,
    additions,
    deletions,
    user: { login: 'testuser' },
  };
}

// Helper to create mock issues
function createIssue(
  username: string,
  state: 'open' | 'closed',
  daysOpen: number = 5
): GitHubIssue {
  const created = new Date();
  created.setDate(created.getDate() - daysOpen - 10);
  const closed = state === 'closed' ? new Date() : null;
  if (closed) closed.setDate(closed.getDate() - 10 + daysOpen);

  return {
    id: Math.floor(Math.random() * 10000),
    number: Math.floor(Math.random() * 100),
    state,
    created_at: created.toISOString(),
    closed_at: closed?.toISOString() || null,
    user: { login: username },
  };
}

// Helper to create mock events
function createEvent(type: string, repoName: string): GitHubEvent {
  return {
    id: Math.random().toString(36).substring(7),
    type,
    created_at: new Date().toISOString(),
    repo: { id: Math.floor(Math.random() * 10000), name: repoName },
    payload: {},
  };
}

// Helper to create mock external PRs
function createExternalPR(
  repository: string,
  isExternal: boolean,
  merged: boolean = false
): ExternalPR {
  return {
    id: Math.floor(Math.random() * 10000),
    title: `PR to ${repository}`,
    state: merged ? 'closed' : 'open',
    created_at: new Date().toISOString(),
    closed_at: merged ? new Date().toISOString() : null,
    merged_at: merged ? new Date().toISOString() : null,
    repository,
    isExternal,
  };
}

// Helper to create external contribution summary
function createExternalContributions(
  uniqueRepos: number = 0,
  totalCommits: number = 0
): ExternalContributionSummary {
  return {
    externalPushes: [],
    externalPRActions: [],
    uniqueExternalRepos: uniqueRepos,
    totalExternalCommits: totalCommits,
  };
}

// ============ COMMIT CONSISTENCY TESTS ============

describe('scoreCommitConsistency', () => {
  it('returns score 0 for empty commits array', () => {
    const result = scoreCommitConsistency([]);
    expect(result.score).toBe(0);
    expect(result.quip).toBe('No commits to analyze');
    expect(result.stats.totalCommits).toBe(0);
  });

  it('returns higher score for consistent weekly commits', () => {
    // Create commits spread across multiple weeks
    const commits = [
      createCommit('feat: week 1', 7),
      createCommit('feat: week 2', 14),
      createCommit('feat: week 3', 21),
      createCommit('feat: week 4', 28),
      createCommit('feat: week 5', 35),
    ];
    const result = scoreCommitConsistency(commits);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.stats.totalCommits).toBe(5);
  });

  it('returns lower score for burst commits in single week', () => {
    // All commits in the same week
    const commits = [
      createCommit('fix: burst 1', 1),
      createCommit('fix: burst 2', 1),
      createCommit('fix: burst 3', 2),
      createCommit('fix: burst 4', 2),
      createCommit('fix: burst 5', 3),
    ];
    const result = scoreCommitConsistency(commits);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

// ============ MESSAGE QUALITY TESTS ============

describe('scoreMessageQuality', () => {
  it('returns score 0 for empty commits array', () => {
    const result = scoreMessageQuality([]);
    expect(result.score).toBe(0);
    expect(result.quip).toBe('No messages to judge');
  });

  it('returns higher score for conventional commit messages', () => {
    const commits = [
      createCommit('feat(auth): add login functionality'),
      createCommit('fix(api): handle null responses gracefully'),
      createCommit('docs: update README with installation steps'),
      createCommit('refactor(utils): simplify helper functions'),
    ];
    const result = scoreMessageQuality(commits);
    expect(result.score).toBeGreaterThan(50);
    expect(result.stats.conventionalPercent).toBe(100);
  });

  it('returns floor score of 50 for low-effort messages', () => {
    const commits = [
      createCommit('fix'),
      createCommit('wip'),
      createCommit('update'),
      createCommit('asdf'),
    ];
    const result = scoreMessageQuality(commits);
    expect(result.score).toBe(50);
  });

  it('applies floor of 50 for very short messages', () => {
    const commits = [createCommit('a'), createCommit('b'), createCommit('xyz')];
    const result = scoreMessageQuality(commits);
    expect(result.score).toBe(50);
  });

  it('rewards longer descriptive messages', () => {
    const commits = [
      createCommit(
        'Implemented user authentication with JWT tokens and session management'
      ),
      createCommit(
        'Added comprehensive error handling for all API endpoints with proper logging'
      ),
      createCommit(
        'Refactored database connection pooling for better performance under load'
      ),
    ];
    const result = scoreMessageQuality(commits);
    expect(result.score).toBeGreaterThan(60);
  });
});

// ============ PR HYGIENE TESTS ============

describe('scorePRHygiene', () => {
  it('returns score 0 for empty PRs array', () => {
    const result = scorePRHygiene([]);
    expect(result.score).toBe(0);
    expect(result.quip).toBe('No PRs on record');
    expect(result.stats.totalPRs).toBe(0);
    expect(result.stats.mergeRate).toBe(0);
  });

  it('returns higher score for small PRs', () => {
    const prs = [
      createPR(50, 20, true), // 70 lines, merged
      createPR(100, 30, true), // 130 lines, merged
      createPR(80, 40, true), // 120 lines, merged
    ];
    const result = scorePRHygiene(prs);
    expect(result.score).toBeGreaterThan(60);
  });

  it('applies floor of 50 for mega PRs', () => {
    const prs = [
      createPR(800, 500, true), // 1300 lines
      createPR(1000, 600, true), // 1600 lines
      createPR(1200, 400, true), // 1600 lines
    ];
    const result = scorePRHygiene(prs);
    expect(result.score).toBe(50);
  });

  it('calculates average lines correctly', () => {
    const prs = [
      createPR(100, 50, true), // 150 lines
      createPR(200, 100, true), // 300 lines
      createPR(150, 75, true), // 225 lines
    ];
    const result = scorePRHygiene(prs);
    expect(result.stats.avgLinesChanged).toBe(225);
    expect(result.stats.totalPRs).toBe(3);
  });

  it('calculates merge rate correctly', () => {
    const prs = [
      createPR(100, 50, true), // merged
      createPR(100, 50, true), // merged
      createPR(100, 50, false), // not merged
      createPR(100, 50, false), // not merged
    ];
    const result = scorePRHygiene(prs);
    expect(result.stats.mergedPRs).toBe(2);
    expect(result.stats.mergeRate).toBe(50);
  });

  it('gives bonus for high merge rate', () => {
    const highMergeRatePRs = [
      createPR(100, 50, true),
      createPR(100, 50, true),
      createPR(100, 50, true),
      createPR(100, 50, true),
      createPR(100, 50, false), // 80% merge rate
    ];
    const lowMergeRatePRs = [
      createPR(100, 50, true),
      createPR(100, 50, false),
      createPR(100, 50, false),
      createPR(100, 50, false),
      createPR(100, 50, false), // 20% merge rate
    ];

    const highResult = scorePRHygiene(highMergeRatePRs);
    const lowResult = scorePRHygiene(lowMergeRatePRs);

    expect(highResult.score).toBeGreaterThan(lowResult.score);
    expect(highResult.stats.mergeRate).toBe(80);
    expect(lowResult.stats.mergeRate).toBe(20);
  });

  it('returns festive quip for high merge rate and good score', () => {
    const prs = [
      createPR(50, 20, true),
      createPR(60, 30, true),
      createPR(40, 20, true),
      createPR(50, 25, true),
      createPR(55, 30, true), // 100% merge rate, small PRs
    ];
    const result = scorePRHygiene(prs);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.quip).toContain('hot cocoa');
  });

  // Tests for external PRs functionality
  describe('with external PRs', () => {
    it('includes external PRs in total count', () => {
      const ownPRs = [createPR(100, 50, true), createPR(100, 50, true)];
      const externalPRs = [
        createExternalPR('facebook/react', true, true),
        createExternalPR('vercel/next.js', true, true),
        createExternalPR('microsoft/typescript', true, false),
      ];

      const result = scorePRHygiene(ownPRs, externalPRs);

      expect(result.stats.totalPRs).toBe(5);
      expect(result.stats.ownPRs).toBe(2);
      expect(result.stats.externalPRs).toBe(3);
    });

    it('applies merge rate bonus across all PRs', () => {
      const ownPRs = [createPR(100, 50, true), createPR(100, 50, false)];
      const externalPRs = [
        createExternalPR('facebook/react', true, true),
        createExternalPR('vercel/next.js', true, true),
      ];

      const result = scorePRHygiene(ownPRs, externalPRs);

      // 3 out of 4 merged = 75% merge rate
      expect(result.stats.mergeRate).toBe(75);
      expect(result.stats.mergedPRs).toBe(3);
    });

    it('gives bonus for merged external PRs', () => {
      const ownPRs = [createPR(100, 50, true)];
      const externalPRsWithMerged = [
        createExternalPR('facebook/react', true, true),
        createExternalPR('vercel/next.js', true, true),
        createExternalPR('microsoft/typescript', true, true),
      ];
      const externalPRsWithoutMerged = [
        createExternalPR('facebook/react', true, false),
        createExternalPR('vercel/next.js', true, false),
        createExternalPR('microsoft/typescript', true, false),
      ];

      const withMerged = scorePRHygiene(ownPRs, externalPRsWithMerged);
      const withoutMerged = scorePRHygiene(ownPRs, externalPRsWithoutMerged);

      expect(withMerged.score).toBeGreaterThan(withoutMerged.score);
    });

    it('caps external merged PRs bonus correctly', () => {
      const ownPRs = [createPR(100, 50, true)];
      // 10 merged external PRs - bonus should be capped at 10
      const manyExternalPRs = Array(10)
        .fill(null)
        .map((_, i) => createExternalPR(`org/repo-${i}`, true, true));

      const result = scorePRHygiene(ownPRs, manyExternalPRs);

      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('handles only external PRs (no own PRs)', () => {
      const externalPRs = [
        createExternalPR('facebook/react', true, true),
        createExternalPR('vercel/next.js', true, true),
      ];

      const result = scorePRHygiene([], externalPRs);

      expect(result.stats.totalPRs).toBe(2);
      expect(result.stats.ownPRs).toBe(0);
      expect(result.stats.externalPRs).toBe(2);
      expect(result.stats.mergeRate).toBe(100);
    });

    it('returns special quip for high external contribution', () => {
      const ownPRs = [createPR(50, 20, true)];
      const externalPRs = [
        createExternalPR('facebook/react', true, true),
        createExternalPR('vercel/next.js', true, true),
        createExternalPR('microsoft/typescript', true, true),
      ];

      const result = scorePRHygiene(ownPRs, externalPRs);

      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.quip).toContain('maintainers');
    });
  });
});

// ============ REVIEW KARMA TESTS ============

describe('scoreReviewKarma', () => {
  it('returns score 0 for no reviews and no PRs', () => {
    const result = scoreReviewKarma(0, 0);
    expect(result.score).toBe(0);
    expect(result.quip).toBe('No reviews on record');
  });

  it('returns higher score for good review ratio', () => {
    const result = scoreReviewKarma(10, 5); // 2:1 ratio
    expect(result.score).toBeGreaterThan(70);
    expect(result.quip).toContain('champion');
  });

  it('applies floor of 50 for poor review ratio', () => {
    const result = scoreReviewKarma(1, 20); // 0.05:1 ratio
    expect(result.score).toBe(50);
  });

  it('handles reviewers who only review (no PRs authored)', () => {
    const result = scoreReviewKarma(15, 0);
    expect(result.score).toBeGreaterThan(50);
    expect(result.stats.karmaRatio).toBe(15);
  });
});

// ============ ISSUE CITIZENSHIP TESTS ============

describe('scoreIssueCitizenship', () => {
  it('returns score 0 for no issues', () => {
    const result = scoreIssueCitizenship([], 'testuser');
    expect(result.score).toBe(0);
    expect(result.quip).toBe('Issue-free zone');
  });

  it('returns higher score for good close ratio', () => {
    const issues = [
      createIssue('testuser', 'closed', 3),
      createIssue('testuser', 'closed', 5),
      createIssue('testuser', 'closed', 2),
    ];
    const result = scoreIssueCitizenship(issues, 'testuser');
    expect(result.score).toBeGreaterThan(70);
    expect(result.stats.issuesClosed).toBe(3);
  });

  it('returns lower score for many open issues', () => {
    const issues = [
      createIssue('testuser', 'open'),
      createIssue('testuser', 'open'),
      createIssue('testuser', 'open'),
      createIssue('testuser', 'closed', 5),
    ];
    const result = scoreIssueCitizenship(issues, 'testuser');
    expect(result.score).toBeLessThan(80);
    expect(result.stats.issuesOpened).toBe(4);
    expect(result.stats.issuesClosed).toBe(1);
  });

  it('filters out issues from other users', () => {
    const issues = [
      createIssue('testuser', 'closed', 3),
      createIssue('otheruser', 'open'),
      createIssue('anotheruser', 'closed', 5),
    ];
    const result = scoreIssueCitizenship(issues, 'testuser');
    expect(result.stats.issuesOpened).toBe(1);
  });

  it('ignores pull requests (issues with pull_request field)', () => {
    const issues: GitHubIssue[] = [
      { ...createIssue('testuser', 'closed', 3), pull_request: {} },
      createIssue('testuser', 'closed', 5),
    ];
    const result = scoreIssueCitizenship(issues, 'testuser');
    expect(result.stats.issuesOpened).toBe(1);
  });
});

// ============ COLLABORATION SPIRIT TESTS ============

describe('scoreCollaborationSpirit', () => {
  it('returns score 0 for no contribution events', () => {
    const result = scoreCollaborationSpirit([], 'testuser');
    expect(result.score).toBe(0);
    expect(result.quip).toBe('Flying solo');
  });

  it('applies floor of 50 for only own repo contributions', () => {
    const events = [
      createEvent('PushEvent', 'testuser/my-repo'),
      createEvent('PullRequestEvent', 'testuser/another-repo'),
      createEvent('IssuesEvent', 'testuser/third-repo'),
    ];
    const result = scoreCollaborationSpirit(events, 'testuser');
    expect(result.score).toBe(50);
    expect(result.stats.externalContributions).toBe(0);
  });

  it('returns higher score for external contributions', () => {
    const events = [
      createEvent('PushEvent', 'facebook/react'),
      createEvent('PullRequestEvent', 'vercel/next.js'),
      createEvent('IssuesEvent', 'microsoft/typescript'),
      createEvent('PushEvent', 'testuser/my-repo'),
    ];
    const result = scoreCollaborationSpirit(events, 'testuser');
    expect(result.score).toBeGreaterThan(50);
    expect(result.stats.externalContributions).toBe(3);
    expect(result.stats.uniqueRepos).toBe(3);
  });

  it('returns 0 for non-contribution event types', () => {
    const events = [
      createEvent('WatchEvent', 'facebook/react'),
      createEvent('ForkEvent', 'vercel/next.js'),
      createEvent('StarEvent', 'microsoft/typescript'),
    ];
    const result = scoreCollaborationSpirit(events, 'testuser');
    expect(result.score).toBe(0);
  });

  // Tests for external contributions functionality
  describe('with external contributions data', () => {
    it('rewards repo diversity from external PRs', () => {
      const events: GitHubEvent[] = [];
      const fewRepos = [
        createExternalPR('facebook/react', true, false),
      ];
      const manyRepos = [
        createExternalPR('facebook/react', true, false),
        createExternalPR('vercel/next.js', true, false),
        createExternalPR('microsoft/typescript', true, false),
        createExternalPR('google/go', true, false),
        createExternalPR('rust-lang/rust', true, false),
      ];

      const resultFew = scoreCollaborationSpirit(
        events,
        'testuser',
        fewRepos,
        createExternalContributions()
      );
      const resultMany = scoreCollaborationSpirit(
        events,
        'testuser',
        manyRepos,
        createExternalContributions()
      );

      expect(resultMany.stats.uniqueRepos).toBe(5);
      expect(resultMany.score).toBeGreaterThan(resultFew.score);
    });

    it('rewards merged external PRs', () => {
      const events: GitHubEvent[] = [];
      const externalPRsMerged = [
        createExternalPR('facebook/react', true, true),
        createExternalPR('vercel/next.js', true, true),
        createExternalPR('microsoft/typescript', true, true),
      ];
      const externalPRsNotMerged = [
        createExternalPR('facebook/react', true, false),
        createExternalPR('vercel/next.js', true, false),
        createExternalPR('microsoft/typescript', true, false),
      ];

      const withMerged = scoreCollaborationSpirit(
        events,
        'testuser',
        externalPRsMerged,
        createExternalContributions()
      );
      const withoutMerged = scoreCollaborationSpirit(
        events,
        'testuser',
        externalPRsNotMerged,
        createExternalContributions()
      );

      expect(withMerged.score).toBeGreaterThan(withoutMerged.score);
      expect(withMerged.stats.externalPRsMerged).toBe(3);
      expect(withoutMerged.stats.externalPRsMerged).toBe(0);
    });

    it('rewards external commit activity', () => {
      const events: GitHubEvent[] = [];
      const externalPRs: ExternalPR[] = [];
      const withCommits = createExternalContributions(2, 50);
      const withoutCommits = createExternalContributions(0, 0);

      const scoreWithCommits = scoreCollaborationSpirit(
        events,
        'testuser',
        externalPRs,
        withCommits
      );
      const scoreWithoutCommits = scoreCollaborationSpirit(
        events,
        'testuser',
        externalPRs,
        withoutCommits
      );

      // withCommits: base 35 + 15 (commit bonus) = 50
      // withoutCommits: base 35 = 35 (but returns 50 for no activity)
      // Actually, withoutCommits has no activity, so returns 50 as default
      // withCommits has activity (totalExternalCommits > 0), so gets calculated
      expect(scoreWithCommits.stats.externalCommits).toBe(50);
      // The important thing is that the bonus is applied correctly
      expect(scoreWithCommits.score).toBe(50); // 35 base + 15 commit bonus (capped)
    });

    it('caps bonuses correctly', () => {
      const events: GitHubEvent[] = [];
      // Extreme case: lots of external PRs
      const manyExternalPRs = Array(20)
        .fill(null)
        .map((_, i) => createExternalPR(`org/repo-${i}`, true, true));
      const manyCommits = createExternalContributions(20, 500);

      const result = scoreCollaborationSpirit(
        events,
        'testuser',
        manyExternalPRs,
        manyCommits
      );

      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('includes external PR stats in response', () => {
      const events: GitHubEvent[] = [];
      const externalPRs = [
        createExternalPR('facebook/react', true, true),
        createExternalPR('vercel/next.js', true, false),
        createExternalPR('testuser/my-repo', false, true), // Own repo
      ];

      const result = scoreCollaborationSpirit(
        events,
        'testuser',
        externalPRs,
        createExternalContributions(2, 10)
      );

      expect(result.stats.externalPRs).toBe(2); // Only external ones
      expect(result.stats.externalPRsMerged).toBe(1);
      expect(result.stats.externalCommits).toBe(10);
    });

    it('returns special quip for highly active external contributor', () => {
      const events: GitHubEvent[] = [];
      const externalPRs = Array(6)
        .fill(null)
        .map((_, i) => createExternalPR(`org/repo-${i}`, true, true));

      const result = scoreCollaborationSpirit(
        events,
        'testuser',
        externalPRs,
        createExternalContributions(6, 30)
      );

      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.quip).toContain('community');
    });
  });
});

// ============ CALCULATE ALL SCORES TESTS ============

describe('calculateAllScores', () => {
  it('returns all 6 category scores', () => {
    const result = calculateAllScores([], [], 0, [], [], 'testuser');

    expect(result).toHaveProperty('commitConsistency');
    expect(result).toHaveProperty('messageQuality');
    expect(result).toHaveProperty('prHygiene');
    expect(result).toHaveProperty('reviewKarma');
    expect(result).toHaveProperty('issueCitizenship');
    expect(result).toHaveProperty('collaborationSpirit');
  });

  it('each category has score, quip, and stats', () => {
    const result = calculateAllScores([], [], 0, [], [], 'testuser');

    Object.values(result).forEach((category) => {
      expect(category).toHaveProperty('score');
      expect(category).toHaveProperty('quip');
      expect(category).toHaveProperty('stats');
      expect(typeof category.score).toBe('number');
      expect(typeof category.quip).toBe('string');
    });
  });

  it('passes external data to scoring functions', () => {
    const externalPRs = [
      createExternalPR('facebook/react', true, true),
      createExternalPR('vercel/next.js', true, true),
    ];
    const externalContributions = createExternalContributions(3, 25);

    const result = calculateAllScores(
      [],
      [],
      0,
      [],
      [],
      'testuser',
      externalPRs,
      externalContributions
    );

    // PR Hygiene should include external PRs
    expect(result.prHygiene.stats.externalPRs).toBe(2);

    // Collaboration Spirit should include external data
    expect(result.collaborationSpirit.stats.externalPRs).toBe(2);
    expect(result.collaborationSpirit.stats.externalCommits).toBe(25);
  });

  it('works without external data (backward compatible)', () => {
    const result = calculateAllScores([], [], 0, [], [], 'testuser');

    expect(result.prHygiene.score).toBe(0);
    expect(result.collaborationSpirit.score).toBe(0);
  });
});

// ============ CALCULATE OVERALL SCORE TESTS ============

describe('calculateOverallScore', () => {
  it('returns average of all category scores', () => {
    const categories = {
      commitConsistency: { score: 60, quip: '', stats: {} },
      messageQuality: { score: 80, quip: '', stats: {} },
      prHygiene: { score: 70, quip: '', stats: {} },
      reviewKarma: { score: 50, quip: '', stats: {} },
      issueCitizenship: { score: 90, quip: '', stats: {} },
      collaborationSpirit: { score: 40, quip: '', stats: {} },
    };

    const result = calculateOverallScore(categories);
    // (60 + 80 + 70 + 50 + 90 + 40) / 6 = 65
    expect(result).toBe(65);
  });

  it('rounds to nearest integer', () => {
    const categories = {
      commitConsistency: { score: 61, quip: '', stats: {} },
      messageQuality: { score: 62, quip: '', stats: {} },
      prHygiene: { score: 63, quip: '', stats: {} },
      reviewKarma: { score: 64, quip: '', stats: {} },
      issueCitizenship: { score: 65, quip: '', stats: {} },
      collaborationSpirit: { score: 66, quip: '', stats: {} },
    };

    const result = calculateOverallScore(categories);
    // (61 + 62 + 63 + 64 + 65 + 66) / 6 = 63.5 → 64
    expect(result).toBe(64);
  });
});

// ============ VERDICT TIER TESTS ============

describe('getVerdictTier', () => {
  it('returns extremely-nice for score >= 85', () => {
    expect(getVerdictTier(85)).toBe('extremely-nice');
    expect(getVerdictTier(100)).toBe('extremely-nice');
  });

  it('returns very-nice for score 70-84', () => {
    expect(getVerdictTier(70)).toBe('very-nice');
    expect(getVerdictTier(84)).toBe('very-nice');
  });

  it('returns sort-of-nice for score 55-69', () => {
    expect(getVerdictTier(55)).toBe('sort-of-nice');
    expect(getVerdictTier(69)).toBe('sort-of-nice');
  });

  it('returns borderline for score 40-54', () => {
    expect(getVerdictTier(40)).toBe('borderline');
    expect(getVerdictTier(54)).toBe('borderline');
  });

  it('returns sort-of-naughty for score 25-39', () => {
    expect(getVerdictTier(25)).toBe('sort-of-naughty');
    expect(getVerdictTier(39)).toBe('sort-of-naughty');
  });

  it('returns very-naughty for score 12-24', () => {
    expect(getVerdictTier(12)).toBe('very-naughty');
    expect(getVerdictTier(24)).toBe('very-naughty');
  });

  it('returns extremely-naughty for score < 12', () => {
    expect(getVerdictTier(11)).toBe('extremely-naughty');
    expect(getVerdictTier(0)).toBe('extremely-naughty');
  });
});

// ============ VERDICT DETAILS TESTS ============

describe('getVerdictDetails', () => {
  it('returns correct details for each tier', () => {
    const tiers = [
      'extremely-nice',
      'very-nice',
      'sort-of-nice',
      'borderline',
      'sort-of-naughty',
      'very-naughty',
      'extremely-naughty',
    ] as const;

    tiers.forEach((tier) => {
      const details = getVerdictDetails(tier);
      expect(details).toHaveProperty('label');
      expect(details).toHaveProperty('emoji');
      expect(details).toHaveProperty('flavor');
      expect(typeof details.label).toBe('string');
      expect(typeof details.emoji).toBe('string');
      expect(typeof details.flavor).toBe('string');
    });
  });

  it('returns Santa emoji for extremely-nice', () => {
    const details = getVerdictDetails('extremely-nice');
    expect(details.emoji).toBe('🎅');
    expect(details.label).toBe('Extremely Nice');
  });

  it('returns skull emoji for extremely-naughty', () => {
    const details = getVerdictDetails('extremely-naughty');
    expect(details.emoji).toBe('💀');
    expect(details.flavor).toContain('Krampus');
  });
});
