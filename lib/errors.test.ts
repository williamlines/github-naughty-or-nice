import { describe, it, expect } from 'vitest';
import { AppError, GitHubError } from './errors';

describe('AppError', () => {
  it('creates error with default status code 500', () => {
    const error = new AppError('INTERNAL_ERROR', 'Something went wrong');

    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.message).toBe('Something went wrong');
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('AppError');
  });

  it('creates error with custom status code', () => {
    const error = new AppError('USER_NOT_FOUND', 'Not found', 404);

    expect(error.statusCode).toBe(404);
  });

  it('stores metadata', () => {
    const error = new AppError('RATE_LIMITED', 'Too many requests', 429, {
      retryAfter: 3600,
    });

    expect(error.meta).toEqual({ retryAfter: 3600 });
  });

  it('is instanceof Error', () => {
    const error = new AppError('INTERNAL_ERROR', 'Test');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('GitHubError', () => {
  it('creates error with 404 for USER_NOT_FOUND', () => {
    const error = new GitHubError('USER_NOT_FOUND', 'User not found');

    expect(error.code).toBe('USER_NOT_FOUND');
    expect(error.statusCode).toBe(404);
  });

  it('creates error with 429 for RATE_LIMITED', () => {
    const error = new GitHubError('RATE_LIMITED', 'Rate limit exceeded', {
      retryAfter: 1800,
    });

    expect(error.code).toBe('RATE_LIMITED');
    expect(error.statusCode).toBe(429);
    expect(error.meta).toEqual({ retryAfter: 1800 });
  });

  it('creates error with 502 for GITHUB_ERROR', () => {
    const error = new GitHubError('GITHUB_ERROR', 'API error');

    expect(error.code).toBe('GITHUB_ERROR');
    expect(error.statusCode).toBe(502);
  });

  it('defaults to 500 for unknown error codes', () => {
    const error = new GitHubError('INTERNAL_ERROR', 'Unknown error');

    expect(error.statusCode).toBe(500);
  });

  it('is instanceof AppError', () => {
    const error = new GitHubError('USER_NOT_FOUND', 'Not found');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(GitHubError);
  });
});

