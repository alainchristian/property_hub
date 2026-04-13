import { useEffect, useState, KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, X, Plus } from 'lucide-react';
import { useVendor, useCreateVendor, useUpdateVendor } from '../../hooks/useVendors';

const schema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  phone:       z.string().min(1, 'Phone is required'),
  email:       z.string().email('Valid email required'),
  hourlyRate:  z.coerce.number().min(0).optional().or(z.literal('')),
  notes:       z.string().optional(),
  isActive:    z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

export function VendorForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: existing }  = useVendor(id ?? '');
  const createMutation       = useCreateVendor();
  const updateMutation       = useUpdateVendor();

  const [services, setServices] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true },
  });

  useEffect(() => {
    if (existing && isEdit) {
      reset({
        companyName: existing.companyName,
        contactName: existing.contactName,
        phone:       existing.phone,
        email:       existing.email,
        hourlyRate:  existing.hourlyRate ?? '',
        notes:       existing.notes ?? '',
        isActive:    existing.isActive,
      });
      setServices(existing.servicesOffered);
    }
  }, [existing, isEdit, reset]);

  function addService() {
    const trimmed = serviceInput.trim().toLowerCase();
    if (trimmed && !services.includes(trimmed)) {
      setServices((prev) => [...prev, trimmed]);
    }
    setServiceInput('');
  }

  function handleServiceKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addService();
    }
  }

  function removeService(s: string) {
    setServices((prev) => prev.filter((x) => x !== s));
  }

  async function onSubmit(data: FormData) {
    const payload = {
      companyName:     data.companyName,
      contactName:     data.contactName,
      phone:           data.phone,
      email:           data.email,
      servicesOffered: services,
      hourlyRate:      data.hourlyRate !== '' && data.hourlyRate !== undefined
        ? Number(data.hourlyRate)
        : undefined,
      notes:    data.notes || undefined,
      isActive: data.isActive ?? true,
    };

    if (isEdit) {
      await updateMutation.mutateAsync({ id: id!, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    navigate('/vendors');
  }

  return (
    <div className="max-w-xl">
      <button
        onClick={() => navigate('/vendors')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Vendors
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-lg font-bold text-gray-900 mb-6">
          {isEdit ? 'Edit Vendor' : 'Add Vendor'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Company + Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
              <input {...register('companyName')} type="text" placeholder="Acme Repairs" className={inputClass} />
              {errors.companyName && <p className="text-xs text-danger-500 mt-1">{errors.companyName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact name</label>
              <input {...register('contactName')} type="text" placeholder="John Smith" className={inputClass} />
              {errors.contactName && <p className="text-xs text-danger-500 mt-1">{errors.contactName.message}</p>}
            </div>
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input {...register('phone')} type="tel" placeholder="+1 555 000 0000" className={inputClass} />
              {errors.phone && <p className="text-xs text-danger-500 mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input {...register('email')} type="email" placeholder="contact@vendor.com" className={inputClass} />
              {errors.email && <p className="text-xs text-danger-500 mt-1">{errors.email.message}</p>}
            </div>
          </div>

          {/* Services */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Services offered</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={serviceInput}
                onChange={(e) => setServiceInput(e.target.value)}
                onKeyDown={handleServiceKeyDown}
                placeholder="e.g. plumbing — press Enter or comma to add"
                className={inputClass}
              />
              <button
                type="button"
                onClick={addService}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            {services.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {services.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100 capitalize"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeService(s)}
                      className="text-blue-400 hover:text-blue-700 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hourly rate ($) <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              {...register('hourlyRate')}
              type="number"
              min="0"
              step="0.01"
              placeholder="75.00"
              className={inputClass}
            />
            {errors.hourlyRate && <p className="text-xs text-danger-500 mt-1">{errors.hourlyRate.message as string}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Any notes about this vendor…"
              className={inputClass + ' resize-none'}
            />
          </div>

          {/* Active toggle — edit only */}
          {isEdit && (
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                {...register('isActive')}
                type="checkbox"
                className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Active vendor</span>
            </label>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/vendors')}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-sm font-medium text-white transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
