import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, UploadCloud, X, FileText } from 'lucide-react';
import { useMaintenanceRequest, useCreateMaintenanceRequest, useUpdateMaintenanceRequest } from '../../hooks/useMaintenance';
import { useUnits } from '../../hooks/useUnits';

const schema = z.object({
  unitId:        z.string().min(1, 'Select a unit'),
  description:   z.string().min(5, 'Description must be at least 5 characters'),
  category:      z.enum(['plumbing', 'electrical', 'hvac', 'structural', 'cleaning', 'security', 'general']),
  priority:      z.enum(['low', 'medium', 'high', 'urgent']),
  estimatedCost: z.coerce.number().min(0).optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

export function MaintenanceForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: existing }      = useMaintenanceRequest(id ?? '');
  const { data: units = [] }    = useUnits();
  const createMutation           = useCreateMaintenanceRequest();
  const updateMutation           = useUpdateMaintenanceRequest();

  const [files, setFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'general',
      priority: 'medium',
    },
  });

  useEffect(() => {
    if (existing && isEdit) {
      reset({
        unitId:        existing.unitId,
        description:   existing.description,
        category:      existing.category,
        priority:      existing.priority,
        estimatedCost: existing.estimatedCost !== undefined && existing.estimatedCost !== null
          ? Number(existing.estimatedCost)
          : '',
      });
    }
  }, [existing, isEdit, reset]);

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [...prev, ...accepted]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*':       ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
    },
    multiple: true,
  });

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(data: FormData) {
    const payload = {
      unitId:        data.unitId,
      description:   data.description,
      category:      data.category,
      priority:      data.priority,
      estimatedCost: data.estimatedCost !== '' && data.estimatedCost !== undefined
        ? Number(data.estimatedCost)
        : undefined,
      // attachments would be uploaded separately to a file storage endpoint
      attachments: [] as string[],
    };

    if (isEdit) {
      await updateMutation.mutateAsync({
        id: id!,
        description:   payload.description,
        category:      payload.category,
        priority:      payload.priority,
        estimatedCost: payload.estimatedCost,
      });
      navigate(`/maintenance/${id}`);
    } else {
      const created = await createMutation.mutateAsync(payload);
      navigate(`/maintenance/${created.id}`);
    }
  }

  return (
    <div className="max-w-xl">
      <button
        onClick={() => navigate(isEdit ? `/maintenance/${id}` : '/maintenance')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft size={16} /> {isEdit ? 'Back to request' : 'Maintenance'}
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-lg font-bold text-gray-900 mb-6">
          {isEdit ? 'Edit Request' : 'New Maintenance Request'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Unit — create only */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select {...register('unitId')} className={inputClass}>
                <option value="">Select a unit…</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    #{u.unitNumber}{u.property ? ` — ${u.property.name}` : ''}
                  </option>
                ))}
              </select>
              {errors.unitId && <p className="text-xs text-danger-500 mt-1">{errors.unitId.message}</p>}
            </div>
          )}

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select {...register('category')} className={inputClass}>
                <option value="general">General</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="hvac">HVAC</option>
                <option value="structural">Structural</option>
                <option value="cleaning">Cleaning</option>
                <option value="security">Security</option>
              </select>
              {errors.category && <p className="text-xs text-danger-500 mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select {...register('priority')} className={inputClass}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              {errors.priority && <p className="text-xs text-danger-500 mt-1">{errors.priority.message}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Describe the issue in detail…"
              className={inputClass + ' resize-none'}
            />
            {errors.description && <p className="text-xs text-danger-500 mt-1">{errors.description.message}</p>}
          </div>

          {/* Estimated cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Cost ($) <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              {...register('estimatedCost')}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className={inputClass}
            />
            {errors.estimatedCost && <p className="text-xs text-danger-500 mt-1">{errors.estimatedCost.message as string}</p>}
          </div>

          {/* Attachments (react-dropzone) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachments <span className="text-gray-400 font-normal">(optional — images or PDF)</span>
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud size={24} className="mx-auto mb-2 text-gray-400" />
              {isDragActive ? (
                <p className="text-sm text-primary-600 font-medium">Drop files here…</p>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    Drag &amp; drop files here, or <span className="text-primary-600 font-medium">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Images and PDF files supported</p>
                </>
              )}
            </div>

            {files.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {files.map((file, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200"
                  >
                    <FileText size={14} className="text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-gray-400 shrink-0">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-gray-400 hover:text-danger-500 transition-colors shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(isEdit ? `/maintenance/${id}` : '/maintenance')}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-sm font-medium text-white transition-colors disabled:opacity-60"
            >
              {isSubmitting
                ? 'Saving…'
                : isEdit
                  ? 'Save changes'
                  : 'Submit request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
