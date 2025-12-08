import { NextResponse } from 'next/server';
import { fetchUserData } from '@/lib/github';
import {
  calculateAllScores,
  calculateOverallScore,
  getVerdictTier,
  getVerdictDetails,
} from '@/lib/scoring';
import { generateAIVerdict } from '@/lib/ai';
import { AppError } from '@/lib/errors';
import { UserAnalysis, AnalysisResponse } from '@/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // Validate username
  const usernamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
  if (!username || !usernamePattern.test(username)) {
    return NextResponse.json<AnalysisResponse>(
      {
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Invalid username format' },
      },
      { status: 400 }
    );
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new AppError('INTERNAL_ERROR', 'GitHub token not configured', 500);
    }

    // Fetch GitHub data
    const data = await fetchUserData(username, token);

    // Calculate scores (including external contributions)
    const categories = calculateAllScores(
      data.commits,
      data.pullRequests,
      data.reviewCount,
      data.issues,
      data.events,
      username,
      data.externalPRs,
      data.externalContributions
    );

    const overallScore = calculateOverallScore(categories);
    const verdictTier = getVerdictTier(overallScore);
    const verdictDetails = getVerdictDetails(verdictTier);

    // Check if user has activity
    const hasActivity =
      data.commits.length > 0 ||
      data.pullRequests.length > 0 ||
      data.events.length > 0;

    // Generate AI verdict
    const summary = {
      totalCommits: data.commits.length,
      totalPRs: data.pullRequests.length,
      totalReviews: data.reviewCount,
      totalIssues: data.issues.length,
      externalPRs: data.externalPRs.filter((pr) => pr.isExternal).length,
      externalPRsMerged: data.externalPRs.filter(
        (pr) => pr.isExternal && pr.merged_at !== null
      ).length,
    };

    const aiSummary = await generateAIVerdict({
      username,
      overallScore,
      verdictTier,
      categories,
      summary,
    });

    // Build response
    const analysis: UserAnalysis = {
      username: data.user.login,
      avatarUrl: data.user.avatar_url,
      profileUrl: data.user.html_url,
      analyzedAt: new Date().toISOString(),
      yearAnalyzed: new Date().getFullYear(),
      hasActivity,
      verdict: {
        tier: verdictTier,
        label: verdictDetails.label,
        emoji: verdictDetails.emoji,
        score: overallScore,
        flavor: verdictDetails.flavor,
        aiSummary,
      },
      categories,
      summary,
      externalPRs: data.externalPRs,
      externalContributions: data.externalContributions,
      dataCompleteness: data.dataCompleteness,
    };

    return NextResponse.json<AnalysisResponse>({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Analysis error:', error);

    if (error instanceof AppError) {
      return NextResponse.json<AnalysisResponse>(
        {
          success: false,
          error: { code: error.code, message: error.message, ...error.meta },
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json<AnalysisResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
