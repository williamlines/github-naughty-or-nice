import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import * as github from '@/lib/github';
import * as ai from '@/lib/ai';
import { RawGitHubData } from '@/lib/github';
import { ExternalPR, ExternalContributionSummary } from '@/types/github';
import { AnalysisResponse } from '@/types';

// Mock modules
vi.mock('@/lib/github');
vi.mock('@/lib/ai');

// Mock environment
process.env.GITHUB_TOKEN = 'test-token';

describe('GET /api/analyze/[username]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockFetchUserData = vi.mocked(github.fetchUserData);
  const mockGenerateAIVerdict = vi.mocked(ai.generateAIVerdict);

  function createMockData(
    externalPRs: ExternalPR[] = [],
    externalContributions?: ExternalContributionSummary
  ): RawGitHubData {
    return {
      user: {
        login: 'testuser',
        id: 12345,
        avatar_url: 'https://github.com/avatar.png',
        html_url: 'https://github.com/testuser',
        public_repos: 10,
        created_at: '2020-01-01T00:00:00Z',
      },
      events: [],
      commits: [],
      pullRequests: [],
      reviewCount: 0,
      issues: [],
      externalPRs,
      externalContributions: externalContributions || {
        externalPushes: [],
        externalPRActions: [],
        uniqueExternalRepos: 0,
        totalExternalCommits: 0,
      },
      dataCompleteness: {
        eventsLimited: false,
        reposAnalyzed: 0,
        reposTotal: 0,
        externalPRsFound: externalPRs.length,
      },
    };
  }

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

  it('includes external PR counts in summary', async () => {
    const externalPRs = [
      createExternalPR('facebook/react', true, true),
      createExternalPR('vercel/next.js', true, false),
      createExternalPR('testuser/my-repo', false, true), // Own repo
    ];

    mockFetchUserData.mockResolvedValue(createMockData(externalPRs));
    mockGenerateAIVerdict.mockResolvedValue('Test AI summary');

    const request = new Request('http://localhost:3000/api/analyze/testuser');
    const params = Promise.resolve({ username: 'testuser' });
    const response = await GET(request, { params });

    expect(response.status).toBe(200);

    const data = (await response.json()) as AnalysisResponse;
    expect(data.success).toBe(true);

    if (data.success) {
      // Should include external PR counts in summary
      expect(data.data.summary).toHaveProperty('externalPRs');
      expect(data.data.summary).toHaveProperty('externalPRsMerged');

      // 2 external PRs (excluding own repo)
      expect(data.data.summary.externalPRs).toBe(2);
      // 1 merged external PR
      expect(data.data.summary.externalPRsMerged).toBe(1);
    }
  });

  it('includes externalPRsFound in dataCompleteness', async () => {
    const externalPRs = [
      createExternalPR('facebook/react', true, true),
      createExternalPR('vercel/next.js', true, true),
      createExternalPR('microsoft/typescript', true, false),
    ];

    mockFetchUserData.mockResolvedValue(createMockData(externalPRs));
    mockGenerateAIVerdict.mockResolvedValue('Test AI summary');

    const request = new Request('http://localhost:3000/api/analyze/testuser');
    const params = Promise.resolve({ username: 'testuser' });
    const response = await GET(request, { params });

    const data = (await response.json()) as AnalysisResponse;
    expect(data.success).toBe(true);

    if (data.success) {
      expect(data.data.dataCompleteness).toHaveProperty('externalPRsFound');
      expect(data.data.dataCompleteness.externalPRsFound).toBe(3);
    }
  });

  it('handles no external PRs (backward compatible)', async () => {
    mockFetchUserData.mockResolvedValue(createMockData([]));
    mockGenerateAIVerdict.mockResolvedValue('Test AI summary');

    const request = new Request('http://localhost:3000/api/analyze/testuser');
    const params = Promise.resolve({ username: 'testuser' });
    const response = await GET(request, { params });

    const data = (await response.json()) as AnalysisResponse;
    expect(data.success).toBe(true);

    if (data.success) {
      expect(data.data.summary.externalPRs).toBe(0);
      expect(data.data.summary.externalPRsMerged).toBe(0);
      expect(data.data.dataCompleteness.externalPRsFound).toBe(0);
    }
  });

  it('passes external data to scoring functions', async () => {
    const externalPRs = [
      createExternalPR('facebook/react', true, true),
      createExternalPR('vercel/next.js', true, true),
    ];
    const externalContributions = {
      externalPushes: [
        {
          repo: 'facebook/react',
          commitCount: 5,
          date: new Date().toISOString(),
        },
      ],
      externalPRActions: [],
      uniqueExternalRepos: 2,
      totalExternalCommits: 10,
    };

    mockFetchUserData.mockResolvedValue(
      createMockData(externalPRs, externalContributions)
    );
    mockGenerateAIVerdict.mockResolvedValue('Test AI summary');

    const request = new Request('http://localhost:3000/api/analyze/testuser');
    const params = Promise.resolve({ username: 'testuser' });
    const response = await GET(request, { params });

    const data = (await response.json()) as AnalysisResponse;
    expect(data.success).toBe(true);

    if (data.success) {
      // Verify scoring includes external data by checking stats
      expect(data.data.categories.prHygiene.stats).toHaveProperty(
        'externalPRs'
      );
      expect(data.data.categories.collaborationSpirit.stats).toHaveProperty(
        'externalPRs'
      );
      expect(data.data.categories.collaborationSpirit.stats).toHaveProperty(
        'externalCommits'
      );
    }
  });

  it('validates username format', async () => {
    const request = new Request('http://localhost:3000/api/analyze/invalid@user');
    const params = Promise.resolve({ username: 'invalid@user' });
    const response = await GET(request, { params });

    expect(response.status).toBe(400);

    const data = (await response.json()) as AnalysisResponse;
    expect(data.success).toBe(false);

    if (!data.success) {
      expect(data.error.code).toBe('USER_NOT_FOUND');
      expect(data.error.message).toContain('Invalid username format');
    }
  });

  it('returns error when GitHub token is missing', async () => {
    const originalToken = process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_TOKEN;

    const request = new Request('http://localhost:3000/api/analyze/testuser');
    const params = Promise.resolve({ username: 'testuser' });
    const response = await GET(request, { params });

    expect(response.status).toBe(500);

    const data = (await response.json()) as AnalysisResponse;
    expect(data.success).toBe(false);

    // Restore token
    process.env.GITHUB_TOKEN = originalToken;
  });

  it('response structure matches UserAnalysis type', async () => {
    const externalPRs = [createExternalPR('facebook/react', true, true)];
    mockFetchUserData.mockResolvedValue(createMockData(externalPRs));
    mockGenerateAIVerdict.mockResolvedValue('Test AI summary');

    const request = new Request('http://localhost:3000/api/analyze/testuser');
    const params = Promise.resolve({ username: 'testuser' });
    const response = await GET(request, { params });

    const data = (await response.json()) as AnalysisResponse;
    expect(data.success).toBe(true);

    if (data.success) {
      const analysis = data.data;

      // Required top-level fields
      expect(analysis).toHaveProperty('username');
      expect(analysis).toHaveProperty('avatarUrl');
      expect(analysis).toHaveProperty('profileUrl');
      expect(analysis).toHaveProperty('analyzedAt');
      expect(analysis).toHaveProperty('yearAnalyzed');
      expect(analysis).toHaveProperty('hasActivity');
      expect(analysis).toHaveProperty('verdict');
      expect(analysis).toHaveProperty('categories');
      expect(analysis).toHaveProperty('summary');
      expect(analysis).toHaveProperty('dataCompleteness');

      // Summary structure with external data
      expect(analysis.summary).toHaveProperty('totalCommits');
      expect(analysis.summary).toHaveProperty('totalPRs');
      expect(analysis.summary).toHaveProperty('totalReviews');
      expect(analysis.summary).toHaveProperty('totalIssues');
      expect(analysis.summary).toHaveProperty('externalPRs');
      expect(analysis.summary).toHaveProperty('externalPRsMerged');

      // DataCompleteness with external data
      expect(analysis.dataCompleteness).toHaveProperty('eventsLimited');
      expect(analysis.dataCompleteness).toHaveProperty('reposAnalyzed');
      expect(analysis.dataCompleteness).toHaveProperty('reposTotal');
      expect(analysis.dataCompleteness).toHaveProperty('externalPRsFound');

      // Verify types
      expect(typeof analysis.summary.externalPRs).toBe('number');
      expect(typeof analysis.summary.externalPRsMerged).toBe('number');
      expect(typeof analysis.dataCompleteness.externalPRsFound).toBe('number');
    }
  });

  it('includes top-level externalPRs array in response', async () => {
    const externalPRs = [
      createExternalPR('facebook/react', true, true),
      createExternalPR('vercel/next.js', true, false),
    ];
    mockFetchUserData.mockResolvedValue(createMockData(externalPRs));
    mockGenerateAIVerdict.mockResolvedValue('Test AI summary');

    const request = new Request('http://localhost:3000/api/analyze/testuser');
    const params = Promise.resolve({ username: 'testuser' });
    const response = await GET(request, { params });

    const data = (await response.json()) as AnalysisResponse;
    expect(data.success).toBe(true);

    if (data.success) {
      expect(data.data).toHaveProperty('externalPRs');
      expect(Array.isArray(data.data.externalPRs)).toBe(true);
      expect(data.data.externalPRs).toHaveLength(2);
      expect(data.data.externalPRs[0]).toHaveProperty('repository');
      expect(data.data.externalPRs[0]).toHaveProperty('isExternal');
      expect(data.data.externalPRs[0]).toHaveProperty('merged_at');
    }
  });

  it('includes top-level externalContributions summary in response', async () => {
    const externalContributions = {
      externalPushes: [
        { repo: 'facebook/react', commitCount: 5, date: new Date().toISOString() },
      ],
      externalPRActions: [],
      uniqueExternalRepos: 2,
      totalExternalCommits: 10,
    };
    mockFetchUserData.mockResolvedValue(
      createMockData([], externalContributions)
    );
    mockGenerateAIVerdict.mockResolvedValue('Test AI summary');

    const request = new Request('http://localhost:3000/api/analyze/testuser');
    const params = Promise.resolve({ username: 'testuser' });
    const response = await GET(request, { params });

    const data = (await response.json()) as AnalysisResponse;
    expect(data.success).toBe(true);

    if (data.success) {
      expect(data.data).toHaveProperty('externalContributions');
      expect(data.data.externalContributions).toHaveProperty('externalPushes');
      expect(data.data.externalContributions).toHaveProperty('externalPRActions');
      expect(data.data.externalContributions).toHaveProperty('uniqueExternalRepos');
      expect(data.data.externalContributions).toHaveProperty('totalExternalCommits');
      expect(data.data.externalContributions.uniqueExternalRepos).toBe(2);
      expect(data.data.externalContributions.totalExternalCommits).toBe(10);
    }
  });
});
