import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';
import type { MaintenanceRequest } from '../types';

export const MAINTENANCE_KEY = ['maintenance'] as const;

export function useMaintenance(params?: Record<string, string>) {
  return useQuery({
    queryKey: [...MAINTENANCE_KEY, params],
    queryFn: () =>
      api.get('/maintenance', { params }).then((r) => r.data as MaintenanceRequest[]),
  });
}

export function useMaintenanceRequest(id: string) {
  return useQuery({
    queryKey: [...MAINTENANCE_KEY, id],
    queryFn: () => api.get(`/maintenance/${id}`).then((r) => r.data as MaintenanceRequest),
    enabled: !!id,
  });
}

export function useCreateMaintenanceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MaintenanceRequest>) =>
      api.post('/maintenance', data).then((r) => r.data as MaintenanceRequest),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MAINTENANCE_KEY });
      toast.success('Maintenance request submitted');
    },
    onError: () => toast.error('Failed to submit maintenance request'),
  });
}

export function useUpdateMaintenanceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<MaintenanceRequest> & { id: string }) =>
      api.patch(`/maintenance/${id}`, data).then((r) => r.data as MaintenanceRequest),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MAINTENANCE_KEY });
      toast.success('Request updated');
    },
    onError: () => toast.error('Failed to update request'),
  });
}

export function useDeleteMaintenanceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/maintenance/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MAINTENANCE_KEY });
      toast.success('Request deleted');
    },
    onError: () => toast.error('Failed to delete request'),
  });
}
