import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AISummary } from './AISummary';

describe('AISummary', () => {
  it('renders the section title', () => {
    render(<AISummary summary="Test summary" />);
    expect(screen.getByText('🎅 Santa Says...')).toBeInTheDocument();
  });

  it('renders the summary text', () => {
    render(<AISummary summary="You have been very nice this year!" />);
    expect(
      screen.getByText(/You have been very nice this year!/i)
    ).toBeInTheDocument();
  });

  it('renders in a blockquote', () => {
    render(<AISummary summary="Test" />);
    const blockquote = document.querySelector('blockquote');
    expect(blockquote).toBeInTheDocument();
  });

  it('applies italic styling to the quote', () => {
    render(<AISummary summary="Test" />);
    const blockquote = document.querySelector('blockquote');
    expect(blockquote).toHaveClass('italic');
  });

  it('has the correct container styling', () => {
    const { container } = render(<AISummary summary="Test" />);
    const card = container.firstChild;
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('rounded-2xl');
    expect(card).toHaveClass('border-2');
  });

  it('handles long summaries', () => {
    const longSummary =
      'This is a very long summary that goes on and on. '.repeat(10);
    render(<AISummary summary={longSummary} />);
    expect(screen.getByText(new RegExp(longSummary.slice(0, 50)))).toBeInTheDocument();
  });

  it('handles special characters in summary', () => {
    render(<AISummary summary="Great job @testuser! You're #1 🎄" />);
    expect(
      screen.getByText(/Great job @testuser! You're #1 🎄/i)
    ).toBeInTheDocument();
  });
});

