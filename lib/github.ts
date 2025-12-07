import {
  GitHubUser,
  GitHubEvent,
  GitHubCommit,
  GitHubPullRequest,
  GitHubIssue,
  GitHubRepo,
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

// Main data fetcher
export interface RawGitHubData {
  user: GitHubUser;
  events: GitHubEvent[];
  commits: GitHubCommit[];
  pullRequests: GitHubPullRequest[];
  reviewCount: number;
  issues: GitHubIssue[];
  dataCompleteness: {
    eventsLimited: boolean;
    reposAnalyzed: number;
    reposTotal: number;
  };
}

export async function fetchUserData(
  username: string,
  token: string
): Promise<RawGitHubData> {
  const year = new Date().getFullYear();
  const since = `${year}-01-01T00:00:00Z`;

  const user = await getUser(username, token);
  const [events, repos] = await Promise.all([
    getEvents(username, token),
    getRepos(username, token),
  ]);

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
    getReviewCount(username, since.split('T')[0], token),
    getIssues(username, since.split('T')[0], token),
  ]);

  return {
    user,
    events,
    commits,
    pullRequests,
    reviewCount,
    issues,
    dataCompleteness: {
      eventsLimited: events.length >= 300,
      reposAnalyzed: activeRepos.length,
      reposTotal: repos.length,
    },
  };
}
