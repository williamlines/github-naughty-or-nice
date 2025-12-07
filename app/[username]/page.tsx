'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { AnalysisResponse, UserAnalysis, ErrorCode } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorState } from '@/components/ErrorState';
import { VerdictCard } from '@/components/VerdictCard';
import { ScoreBreakdown } from '@/components/ScoreBreakdown';
import { AISummary } from '@/components/AISummary';

export default function ResultsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserAnalysis | null>(null);
  const [error, setError] = useState<ErrorCode | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch(`/api/analyze/${username}`);
        const result: AnalysisResponse = await res.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error.code);
        }
      } catch {
        setError('INTERNAL_ERROR');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [username]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <LoadingSpinner />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <ErrorState code={error || 'INTERNAL_ERROR'} />
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Verdict Card */}
        <VerdictCard
          username={data.username}
          avatarUrl={data.avatarUrl}
          profileUrl={data.profileUrl}
          verdict={data.verdict}
        />

        {/* AI Summary */}
        <AISummary summary={data.verdict.aiSummary} />

        {/* Score Breakdown */}
        <ScoreBreakdown categories={data.categories} />

        {/* Actions */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition-colors"
          >
            Check Another Username
          </Link>
        </div>
      </div>
    </main>
  );
}

