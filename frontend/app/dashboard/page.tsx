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
  active:    { label: 'Active',    dot: 'bg-orange-500', text: 'text-orange-600' },
  draft:     { label: 'Draft',     dot: 'bg-gray-400',   text: 'text-gray-500' },
  closed:    { label: 'Closed',    dot: 'bg-emerald-500',text: 'text-emerald-600' },
  cancelled: { label: 'Cancelled', dot: 'bg-red-500',    text: 'text-red-600' },
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !deals) return null;

  const activeDeals      = deals.filter(d => d.status === 'active' || d.status === 'draft');
  const totalDealSize    = deals.reduce((sum, d) => sum + (d.deal_size_usd || 0), 0);
  const totalSynLow      = deals.reduce((sum, d) => sum + (d.total_value_low  || 0), 0);
  const totalSynHigh     = deals.reduce((sum, d) => sum + (d.total_value_high || 0), 0);
  const maxHigh          = Math.max(...deals.map(d => d.total_value_high || 0), 1);

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
          <p className="text-xs font-semibold text-[#D04A02] uppercase tracking-widest mb-1">Overview</p>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.first_name ? `Welcome back, ${user.first_name}` : 'Dashboard'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">M&A synergy analysis platform</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-8">

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Transactions</p>
            <p className="text-4xl font-bold text-gray-900 tabular-nums">{deals.length}</p>
            <p className="text-xs text-gray-500 mt-2">{activeDeals.length} active</p>
          </div>
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
            <p className="text-xs font-semibold text-[#D04A02] uppercase tracking-wider mb-3">Total Deal Value</p>
            <p className="text-3xl font-bold text-gray-900 font-mono tabular-nums">
              {totalDealSize > 0 ? formatCompactNumber(totalDealSize) : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-2">Aggregate EV</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Synergy Low</p>
            <p className="text-3xl font-bold text-gray-900 font-mono tabular-nums">
              {totalSynLow > 0 ? formatCompactNumber(totalSynLow) : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-2">Portfolio floor estimate</p>
          </div>
          <div className="rounded-xl border border-[#D04A02]/20 bg-orange-50/50 p-5">
            <p className="text-xs font-semibold text-[#D04A02] uppercase tracking-wider mb-3">Synergy High</p>
            <p className="text-3xl font-bold text-gray-900 font-mono tabular-nums">
              {totalSynHigh > 0 ? formatCompactNumber(totalSynHigh) : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-2">Portfolio ceiling estimate</p>
          </div>
        </div>

        {/* Recent deals */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-[#D04A02] rounded-full" />
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Deal Pipeline</h2>
            </div>
            <button
              onClick={() => router.push('/deals')}
              className="text-xs text-gray-400 hover:text-[#D04A02] transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {deals.length === 0 ? (
            <div className="border border-gray-200 bg-white rounded-xl p-12 text-center">
              <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-1">No deals yet</h3>
              <p className="text-gray-500 text-sm mb-5">Create your first transaction to start synergy analysis</p>
              <button
                onClick={() => router.push('/deals/new')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#D04A02] hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> New Deal
              </button>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div className="grid grid-cols-[2fr_1fr_2fr_1fr_32px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deal Size</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" />Synergy Opportunity
                </span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</span>
                <span />
              </div>
              <div className="divide-y divide-gray-100">
                {deals.slice(0, 5).map((deal) => {
                  const status = STATUS_CONFIG[deal.status] || STATUS_CONFIG.draft;
                  const synHigh = deal.total_value_high || 0;
                  const synLow  = deal.total_value_low  || 0;
                  const barPct  = maxHigh > 0 ? (synHigh / maxHigh) * 100 : 0;
                  return (
                    <div
                      key={deal.id}
                      onClick={() => router.push(`/deals/${deal.id}`)}
                      className="grid grid-cols-[2fr_1fr_2fr_1fr_32px] gap-4 px-6 py-4 hover:bg-orange-50 transition-colors cursor-pointer group items-center"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#D04A02] transition-colors">
                          {deal.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 truncate">{deal.acquirer?.name}</span>
                          <span className="text-gray-300 text-xs flex-shrink-0">→</span>
                          <span className="text-xs text-gray-500 truncate">{deal.target?.name}</span>
                        </div>
                      </div>
                      <div>
                        {deal.deal_size_usd ? (
                          <span className="text-sm font-mono text-gray-900">{formatCompactNumber(deal.deal_size_usd)}</span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        {synHigh > 0 ? (
                          <>
                            <p className="text-sm font-semibold text-gray-900 font-mono tabular-nums">
                              {formatCompactNumber(synLow)}<span className="text-gray-400 font-normal text-xs mx-1">–</span>{formatCompactNumber(synHigh)}
                            </p>
                            <div className="h-1 bg-gray-100 rounded-full mt-1.5">
                              <div className="h-full bg-[#D04A02] opacity-60 rounded-full" style={{ width: `${barPct}%` }} />
                            </div>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.dot}`} />
                        <span className={`text-xs font-medium ${status.text}`}>{status.label}</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#D04A02] transition-colors" />
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
            <div className="w-1 h-5 bg-gray-300 rounded-full" />
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/deals/new')}
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Plus className="w-4 h-4 text-[#D04A02]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 group-hover:text-[#D04A02] transition-colors">New Deal</p>
                <p className="text-xs text-gray-500">Start synergy analysis</p>
              </div>
            </button>
            <button
              onClick={() => router.push('/learn')}
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Lever Playbooks</p>
                <p className="text-xs text-gray-500">Methodology workspace</p>
              </div>
            </button>
            <button
              onClick={() => router.push('/chat')}
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">AI Chat</p>
                <p className="text-xs text-gray-500">Ask about lever methodology</p>
              </div>
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}
