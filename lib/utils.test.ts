import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn (className helper)', () => {
  it('merges multiple class names', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const result = cn('base', true && 'included', false && 'excluded');
    expect(result).toBe('base included');
  });

  it('handles array of classes', () => {
    const result = cn(['foo', 'bar']);
    expect(result).toBe('foo bar');
  });

  it('merges tailwind classes correctly (last wins)', () => {
    const result = cn('p-2', 'p-4');
    expect(result).toBe('p-4');
  });

  it('handles undefined and null gracefully', () => {
    const result = cn('base', undefined, null, 'end');
    expect(result).toBe('base end');
  });

  it('handles empty string', () => {
    const result = cn('');
    expect(result).toBe('');
  });

  it('handles complex tailwind merges', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('preserves non-conflicting classes', () => {
    const result = cn('font-bold', 'text-lg', 'mt-4');
    expect(result).toBe('font-bold text-lg mt-4');
  });
});

