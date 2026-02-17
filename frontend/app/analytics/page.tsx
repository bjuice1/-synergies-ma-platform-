'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSynergies } from '@/hooks/useSynergies';
import { StatusChart } from '@/components/charts/StatusChart';
import { IndustryChart } from '@/components/charts/IndustryChart';
import { ValueDistributionChart } from '@/components/charts/ValueDistributionChart';
import { StatCard } from '@/components/dashboard/StatCard';
import { formatCompactNumber } from '@/lib/utils';

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: synergies, isLoading: synergiesLoading } = useSynergies();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || synergiesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-pulse">
          <div className="h-8 w-8 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !synergies) {
    return null;
  }

  // Calculate analytics stats
  const totalValue = synergies.reduce((sum, s) => sum + (s.value_low + s.value_high) / 2, 0);
  const avgValue = synergies.length > 0 ? totalValue / synergies.length : 0;
  const highConfidenceCount = synergies.filter((s) => s.confidence_level === 'HIGH').length;
  const realizedCount = synergies.filter((s) => s.status === 'REALIZED').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-blue-500/20 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-emerald-500/20 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute w-96 h-96 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-violet-500/10 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-md bg-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Analytics</h1>
                <p className="text-sm text-gray-400 mt-1">
                  Advanced insights and visualizations
                </p>
              </div>
              <nav className="flex gap-4">
                <a
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Dashboard
                </a>
                <a
                  href="/synergies"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Synergies
                </a>
                <a
                  href="/analytics"
                  className="px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-lg"
                >
                  Analytics
                </a>
                <a
                  href="/chat"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  AI Chat
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Value"
              value={formatCompactNumber(totalValue)}
              description="Combined synergy value"
            />
            <StatCard
              title="Average Value"
              value={formatCompactNumber(avgValue)}
              description="Per synergy"
            />
            <StatCard
              title="High Confidence"
              value={highConfidenceCount}
              description={`${Math.round((highConfidenceCount / synergies.length) * 100)}% of total`}
            />
            <StatCard
              title="Realization Rate"
              value={`${Math.round((realizedCount / synergies.length) * 100)}%`}
              description={`${realizedCount} of ${synergies.length} realized`}
            />
          </div>

          {/* Charts Grid */}
          <div className="space-y-6">
            {/* Row 1: Status and Industry */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StatusChart synergies={synergies} />
              <IndustryChart synergies={synergies} />
            </div>

            {/* Row 2: Value Distribution */}
            <div className="grid grid-cols-1 gap-6">
              <ValueDistributionChart synergies={synergies} />
            </div>

            {/* Insights Card */}
            <div className="glass-card border-white/10 bg-white/5 backdrop-blur-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Key Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-emerald-400 font-medium mb-2">Portfolio Health</h4>
                  <p className="text-sm text-gray-300">
                    {realizedCount} synergies have been realized ({Math.round((realizedCount / synergies.length) * 100)}% success rate).
                    {synergies.filter((s) => s.status === 'IN_PROGRESS').length} synergies are currently in progress.
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-blue-400 font-medium mb-2">Confidence Distribution</h4>
                  <p className="text-sm text-gray-300">
                    {highConfidenceCount} high-confidence synergies worth {formatCompactNumber(
                      synergies.filter((s) => s.confidence_level === 'HIGH')
                        .reduce((sum, s) => sum + (s.value_low + s.value_high) / 2, 0)
                    )}.
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-purple-400 font-medium mb-2">Value at Risk</h4>
                  <p className="text-sm text-gray-300">
                    {synergies.filter((s) => s.status === 'AT_RISK').length} synergies are at risk, representing{' '}
                    {formatCompactNumber(
                      synergies.filter((s) => s.status === 'AT_RISK')
                        .reduce((sum, s) => sum + (s.value_low + s.value_high) / 2, 0)
                    )} in potential value.
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-amber-400 font-medium mb-2">Industry Focus</h4>
                  <p className="text-sm text-gray-300">
                    {Object.keys(synergies.reduce((acc, s) => ({ ...acc, [s.industry?.name || 'Uncategorized']: true }), {})).length}{' '}
                    industries represented in the portfolio.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
