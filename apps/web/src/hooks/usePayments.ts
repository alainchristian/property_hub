import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';
import type { Payment } from '../types';

export const PAYMENTS_KEY = ['payments'] as const;

export function usePayments(params?: Record<string, string>) {
  return useQuery({
    queryKey: [...PAYMENTS_KEY, params],
    queryFn: () => api.get('/payments', { params }).then((r) => r.data as Payment[]),
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: [...PAYMENTS_KEY, id],
    queryFn: () => api.get(`/payments/${id}`).then((r) => r.data as Payment),
    enabled: !!id,
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      amountPaid,
      method,
      receiptNumber,
      notes,
    }: {
      id: string;
      amountPaid: number;
      method: string;
      receiptNumber?: string;
      notes?: string;
    }) =>
      api
        .post(`/payments/${id}/record`, { amountPaid, method, receiptNumber, notes })
        .then((r) => r.data as Payment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYMENTS_KEY });
      toast.success('Payment recorded successfully');
    },
    onError: () => toast.error('Failed to record payment'),
  });
}

export function useCreateStripeCheckout() {
  return useMutation({
    mutationFn: ({ id, tenantEmail }: { id: string; tenantEmail: string }) =>
      api
        .post(`/payments/${id}/checkout`, { tenantEmail })
        .then((r) => r.data as { url: string }),
    onError: () => toast.error('Failed to create payment link'),
  });
}
