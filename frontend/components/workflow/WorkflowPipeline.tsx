'use client';

import { useWorkflowTransitions, useCurrentWorkflowState } from '@/hooks/useWorkflow';
import { WorkflowStage } from './WorkflowStage';
import { StageConnector } from './StageConnector';
import { WorkflowTimeline } from './WorkflowTimeline';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import type { WorkflowState } from '@/lib/types';

interface WorkflowPipelineProps {
  synergyId: number;
  showTimeline?: boolean; // Show detailed transition history
  compact?: boolean; // Compact mode for cards (smaller)
}

const WORKFLOW_STAGES: WorkflowState[] = [
  'draft',
  'review',
  'approved',
  'realized',
];

// Note: 'rejected' is a terminal state, shown separately

export function WorkflowPipeline({
  synergyId,
  showTimeline = false,
  compact = false
}: WorkflowPipelineProps) {
  const { data: transitions, isLoading, error, refetch } = useWorkflowTransitions(synergyId);
  const currentState = useCurrentWorkflowState(synergyId);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} retry={refetch} />;

  // Find which transitions happened
  const stageTransitions = new Map<WorkflowState, typeof transitions[0]>();
  transitions?.forEach(transition => {
    if (!stageTransitions.has(transition.to_state)) {
      stageTransitions.set(transition.to_state, transition);
    }
  });

  // Determine stage status (complete, active, pending)
  const getStageStatus = (stage: WorkflowState): 'complete' | 'active' | 'pending' | 'rejected' => {
    if (currentState === 'rejected' && stage !== 'draft') return 'rejected';
    if (currentState === stage) return 'active';

    const stageIndex = WORKFLOW_STAGES.indexOf(stage);
    const currentIndex = WORKFLOW_STAGES.indexOf(currentState || 'draft');

    return stageIndex < currentIndex ? 'complete' : 'pending';
  };

  return (
    <div className="glass-card border-white/10 bg-white/5 backdrop-blur-lg p-6 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Workflow Status</h3>
          <p className="text-sm text-gray-400 mt-1">
            Current stage: <span className="text-emerald-400 font-medium capitalize">{currentState}</span>
          </p>
        </div>

        {/* Show rejected badge if applicable */}
        {currentState === 'rejected' && (
          <div className="glass-card border-red-500/20 bg-red-500/10 px-3 py-1 rounded-lg">
            <span className="text-sm text-red-400 font-medium">Rejected</span>
          </div>
        )}
      </div>

      {/* Pipeline */}
      <div className={`flex items-center gap-2 ${compact ? '' : 'overflow-x-auto pb-4'}`}>
        {WORKFLOW_STAGES.map((stage, index) => (
          <div key={stage} className="flex items-center">
            <WorkflowStage
              stage={stage}
              status={getStageStatus(stage)}
              transition={stageTransitions.get(stage)}
              compact={compact}
            />

            {/* Connector between stages */}
            {index < WORKFLOW_STAGES.length - 1 && (
              <StageConnector
                active={getStageStatus(stage) === 'complete'}
                compact={compact}
              />
            )}
          </div>
        ))}
      </div>

      {/* Detailed Timeline (Optional) */}
      {showTimeline && transitions && transitions.length > 0 && (
        <WorkflowTimeline transitions={transitions} className="mt-6 pt-6 border-t border-white/10" />
      )}
    </div>
  );
}
