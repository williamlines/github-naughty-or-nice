import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AISummary } from './AISummary';

describe('AISummary', () => {
  describe('Santa mode (score >= 50)', () => {
    it('renders Santa section title', () => {
      render(<AISummary summary="Test summary" score={50} />);
      expect(screen.getByText('🎅 Santa Says...')).toBeInTheDocument();
    });

    it('renders the summary text', () => {
      render(<AISummary summary="You have been very nice this year!" score={85} />);
      expect(
        screen.getByText(/You have been very nice this year!/i)
      ).toBeInTheDocument();
    });
  });

  describe('Krampus mode (score < 50)', () => {
    it('renders Krampus section title for low scores', () => {
      render(<AISummary summary="Test summary" score={49} />);
      expect(screen.getByText('😈 Krampus Says...')).toBeInTheDocument();
    });

    it('renders Krampus for score 0', () => {
      render(<AISummary summary="You've been naughty!" score={0} />);
      expect(screen.getByText('😈 Krampus Says...')).toBeInTheDocument();
    });

    it('renders the summary text in Krampus mode', () => {
      render(<AISummary summary="Coal for you this year!" score={25} />);
      expect(
        screen.getByText(/Coal for you this year!/i)
      ).toBeInTheDocument();
    });
  });

  describe('Common functionality', () => {
    it('renders in a blockquote', () => {
      render(<AISummary summary="Test" score={70} />);
      const blockquote = document.querySelector('blockquote');
      expect(blockquote).toBeInTheDocument();
    });

    it('applies italic styling to the quote', () => {
      render(<AISummary summary="Test" score={70} />);
      const blockquote = document.querySelector('blockquote');
      expect(blockquote).toHaveClass('italic');
    });

    it('has the correct container styling', () => {
      const { container } = render(<AISummary summary="Test" score={70} />);
      const card = container.firstChild;
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('rounded-2xl');
      expect(card).toHaveClass('border-2');
    });

    it('handles long summaries', () => {
      const longSummary =
        'This is a very long summary that goes on and on. '.repeat(10);
      render(<AISummary summary={longSummary} score={70} />);
      expect(screen.getByText(new RegExp(longSummary.slice(0, 50)))).toBeInTheDocument();
    });

    it('handles special characters in summary', () => {
      render(<AISummary summary="Great job @testuser! You're #1 🎄" score={70} />);
      expect(
        screen.getByText(/Great job @testuser! You're #1 🎄/i)
      ).toBeInTheDocument();
    });
  });
});

