import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';
import type { Lease } from '../types';

export const LEASES_KEY = ['leases'] as const;

export function useLeases(params?: Record<string, string>) {
  return useQuery({
    queryKey: [...LEASES_KEY, params],
    queryFn: () => api.get('/leases', { params }).then((r) => r.data as Lease[]),
  });
}

export function useLease(id: string) {
  return useQuery({
    queryKey: [...LEASES_KEY, id],
    queryFn: () => api.get(`/leases/${id}`).then((r) => r.data as Lease),
    enabled: !!id,
  });
}

export function useCreateLease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Lease>) =>
      api.post('/leases', data).then((r) => r.data as Lease),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LEASES_KEY });
      toast.success('Lease created and payments scheduled');
    },
    onError: () => toast.error('Failed to create lease'),
  });
}

export function useUpdateLease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Lease> & { id: string }) =>
      api.patch(`/leases/${id}`, data).then((r) => r.data as Lease),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LEASES_KEY });
      toast.success('Lease updated');
    },
    onError: () => toast.error('Failed to update lease'),
  });
}

export function useTerminateLease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/leases/${id}/terminate`, { reason }).then((r) => r.data as Lease),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LEASES_KEY });
      toast.success('Lease terminated');
    },
    onError: () => toast.error('Failed to terminate lease'),
  });
}

export function useRenewLease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Lease> & { id: string }) =>
      api.post(`/leases/${id}/renew`, data).then((r) => r.data as Lease),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LEASES_KEY });
      toast.success('Lease renewed successfully');
    },
    onError: () => toast.error('Failed to renew lease'),
  });
}

export function useDeleteLease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/leases/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LEASES_KEY });
      toast.success('Lease deleted');
    },
    onError: () => toast.error('Failed to delete lease'),
  });
}
