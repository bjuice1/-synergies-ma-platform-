'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSynergies, useCreateSynergy, useUpdateSynergy, useDeleteSynergy } from '@/hooks/useSynergies';
import { Button } from '@/components/ui/button';
import { SynergyCard } from '@/components/synergies/SynergyCard';
import { SynergyFiltersComponent } from '@/components/synergies/SynergyFilters';
import { SynergyForm } from '@/components/synergies/SynergyForm';
import type { Synergy, SynergyFilters, CreateSynergyInput } from '@/lib/types';

export default function SynergiesPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [filters, setFilters] = useState<SynergyFilters>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSynergy, setEditingSynergy] = useState<Synergy | null>(null);

  const { data: synergies, isLoading: synergiesLoading } = useSynergies(filters);
  const createMutation = useCreateSynergy();
  const updateMutation = useUpdateSynergy();
  const deleteMutation = useDeleteSynergy();

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

  const handleCreate = () => {
    setEditingSynergy(null);
    setIsFormOpen(true);
  };

  const handleEdit = (synergy: Synergy) => {
    setEditingSynergy(synergy);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this synergy?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete synergy:', error);
        alert('Failed to delete synergy');
      }
    }
  };

  const handleSubmit = async (data: CreateSynergyInput) => {
    try {
      if (editingSynergy) {
        await updateMutation.mutateAsync({ id: editingSynergy.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setIsFormOpen(false);
      setEditingSynergy(null);
    } catch (error) {
      console.error('Failed to save synergy:', error);
      alert('Failed to save synergy');
    }
  };

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
                <h1 className="text-2xl font-bold text-white">Synergies</h1>
                <p className="text-sm text-gray-400 mt-1">
                  Manage and track all M&A synergies
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
                  className="px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-lg"
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
          {/* Action bar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white text-lg">
                {synergies.length} synergies found
              </p>
            </div>
            <Button
              onClick={handleCreate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              + Create Synergy
            </Button>
          </div>

          {/* Filters */}
          <SynergyFiltersComponent filters={filters} onFiltersChange={setFilters} />

          {/* Synergies list */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {synergies.length === 0 ? (
              <div className="col-span-2 text-center py-12">
                <p className="text-gray-400 text-lg">No synergies found</p>
                <Button
                  onClick={handleCreate}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Create your first synergy
                </Button>
              </div>
            ) : (
              synergies.map((synergy) => (
                <SynergyCard
                  key={synergy.id}
                  synergy={synergy}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </main>
      </div>

      {/* Synergy Form Dialog */}
      <SynergyForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        synergy={editingSynergy}
        loading={createMutation.isPending || updateMutation.isPending}
      />

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
