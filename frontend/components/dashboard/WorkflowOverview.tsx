'use client';

import { WorkflowPipeline } from '@/components/workflow/WorkflowPipeline';
import type { Synergy } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface WorkflowOverviewProps {
  synergies: Synergy[];
}

export function WorkflowOverview({ synergies }: WorkflowOverviewProps) {
  const router = useRouter();

  // Group synergies by workflow state
  const synergyGroups = {
    draft: synergies.filter((s) => !s.current_workflow_state || s.current_workflow_state === 'draft'),
    review: synergies.filter((s) => s.current_workflow_state === 'review'),
    approved: synergies.filter((s) => s.current_workflow_state === 'approved'),
    realized: synergies.filter((s) => s.current_workflow_state === 'realized'),
    rejected: synergies.filter((s) => s.current_workflow_state === 'rejected'),
  };

  return (
    <div className="glass-card border-white/10 bg-white/5 backdrop-blur-lg p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Workflow Overview</h2>
          <p className="text-sm text-gray-400 mt-1">Track synergy progression through approval stages</p>
        </div>
      </div>

      {/* Pipeline by Synergy */}
      <div className="space-y-4">
        {synergies.slice(0, 5).map((synergy) => (
          <div
            key={synergy.id}
            className="glass-card border-white/10 bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
            onClick={() => router.push(`/synergies/${synergy.id}`)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white">{synergy.synergy_type}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{synergy.description.slice(0, 80)}...</p>
              </div>
            </div>
            <WorkflowPipeline synergyId={synergy.id} compact showTimeline={false} />
          </div>
        ))}

        {synergies.length > 5 && (
          <button
            onClick={() => router.push('/synergies')}
            className="w-full py-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            View all {synergies.length} synergies →
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/10">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-400">{synergyGroups.draft.length}</p>
          <p className="text-xs text-gray-500 mt-1">Draft</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-400">{synergyGroups.review.length}</p>
          <p className="text-xs text-gray-500 mt-1">Review</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-400">{synergyGroups.approved.length}</p>
          <p className="text-xs text-gray-500 mt-1">Approved</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">{synergyGroups.realized.length}</p>
          <p className="text-xs text-gray-500 mt-1">Realized</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-400">{synergyGroups.rejected.length}</p>
          <p className="text-xs text-gray-500 mt-1">Rejected</p>
        </div>
      </div>
    </div>
  );
}
