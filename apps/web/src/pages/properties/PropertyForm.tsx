import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useProperty, useCreateProperty, useUpdateProperty } from '../../hooks/useProperties';
import { useAuth } from '../../auth/AuthContext';

const schema = z.object({
  name:            z.string().min(1, 'Name required'),
  type:            z.enum(['residential', 'commercial', 'mixed']),
  address:         z.string().min(1, 'Address required'),
  description:     z.string().optional(),
  acquisitionDate: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

export function PropertyForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit  = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: existing } = useProperty(id ?? '');
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (existing && isEdit) {
      reset({
        name:            existing.name,
        type:            existing.type as FormData['type'],
        address:         existing.address,
        description:     existing.description ?? '',
        acquisitionDate: existing.acquisitionDate?.split('T')[0] ?? '',
      });
    }
  }, [existing, isEdit, reset]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      ownerId: user!.id,
      acquisitionDate: data.acquisitionDate || undefined,
      description:     data.description     || undefined,
    };

    if (isEdit) {
      await updateMutation.mutateAsync({ id: id!, ...payload });
      navigate(`/properties/${id}`);
    } else {
      const created = await createMutation.mutateAsync(payload);
      navigate(`/properties/${created.id}`);
    }
  };

  return (
    <div className="max-w-xl">
      {/* Back */}
      <button
        onClick={() => navigate(isEdit ? `/properties/${id}` : '/properties')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        {isEdit ? 'Back to property' : 'Properties'}
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-lg font-bold text-gray-900 mb-6">
          {isEdit ? 'Edit Property' : 'Add Property'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property name</label>
            <input {...register('name')} type="text" placeholder="Sunset Apartments" className={inputClass} />
            {errors.name && <p className="text-xs text-danger-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select {...register('type')} className={inputClass}>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="mixed">Mixed</option>
            </select>
            {errors.type && <p className="text-xs text-danger-500 mt-1">{errors.type.message}</p>}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input {...register('address')} type="text" placeholder="123 Main St, City, State" className={inputClass} />
            {errors.address && <p className="text-xs text-danger-500 mt-1">{errors.address.message}</p>}
          </div>

          {/* Acquisition date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Acquisition date <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input {...register('acquisitionDate')} type="date" className={inputClass} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Brief description of the property…"
              className={inputClass + ' resize-none'}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(isEdit ? `/properties/${id}` : '/properties')}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-sm font-medium text-white transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
