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

// === External Contributions Types ===

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
  externalPRActions: Array<{
    repo: string;
    action: string;
    merged: boolean;
    date: string;
  }>;
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
