import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking
import {
  getUser,
  getEvents,
  getRepos,
  getRepoCommits,
  getRepoPRs,
  getReviewCount,
  getIssues,
  searchUserPRs,
  parseExternalContributions,
} from './github';
import { GitHubError } from './errors';
import { GitHubEvent } from '@/types/github';

describe('GitHub API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getUser', () => {
    it('fetches user successfully', async () => {
      const mockUser = {
        login: 'testuser',
        id: 12345,
        avatar_url: 'https://github.com/avatar.png',
        html_url: 'https://github.com/testuser',
        public_repos: 10,
        created_at: '2020-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const result = await getUser('testuser', 'fake-token');

      expect(result).toEqual(mockUser);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/users/testuser',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
          }),
        })
      );
    });

    it('throws USER_NOT_FOUND for 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      try {
        await getUser('nonexistent', 'token');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GitHubError);
        expect((error as GitHubError).code).toBe('USER_NOT_FOUND');
      }
    });

    it('throws GITHUB_ERROR for 401 (bad token)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      try {
        await getUser('user', 'bad-token');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GitHubError);
        expect((error as GitHubError).code).toBe('GITHUB_ERROR');
        expect((error as GitHubError).message).toBe('Invalid GitHub token');
      }
    });

    it('throws RATE_LIMITED for 403', async () => {
      const resetTime = Math.floor(Date.now() / 1000) + 3600;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: {
          get: (name: string) =>
            name === 'X-RateLimit-Reset' ? String(resetTime) : null,
        },
      });

      try {
        await getUser('user', 'token');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GitHubError);
        expect((error as GitHubError).code).toBe('RATE_LIMITED');
      }
    });

    it('throws GITHUB_ERROR for other status codes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      try {
        await getUser('user', 'token');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GitHubError);
        expect((error as GitHubError).code).toBe('GITHUB_ERROR');
      }
    });
  });

  describe('getEvents', () => {
    it('fetches multiple pages of events', async () => {
      const page1 = Array(100)
        .fill(null)
        .map((_, i) => ({ id: `event-${i}`, type: 'PushEvent' }));
      const page2 = Array(50)
        .fill(null)
        .map((_, i) => ({ id: `event-${100 + i}`, type: 'PushEvent' }));

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => page1 })
        .mockResolvedValueOnce({ ok: true, json: async () => page2 });

      const result = await getEvents('testuser', 'token');

      expect(result).toHaveLength(150);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('stops fetching when page has less than 100 items', async () => {
      const page1 = Array(50)
        .fill(null)
        .map((_, i) => ({ id: `event-${i}` }));

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => page1 });

      const result = await getEvents('testuser', 'token');

      expect(result).toHaveLength(50);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRepos', () => {
    it('fetches repos sorted by push date', async () => {
      const mockRepos = [{ id: 1, name: 'repo1' }];
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockRepos });

      const result = await getRepos('testuser', 'token');

      expect(result).toEqual(mockRepos);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('sort=pushed'),
        expect.any(Object)
      );
    });
  });

  describe('getRepoCommits', () => {
    it('returns empty array on error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

      const result = await getRepoCommits(
        'owner',
        'repo',
        'author',
        '2025-01-01',
        'token'
      );

      expect(result).toEqual([]);
    });

    it('fetches commits successfully', async () => {
      const mockCommits = [{ sha: 'abc123' }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommits,
      });

      const result = await getRepoCommits(
        'owner',
        'repo',
        'author',
        '2025-01-01',
        'token'
      );

      expect(result).toEqual(mockCommits);
    });
  });

  describe('getRepoPRs', () => {
    it('returns empty array on error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await getRepoPRs('owner', 'repo', 'token');

      expect(result).toEqual([]);
    });
  });

  describe('getReviewCount', () => {
    it('returns count from search API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total_count: 42 }),
      });

      const result = await getReviewCount('testuser', '2025-01-01', 'token');

      expect(result).toBe(42);
    });

    it('returns 0 on error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await getReviewCount('testuser', '2025-01-01', 'token');

      expect(result).toBe(0);
    });
  });

  describe('getIssues', () => {
    it('returns issues from search API', async () => {
      const mockIssues = [{ id: 1, title: 'Bug report' }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockIssues }),
      });

      const result = await getIssues('testuser', '2025-01-01', 'token');

      expect(result).toEqual(mockIssues);
    });

    it('returns empty array on error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await getIssues('testuser', '2025-01-01', 'token');

      expect(result).toEqual([]);
    });

    it('returns empty array when items is undefined', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await getIssues('testuser', '2025-01-01', 'token');

      expect(result).toEqual([]);
    });
  });

  describe('searchUserPRs', () => {
    it('returns external PRs with isExternal flag', async () => {
      const mockSearchResult = {
        total_count: 3,
        incomplete_results: false,
        items: [
          {
            id: 1,
            title: 'Fix bug in external repo',
            state: 'closed',
            created_at: '2025-01-15T00:00:00Z',
            closed_at: '2025-01-16T00:00:00Z',
            repository_url: 'https://api.github.com/repos/facebook/react',
            pull_request: { merged_at: '2025-01-16T00:00:00Z' },
          },
          {
            id: 2,
            title: 'Update docs in own repo',
            state: 'closed',
            created_at: '2025-01-10T00:00:00Z',
            closed_at: '2025-01-11T00:00:00Z',
            repository_url: 'https://api.github.com/repos/testuser/my-repo',
            pull_request: { merged_at: '2025-01-11T00:00:00Z' },
          },
          {
            id: 3,
            title: 'Add feature to another repo',
            state: 'open',
            created_at: '2025-01-20T00:00:00Z',
            closed_at: null,
            repository_url: 'https://api.github.com/repos/vercel/next.js',
            pull_request: { merged_at: null },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResult,
      });

      const result = await searchUserPRs('testuser', '2025-01-01', 'token');

      expect(result).toHaveLength(3);

      // External PR to facebook/react
      expect(result[0].repository).toBe('facebook/react');
      expect(result[0].isExternal).toBe(true);
      expect(result[0].merged_at).toBe('2025-01-16T00:00:00Z');

      // Own repo PR
      expect(result[1].repository).toBe('testuser/my-repo');
      expect(result[1].isExternal).toBe(false);

      // External PR to vercel/next.js (not merged)
      expect(result[2].repository).toBe('vercel/next.js');
      expect(result[2].isExternal).toBe(true);
      expect(result[2].merged_at).toBeNull();
    });

    it('handles empty results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total_count: 0, incomplete_results: false, items: [] }),
      });

      const result = await searchUserPRs('testuser', '2025-01-01', 'token');

      expect(result).toEqual([]);
    });

    it('returns empty array on error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await searchUserPRs('testuser', '2025-01-01', 'token');

      expect(result).toEqual([]);
    });
  });

  describe('parseExternalContributions', () => {
    it('extracts PushEvents to external repos', () => {
      const events: GitHubEvent[] = [
        {
          id: '1',
          type: 'PushEvent',
          created_at: '2025-01-15T00:00:00Z',
          repo: { id: 1, name: 'facebook/react' },
          payload: { push_id: 123, size: 3, commits: [{ sha: 'a' }, { sha: 'b' }, { sha: 'c' }] },
        },
        {
          id: '2',
          type: 'PushEvent',
          created_at: '2025-01-16T00:00:00Z',
          repo: { id: 2, name: 'vercel/next.js' },
          payload: { push_id: 124, size: 2, commits: [{ sha: 'd' }, { sha: 'e' }] },
        },
      ];

      const result = parseExternalContributions(events, 'testuser');

      expect(result.externalPushes).toHaveLength(2);
      expect(result.totalExternalCommits).toBe(5);
      expect(result.uniqueExternalRepos).toBe(2);
    });

    it('ignores events to own repos', () => {
      const events: GitHubEvent[] = [
        {
          id: '1',
          type: 'PushEvent',
          created_at: '2025-01-15T00:00:00Z',
          repo: { id: 1, name: 'testuser/my-repo' },
          payload: { push_id: 123, size: 5 },
        },
        {
          id: '2',
          type: 'PushEvent',
          created_at: '2025-01-16T00:00:00Z',
          repo: { id: 2, name: 'facebook/react' },
          payload: { push_id: 124, size: 2 },
        },
      ];

      const result = parseExternalContributions(events, 'testuser');

      expect(result.externalPushes).toHaveLength(1);
      expect(result.externalPushes[0].repo).toBe('facebook/react');
      expect(result.totalExternalCommits).toBe(2);
    });

    it('extracts PullRequestEvents to external repos', () => {
      const events: GitHubEvent[] = [
        {
          id: '1',
          type: 'PullRequestEvent',
          created_at: '2025-01-15T00:00:00Z',
          repo: { id: 1, name: 'facebook/react' },
          payload: { action: 'opened', pull_request: { merged: false } },
        },
        {
          id: '2',
          type: 'PullRequestEvent',
          created_at: '2025-01-16T00:00:00Z',
          repo: { id: 2, name: 'facebook/react' },
          payload: { action: 'closed', pull_request: { merged: true } },
        },
      ];

      const result = parseExternalContributions(events, 'testuser');

      expect(result.externalPRActions).toHaveLength(2);
      expect(result.externalPRActions[0].action).toBe('opened');
      expect(result.externalPRActions[0].merged).toBe(false);
      expect(result.externalPRActions[1].action).toBe('closed');
      expect(result.externalPRActions[1].merged).toBe(true);
    });

    it('calculates unique repos correctly', () => {
      const events: GitHubEvent[] = [
        {
          id: '1',
          type: 'PushEvent',
          created_at: '2025-01-15T00:00:00Z',
          repo: { id: 1, name: 'facebook/react' },
          payload: { push_id: 123, size: 1 },
        },
        {
          id: '2',
          type: 'PullRequestEvent',
          created_at: '2025-01-16T00:00:00Z',
          repo: { id: 1, name: 'facebook/react' }, // Same repo
          payload: { action: 'opened' },
        },
        {
          id: '3',
          type: 'PushEvent',
          created_at: '2025-01-17T00:00:00Z',
          repo: { id: 2, name: 'vercel/next.js' },
          payload: { push_id: 125, size: 2 },
        },
      ];

      const result = parseExternalContributions(events, 'testuser');

      expect(result.uniqueExternalRepos).toBe(2); // facebook/react and vercel/next.js
    });

    it('returns empty summary when no events', () => {
      const result = parseExternalContributions([], 'testuser');

      expect(result.externalPushes).toEqual([]);
      expect(result.externalPRActions).toEqual([]);
      expect(result.uniqueExternalRepos).toBe(0);
      expect(result.totalExternalCommits).toBe(0);
    });
  });
});

