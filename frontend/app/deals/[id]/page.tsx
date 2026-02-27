'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useDeal } from '@/hooks/useDeals';
import { dealsApi } from '@/lib/api';
import { LeverCard } from '@/components/levers/LeverCard';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  ArrowLeft,
  Building2,
  DollarSign,
  Calendar,
  TrendingUp,
  Database,
} from 'lucide-react';
import { formatCompactNumber } from '@/lib/utils';

export default function DealDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const dealId = parseInt(params.id);

  const { data: deal, isLoading: dealLoading, error: dealError } = useDeal(dealId);

  const { data: leversData, isLoading: leversLoading } = useQuery({
    queryKey: ['deal-levers', dealId],
    queryFn: () => dealsApi.getLevers(dealId),
    enabled: !!dealId && isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || dealLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (dealError || !deal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="border border-red-500/20 bg-red-500/5 p-8 rounded-2xl max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">Deal Not Found</h2>
          <p className="text-gray-400 mb-4">The deal you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/deals')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Deals
          </Button>
        </div>
      </div>
    );
  }

  const summary = leversData?.summary;
  const levers = leversData?.levers ?? [];
  const costLevers = levers.filter(l => l.lever_type === 'cost');
  const revenueLevers = levers.filter(l => l.lever_type === 'revenue');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-blue-500/10 rounded-full mix-blend-screen filter blur-3xl animate-blob" />
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-emerald-500/10 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-md bg-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/deals')}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white">{deal.name}</h1>
                  <p className="text-sm text-gray-400 mt-0.5 capitalize">
                    {deal.deal_type} · {deal.status}
                  </p>
                </div>
              </div>
              <nav className="flex gap-2">
                <a href="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">Dashboard</a>
                <a href="/deals" className="px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-lg">Deals</a>
                <a href="/learn" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">Learn</a>
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* Deal overview strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {deal.deal_size_usd && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-400">Deal Size</span>
                </div>
                <p className="text-xl font-bold text-white font-mono">{formatCompactNumber(deal.deal_size_usd)}</p>
              </div>
            )}
            {deal.close_date && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-violet-400" />
                  <span className="text-xs text-gray-400">Expected Close</span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {new Date(deal.close_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                </p>
              </div>
            )}
            {deal.acquirer && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-gray-400">Acquirer</span>
                </div>
                <p className="text-sm font-semibold text-white truncate">{deal.acquirer.name}</p>
                {deal.acquirer.revenue_usd && (
                  <p className="text-xs text-gray-500 mt-0.5">{formatCompactNumber(deal.acquirer.revenue_usd)} revenue</p>
                )}
              </div>
            )}
            {deal.target && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-400">Target</span>
                </div>
                <p className="text-sm font-semibold text-white truncate">{deal.target.name}</p>
                {deal.target.revenue_usd && (
                  <p className="text-xs text-gray-500 mt-0.5">{formatCompactNumber(deal.target.revenue_usd)} revenue</p>
                )}
              </div>
            )}
          </div>

          {/* Synergy opportunity summary banner */}
          {summary && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-lg font-bold text-white">Cost Synergy Opportunity</h2>
                  </div>
                  <p className="text-4xl font-bold text-white font-mono mt-2">
                    {formatCompactNumber(summary.total_cost_synergy_low)}
                    <span className="text-gray-500 font-normal text-2xl"> – </span>
                    {formatCompactNumber(summary.total_cost_synergy_high)}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {summary.total_pct_low}–{summary.total_pct_high}% of combined revenue
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 justify-end mb-1">
                    <Database className="w-3.5 h-3.5" />
                    <span>Benchmark basis</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{summary.benchmark_n}</p>
                  <p className="text-xs text-gray-400">comparable transactions</p>
                  {summary.combined_revenue > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Combined revenue: {formatCompactNumber(summary.combined_revenue)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cost levers */}
          {leversLoading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : costLevers.length > 0 ? (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
                Cost Levers
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {costLevers.map((lever) => (
                  <LeverCard
                    key={lever.id}
                    lever={lever}
                    combinedRevenue={summary?.combined_revenue ?? 0}
                    benchmarkN={summary?.benchmark_n ?? 0}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {/* Revenue levers */}
          {revenueLevers.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
                Revenue Levers
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {revenueLevers.map((lever) => (
                  <LeverCard
                    key={lever.id}
                    lever={lever}
                    combinedRevenue={summary?.combined_revenue ?? 0}
                    benchmarkN={summary?.benchmark_n ?? 0}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No levers state */}
          {!leversLoading && levers.length === 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Lever Analysis Yet</h3>
              <p className="text-gray-400 text-sm">
                Upload client cost data to generate benchmark-driven synergy lever analysis.
              </p>
            </div>
          )}

          {/* Strategic rationale */}
          {deal.strategic_rationale && (
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Strategic Rationale</h3>
              <p className="text-gray-300 leading-relaxed">{deal.strategic_rationale}</p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
