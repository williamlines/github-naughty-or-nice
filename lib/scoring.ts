import { CategoryScores, VerdictTier } from '@/types';
import {
  GitHubCommit,
  GitHubPullRequest,
  GitHubIssue,
  GitHubEvent,
} from '@/types/github';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function average(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function getWeekNumber(dateStr: string): number {
  const date = new Date(dateStr);
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

// 1. Commit Consistency
export function scoreCommitConsistency(
  commits: GitHubCommit[]
): CategoryScores['commitConsistency'] {
  if (commits.length === 0) {
    return {
      score: 50,
      quip: 'No commits to analyze',
      stats: { totalCommits: 0, activeWeeks: 0 },
    };
  }

  const weekMap = new Map<number, number>();
  commits.forEach((c) => {
    const week = getWeekNumber(c.commit.author.date);
    weekMap.set(week, (weekMap.get(week) || 0) + 1);
  });

  const currentWeek = getWeekNumber(new Date().toISOString());
  const activeWeeks = weekMap.size;
  const coverageRatio = activeWeeks / currentWeek;

  const counts = Array.from(weekMap.values());
  const avg = average(counts);
  const variance = average(counts.map((c) => Math.pow(c - avg, 2)));
  const normalizedVariance = Math.min(variance / 100, 1);

  const score = clamp(
    Math.round(coverageRatio * 70 + (1 - normalizedVariance) * 30),
    0,
    100
  );

  return {
    score,
    quip:
      score >= 70
        ? 'Steady as a reindeer'
        : score >= 40
          ? 'Mostly consistent, with some hibernation'
          : 'Feast or famine commits',
    stats: {
      totalCommits: commits.length,
      activeWeeks,
      avgPerWeek:
        Math.round((commits.length / Math.max(activeWeeks, 1)) * 10) / 10,
    },
  };
}

// 2. Message Quality
export function scoreMessageQuality(
  commits: GitHubCommit[]
): CategoryScores['messageQuality'] {
  if (commits.length === 0) {
    return { score: 50, quip: 'No messages to judge', stats: {} };
  }

  const messages = commits.map((c) => c.commit.message.split('\n')[0]);
  const avgLength = average(messages.map((m) => m.length));
  const shortPercent =
    (messages.filter((m) => m.length < 10).length / messages.length) * 100;

  const lowEffort = /^(fix|wip|update|test|asdf|\.+)$/i;
  const lowEffortPercent =
    (messages.filter((m) => lowEffort.test(m.trim())).length /
      messages.length) *
    100;

  const conventional = /^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?:/i;
  const conventionalPercent =
    (messages.filter((m) => conventional.test(m)).length / messages.length) *
    100;

  let score = 50;
  if (avgLength >= 50) score += 25;
  else if (avgLength >= 30) score += 15;
  else if (avgLength >= 20) score += 5;
  else score -= 10;

  score -= Math.min(shortPercent / 2, 25);
  score -= Math.min(lowEffortPercent, 20);
  score += Math.min(conventionalPercent / 5, 20);

  score = clamp(Math.round(score), 0, 100);

  return {
    score,
    quip:
      score >= 70
        ? 'Your commits tell a beautiful story'
        : score >= 40
          ? 'Your commits tell a story... mostly'
          : "The elves can't read your commit history",
    stats: {
      avgLength: Math.round(avgLength),
      conventionalPercent: Math.round(conventionalPercent),
    },
  };
}

// 3. PR Hygiene
export function scorePRHygiene(
  prs: GitHubPullRequest[]
): CategoryScores['prHygiene'] {
  if (prs.length === 0) {
    return { score: 50, quip: 'No PRs on record', stats: { totalPRs: 0 } };
  }

  const linesChanged = prs.map((pr) => pr.additions + pr.deletions);
  const avgLines = average(linesChanged);
  const megaPRs = linesChanged.filter((l) => l > 1000).length;
  const megaPRPercent = (megaPRs / prs.length) * 100;
  const smallPRs = linesChanged.filter((l) => l < 400).length;
  const smallPRPercent = (smallPRs / prs.length) * 100;

  let score = 50;
  if (avgLines < 200) score += 30;
  else if (avgLines < 400) score += 20;
  else if (avgLines < 600) score += 10;
  else if (avgLines > 800) score -= 20;

  score += Math.min(smallPRPercent / 5, 15);
  score -= megaPRPercent;

  score = clamp(Math.round(score), 0, 100);

  return {
    score,
    quip:
      score >= 70
        ? 'Reviewers love your bite-sized PRs'
        : score >= 40
          ? 'Reviewers appreciate you'
          : 'Your PRs need a table of contents',
    stats: { totalPRs: prs.length, avgLinesChanged: Math.round(avgLines) },
  };
}

// 4. Review Karma
export function scoreReviewKarma(
  reviewCount: number,
  prsAuthored: number
): CategoryScores['reviewKarma'] {
  if (prsAuthored === 0 && reviewCount === 0) {
    return {
      score: 50,
      quip: 'No reviews on record',
      stats: { reviewsGiven: 0, prsAuthored: 0 },
    };
  }

  const karmaRatio = prsAuthored > 0 ? reviewCount / prsAuthored : reviewCount;

  let score = 30;
  score += Math.min(reviewCount * 4, 40);
  if (karmaRatio >= 1.0) score += 30;
  else if (karmaRatio >= 0.5) score += 20;
  else if (karmaRatio >= 0.25) score += 10;

  score = clamp(Math.round(score), 0, 100);

  return {
    score,
    quip:
      score >= 70
        ? 'A true code review champion'
        : score >= 40
          ? 'The elves want more reviews'
          : 'The review queue misses you',
    stats: {
      reviewsGiven: reviewCount,
      prsAuthored,
      karmaRatio: Math.round(karmaRatio * 100) / 100,
    },
  };
}

// 5. Issue Citizenship
export function scoreIssueCitizenship(
  issues: GitHubIssue[],
  username: string
): CategoryScores['issueCitizenship'] {
  const realIssues = issues.filter((i) => !i.pull_request);
  const opened = realIssues.filter((i) => i.user.login === username);
  const closed = opened.filter((i) => i.state === 'closed');

  if (opened.length === 0) {
    return {
      score: 50,
      quip: 'Issue-free zone',
      stats: { issuesOpened: 0, issuesClosed: 0 },
    };
  }

  const closeRatio = closed.length / opened.length;

  let score = 40;
  score += closeRatio * 40;

  const closeTimes = closed
    .filter((i) => i.closed_at)
    .map(
      (i) =>
        (new Date(i.closed_at!).getTime() - new Date(i.created_at).getTime()) /
        86400000
    );
  const avgCloseTime = average(closeTimes);

  if (avgCloseTime > 0 && avgCloseTime < 7) score += 20;
  else if (avgCloseTime < 14) score += 15;
  else if (avgCloseTime < 30) score += 10;

  score = clamp(Math.round(score), 0, 100);

  return {
    score,
    quip:
      score >= 70
        ? 'A tidy workshop indeed'
        : score >= 40
          ? 'Some open issues gathering dust'
          : 'Your issues are having a party without you',
    stats: { issuesOpened: opened.length, issuesClosed: closed.length },
  };
}

// 6. Collaboration Spirit
export function scoreCollaborationSpirit(
  events: GitHubEvent[],
  username: string
): CategoryScores['collaborationSpirit'] {
  const contributionTypes = ['PushEvent', 'PullRequestEvent', 'IssuesEvent'];
  const contributions = events.filter((e) =>
    contributionTypes.includes(e.type)
  );

  if (contributions.length === 0) {
    return {
      score: 50,
      quip: 'Flying solo',
      stats: { externalContributions: 0 },
    };
  }

  // Escape special regex characters in username to prevent injection
  const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ownRepoPattern = new RegExp(`^${escapedUsername}/`, 'i');
  const external = contributions.filter(
    (e) => !ownRepoPattern.test(e.repo.name)
  );
  const externalPercent = (external.length / contributions.length) * 100;
  const uniqueExternalRepos = new Set(external.map((e) => e.repo.name)).size;

  let score = 30;
  score += Math.min(externalPercent / 2.5, 40);
  score += Math.min(uniqueExternalRepos * 6, 30);

  score = clamp(Math.round(score), 0, 100);

  return {
    score,
    quip:
      score >= 70
        ? 'Open source hero status'
        : score >= 40
          ? 'Spreading holiday cheer'
          : 'Your code rarely leaves home',
    stats: {
      externalContributions: external.length,
      uniqueRepos: uniqueExternalRepos,
    },
  };
}

// Calculate all scores
export function calculateAllScores(
  commits: GitHubCommit[],
  prs: GitHubPullRequest[],
  reviewCount: number,
  issues: GitHubIssue[],
  events: GitHubEvent[],
  username: string
): CategoryScores {
  return {
    commitConsistency: scoreCommitConsistency(commits),
    messageQuality: scoreMessageQuality(commits),
    prHygiene: scorePRHygiene(prs),
    reviewKarma: scoreReviewKarma(reviewCount, prs.length),
    issueCitizenship: scoreIssueCitizenship(issues, username),
    collaborationSpirit: scoreCollaborationSpirit(events, username),
  };
}

// Overall score
export function calculateOverallScore(categories: CategoryScores): number {
  const scores = Object.values(categories).map((c) => c.score);
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// Verdict tier
export function getVerdictTier(score: number): VerdictTier {
  if (score >= 90) return 'extremely-nice';
  if (score >= 75) return 'very-nice';
  if (score >= 60) return 'sort-of-nice';
  if (score >= 45) return 'borderline';
  if (score >= 30) return 'sort-of-naughty';
  if (score >= 15) return 'very-naughty';
  return 'extremely-naughty';
}

// Verdict details
export function getVerdictDetails(tier: VerdictTier): {
  label: string;
  emoji: string;
  flavor: string;
} {
  const details: Record<
    VerdictTier,
    { label: string; emoji: string; flavor: string }
  > = {
    'extremely-nice': {
      label: 'Extremely Nice',
      emoji: '🎅',
      flavor: "Santa's putting you on speed dial",
    },
    'very-nice': {
      label: 'Very Nice',
      emoji: '😇',
      flavor: 'Definitely on the nice list',
    },
    'sort-of-nice': {
      label: 'Sort of Nice',
      emoji: '🙂',
      flavor: "Nice-ish... we'll allow it",
    },
    borderline: {
      label: 'Borderline',
      emoji: '😬',
      flavor: 'The elves are debating',
    },
    'sort-of-naughty': {
      label: 'Sort of Naughty',
      emoji: '😈',
      flavor: 'Coal is looking likely',
    },
    'very-naughty': {
      label: 'Very Naughty',
      emoji: '👿',
      flavor: "Santa's disappointed",
    },
    'extremely-naughty': {
      label: 'Extremely Naughty',
      emoji: '💀',
      flavor: 'Krampus has entered the chat',
    },
  };
  return details[tier];
}

