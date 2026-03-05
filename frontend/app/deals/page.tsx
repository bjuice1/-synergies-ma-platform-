'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDeals } from '@/hooks/useDeals';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCompactNumber } from '@/lib/utils';
import { Plus, ArrowRight, Building2 } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  active:    { label: 'Active',      dot: 'bg-orange-400',  text: 'text-orange-400' },
  draft:     { label: 'Draft',       dot: 'bg-slate-400',   text: 'text-slate-400' },
  closed:    { label: 'Closed',      dot: 'bg-emerald-400', text: 'text-emerald-400' },
  cancelled: { label: 'Cancelled',   dot: 'bg-red-400',     text: 'text-red-400' },
};

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/deals',     label: 'Deals',    active: true },
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
      <div className="flex min-h-screen items-center justify-center bg-[#0C0F1A]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!deals) return null;

  return (
    <div className="min-h-screen bg-[#0C0F1A]">

      {/* Top nav bar */}
      <header className="border-b border-white/8 bg-[#0E1220]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Wordmark */}
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-orange-500 rounded-full" />
              <span className="text-sm font-semibold text-white tracking-wide">SYNERGIES</span>
            </div>

            {/* Nav */}
            <nav className="flex items-center gap-1">
              {NAV_LINKS.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    link.active
                      ? 'text-orange-400 bg-orange-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
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
      <div className="border-b border-white/8 bg-[#0E1220]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">Deal Pipeline</p>
              <h1 className="text-2xl font-bold text-white">M&amp;A Transactions</h1>
              <p className="text-sm text-slate-400 mt-1">
                {deals.length} {deals.length === 1 ? 'transaction' : 'transactions'} · Benchmark-driven synergy analysis
              </p>
            </div>
            <Button
              onClick={() => router.push('/deals/new')}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium h-9 px-4"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Deal
            </Button>
          </div>
        </div>
      </div>

      {/* Deal pipeline table */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {deals.length === 0 ? (
          <div className="border border-white/8 bg-[#111827] rounded-xl p-16 text-center">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No transactions yet</h3>
            <p className="text-slate-400 text-sm mb-6">Create your first deal to begin synergy analysis</p>
            <Button
              onClick={() => router.push('/deals/new')}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Deal
            </Button>
          </div>
        ) : (
          <div className="border border-white/8 rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-6 py-3 bg-[#111827] border-b border-white/8">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deal Size</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Combined Rev.</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Close Date</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</span>
              <span />
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/5">
              {deals.map((deal) => {
                const status = STATUS_CONFIG[deal.status] || STATUS_CONFIG.draft;
                const combinedRev =
                  (deal.acquirer?.revenue_usd || 0) + (deal.target?.revenue_usd || 0);

                return (
                  <div
                    key={deal.id}
                    onClick={() => router.push(`/deals/${deal.id}`)}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-6 py-5 bg-[#0E1220] hover:bg-[#141929] transition-colors cursor-pointer group items-center"
                  >
                    {/* Transaction */}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate group-hover:text-orange-300 transition-colors">
                        {deal.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-slate-500 truncate">
                          {deal.acquirer?.name}
                        </span>
                        <span className="text-slate-700 text-xs">→</span>
                        <span className="text-xs text-slate-500 truncate">
                          {deal.target?.name}
                        </span>
                      </div>
                    </div>

                    {/* Deal size */}
                    <div>
                      {deal.deal_size_usd ? (
                        <span className="text-sm font-mono text-white">
                          {formatCompactNumber(deal.deal_size_usd)}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-600">—</span>
                      )}
                    </div>

                    {/* Combined revenue */}
                    <div>
                      {combinedRev > 0 ? (
                        <span className="text-sm font-mono text-slate-300">
                          {formatCompactNumber(combinedRev)}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-600">—</span>
                      )}
                    </div>

                    {/* Close date */}
                    <div>
                      {deal.close_date ? (
                        <span className="text-sm text-slate-300">
                          {new Date(deal.close_date).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short',
                          })}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-600">—</span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.dot}`} />
                      <span className={`text-xs font-medium ${status.text}`}>{status.label}</span>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-orange-400 transition-colors" />
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
