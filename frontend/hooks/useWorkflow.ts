'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { workflowApi } from '@/lib/api';
import type { WorkflowTransition, WorkflowState } from '@/lib/types';

/**
 * Fetch workflow transition history for a synergy
 */
export function useWorkflowTransitions(
  synergyId: number | undefined
): UseQueryResult<WorkflowTransition[], Error> {
  return useQuery({
    queryKey: ['workflow', synergyId],
    queryFn: () => {
      if (!synergyId) throw new Error('Synergy ID required');
      return workflowApi.getTransitions(synergyId);
    },
    enabled: !!synergyId,
    staleTime: 30000, // 30 seconds - workflow changes infrequently
  });
}

/**
 * Derive current workflow state from transitions
 */
export function useCurrentWorkflowState(
  synergyId: number | undefined
): WorkflowState | undefined {
  const { data: transitions } = useWorkflowTransitions(synergyId);

  if (!transitions || transitions.length === 0) {
    return 'draft'; // Default state
  }

  // Latest transition = current state
  return transitions[transitions.length - 1].to_state;
}
