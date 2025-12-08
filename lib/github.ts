import {
  GitHubUser,
  GitHubEvent,
  GitHubCommit,
  GitHubPullRequest,
  GitHubIssue,
  GitHubRepo,
  GitHubSearchResult,
  SearchPRItem,
  ExternalPR,
  ExternalContributionSummary,
  PushEventPayload,
  PREventPayload,
} from '@/types/github';
import { GitHubError } from './errors';

const GITHUB_API = 'https://api.github.com';

async function fetchGitHub<T>(endpoint: string, token: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const res = await fetch(`${GITHUB_API}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new GitHubError('USER_NOT_FOUND', 'User not found');
      }
      if (res.status === 401) {
        throw new GitHubError('GITHUB_ERROR', 'Invalid GitHub token');
      }
      if (res.status === 403) {
        const reset = res.headers.get('X-RateLimit-Reset');
        throw new GitHubError('RATE_LIMITED', 'Rate limit exceeded', {
          retryAfter: reset
            ? parseInt(reset) - Math.floor(Date.now() / 1000)
            : 3600,
        });
      }
      throw new GitHubError('GITHUB_ERROR', `GitHub API error: ${res.status}`);
    }

    return res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getUser(
  username: string,
  token: string
): Promise<GitHubUser> {
  return fetchGitHub(`/users/${username}`, token);
}

export async function getEvents(
  username: string,
  token: string
): Promise<GitHubEvent[]> {
  const events: GitHubEvent[] = [];
  for (let page = 1; page <= 3; page++) {
    const pageEvents = await fetchGitHub<GitHubEvent[]>(
      `/users/${username}/events?per_page=100&page=${page}`,
      token
    );
    events.push(...pageEvents);
    if (pageEvents.length < 100) break;
  }
  return events;
}

export async function getRepos(
  username: string,
  token: string
): Promise<GitHubRepo[]> {
  return fetchGitHub(
    `/users/${username}/repos?per_page=100&sort=pushed`,
    token
  );
}

export async function getRepoCommits(
  owner: string,
  repo: string,
  author: string,
  since: string,
  token: string
): Promise<GitHubCommit[]> {
  try {
    return await fetchGitHub(
      `/repos/${owner}/${repo}/commits?author=${author}&since=${since}&per_page=100`,
      token
    );
  } catch {
    return []; // Repo might be empty or inaccessible
  }
}

export async function getRepoPRs(
  owner: string,
  repo: string,
  token: string
): Promise<GitHubPullRequest[]> {
  try {
    return await fetchGitHub(
      `/repos/${owner}/${repo}/pulls?state=all&per_page=100`,
      token
    );
  } catch {
    return [];
  }
}

export async function getReviewCount(
  username: string,
  since: string,
  token: string
): Promise<number> {
  try {
    const result = await fetchGitHub<{ total_count: number }>(
      `/search/issues?q=reviewed-by:${username}+type:pr+created:>=${since}`,
      token
    );
    return result.total_count;
  } catch {
    return 0;
  }
}

export async function getIssues(
  username: string,
  since: string,
  token: string
): Promise<GitHubIssue[]> {
  try {
    const result = await fetchGitHub<{ items: GitHubIssue[] }>(
      `/search/issues?q=author:${username}+type:issue+created:>=${since}&per_page=100`,
      token
    );
    return result.items || [];
  } catch {
    return [];
  }
}

// === External Contributions Functions ===

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
      isExternal: !item.repository_url
        .toLowerCase()
        .includes(`/${username.toLowerCase()}/`),
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
  const externalPushes: Array<{
    repo: string;
    commitCount: number;
    date: string;
  }> = [];
  const externalPRActions: Array<{
    repo: string;
    action: string;
    merged: boolean;
    date: string;
  }> = [];

  const usernamePrefix = `${username.toLowerCase()}/`;

  events.forEach((event) => {
    const isExternal = !event.repo.name.toLowerCase().startsWith(usernamePrefix);
    if (!isExternal) return;

    if (event.type === 'PushEvent') {
      const payload = event.payload as unknown as PushEventPayload;
      externalPushes.push({
        repo: event.repo.name,
        commitCount: payload.commits?.length || payload.size || 0,
        date: event.created_at,
      });
    }

    if (event.type === 'PullRequestEvent') {
      const payload = event.payload as unknown as PREventPayload;
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
      ...externalPushes.map((p) => p.repo),
      ...externalPRActions.map((p) => p.repo),
    ]).size,
    totalExternalCommits: externalPushes.reduce(
      (sum, p) => sum + p.commitCount,
      0
    ),
  };
}

// Main data fetcher
export interface RawGitHubData {
  user: GitHubUser;
  events: GitHubEvent[];
  commits: GitHubCommit[];
  pullRequests: GitHubPullRequest[];
  reviewCount: number;
  issues: GitHubIssue[];
  externalPRs: ExternalPR[];
  externalContributions: ExternalContributionSummary;
  dataCompleteness: {
    eventsLimited: boolean;
    reposAnalyzed: number;
    reposTotal: number;
    externalPRsFound: number;
  };
}

export async function fetchUserData(
  username: string,
  token: string
): Promise<RawGitHubData> {
  const year = new Date().getFullYear();
  const since = `${year}-01-01T00:00:00Z`;
  const sinceDate = since.split('T')[0];

  const user = await getUser(username, token);
  
  // Fetch events, repos, and external PRs in parallel
  const [events, repos, externalPRs] = await Promise.all([
    getEvents(username, token),
    getRepos(username, token),
    searchUserPRs(username, sinceDate, token),
  ]);

  // Parse external contributions from events
  const externalContributions = parseExternalContributions(events, username);

  // Get active repos from this year (limit to 10)
  const activeRepos = repos
    .filter((r) => new Date(r.pushed_at) >= new Date(since))
    .slice(0, 10);

  // Fetch commits and PRs from active repos
  const repoData = await Promise.all(
    activeRepos.map(async (repo) => {
      const [commits, prs] = await Promise.all([
        getRepoCommits(repo.owner.login, repo.name, username, since, token),
        getRepoPRs(repo.owner.login, repo.name, token),
      ]);
      return {
        commits,
        prs: prs.filter((pr) => pr.user.login === username),
      };
    })
  );

  const commits = repoData.flatMap((r) => r.commits);
  const pullRequests = repoData.flatMap((r) => r.prs);

  const [reviewCount, issues] = await Promise.all([
    getReviewCount(username, sinceDate, token),
    getIssues(username, sinceDate, token),
  ]);

  return {
    user,
    events,
    commits,
    pullRequests,
    reviewCount,
    issues,
    externalPRs,
    externalContributions,
    dataCompleteness: {
      eventsLimited: events.length >= 300,
      reposAnalyzed: activeRepos.length,
      reposTotal: repos.length,
      externalPRsFound: externalPRs.length,
    },
  };
}
