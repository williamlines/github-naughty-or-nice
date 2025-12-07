#!/usr/bin/env npx tsx
/**
 * Debug script to test GitHub API data fetching
 * Usage: npx tsx scripts/debug-github.ts <username>
 *
 * Or add to package.json: "debug:github": "tsx scripts/debug-github.ts"
 * Then run: npm run debug:github <username>
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local (Next.js convention), fallback to .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

// Re-implement fetch functions here to avoid module resolution issues
const GITHUB_API = 'https://api.github.com';

interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  created_at: string;
  [key: string]: unknown; // Allow extra fields
}

interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  repo: { id: number; name: string };
  payload: Record<string, unknown>;
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { date: string };
  };
  author: { login: string } | null;
}

interface GitHubPullRequest {
  id: number;
  number: number;
  state: 'open' | 'closed';
  created_at: string;
  merged_at: string | null;
  additions: number;
  deletions: number;
  user: { login: string };
}

interface GitHubIssue {
  id: number;
  number: number;
  state: 'open' | 'closed';
  created_at: string;
  closed_at: string | null;
  user: { login: string };
  pull_request?: unknown;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  pushed_at: string;
  default_branch: string;
}

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color: keyof typeof colors, ...args: unknown[]) {
  console.log(colors[color], ...args, colors.reset);
}

function header(text: string) {
  console.log('\n' + '='.repeat(60));
  log('cyan', `  ${text}`);
  console.log('='.repeat(60));
}

function subheader(text: string) {
  console.log('\n' + '-'.repeat(40));
  log('blue', `  ${text}`);
  console.log('-'.repeat(40));
}

async function fetchGitHub<T>(
  endpoint: string,
  token: string
): Promise<{
  data: T | null;
  raw: unknown;
  status: number;
  headers: Record<string, string>;
}> {
  const url = `${GITHUB_API}${endpoint}`;
  log('yellow', `→ Fetching: ${url}`);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  const headersObj: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    if (
      key.toLowerCase().startsWith('x-ratelimit') ||
      key.toLowerCase() === 'content-type'
    ) {
      headersObj[key] = value;
    }
  });

  let raw: unknown = null;
  try {
    raw = await res.json();
  } catch {
    raw = await res.text();
  }

  return {
    data: res.ok ? (raw as T) : null,
    raw,
    status: res.status,
    headers: headersObj,
  };
}

async function debugGitHub(username: string) {
  const token = process.env.GITHUB_TOKEN;

  header('🔍 GitHub API Debug Tool');
  console.log(`Username: ${username}`);
  console.log(`Token: ${token ? '✓ Found' : '✗ MISSING!'}`);
  console.log(`Time: ${new Date().toISOString()}`);

  if (!token) {
    log('red', '\n❌ ERROR: GITHUB_TOKEN not found in environment');
    log('yellow', 'Create a .env file with: GITHUB_TOKEN=your_token_here');
    process.exit(1);
  }

  const year = new Date().getFullYear();
  const since = `${year}-01-01T00:00:00Z`;
  const sinceDate = since.split('T')[0];

  // 1. Fetch User
  subheader('1️⃣  User Profile');
  const userResult = await fetchGitHub<GitHubUser>(`/users/${username}`, token);
  console.log(`Status: ${userResult.status}`);
  console.log(
    `Rate Limit Remaining: ${userResult.headers['x-ratelimit-remaining'] || 'N/A'}`
  );

  if (!userResult.data) {
    log('red', '❌ Failed to fetch user');
    console.log('Response:', JSON.stringify(userResult.raw, null, 2));
    process.exit(1);
  }

  const user = userResult.data;
  console.log('\n📋 User Data:');
  console.log(`  login: ${user.login}`);
  console.log(`  id: ${user.id}`);
  console.log(`  avatar_url: ${user.avatar_url}`);
  console.log(`  html_url: ${user.html_url}`);
  console.log(`  public_repos: ${user.public_repos}`);
  console.log(`  created_at: ${user.created_at}`);

  // Check for extra fields we might be missing
  const expectedUserFields = [
    'login',
    'id',
    'avatar_url',
    'html_url',
    'public_repos',
    'created_at',
  ];
  const actualUserFields = Object.keys(user);
  const extraFields = actualUserFields.filter(
    (f) => !expectedUserFields.includes(f)
  );
  if (extraFields.length > 0) {
    log(
      'yellow',
      `\n  ⚠️  Extra fields available: ${extraFields.slice(0, 10).join(', ')}${extraFields.length > 10 ? '...' : ''}`
    );
  }

  // 2. Fetch Events
  subheader('2️⃣  Events (up to 300)');
  const events: GitHubEvent[] = [];
  for (let page = 1; page <= 3; page++) {
    const eventsResult = await fetchGitHub<GitHubEvent[]>(
      `/users/${username}/events?per_page=100&page=${page}`,
      token
    );
    if (eventsResult.data) {
      events.push(...eventsResult.data);
      console.log(`  Page ${page}: ${eventsResult.data.length} events`);
      if (eventsResult.data.length < 100) break;
    } else {
      log('red', `  Page ${page}: Failed`);
      break;
    }
  }

  console.log(`\n📊 Events Summary:`);
  console.log(`  Total fetched: ${events.length}`);
  console.log(
    `  Events limited (>=300): ${events.length >= 300 ? '⚠️ YES' : 'No'}`
  );

  // Event type breakdown
  const eventTypes: Record<string, number> = {};
  events.forEach((e) => {
    eventTypes[e.type] = (eventTypes[e.type] || 0) + 1;
  });
  console.log('\n  Event Types:');
  Object.entries(eventTypes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`    ${type}: ${count}`);
    });

  if (events.length > 0) {
    console.log('\n  📝 Sample Event:');
    console.log(
      JSON.stringify(events[0], null, 2)
        .split('\n')
        .map((l) => '    ' + l)
        .join('\n')
    );
  }

  // 3. Fetch Repos
  subheader('3️⃣  Repositories');
  const reposResult = await fetchGitHub<GitHubRepo[]>(
    `/users/${username}/repos?per_page=100&sort=pushed`,
    token
  );

  if (!reposResult.data) {
    log('red', '❌ Failed to fetch repos');
    console.log('Response:', JSON.stringify(reposResult.raw, null, 2));
  } else {
    const repos = reposResult.data;
    const activeRepos = repos.filter(
      (r) => new Date(r.pushed_at) >= new Date(since)
    );

    console.log(`\n📊 Repos Summary:`);
    console.log(`  Total repos: ${repos.length}`);
    console.log(`  Active in ${year}: ${activeRepos.length}`);
    console.log(
      `  Will analyze: ${Math.min(activeRepos.length, 10)} (capped at 10)`
    );

    if (activeRepos.length > 0) {
      console.log('\n  📝 Active Repos:');
      activeRepos.slice(0, 10).forEach((r, i) => {
        console.log(`    ${i + 1}. ${r.full_name} (pushed: ${r.pushed_at})`);
      });
    }

    // 4. Fetch Commits from first active repo
    if (activeRepos.length > 0) {
      subheader('4️⃣  Commits (from first active repo)');
      const firstRepo = activeRepos[0];
      const commitsResult = await fetchGitHub<GitHubCommit[]>(
        `/repos/${firstRepo.owner.login}/${firstRepo.name}/commits?author=${username}&since=${since}&per_page=100`,
        token
      );

      if (commitsResult.data) {
        console.log(`\n📊 Commits from ${firstRepo.full_name}:`);
        console.log(`  Count: ${commitsResult.data.length}`);

        if (commitsResult.data.length > 0) {
          console.log('\n  📝 Sample Commit:');
          console.log(
            JSON.stringify(commitsResult.data[0], null, 2)
              .split('\n')
              .map((l) => '    ' + l)
              .join('\n')
          );
        }
      } else {
        log(
          'yellow',
          `  ⚠️ Could not fetch commits (status: ${commitsResult.status})`
        );
      }

      // 5. Fetch PRs from first active repo
      subheader('5️⃣  Pull Requests (from first active repo)');
      const prsResult = await fetchGitHub<GitHubPullRequest[]>(
        `/repos/${firstRepo.owner.login}/${firstRepo.name}/pulls?state=all&per_page=100`,
        token
      );

      if (prsResult.data) {
        const userPRs = prsResult.data.filter(
          (pr) => pr.user.login === username
        );
        console.log(`\n📊 PRs from ${firstRepo.full_name}:`);
        console.log(`  Total PRs: ${prsResult.data.length}`);
        console.log(`  User's PRs: ${userPRs.length}`);

        if (userPRs.length > 0) {
          console.log('\n  📝 Sample PR:');
          console.log(
            JSON.stringify(userPRs[0], null, 2)
              .split('\n')
              .map((l) => '    ' + l)
              .join('\n')
          );
        }
      } else {
        log('yellow', `  ⚠️ Could not fetch PRs (status: ${prsResult.status})`);
      }
    }
  }

  // 6. Fetch Review Count
  subheader('6️⃣  Review Count (Search API)');
  const reviewResult = await fetchGitHub<{ total_count: number }>(
    `/search/issues?q=reviewed-by:${username}+type:pr+created:>=${sinceDate}`,
    token
  );

  if (reviewResult.data) {
    console.log(`\n📊 Reviews:`);
    console.log(`  Total reviews in ${year}: ${reviewResult.data.total_count}`);
  } else {
    log(
      'yellow',
      `  ⚠️ Could not fetch review count (status: ${reviewResult.status})`
    );
    console.log('  Response:', JSON.stringify(reviewResult.raw, null, 2));
  }

  // 7. Fetch Issues
  subheader('7️⃣  Issues (Search API)');
  const issuesResult = await fetchGitHub<{
    items: GitHubIssue[];
    total_count: number;
  }>(
    `/search/issues?q=author:${username}+type:issue+created:>=${sinceDate}&per_page=100`,
    token
  );

  if (issuesResult.data) {
    console.log(`\n📊 Issues:`);
    console.log(`  Total issues in ${year}: ${issuesResult.data.total_count}`);
    console.log(`  Fetched: ${issuesResult.data.items?.length || 0}`);

    if (issuesResult.data.items && issuesResult.data.items.length > 0) {
      console.log('\n  📝 Sample Issue:');
      console.log(
        JSON.stringify(issuesResult.data.items[0], null, 2)
          .split('\n')
          .map((l) => '    ' + l)
          .join('\n')
      );
    }
  } else {
    log(
      'yellow',
      `  ⚠️ Could not fetch issues (status: ${issuesResult.status})`
    );
    console.log('  Response:', JSON.stringify(issuesResult.raw, null, 2));
  }

  // Summary
  header('📊 Debug Summary');
  console.log(`
  User:          ${user.login} ✓
  Events:        ${events.length} ${events.length >= 300 ? '(⚠️ capped at 300)' : ''}
  Repos:         ${reposResult.data?.length || 0}
  Active Repos:  ${reposResult.data?.filter((r) => new Date(r.pushed_at) >= new Date(since)).length || 0}

  Rate Limit:    ${userResult.headers['x-ratelimit-remaining']} remaining
  `);

  log('green', '✅ Debug complete! Check the output above for any issues.');
}

// Main
const username = process.argv[2];
if (!username) {
  log('red', '❌ Usage: npx tsx scripts/debug-github.ts <username>');
  process.exit(1);
}

debugGitHub(username).catch((err) => {
  log('red', '❌ Fatal error:', err);
  process.exit(1);
});
