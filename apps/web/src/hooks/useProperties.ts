import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';
import type { Property } from '../types';

export const PROPERTIES_KEY = ['properties'] as const;

export function useProperties(params?: Record<string, string>) {
  return useQuery({
    queryKey: [...PROPERTIES_KEY, params],
    queryFn: () => api.get('/properties', { params }).then((r) => r.data as Property[]),
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: [...PROPERTIES_KEY, id],
    queryFn: () => api.get(`/properties/${id}`).then((r) => r.data as Property),
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Property>) =>
      api.post('/properties', data).then((r) => r.data as Property),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTIES_KEY });
      toast.success('Property created successfully');
    },
    onError: () => toast.error('Failed to create property'),
  });
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Property> & { id: string }) =>
      api.patch(`/properties/${id}`, data).then((r) => r.data as Property),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTIES_KEY });
      toast.success('Property updated');
    },
    onError: () => toast.error('Failed to update property'),
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/properties/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTIES_KEY });
      toast.success('Property deleted');
    },
    onError: () => toast.error('Failed to delete property'),
  });
}
