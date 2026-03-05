'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDeals } from '@/hooks/useDeals';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCompactNumber } from '@/lib/utils';
import { ArrowRight, Building2, Plus, TrendingUp, Activity } from 'lucide-react';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', active: true },
  { href: '/deals',     label: 'Deals' },
  { href: '/learn',     label: 'Learn' },
  { href: '/chat',      label: 'AI Chat' },
];

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  active:    { label: 'Active',    dot: 'bg-orange-400', text: 'text-orange-400' },
  draft:     { label: 'Draft',     dot: 'bg-slate-400',  text: 'text-slate-400' },
  closed:    { label: 'Closed',    dot: 'bg-emerald-400',text: 'text-emerald-400' },
  cancelled: { label: 'Cancelled', dot: 'bg-red-400',    text: 'text-red-400' },
};

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
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

  if (!isAuthenticated || !deals) return null;

  // Stats derived from deal pipeline
  const activeDeals   = deals.filter(d => d.status === 'active');
  const totalDealSize = deals.reduce((sum, d) => sum + (d.deal_size_usd || 0), 0);
  const totalCombinedRev = deals.reduce((sum, d) => {
    return sum + (d.acquirer?.revenue_usd || 0) + (d.target?.revenue_usd || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[#0C0F1A]">

      {/* Top nav */}
      <header className="border-b border-white/8 bg-[#0E1220]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-orange-500 rounded-full" />
              <span className="text-sm font-semibold text-white tracking-wide">SYNERGIES</span>
            </div>
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
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">
            Overview
          </p>
          <h1 className="text-2xl font-bold text-white">
            {user?.first_name ? `Welcome back, ${user.first_name}` : 'Dashboard'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">M&A synergy analysis platform</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-8">

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-white/8 bg-[#0E1220] p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Transactions</p>
            <p className="text-4xl font-bold text-white tabular-nums">{deals.length}</p>
            <p className="text-xs text-slate-500 mt-2">Total in pipeline</p>
          </div>
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5">
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-3">Active</p>
            <p className="text-4xl font-bold text-white tabular-nums">{activeDeals.length}</p>
            <p className="text-xs text-slate-500 mt-2">In progress</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-[#0E1220] p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Total Deal Value</p>
            <p className="text-3xl font-bold text-white font-mono tabular-nums">
              {totalDealSize > 0 ? formatCompactNumber(totalDealSize) : '—'}
            </p>
            <p className="text-xs text-slate-500 mt-2">Aggregate deal size</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-[#0E1220] p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Combined Revenue</p>
            <p className="text-3xl font-bold text-white font-mono tabular-nums">
              {totalCombinedRev > 0 ? formatCompactNumber(totalCombinedRev) : '—'}
            </p>
            <p className="text-xs text-slate-500 mt-2">Across all entities</p>
          </div>
        </div>

        {/* Recent deals */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-orange-500 rounded-full" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Deal Pipeline</h2>
            </div>
            <button
              onClick={() => router.push('/deals')}
              className="text-xs text-slate-500 hover:text-orange-400 transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {deals.length === 0 ? (
            <div className="border border-white/8 bg-[#111827] rounded-xl p-12 text-center">
              <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white mb-1">No deals yet</h3>
              <p className="text-slate-400 text-sm mb-5">Create your first transaction to start synergy analysis</p>
              <button
                onClick={() => router.push('/deals/new')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> New Deal
              </button>
            </div>
          ) : (
            <div className="border border-white/8 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_32px] gap-4 px-6 py-3 bg-[#111827] border-b border-white/8">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deal Size</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Combined Rev.</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Close Date</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</span>
                <span />
              </div>
              {/* Rows */}
              <div className="divide-y divide-white/5">
                {deals.slice(0, 5).map((deal) => {
                  const status = STATUS_CONFIG[deal.status] || STATUS_CONFIG.draft;
                  const combinedRev = (deal.acquirer?.revenue_usd || 0) + (deal.target?.revenue_usd || 0);
                  return (
                    <div
                      key={deal.id}
                      onClick={() => router.push(`/deals/${deal.id}`)}
                      className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_32px] gap-4 px-6 py-4 bg-[#0E1220] hover:bg-[#141929] transition-colors cursor-pointer group items-center"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate group-hover:text-orange-300 transition-colors">
                          {deal.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 truncate">{deal.acquirer?.name}</span>
                          <span className="text-slate-700 text-xs">→</span>
                          <span className="text-xs text-slate-500 truncate">{deal.target?.name}</span>
                        </div>
                      </div>
                      <div>
                        {deal.deal_size_usd ? (
                          <span className="text-sm font-mono text-white">{formatCompactNumber(deal.deal_size_usd)}</span>
                        ) : (
                          <span className="text-sm text-slate-600">—</span>
                        )}
                      </div>
                      <div>
                        {combinedRev > 0 ? (
                          <span className="text-sm font-mono text-slate-300">{formatCompactNumber(combinedRev)}</span>
                        ) : (
                          <span className="text-sm text-slate-600">—</span>
                        )}
                      </div>
                      <div>
                        {deal.close_date ? (
                          <span className="text-sm text-slate-300">
                            {new Date(deal.close_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-600">—</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.dot}`} />
                        <span className={`text-xs font-medium ${status.text}`}>{status.label}</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-orange-400 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Quick actions */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-5 bg-slate-700 rounded-full" />
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/deals/new')}
              className="flex items-center gap-3 p-4 rounded-xl border border-white/8 bg-[#0E1220] hover:border-orange-500/30 hover:bg-orange-500/5 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Plus className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-orange-300 transition-colors">New Deal</p>
                <p className="text-xs text-slate-500">Start synergy analysis</p>
              </div>
            </button>
            <button
              onClick={() => router.push('/learn')}
              className="flex items-center gap-3 p-4 rounded-xl border border-white/8 bg-[#0E1220] hover:border-white/20 hover:bg-white/3 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Lever Playbooks</p>
                <p className="text-xs text-slate-500">Methodology workspace</p>
              </div>
            </button>
            <button
              onClick={() => router.push('/chat')}
              className="flex items-center gap-3 p-4 rounded-xl border border-white/8 bg-[#0E1220] hover:border-white/20 hover:bg-white/3 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">AI Chat</p>
                <p className="text-xs text-slate-500">Ask about lever methodology</p>
              </div>
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}
