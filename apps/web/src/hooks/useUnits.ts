import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';
import type { Unit } from '../types';

export const UNITS_KEY = ['units'] as const;

export function useUnits(params?: Record<string, string>) {
  return useQuery({
    queryKey: [...UNITS_KEY, params],
    queryFn: () => api.get('/units', { params }).then((r) => r.data as Unit[]),
  });
}

export function useUnit(id: string) {
  return useQuery({
    queryKey: [...UNITS_KEY, id],
    queryFn: () => api.get(`/units/${id}`).then((r) => r.data as Unit),
    enabled: !!id,
  });
}

export function useCreateUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Unit>) =>
      api.post('/units', data).then((r) => r.data as Unit),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: UNITS_KEY });
      toast.success('Unit created successfully');
    },
    onError: () => toast.error('Failed to create unit'),
  });
}

export function useUpdateUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Unit> & { id: string }) =>
      api.patch(`/units/${id}`, data).then((r) => r.data as Unit),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: UNITS_KEY });
      toast.success('Unit updated');
    },
    onError: () => toast.error('Failed to update unit'),
  });
}

export function useDeleteUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/units/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: UNITS_KEY });
      toast.success('Unit deleted');
    },
    onError: () => toast.error('Failed to delete unit'),
  });
}
