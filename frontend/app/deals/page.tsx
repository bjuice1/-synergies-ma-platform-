'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDeals } from '@/hooks/useDeals';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCompactNumber } from '@/lib/utils';
import { Plus, Building2, TrendingUp, Calendar } from 'lucide-react';

export default function DealsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: deals, isLoading: dealsLoading } = useDeals();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || dealsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!deals) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-blue-500/20 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-emerald-500/20 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-md bg-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">M&A Deals</h1>
                <p className="text-sm text-gray-400 mt-1">
                  {deals.length} {deals.length === 1 ? 'deal' : 'deals'} • AI-powered synergy identification
                </p>
              </div>
              <nav className="flex gap-4">
                <a href="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  Dashboard
                </a>
                <a href="/synergies" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  Synergies
                </a>
                <a href="/deals" className="px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-lg">
                  Deals
                </a>
                <a href="/learn" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  Learn
                </a>
                <a href="/chat" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  AI Chat
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Action bar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Active Deals</h2>
              <p className="text-sm text-gray-400 mt-1">Create deals to analyze synergy opportunities</p>
            </div>
            <Button
              onClick={() => router.push('/deals/new')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Deal
            </Button>
          </div>

          {/* Deals grid */}
          {deals.length === 0 ? (
            <div className="glass-card border-white/10 bg-white/5 backdrop-blur-lg p-12 rounded-2xl text-center">
              <Building2 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No deals yet</h3>
              <p className="text-gray-400 mb-6">
                Create your first deal to start identifying synergies
              </p>
              <Button
                onClick={() => router.push('/deals/new')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Deal
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="glass-card border-white/10 bg-white/5 backdrop-blur-lg p-6 rounded-2xl hover:bg-white/10 transition-all cursor-pointer"
                  onClick={() => router.push(`/deals/${deal.id}`)}
                >
                  {/* Deal header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{deal.name}</h3>
                      <p className="text-sm text-gray-400 capitalize">{deal.deal_type}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      deal.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                      deal.status === 'draft' ? 'bg-gray-500/20 text-gray-400' :
                      deal.status === 'closed' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {deal.status}
                    </span>
                  </div>

                  {/* Companies */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-gray-300">{deal.acquirer?.name || 'Acquirer'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">{deal.target?.name || 'Target'}</span>
                    </div>
                  </div>

                  {/* Deal metrics */}
                  <div className="border-t border-white/10 pt-4 space-y-2">
                    {deal.deal_size_usd && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Deal Size</span>
                        <span className="text-white font-mono">{formatCompactNumber(deal.deal_size_usd)}</span>
                      </div>
                    )}
                    {deal.synergies_count !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Synergies</span>
                        <span className="text-emerald-400 font-semibold">{deal.synergies_count}</span>
                      </div>
                    )}
                    {deal.total_value_low && deal.total_value_high && (
                      <div className="flex items-center justify-between text-sm">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 font-mono">
                          {formatCompactNumber((deal.total_value_low + deal.total_value_high) / 2)}
                        </span>
                      </div>
                    )}
                    {deal.close_date && (
                      <div className="flex items-center justify-between text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">{new Date(deal.close_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
