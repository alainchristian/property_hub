import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';
import type { Tenant } from '../types';

export const TENANTS_KEY = ['tenants'] as const;

export function useTenants(params?: Record<string, string>) {
  return useQuery({
    queryKey: [...TENANTS_KEY, params],
    queryFn: () => api.get('/tenants', { params }).then((r) => r.data as Tenant[]),
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: [...TENANTS_KEY, id],
    queryFn: () => api.get(`/tenants/${id}`).then((r) => r.data as Tenant),
    enabled: !!id,
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Tenant>) =>
      api.post('/tenants', data).then((r) => r.data as Tenant),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TENANTS_KEY });
      toast.success('Tenant created successfully');
    },
    onError: () => toast.error('Failed to create tenant'),
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Tenant> & { id: string }) =>
      api.patch(`/tenants/${id}`, data).then((r) => r.data as Tenant),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TENANTS_KEY });
      toast.success('Tenant updated');
    },
    onError: () => toast.error('Failed to update tenant'),
  });
}

export function useDeleteTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tenants/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TENANTS_KEY });
      toast.success('Tenant deleted');
    },
    onError: () => toast.error('Failed to delete tenant'),
  });
}
