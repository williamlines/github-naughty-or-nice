import type { ExternalPR, ExternalContributionSummary } from './github';

// ============ VERDICT SYSTEM ============

export type VerdictTier =
  | 'extremely-nice'
  | 'very-nice'
  | 'sort-of-nice'
  | 'borderline'
  | 'sort-of-naughty'
  | 'very-naughty'
  | 'extremely-naughty';

export interface Verdict {
  tier: VerdictTier;
  label: string;
  emoji: string;
  score: number;
  flavor: string;
  aiSummary: string;
}

// ============ SCORING CATEGORIES ============

export type CategoryId =
  | 'commitConsistency'
  | 'messageQuality'
  | 'prHygiene'
  | 'reviewKarma'
  | 'issueCitizenship'
  | 'collaborationSpirit';

export interface CategoryScore {
  score: number;
  quip: string;
  stats: Record<string, number | string>;
}

export type CategoryScores = Record<CategoryId, CategoryScore>;

// ============ USER ANALYSIS ============

export interface UserAnalysis {
  username: string;
  avatarUrl: string;
  profileUrl: string;
  analyzedAt: string;
  yearAnalyzed: number;
  hasActivity: boolean;
  verdict: Verdict;
  categories: CategoryScores;
  summary: {
    totalCommits: number;
    totalPRs: number;
    totalReviews: number;
    totalIssues: number;
    externalPRs: number;
    externalPRsMerged: number;
  };
  externalPRs: ExternalPR[];
  externalContributions: ExternalContributionSummary;
  dataCompleteness: {
    eventsLimited: boolean;
    reposAnalyzed: number;
    reposTotal: number;
    externalPRsFound: number;
    note?: string;
  };
}

// ============ API RESPONSE ============

export interface AnalysisSuccess {
  success: true;
  data: UserAnalysis;
}

export interface AnalysisError {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    retryAfter?: number;
  };
}

export type AnalysisResponse = AnalysisSuccess | AnalysisError;

export type ErrorCode =
  | 'USER_NOT_FOUND'
  | 'NO_ACTIVITY'
  | 'RATE_LIMITED'
  | 'GITHUB_ERROR'
  | 'OPENAI_ERROR'
  | 'INTERNAL_ERROR';
