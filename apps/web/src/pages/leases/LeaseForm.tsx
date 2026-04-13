import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useLease, useCreateLease, useUpdateLease } from '../../hooks/useLeases';
import { useUnits } from '../../hooks/useUnits';
import { useTenants } from '../../hooks/useTenants';

const schema = z.object({
  unitId:          z.string().min(1, 'Select a unit'),
  tenantId:        z.string().min(1, 'Select a tenant'),
  startDate:       z.string().min(1, 'Start date required'),
  endDate:         z.string().min(1, 'End date required'),
  rentAmount:      z.coerce.number().min(0, 'Rent must be ≥ 0'),
  depositAmount:   z.coerce.number().min(0, 'Deposit must be ≥ 0'),
  paymentSchedule: z.enum(['monthly', 'quarterly', 'yearly']),
  paymentDay:      z.coerce.number().int().min(1).max(28),
  notes:           z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

export function LeaseForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: existing }          = useLease(id ?? '');
  const { data: units    = [] }     = useUnits();
  const { data: tenants  = [] }     = useTenants();
  const createMutation              = useCreateLease();
  const updateMutation              = useUpdateLease();

  // Only show vacant units in create mode (existing unit shown in edit via reset)
  const vacantUnits = units.filter((u) => u.status === 'vacant');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      paymentSchedule: 'monthly',
      paymentDay:      1,
    },
  });

  useEffect(() => {
    if (existing && isEdit) {
      reset({
        unitId:          existing.unitId,
        tenantId:        existing.tenantId,
        startDate:       existing.startDate.slice(0, 10),
        endDate:         existing.endDate.slice(0, 10),
        rentAmount:      Number(existing.rentAmount),
        depositAmount:   Number(existing.depositAmount),
        paymentSchedule: existing.paymentSchedule as FormData['paymentSchedule'],
        paymentDay:      existing.paymentDay,
        notes:           existing.notes ?? '',
      });
    }
  }, [existing, isEdit, reset]);

  const onSubmit = async (data: FormData) => {
    if (isEdit) {
      // Only send editable fields to PATCH
      await updateMutation.mutateAsync({
        id: id!,
        endDate:         data.endDate,
        rentAmount:      data.rentAmount,
        paymentSchedule: data.paymentSchedule,
        paymentDay:      data.paymentDay,
        notes:           data.notes || undefined,
      } as any);
      navigate(`/leases/${id}`);
    } else {
      const created = await createMutation.mutateAsync({
        ...data,
        notes: data.notes || undefined,
      });
      navigate(`/leases/${created.id}`);
    }
  };

  return (
    <div className="max-w-xl">
      <button
        onClick={() => navigate(isEdit ? `/leases/${id}` : '/leases')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft size={16} /> {isEdit ? 'Back to lease' : 'Leases'}
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-lg font-bold text-gray-900 mb-6">
          {isEdit ? 'Edit Lease' : 'New Lease'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Unit + Tenant — create only */}
          {!isEdit && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select {...register('unitId')} className={inputClass}>
                  <option value="">Select a vacant unit…</option>
                  {vacantUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      #{u.unitNumber}{u.property ? ` — ${u.property.name}` : ''}
                    </option>
                  ))}
                </select>
                {errors.unitId && <p className="text-xs text-danger-500 mt-1">{errors.unitId.message}</p>}
                {vacantUnits.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">No vacant units available.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
                <select {...register('tenantId')} className={inputClass}>
                  <option value="">Select a tenant…</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                    </option>
                  ))}
                </select>
                {errors.tenantId && <p className="text-xs text-danger-500 mt-1">{errors.tenantId.message}</p>}
              </div>
            </>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
                <input {...register('startDate')} type="date" className={inputClass} />
                {errors.startDate && <p className="text-xs text-danger-500 mt-1">{errors.startDate.message}</p>}
              </div>
            )}
            <div className={isEdit ? 'col-span-2' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
              <input {...register('endDate')} type="date" className={inputClass} />
              {errors.endDate && <p className="text-xs text-danger-500 mt-1">{errors.endDate.message}</p>}
            </div>
          </div>

          {/* Rent + Deposit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly rent ($)</label>
              <input {...register('rentAmount')} type="number" step="0.01" min="0" placeholder="1500" className={inputClass} />
              {errors.rentAmount && <p className="text-xs text-danger-500 mt-1">{errors.rentAmount.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deposit ($){isEdit && <span className="text-gray-400 font-normal"> (read-only)</span>}
              </label>
              <input
                {...register('depositAmount')}
                type="number"
                step="0.01"
                min="0"
                placeholder="1500"
                className={inputClass}
                readOnly={isEdit}
              />
              {errors.depositAmount && <p className="text-xs text-danger-500 mt-1">{errors.depositAmount.message}</p>}
            </div>
          </div>

          {/* Payment schedule */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment schedule</label>
              <select {...register('paymentSchedule')} className={inputClass}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment day (1–28)</label>
              <input {...register('paymentDay')} type="number" min="1" max="28" placeholder="1" className={inputClass} />
              {errors.paymentDay && <p className="text-xs text-danger-500 mt-1">{errors.paymentDay.message}</p>}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Any additional notes…"
              className={inputClass + ' resize-none'}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(isEdit ? `/leases/${id}` : '/leases')}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-sm font-medium text-white transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create lease'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
