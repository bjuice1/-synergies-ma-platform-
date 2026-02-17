'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { metricsApi } from '@/lib/api';
import type { SynergyMetricsResponse } from '@/lib/types';

/**
 * Fetch detailed value breakdown for a synergy
 */
export function useSynergyMetrics(
  synergyId: number | undefined
): UseQueryResult<SynergyMetricsResponse, Error> {
  return useQuery({
    queryKey: ['metrics', synergyId],
    queryFn: () => {
      if (!synergyId) throw new Error('Synergy ID required');
      return metricsApi.getMetrics(synergyId);
    },
    enabled: !!synergyId,
    staleTime: 60000, // 1 minute - metrics change less frequently than synergies
  });
}
