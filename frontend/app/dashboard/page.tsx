'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSynergies } from '@/hooks/useSynergies';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentSynergies } from '@/components/dashboard/RecentSynergies';
import { WorkflowOverview } from '@/components/dashboard/WorkflowOverview';
import { StatusChart } from '@/components/charts/StatusChart';
import { formatCompactNumber } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
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

  // Calculate dashboard stats
  const totalSynergies = synergies.length;
  const realizedSynergies = synergies.filter((s) => s.status === 'REALIZED');
  const inProgressCount = synergies.filter((s) => s.status === 'IN_PROGRESS').length;
  const realizedValue = realizedSynergies.reduce(
    (sum, s) => {
      const low = Number(s.value_low) || 0;
      const high = Number(s.value_high) || 0;
      return sum + (low + high) / 2;
    },
    0
  );
  const estimatedTotalValue = synergies.reduce(
    (sum, s) => {
      const low = Number(s.value_low) || 0;
      const high = Number(s.value_high) || 0;
      return sum + (low + high) / 2;
    },
    0
  );

  // Get recent synergies (last 5)
  const recentSynergies = [...synergies]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

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
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-sm text-gray-400 mt-1">
                  Welcome back, {user?.first_name} {user?.last_name}
                </p>
              </div>
              <nav className="flex gap-4">
                <a
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-lg"
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
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
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
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Synergies"
              value={totalSynergies}
              description="Identified opportunities"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              }
            />
            <StatCard
              title="Realized Value"
              value={formatCompactNumber(realizedValue)}
              description={`${realizedSynergies.length} synergies realized`}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
            <StatCard
              title="In Progress"
              value={inProgressCount}
              description="Active synergies"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              }
            />
            <StatCard
              title="Estimated Value"
              value={formatCompactNumber(estimatedTotalValue)}
              description="Total potential value"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
          </div>

          {/* Workflow Overview */}
          <div className="mb-8">
            <WorkflowOverview synergies={synergies} />
          </div>

          {/* Charts and Recent Synergies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatusChart synergies={synergies} />
            <RecentSynergies synergies={recentSynergies} />
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
