import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreBreakdown } from './ScoreBreakdown';
import { CategoryScores } from '@/types';

const mockCategories: CategoryScores = {
  commitConsistency: { score: 80, quip: 'Steady', stats: {} },
  messageQuality: { score: 70, quip: 'Clear', stats: {} },
  prHygiene: { score: 60, quip: 'Decent', stats: {} },
  reviewKarma: { score: 50, quip: 'Helpful', stats: {} },
  issueCitizenship: { score: 40, quip: 'Present', stats: {} },
  collaborationSpirit: { score: 30, quip: 'Solo', stats: {} },
};

describe('ScoreBreakdown', () => {
  it('renders the section title', () => {
    render(<ScoreBreakdown categories={mockCategories} />);
    expect(screen.getByText('Score Breakdown')).toBeInTheDocument();
  });

  it('renders all 6 categories', () => {
    render(<ScoreBreakdown categories={mockCategories} />);
    expect(screen.getByText('Commit Consistency')).toBeInTheDocument();
    expect(screen.getByText('Message Quality')).toBeInTheDocument();
    expect(screen.getByText('PR Hygiene')).toBeInTheDocument();
    expect(screen.getByText('Review Karma')).toBeInTheDocument();
    expect(screen.getByText('Issue Citizenship')).toBeInTheDocument();
    expect(screen.getByText('Collaboration Spirit')).toBeInTheDocument();
  });

  it('renders all category icons', () => {
    render(<ScoreBreakdown categories={mockCategories} />);
    expect(screen.getByText('📅')).toBeInTheDocument();
    expect(screen.getByText('📝')).toBeInTheDocument();
    expect(screen.getByText('✂️')).toBeInTheDocument();
    expect(screen.getByText('🤝')).toBeInTheDocument();
    expect(screen.getByText('🧹')).toBeInTheDocument();
    expect(screen.getByText('🌍')).toBeInTheDocument();
  });

  it('renders all scores', () => {
    render(<ScoreBreakdown categories={mockCategories} />);
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('renders all quips', () => {
    render(<ScoreBreakdown categories={mockCategories} />);
    expect(screen.getByText('Steady')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.getByText('Decent')).toBeInTheDocument();
    expect(screen.getByText('Helpful')).toBeInTheDocument();
    expect(screen.getByText('Present')).toBeInTheDocument();
    expect(screen.getByText('Solo')).toBeInTheDocument();
  });

  it('has the correct container styling', () => {
    const { container } = render(<ScoreBreakdown categories={mockCategories} />);
    const card = container.firstChild;
    expect(card).toHaveClass('bg-white/5');
    expect(card).toHaveClass('rounded-2xl');
  });
});

