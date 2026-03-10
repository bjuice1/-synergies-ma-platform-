'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDeals } from '@/hooks/useDeals';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCompactNumber } from '@/lib/utils';
import { Plus, ArrowRight, Building2, TrendingUp } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  active:    { label: 'Active',    dot: 'bg-orange-500',  text: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  draft:     { label: 'Draft',     dot: 'bg-gray-400',    text: 'text-gray-600',   bg: 'bg-gray-100 border-gray-200' },
  closed:    { label: 'Closed',    dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  cancelled: { label: 'Cancelled', dot: 'bg-red-500',     text: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
};

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/deals',     label: 'Deals', active: true },
  { href: '/learn',     label: 'Learn' },
  { href: '/chat',      label: 'AI Chat' },
];

export default function DealsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: deals, isLoading: dealsLoading } = useDeals();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || dealsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!deals) return null;

  // Portfolio summary
  const activeDeals   = deals.filter(d => d.status === 'active' || d.status === 'draft');
  const totalSynLow   = deals.reduce((s, d) => s + (d.total_value_low  || 0), 0);
  const totalSynHigh  = deals.reduce((s, d) => s + (d.total_value_high || 0), 0);
  const maxHigh       = Math.max(...deals.map(d => d.total_value_high || 0), 1);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top nav */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-[#D04A02] rounded-full" />
              <span className="text-sm font-semibold text-gray-900 tracking-wide">SYNERGIES</span>
            </div>
            <nav className="flex items-center gap-1">
              {NAV_LINKS.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    link.active
                      ? 'text-[#D04A02] bg-orange-50'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Page header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold text-[#D04A02] uppercase tracking-widest mb-1">Deal Pipeline</p>
              <h1 className="text-2xl font-bold text-gray-900">M&amp;A Transactions</h1>
              <p className="text-sm text-gray-500 mt-1">
                {activeDeals.length} active · {deals.length} total · Benchmark-driven synergy analysis
              </p>
            </div>
            <Button
              onClick={() => router.push('/deals/new')}
              className="bg-[#D04A02] hover:bg-orange-700 text-white text-sm font-medium h-9 px-4"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Deal
            </Button>
          </div>

          {/* Portfolio bar */}
          {totalSynHigh > 0 && (
            <div className="mt-5 flex items-center gap-6 pt-5 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Portfolio synergy opportunity</p>
                <p className="text-2xl font-bold text-gray-900 font-mono tabular-nums">
                  {formatCompactNumber(totalSynLow)}
                  <span className="text-gray-300 font-normal mx-1.5 text-lg">–</span>
                  {formatCompactNumber(totalSynHigh)}
                </p>
              </div>
              <div className="text-gray-200 text-xl font-light">|</div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{deals.length}</p>
              </div>
              <div className="text-gray-200 text-xl font-light">|</div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Active deals</p>
                <p className="text-2xl font-bold text-gray-900">{activeDeals.length}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deal table */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {deals.length === 0 ? (
          <div className="border border-gray-200 bg-white rounded-xl p-16 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
            <p className="text-gray-500 text-sm mb-6">Create your first deal to begin synergy analysis</p>
            <Button
              onClick={() => router.push('/deals/new')}
              className="bg-[#D04A02] hover:bg-orange-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Deal
            </Button>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_2fr_1fr_40px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deal Size</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Combined Rev.</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" />
                Synergy Opportunity
              </span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</span>
              <span />
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-100">
              {deals.map((deal) => {
                const status = STATUS_CONFIG[deal.status] || STATUS_CONFIG.draft;
                const combinedRev = (deal.acquirer?.revenue_usd || 0) + (deal.target?.revenue_usd || 0);
                const synHigh = deal.total_value_high || 0;
                const synLow  = deal.total_value_low  || 0;
                const barPct  = maxHigh > 0 ? (synHigh / maxHigh) * 100 : 0;
                const synPct  = combinedRev > 0 && synHigh > 0
                  ? ((synLow + synHigh) / 2 / combinedRev * 100).toFixed(1)
                  : null;

                return (
                  <div
                    key={deal.id}
                    onClick={() => router.push(`/deals/${deal.id}`)}
                    className="grid grid-cols-[2fr_1fr_1fr_2fr_1fr_40px] gap-4 px-6 py-5 hover:bg-orange-50 transition-colors cursor-pointer group items-center"
                  >
                    {/* Transaction */}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#D04A02] transition-colors">
                        {deal.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-gray-500 truncate max-w-[120px]">{deal.acquirer?.name}</span>
                        <span className="text-gray-300 text-xs flex-shrink-0">→</span>
                        <span className="text-xs text-gray-500 truncate max-w-[120px]">{deal.target?.name}</span>
                      </div>
                    </div>

                    {/* Deal size */}
                    <div>
                      {deal.deal_size_usd ? (
                        <span className="text-sm font-mono text-gray-900">{formatCompactNumber(deal.deal_size_usd)}</span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>

                    {/* Combined rev */}
                    <div>
                      {combinedRev > 0 ? (
                        <span className="text-sm font-mono text-gray-700">{formatCompactNumber(combinedRev)}</span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>

                    {/* Synergy opportunity */}
                    <div className="min-w-0">
                      {synHigh > 0 ? (
                        <>
                          <div className="flex items-baseline gap-2 mb-1.5">
                            <span className="text-sm font-semibold text-gray-900 font-mono tabular-nums">
                              {formatCompactNumber(synLow)}
                              <span className="text-gray-400 font-normal text-xs mx-1">–</span>
                              {formatCompactNumber(synHigh)}
                            </span>
                            {synPct && (
                              <span className="text-xs text-[#D04A02] font-medium">~{synPct}% rev</span>
                            )}
                          </div>
                          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#D04A02] opacity-60 rounded-full transition-all"
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.dot}`} />
                        {status.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#D04A02] transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
