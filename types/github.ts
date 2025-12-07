export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  created_at: string;
}

export interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  repo: { id: number; name: string };
  payload: Record<string, unknown>;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { date: string };
  };
  author: { login: string } | null;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  state: 'open' | 'closed';
  created_at: string;
  merged_at: string | null;
  additions: number;
  deletions: number;
  user: { login: string };
}

export interface GitHubIssue {
  id: number;
  number: number;
  state: 'open' | 'closed';
  created_at: string;
  closed_at: string | null;
  user: { login: string };
  pull_request?: unknown;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  pushed_at: string;
  default_branch: string;
}

export interface GitHubSearchResult<T> {
  total_count: number;
  incomplete_results: boolean;
  items: T[];
}
