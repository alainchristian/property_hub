import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';
import type { Document } from '../types';

export const DOCUMENTS_KEY = ['documents'] as const;

export function useDocuments(params?: { refType?: string; refId?: string }) {
  return useQuery({
    queryKey: [...DOCUMENTS_KEY, params],
    queryFn: () =>
      api.get('/documents', { params }).then((r) => r.data as Document[]),
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: [...DOCUMENTS_KEY, id],
    queryFn: () => api.get(`/documents/${id}`).then((r) => r.data as Document),
    enabled: !!id,
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Document, 'id' | 'uploadedAt' | 'version'>) =>
      api.post('/documents', data).then((r) => r.data as Document),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DOCUMENTS_KEY });
      toast.success('Document registered');
    },
    onError: () => toast.error('Failed to register document'),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DOCUMENTS_KEY });
      toast.success('Document deleted');
    },
    onError: () => toast.error('Failed to delete document'),
  });
}
