'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { synergiesApi } from '@/lib/api';
import type { Synergy, CreateSynergyInput, SynergyFilters } from '@/lib/types';

export function useSynergies(filters?: SynergyFilters) {
  return useQuery({
    queryKey: ['synergies', filters],
    queryFn: () => synergiesApi.getAll(filters),
  });
}

export function useSynergy(id: number) {
  return useQuery({
    queryKey: ['synergies', id],
    queryFn: () => synergiesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateSynergy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSynergyInput) => synergiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['synergies'] });
    },
  });
}

export function useUpdateSynergy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateSynergyInput> }) =>
      synergiesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['synergies'] });
    },
  });
}

export function useDeleteSynergy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => synergiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['synergies'] });
    },
  });
}
