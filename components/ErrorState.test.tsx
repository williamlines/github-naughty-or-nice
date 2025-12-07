import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('renders USER_NOT_FOUND error correctly', () => {
    render(<ErrorState code="USER_NOT_FOUND" />);
    expect(
      screen.getByText("Hmm, Santa can't find that username")
    ).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure they exist on GitHub?')
    ).toBeInTheDocument();
  });

  it('renders NO_ACTIVITY error correctly', () => {
    render(<ErrorState code="NO_ACTIVITY" />);
    expect(
      screen.getByText('This account has been very quiet...')
    ).toBeInTheDocument();
  });

  it('renders RATE_LIMITED error correctly', () => {
    render(<ErrorState code="RATE_LIMITED" />);
    expect(
      screen.getByText('The elves are overwhelmed!')
    ).toBeInTheDocument();
  });

  it('renders GITHUB_ERROR error correctly', () => {
    render(<ErrorState code="GITHUB_ERROR" />);
    expect(
      screen.getByText("GitHub's workshop is closed")
    ).toBeInTheDocument();
  });

  it('renders OPENAI_ERROR error correctly', () => {
    render(<ErrorState code="OPENAI_ERROR" />);
    expect(screen.getByText('Santa lost his glasses')).toBeInTheDocument();
  });

  it('renders INTERNAL_ERROR error correctly', () => {
    render(<ErrorState code="INTERNAL_ERROR" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('displays the error emoji', () => {
    render(<ErrorState code="INTERNAL_ERROR" />);
    expect(screen.getByText('😅')).toBeInTheDocument();
  });

  it('renders a link to try another username', () => {
    render(<ErrorState code="USER_NOT_FOUND" />);
    const link = screen.getByRole('link', { name: /try another username/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});

