import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { use } from 'react';
import ResultsPage from './page';

// Mock React 19's use() hook
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    use: vi.fn(),
  };
});

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

// Mock components
vi.mock('@/components/LoadingSpinner', () => ({
  LoadingSpinner: () => <div>Loading...</div>,
}));

vi.mock('@/components/ErrorState', () => ({
  ErrorState: ({ code }: { code: string }) => <div>Error: {code}</div>,
}));

vi.mock('@/components/VerdictCard', () => ({
  VerdictCard: () => <div>VerdictCard</div>,
}));

vi.mock('@/components/ScoreBreakdown', () => ({
  ScoreBreakdown: () => <div>ScoreBreakdown</div>,
}));

vi.mock('@/components/AISummary', () => ({
  AISummary: ({ summary, score }: { summary: string; score: number }) => (
    <div data-testid="ai-summary">{summary}</div>
  ),
}));

describe('ResultsPage - AI Summary Duplication Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('fetches analysis only once on mount', async () => {
    vi.mocked(use).mockReturnValue({ username: 'testuser' });

    const mockResponse = {
      success: true,
      data: {
        username: 'testuser',
        avatarUrl: 'https://example.com/avatar.jpg',
        profileUrl: 'https://github.com/testuser',
        verdict: {
          tier: 'very-nice',
          score: 85,
          message: 'Nice work!',
          aiSummary: 'Test AI summary',
        },
        categories: [],
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockResponse,
    });

    render(<ResultsPage params={Promise.resolve({ username: 'testuser' })} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/analyze/testuser');
  });

  it('renders AI summary exactly once', async () => {
    vi.mocked(use).mockReturnValue({ username: 'testuser' });

    const mockResponse = {
      success: true,
      data: {
        username: 'testuser',
        avatarUrl: 'https://example.com/avatar.jpg',
        profileUrl: 'https://github.com/testuser',
        verdict: {
          tier: 'very-nice',
          score: 85,
          message: 'Nice work!',
          aiSummary: 'Test AI summary message',
        },
        categories: [],
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockResponse,
    });

    render(<ResultsPage params={Promise.resolve({ username: 'testuser' })} />);

    await waitFor(() => {
      const summaries = screen.getAllByText(/Test AI summary message/i);
      expect(summaries).toHaveLength(1);
    });
  });

  it('does not re-fetch when component re-renders', async () => {
    vi.mocked(use).mockReturnValue({ username: 'testuser' });

    const mockResponse = {
      success: true,
      data: {
        username: 'testuser',
        avatarUrl: 'https://example.com/avatar.jpg',
        profileUrl: 'https://github.com/testuser',
        verdict: {
          tier: 'very-nice',
          score: 85,
          message: 'Nice work!',
          aiSummary: 'Test summary',
        },
        categories: [],
      },
    };

    (global.fetch as any).mockResolvedValue({
      json: async () => mockResponse,
    });

    const { rerender } = render(
      <ResultsPage params={Promise.resolve({ username: 'testuser' })} />
    );

    await waitFor(() => screen.getByText(/Test summary/i));

    // Trigger re-render
    rerender(
      <ResultsPage params={Promise.resolve({ username: 'testuser' })} />
    );

    // Should still only have called fetch once
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('handles fetch errors gracefully', async () => {
    vi.mocked(use).mockReturnValue({ username: 'testuser' });

    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<ResultsPage params={Promise.resolve({ username: 'testuser' })} />);

    await waitFor(() => {
      expect(screen.getByText('Error: INTERNAL_ERROR')).toBeInTheDocument();
    });

    // Verify fetch was called only once even on error
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('handles API error responses', async () => {
    vi.mocked(use).mockReturnValue({ username: 'testuser' });

    const mockResponse = {
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockResponse,
    });

    render(<ResultsPage params={Promise.resolve({ username: 'testuser' })} />);

    await waitFor(() => {
      expect(screen.getByText('Error: USER_NOT_FOUND')).toBeInTheDocument();
    });

    // Verify fetch was called only once
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
