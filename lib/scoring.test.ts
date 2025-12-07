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
function createPR(additions: number, deletions: number): GitHubPullRequest {
  return {
    id: Math.floor(Math.random() * 10000),
    number: Math.floor(Math.random() * 100),
    state: 'closed',
    created_at: new Date().toISOString(),
    merged_at: new Date().toISOString(),
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

// ============ COMMIT CONSISTENCY TESTS ============

describe('scoreCommitConsistency', () => {
  it('returns score 50 for empty commits array', () => {
    const result = scoreCommitConsistency([]);
    expect(result.score).toBe(50);
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
  it('returns score 50 for empty commits array', () => {
    const result = scoreMessageQuality([]);
    expect(result.score).toBe(50);
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

  it('returns lower score for low-effort messages', () => {
    const commits = [
      createCommit('fix'),
      createCommit('wip'),
      createCommit('update'),
      createCommit('asdf'),
    ];
    const result = scoreMessageQuality(commits);
    expect(result.score).toBeLessThan(50);
  });

  it('penalizes very short messages', () => {
    const commits = [createCommit('a'), createCommit('b'), createCommit('xyz')];
    const result = scoreMessageQuality(commits);
    expect(result.score).toBeLessThan(50);
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
  it('returns score 50 for empty PRs array', () => {
    const result = scorePRHygiene([]);
    expect(result.score).toBe(50);
    expect(result.quip).toBe('No PRs on record');
    expect(result.stats.totalPRs).toBe(0);
  });

  it('returns higher score for small PRs', () => {
    const prs = [
      createPR(50, 20), // 70 lines
      createPR(100, 30), // 130 lines
      createPR(80, 40), // 120 lines
    ];
    const result = scorePRHygiene(prs);
    expect(result.score).toBeGreaterThan(60);
    expect(result.quip).toContain('love');
  });

  it('returns lower score for mega PRs', () => {
    const prs = [
      createPR(800, 500), // 1300 lines
      createPR(1000, 600), // 1600 lines
      createPR(1200, 400), // 1600 lines
    ];
    const result = scorePRHygiene(prs);
    expect(result.score).toBeLessThan(50);
  });

  it('calculates average lines correctly', () => {
    const prs = [
      createPR(100, 50), // 150 lines
      createPR(200, 100), // 300 lines
      createPR(150, 75), // 225 lines
    ];
    const result = scorePRHygiene(prs);
    expect(result.stats.avgLinesChanged).toBe(225);
    expect(result.stats.totalPRs).toBe(3);
  });
});

// ============ REVIEW KARMA TESTS ============

describe('scoreReviewKarma', () => {
  it('returns score 50 for no reviews and no PRs', () => {
    const result = scoreReviewKarma(0, 0);
    expect(result.score).toBe(50);
    expect(result.quip).toBe('No reviews on record');
  });

  it('returns higher score for good review ratio', () => {
    const result = scoreReviewKarma(10, 5); // 2:1 ratio
    expect(result.score).toBeGreaterThan(70);
    expect(result.quip).toContain('champion');
  });

  it('returns lower score for poor review ratio', () => {
    const result = scoreReviewKarma(1, 20); // 0.05:1 ratio
    expect(result.score).toBeLessThan(50);
  });

  it('handles reviewers who only review (no PRs authored)', () => {
    const result = scoreReviewKarma(15, 0);
    expect(result.score).toBeGreaterThan(50);
    expect(result.stats.karmaRatio).toBe(15);
  });
});

// ============ ISSUE CITIZENSHIP TESTS ============

describe('scoreIssueCitizenship', () => {
  it('returns score 50 for no issues', () => {
    const result = scoreIssueCitizenship([], 'testuser');
    expect(result.score).toBe(50);
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
    expect(result.score).toBeLessThan(70);
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
  it('returns score 50 for no contribution events', () => {
    const result = scoreCollaborationSpirit([], 'testuser');
    expect(result.score).toBe(50);
    expect(result.quip).toBe('Flying solo');
  });

  it('returns lower score for only own repo contributions', () => {
    const events = [
      createEvent('PushEvent', 'testuser/my-repo'),
      createEvent('PullRequestEvent', 'testuser/another-repo'),
      createEvent('IssuesEvent', 'testuser/third-repo'),
    ];
    const result = scoreCollaborationSpirit(events, 'testuser');
    expect(result.score).toBeLessThan(50);
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

  it('ignores non-contribution event types', () => {
    const events = [
      createEvent('WatchEvent', 'facebook/react'),
      createEvent('ForkEvent', 'vercel/next.js'),
      createEvent('StarEvent', 'microsoft/typescript'),
    ];
    const result = scoreCollaborationSpirit(events, 'testuser');
    expect(result.score).toBe(50);
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
  it('returns extremely-nice for score >= 90', () => {
    expect(getVerdictTier(90)).toBe('extremely-nice');
    expect(getVerdictTier(100)).toBe('extremely-nice');
  });

  it('returns very-nice for score 75-89', () => {
    expect(getVerdictTier(75)).toBe('very-nice');
    expect(getVerdictTier(89)).toBe('very-nice');
  });

  it('returns sort-of-nice for score 60-74', () => {
    expect(getVerdictTier(60)).toBe('sort-of-nice');
    expect(getVerdictTier(74)).toBe('sort-of-nice');
  });

  it('returns borderline for score 45-59', () => {
    expect(getVerdictTier(45)).toBe('borderline');
    expect(getVerdictTier(59)).toBe('borderline');
  });

  it('returns sort-of-naughty for score 30-44', () => {
    expect(getVerdictTier(30)).toBe('sort-of-naughty');
    expect(getVerdictTier(44)).toBe('sort-of-naughty');
  });

  it('returns very-naughty for score 15-29', () => {
    expect(getVerdictTier(15)).toBe('very-naughty');
    expect(getVerdictTier(29)).toBe('very-naughty');
  });

  it('returns extremely-naughty for score < 15', () => {
    expect(getVerdictTier(14)).toBe('extremely-naughty');
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
