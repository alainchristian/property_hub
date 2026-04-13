import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';
import type { Vendor } from '../types';

export const VENDORS_KEY = ['vendors'] as const;

export function useVendors(params?: Record<string, string>) {
  return useQuery({
    queryKey: [...VENDORS_KEY, params],
    queryFn: () => api.get('/vendors', { params }).then((r) => r.data as Vendor[]),
  });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: [...VENDORS_KEY, id],
    queryFn: () => api.get(`/vendors/${id}`).then((r) => r.data as Vendor),
    enabled: !!id,
  });
}

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Vendor>) =>
      api.post('/vendors', data).then((r) => r.data as Vendor),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VENDORS_KEY });
      toast.success('Vendor created successfully');
    },
    onError: () => toast.error('Failed to create vendor'),
  });
}

export function useUpdateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Vendor> & { id: string }) =>
      api.patch(`/vendors/${id}`, data).then((r) => r.data as Vendor),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VENDORS_KEY });
      toast.success('Vendor updated');
    },
    onError: () => toast.error('Failed to update vendor'),
  });
}

export function useDeleteVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/vendors/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VENDORS_KEY });
      toast.success('Vendor deleted');
    },
    onError: () => toast.error('Failed to delete vendor'),
  });
}
