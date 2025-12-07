import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateEnv } from './env';

describe('validateEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws when GITHUB_TOKEN is missing', () => {
    delete process.env.GITHUB_TOKEN;
    process.env.OPENAI_API_KEY = 'sk-test';

    expect(() => validateEnv()).toThrow(
      'Missing environment variables: GITHUB_TOKEN'
    );
  });

  it('throws when OPENAI_API_KEY is missing', () => {
    process.env.GITHUB_TOKEN = 'ghp-test';
    delete process.env.OPENAI_API_KEY;

    expect(() => validateEnv()).toThrow(
      'Missing environment variables: OPENAI_API_KEY'
    );
  });

  it('throws when both are missing', () => {
    delete process.env.GITHUB_TOKEN;
    delete process.env.OPENAI_API_KEY;

    expect(() => validateEnv()).toThrow(
      'Missing environment variables: GITHUB_TOKEN, OPENAI_API_KEY'
    );
  });

  it('does not throw when all required vars are present', () => {
    process.env.GITHUB_TOKEN = 'ghp-test';
    process.env.OPENAI_API_KEY = 'sk-test';

    expect(() => validateEnv()).not.toThrow();
  });
});
