import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useTenant, useCreateTenant, useUpdateTenant } from '../../hooks/useTenants';

const schema = z.object({
  firstName:             z.string().min(1, 'First name required'),
  lastName:              z.string().min(1, 'Last name required'),
  email:                 z.string().email('Invalid email'),
  phone:                 z.string().min(1, 'Phone required'),
  address:               z.string().optional(),
  idNumber:              z.string().optional(),
  emergencyContactName:  z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

export function TenantForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: existing } = useTenant(id ?? '');
  const createMutation = useCreateTenant();
  const updateMutation = useUpdateTenant();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (existing && isEdit) {
      reset({
        firstName:             existing.firstName,
        lastName:              existing.lastName,
        email:                 existing.email,
        phone:                 existing.phone,
        address:               existing.address               ?? '',
        idNumber:              existing.idNumber              ?? '',
        emergencyContactName:  existing.emergencyContactName  ?? '',
        emergencyContactPhone: existing.emergencyContactPhone ?? '',
      });
    }
  }, [existing, isEdit, reset]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      address:               data.address               || undefined,
      idNumber:              data.idNumber              || undefined,
      emergencyContactName:  data.emergencyContactName  || undefined,
      emergencyContactPhone: data.emergencyContactPhone || undefined,
    };

    if (isEdit) {
      await updateMutation.mutateAsync({ id: id!, ...payload });
      navigate(`/tenants/${id}`);
    } else {
      const created = await createMutation.mutateAsync(payload);
      navigate(`/tenants/${created.id}`);
    }
  };

  return (
    <div className="max-w-xl">
      <button
        onClick={() => navigate(isEdit ? `/tenants/${id}` : '/tenants')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft size={16} /> {isEdit ? 'Back to tenant' : 'Tenants'}
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-lg font-bold text-gray-900 mb-6">
          {isEdit ? 'Edit Tenant' : 'Add Tenant'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
              <input {...register('firstName')} type="text" placeholder="Jane" className={inputClass} />
              {errors.firstName && <p className="text-xs text-danger-500 mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
              <input {...register('lastName')} type="text" placeholder="Smith" className={inputClass} />
              {errors.lastName && <p className="text-xs text-danger-500 mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input {...register('email')} type="email" placeholder="jane@example.com" className={inputClass} />
            {errors.email && <p className="text-xs text-danger-500 mt-1">{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input {...register('phone')} type="tel" placeholder="+1 555 000 0000" className={inputClass} />
            {errors.phone && <p className="text-xs text-danger-500 mt-1">{errors.phone.message}</p>}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input {...register('address')} type="text" placeholder="123 Main St, City" className={inputClass} />
          </div>

          {/* ID Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID / Passport number <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input {...register('idNumber')} type="text" placeholder="e.g. AB-123456" className={inputClass} />
          </div>

          {/* Emergency contact */}
          <div className="border-t border-gray-100 pt-4 mt-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Emergency Contact
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  {...register('emergencyContactName')}
                  type="text"
                  placeholder="John Smith"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  {...register('emergencyContactPhone')}
                  type="tel"
                  placeholder="+1 555 000 0001"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(isEdit ? `/tenants/${id}` : '/tenants')}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-sm font-medium text-white transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
