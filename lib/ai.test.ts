import { describe, it, expect } from 'vitest';
import { getFallbackVerdict, VerdictInput } from './ai';
import { VerdictTier } from '@/types';

// Helper to create VerdictInput
function createVerdictInput(
  tier: VerdictTier,
  overrides: Partial<VerdictInput> = {}
): VerdictInput {
  return {
    username: 'testuser',
    overallScore: 65,
    verdictTier: tier,
    categories: {
      commitConsistency: { score: 60, quip: '', stats: {} },
      messageQuality: { score: 70, quip: '', stats: {} },
      prHygiene: { score: 65, quip: '', stats: {} },
      reviewKarma: { score: 55, quip: '', stats: {} },
      issueCitizenship: { score: 75, quip: '', stats: {} },
      collaborationSpirit: { score: 65, quip: '', stats: {} },
    },
    summary: {
      totalCommits: 150,
      totalPRs: 25,
      totalReviews: 10,
      totalIssues: 5,
    },
    ...overrides,
  };
}

describe('getFallbackVerdict', () => {
  it('returns verdict for extremely-nice tier', () => {
    const input = createVerdictInput('extremely-nice');
    const result = getFallbackVerdict(input);

    expect(result).toContain('@testuser');
    expect(result).toContain('150');
    expect(result).toContain('Ho ho ho');
  });

  it('returns verdict for very-nice tier', () => {
    const input = createVerdictInput('very-nice');
    const result = getFallbackVerdict(input);

    expect(result).toContain('@testuser');
    expect(result).toContain('150');
    expect(result).toContain('25');
    expect(result).toContain('impressed');
  });

  it('returns verdict for sort-of-nice tier', () => {
    const input = createVerdictInput('sort-of-nice');
    const result = getFallbackVerdict(input);

    expect(result).toContain('@testuser');
    expect(result).toContain('mostly nice');
  });

  it('returns verdict for borderline tier', () => {
    const input = createVerdictInput('borderline');
    const result = getFallbackVerdict(input);

    expect(result).toContain('@testuser');
    expect(result).toContain('debating');
  });

  it('returns verdict for sort-of-naughty tier', () => {
    const input = createVerdictInput('sort-of-naughty', {
      summary: { totalCommits: 10, totalPRs: 2, totalReviews: 1, totalIssues: 0 },
    });
    const result = getFallbackVerdict(input);

    expect(result).toContain('@testuser');
    expect(result).toContain('coal');
  });

  it('returns verdict for very-naughty tier', () => {
    const input = createVerdictInput('very-naughty');
    const result = getFallbackVerdict(input);

    expect(result).toContain('@testuser');
    expect(result).toContain('disappointed');
  });

  it('returns verdict for extremely-naughty tier', () => {
    const input = createVerdictInput('extremely-naughty');
    const result = getFallbackVerdict(input);

    expect(result).toContain('@testuser');
    expect(result).toContain('Scrooge');
  });

  it('includes username in all verdicts', () => {
    const tiers: VerdictTier[] = [
      'extremely-nice',
      'very-nice',
      'sort-of-nice',
      'borderline',
      'sort-of-naughty',
      'very-naughty',
      'extremely-naughty',
    ];

    tiers.forEach((tier) => {
      const input = createVerdictInput(tier, { username: 'customuser' });
      const result = getFallbackVerdict(input);
      expect(result).toContain('@customuser');
    });
  });

  it('includes commit count in nice tier verdicts', () => {
    const input = createVerdictInput('extremely-nice', {
      summary: { totalCommits: 999, totalPRs: 50, totalReviews: 20, totalIssues: 10 },
    });
    const result = getFallbackVerdict(input);

    expect(result).toContain('999');
  });

  it('returns string for all tiers', () => {
    const tiers: VerdictTier[] = [
      'extremely-nice',
      'very-nice',
      'sort-of-nice',
      'borderline',
      'sort-of-naughty',
      'very-naughty',
      'extremely-naughty',
    ];

    tiers.forEach((tier) => {
      const input = createVerdictInput(tier);
      const result = getFallbackVerdict(input);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(50);
    });
  });
});

// Note: generateAIVerdict is not tested here because it makes real API calls.
// In a production environment, you would mock the OpenAI client.
// The fallback function is the testable unit.

