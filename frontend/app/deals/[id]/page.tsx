'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useDeal } from '@/hooks/useDeals';
import { dealsApi } from '@/lib/api';
import { LeverCard } from '@/components/levers/LeverCard';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowLeft, TrendingUp, Database } from 'lucide-react';
import { formatCompactNumber } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/deals',     label: 'Deals' },
  { href: '/learn',     label: 'Learn' },
  { href: '/chat',      label: 'AI Chat' },
];

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
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || dealLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0C0F1A]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (dealError || !deal) {
    return (
      <div className="min-h-screen bg-[#0C0F1A] flex items-center justify-center">
        <div className="border border-red-500/20 bg-red-500/5 p-8 rounded-xl max-w-md text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Deal Not Found</h2>
          <p className="text-slate-400 mb-4">The deal you are looking for does not exist.</p>
          <Button onClick={() => router.push('/deals')} variant="outline" className="text-slate-300">
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
    <div className="min-h-screen bg-[#0C0F1A]">

      {/* Top nav */}
      <header className="border-b border-white/8 bg-[#0E1220]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/deals')}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-md transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-white/10" />
              <div className="w-1 h-6 bg-orange-500 rounded-full" />
              <span className="text-sm font-semibold text-white tracking-wide">SYNERGIES</span>
            </div>
            <nav className="flex items-center gap-1">
              {NAV_LINKS.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Deal header band */}
      <div className="border-b border-white/8 bg-[#0E1220]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1.5 capitalize">
            {deal.deal_type} &middot; {deal.status}
          </p>
          <h1 className="text-2xl font-bold text-white mb-5">{deal.name}</h1>

          <div className="flex items-center gap-10 flex-wrap">
            {deal.acquirer && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Acquirer</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                  <p className="text-sm font-semibold text-white">{deal.acquirer.name}</p>
                  {deal.acquirer.revenue_usd && (
                    <span className="text-xs text-slate-500 font-mono ml-1">
                      {formatCompactNumber(deal.acquirer.revenue_usd)} rev
                    </span>
                  )}
                </div>
              </div>
            )}
            {deal.target && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Target</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-sky-400" />
                  <p className="text-sm font-semibold text-white">{deal.target.name}</p>
                  {deal.target.revenue_usd && (
                    <span className="text-xs text-slate-500 font-mono ml-1">
                      {formatCompactNumber(deal.target.revenue_usd)} rev
                    </span>
                  )}
                </div>
              </div>
            )}
            {deal.deal_size_usd && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Deal Size</p>
                <p className="text-sm font-bold text-white font-mono">{formatCompactNumber(deal.deal_size_usd)}</p>
              </div>
            )}
            {deal.close_date && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Expected Close</p>
                <p className="text-sm font-semibold text-white">
                  {new Date(deal.close_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-8">

        {/* Synergy opportunity hero */}
        {summary && (
          <div className="rounded-xl border border-orange-500/25 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent p-6">
            <div className="flex items-start justify-between flex-wrap gap-6">
              <div>
                <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-3">
                  Cost Synergy Opportunity
                </p>
                <p className="text-5xl font-bold text-white font-mono tracking-tight leading-none">
                  {formatCompactNumber(summary.total_cost_synergy_low)}
                  <span className="text-slate-600 font-normal text-3xl mx-3">–</span>
                  {formatCompactNumber(summary.total_cost_synergy_high)}
                </p>
                <p className="text-sm text-slate-400 mt-3">
                  <span className="text-orange-400 font-semibold font-mono">
                    {summary.total_pct_low}–{summary.total_pct_high}%
                  </span>
                  {' '}of{' '}
                  <span className="font-mono text-slate-300">{formatCompactNumber(summary.combined_revenue)}</span>
                  {' '}combined revenue
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5 justify-end">
                  <Database className="w-3.5 h-3.5" />
                  Benchmark basis
                </p>
                <p className="text-4xl font-bold text-white">{summary.benchmark_n}</p>
                <p className="text-xs text-slate-500 mt-1">comparable transactions</p>
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
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-5 bg-orange-500 rounded-full" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Cost Levers</h2>
            </div>
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
          </section>
        ) : null}

        {/* Revenue levers */}
        {revenueLevers.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-5 bg-sky-500 rounded-full" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Revenue Levers</h2>
            </div>
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
          </section>
        )}

        {/* Empty state */}
        {!leversLoading && levers.length === 0 && (
          <div className="border border-white/8 bg-[#111827] rounded-xl p-12 text-center">
            <TrendingUp className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">No Lever Analysis Yet</h3>
            <p className="text-slate-400 text-sm">Upload client cost data to generate benchmark-driven analysis.</p>
          </div>
        )}

        {/* Strategic rationale */}
        {deal.strategic_rationale && (
          <section className="border border-white/8 bg-[#0E1220] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-5 bg-slate-700 rounded-full" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Strategic Rationale</h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-sm">{deal.strategic_rationale}</p>
          </section>
        )}

      </main>
    </div>
  );
}
