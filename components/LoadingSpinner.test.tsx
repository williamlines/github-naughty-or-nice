import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders the spinner element', () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('displays the loading message', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Consulting the elves...')).toBeInTheDocument();
  });

  it('has correct styling classes', () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('border-green-500');
    expect(spinner).toHaveClass('rounded-full');
  });
});

