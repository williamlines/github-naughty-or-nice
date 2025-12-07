import { ErrorCode } from '@/types';

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public meta?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class GitHubError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    meta?: Record<string, unknown>
  ) {
    const statusCodes: Record<string, number> = {
      USER_NOT_FOUND: 404,
      RATE_LIMITED: 429,
      GITHUB_ERROR: 502,
    };
    super(code, message, statusCodes[code] || 500, meta);
  }
}

