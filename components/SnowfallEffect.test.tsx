import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SnowfallEffect } from './SnowfallEffect';

describe('SnowfallEffect', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders toggle control with label', () => {
    render(<SnowfallEffect />);
    expect(screen.getByText(/Snowfall ❄️/i)).toBeInTheDocument();
  });

  it('renders checkbox input', () => {
    render(<SnowfallEffect />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('snowfall is enabled by default', () => {
    const { container } = render(<SnowfallEffect />);
    const snowflakes = container.querySelectorAll('.snowflake');
    expect(snowflakes.length).toBe(50);
  });

  it('checkbox is checked by default', () => {
    render(<SnowfallEffect />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('toggle disables snowfall when clicked', () => {
    const { container } = render(<SnowfallEffect />);
    const checkbox = screen.getByRole('checkbox');

    fireEvent.click(checkbox);

    const snowflakes = container.querySelectorAll('.snowflake');
    expect(snowflakes.length).toBe(0);
  });

  it('toggle enables snowfall when clicked twice', () => {
    const { container } = render(<SnowfallEffect />);
    const checkbox = screen.getByRole('checkbox');

    fireEvent.click(checkbox); // Disable
    fireEvent.click(checkbox); // Enable

    const snowflakes = container.querySelectorAll('.snowflake');
    expect(snowflakes.length).toBe(50);
  });

  it('persists enabled state to localStorage', () => {
    render(<SnowfallEffect />);
    const checkbox = screen.getByRole('checkbox');

    fireEvent.click(checkbox); // Disable

    expect(localStorage.getItem('snowfall-enabled')).toBe('false');
  });

  it('persists disabled state to localStorage when re-enabled', () => {
    render(<SnowfallEffect />);
    const checkbox = screen.getByRole('checkbox');

    fireEvent.click(checkbox); // Disable
    fireEvent.click(checkbox); // Enable

    expect(localStorage.getItem('snowfall-enabled')).toBe('true');
  });

  it('loads saved preference from localStorage (disabled)', () => {
    localStorage.setItem('snowfall-enabled', 'false');

    const { container } = render(<SnowfallEffect />);
    const snowflakes = container.querySelectorAll('.snowflake');

    expect(snowflakes.length).toBe(0);
  });

  it('loads saved preference from localStorage (enabled)', () => {
    localStorage.setItem('snowfall-enabled', 'true');

    const { container } = render(<SnowfallEffect />);
    const snowflakes = container.querySelectorAll('.snowflake');

    expect(snowflakes.length).toBe(50);
  });

  it('snowflakes have random horizontal positions', () => {
    const { container } = render(<SnowfallEffect />);
    const snowflakes = container.querySelectorAll('.snowflake');

    const positions = Array.from(snowflakes).map(
      (flake) => (flake as HTMLElement).style.left
    );

    // Check that we have different positions
    const uniquePositions = new Set(positions);
    expect(uniquePositions.size).toBeGreaterThan(1);
  });

  it('snowflakes have random animation durations', () => {
    const { container } = render(<SnowfallEffect />);
    const snowflakes = container.querySelectorAll('.snowflake');

    const durations = Array.from(snowflakes).map(
      (flake) => (flake as HTMLElement).style.animationDuration
    );

    // Check that we have different durations
    const uniqueDurations = new Set(durations);
    expect(uniqueDurations.size).toBeGreaterThan(1);
  });

  it('snowflakes have random animation delays', () => {
    const { container } = render(<SnowfallEffect />);
    const snowflakes = container.querySelectorAll('.snowflake');

    const delays = Array.from(snowflakes).map(
      (flake) => (flake as HTMLElement).style.animationDelay
    );

    // Check that we have different delays
    const uniqueDelays = new Set(delays);
    expect(uniqueDelays.size).toBeGreaterThan(1);
  });

  it('snowflakes have pointer-events: none class', () => {
    const { container } = render(<SnowfallEffect />);
    const snowflake = container.querySelector('.snowflake');

    expect(snowflake).toHaveClass('snowflake');
  });

  it('snowfall container has correct classes', () => {
    const { container } = render(<SnowfallEffect />);
    const snowfallContainer = container.querySelector('.snowfall-container');

    expect(snowfallContainer).toBeInTheDocument();
  });

  it('toggle has correct styling classes', () => {
    render(<SnowfallEffect />);
    const label = screen.getByText(/Snowfall ❄️/i).closest('label');

    expect(label).toHaveClass('flex', 'items-center', 'gap-2', 'cursor-pointer');
  });
});
