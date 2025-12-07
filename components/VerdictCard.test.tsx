import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VerdictCard } from './VerdictCard';
import { Verdict } from '@/types';

const mockVerdict: Verdict = {
  tier: 'very-nice',
  label: 'Very Nice!',
  emoji: '🎄',
  score: 75,
  flavor: 'Making spirits bright',
  aiSummary: 'Great work this year!',
};

const defaultProps = {
  username: 'testuser',
  avatarUrl: 'https://avatars.githubusercontent.com/u/12345',
  profileUrl: 'https://github.com/testuser',
  verdict: mockVerdict,
};

describe('VerdictCard', () => {
  it('renders the username', () => {
    render(<VerdictCard {...defaultProps} />);
    expect(screen.getByText('@testuser')).toBeInTheDocument();
  });

  it('renders the verdict emoji', () => {
    render(<VerdictCard {...defaultProps} />);
    expect(screen.getByText('🎄')).toBeInTheDocument();
  });

  it('renders the verdict label', () => {
    render(<VerdictCard {...defaultProps} />);
    expect(screen.getByText('Very Nice!')).toBeInTheDocument();
  });

  it('renders the score', () => {
    render(<VerdictCard {...defaultProps} />);
    expect(screen.getByText('75/100')).toBeInTheDocument();
  });

  it('renders the flavor text', () => {
    render(<VerdictCard {...defaultProps} />);
    expect(screen.getByText('Making spirits bright')).toBeInTheDocument();
  });

  it('renders the avatar image', () => {
    render(<VerdictCard {...defaultProps} />);
    const img = screen.getByAltText('testuser');
    expect(img).toBeInTheDocument();
  });

  it('links to the GitHub profile', () => {
    render(<VerdictCard {...defaultProps} />);
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', 'https://github.com/testuser');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('renders different scores correctly', () => {
    render(
      <VerdictCard
        {...defaultProps}
        verdict={{ ...mockVerdict, score: 42 }}
      />
    );
    expect(screen.getByText('42/100')).toBeInTheDocument();
  });
});

