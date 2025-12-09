import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the spinner element', () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders first message initially', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Checking your commits...')).toBeInTheDocument();
  });

  it('rotates to second message after 2.5 seconds', async () => {
    render(<LoadingSpinner />);
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.getByText('Reviewing your PRs...')).toBeInTheDocument();
  });

  it('rotates to third message after 5 seconds', async () => {
    render(<LoadingSpinner />);
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('Consulting the elves...')).toBeInTheDocument();
  });

  it('cycles back to first message after all three', async () => {
    render(<LoadingSpinner />);
    await act(async () => {
      vi.advanceTimersByTime(7500);
    });
    expect(screen.getByText('Checking your commits...')).toBeInTheDocument();
  });

  it('cleans up interval on unmount', () => {
    const { unmount } = render(<LoadingSpinner />);
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('spinner element is always visible', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('border-[#8b181d]');
    expect(spinner).toHaveClass('rounded-full');
  });
});

