import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useUnit, useCreateUnit, useUpdateUnit } from '../../hooks/useUnits';
import { useProperties } from '../../hooks/useProperties';

const schema = z.object({
  propertyId:  z.string().uuid('Select a property'),
  unitNumber:  z.string().min(1, 'Unit number required'),
  type:        z.enum(['residential', 'commercial', 'office', 'warehouse', 'retail', 'mixed']),
  floor:       z.coerce.number().int().optional(),
  area:        z.coerce.number().positive('Must be positive').optional(),
  rentAmount:  z.coerce.number().min(0, 'Rent must be ≥ 0'),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

export function UnitForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: existing }    = useUnit(id ?? '');
  const { data: properties = [] } = useProperties();
  const createMutation = useCreateUnit();
  const updateMutation = useUpdateUnit();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (existing && isEdit) {
      reset({
        propertyId:  existing.propertyId,
        unitNumber:  existing.unitNumber,
        type:        existing.type as FormData['type'],
        floor:       existing.floor ?? undefined,
        area:        existing.area  ?? undefined,
        rentAmount:  Number(existing.rentAmount),
        description: existing.description ?? '',
      });
    }
  }, [existing, isEdit, reset]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      floor:       data.floor       ?? undefined,
      area:        data.area        ?? undefined,
      description: data.description || undefined,
    };

    if (isEdit) {
      await updateMutation.mutateAsync({ id: id!, ...payload });
      navigate(`/units/${id}`);
    } else {
      const created = await createMutation.mutateAsync(payload);
      navigate(`/units/${created.id}`);
    }
  };

  return (
    <div className="max-w-xl">
      <button
        onClick={() => navigate(isEdit ? `/units/${id}` : '/units')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft size={16} /> {isEdit ? 'Back to unit' : 'Units'}
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-lg font-bold text-gray-900 mb-6">
          {isEdit ? 'Edit Unit' : 'Add Unit'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Property */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
            <select {...register('propertyId')} className={inputClass}>
              <option value="">Select a property…</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.propertyId && <p className="text-xs text-danger-500 mt-1">{errors.propertyId.message}</p>}
          </div>

          {/* Unit number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit number</label>
            <input {...register('unitNumber')} type="text" placeholder="e.g. 101, A1, PH-3" className={inputClass} />
            {errors.unitNumber && <p className="text-xs text-danger-500 mt-1">{errors.unitNumber.message}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select {...register('type')} className={inputClass}>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="office">Office</option>
              <option value="warehouse">Warehouse</option>
              <option value="retail">Retail</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          {/* Floor + Area */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Floor <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input {...register('floor')} type="number" placeholder="e.g. 3" className={inputClass} />
              {errors.floor && <p className="text-xs text-danger-500 mt-1">{errors.floor.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area m² <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input {...register('area')} type="number" step="0.1" placeholder="e.g. 85" className={inputClass} />
              {errors.area && <p className="text-xs text-danger-500 mt-1">{errors.area.message}</p>}
            </div>
          </div>

          {/* Rent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly rent ($)</label>
            <input {...register('rentAmount')} type="number" step="0.01" min="0" placeholder="1500" className={inputClass} />
            {errors.rentAmount && <p className="text-xs text-danger-500 mt-1">{errors.rentAmount.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Notes about this unit…"
              className={inputClass + ' resize-none'}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(isEdit ? `/units/${id}` : '/units')}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-sm font-medium text-white transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
