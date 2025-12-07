import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryRow } from './CategoryRow';
import { CategoryScore } from '@/types';

const mockScore: CategoryScore = {
  score: 75,
  quip: 'Looking good!',
  stats: { total: 10 },
};

describe('CategoryRow', () => {
  it('renders commit consistency category', () => {
    render(<CategoryRow id="commitConsistency" data={mockScore} />);
    expect(screen.getByText('📅')).toBeInTheDocument();
    expect(screen.getByText('Commit Consistency')).toBeInTheDocument();
  });

  it('renders message quality category', () => {
    render(<CategoryRow id="messageQuality" data={mockScore} />);
    expect(screen.getByText('📝')).toBeInTheDocument();
    expect(screen.getByText('Message Quality')).toBeInTheDocument();
  });

  it('renders PR hygiene category', () => {
    render(<CategoryRow id="prHygiene" data={mockScore} />);
    expect(screen.getByText('✂️')).toBeInTheDocument();
    expect(screen.getByText('PR Hygiene')).toBeInTheDocument();
  });

  it('renders review karma category', () => {
    render(<CategoryRow id="reviewKarma" data={mockScore} />);
    expect(screen.getByText('🤝')).toBeInTheDocument();
    expect(screen.getByText('Review Karma')).toBeInTheDocument();
  });

  it('renders issue citizenship category', () => {
    render(<CategoryRow id="issueCitizenship" data={mockScore} />);
    expect(screen.getByText('🧹')).toBeInTheDocument();
    expect(screen.getByText('Issue Citizenship')).toBeInTheDocument();
  });

  it('renders collaboration spirit category', () => {
    render(<CategoryRow id="collaborationSpirit" data={mockScore} />);
    expect(screen.getByText('🌍')).toBeInTheDocument();
    expect(screen.getByText('Collaboration Spirit')).toBeInTheDocument();
  });

  it('displays the score', () => {
    render(<CategoryRow id="commitConsistency" data={mockScore} />);
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('displays the quip', () => {
    render(<CategoryRow id="commitConsistency" data={mockScore} />);
    expect(screen.getByText('Looking good!')).toBeInTheDocument();
  });

  it('uses green color for high scores (>=70)', () => {
    render(<CategoryRow id="commitConsistency" data={{ ...mockScore, score: 85 }} />);
    const bar = document.querySelector('.bg-green-500');
    expect(bar).toBeInTheDocument();
  });

  it('uses yellow color for medium scores (40-69)', () => {
    render(<CategoryRow id="commitConsistency" data={{ ...mockScore, score: 50 }} />);
    const bar = document.querySelector('.bg-yellow-500');
    expect(bar).toBeInTheDocument();
  });

  it('uses red color for low scores (<40)', () => {
    render(<CategoryRow id="commitConsistency" data={{ ...mockScore, score: 25 }} />);
    const bar = document.querySelector('.bg-red-500');
    expect(bar).toBeInTheDocument();
  });

  it('sets correct width on progress bar', () => {
    render(<CategoryRow id="commitConsistency" data={{ ...mockScore, score: 60 }} />);
    const bar = document.querySelector('.bg-yellow-500');
    expect(bar).toHaveStyle({ width: '60%' });
  });
});

