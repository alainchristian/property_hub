import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, type AuthUser } from '../../auth/AuthContext';
import toast from 'react-hot-toast';

const schema = z
  .object({
    firstName: z.string().min(1, 'First name required'),
    lastName:  z.string().min(1, 'Last name required'),
    email:     z.string().email('Invalid email'),
    phone:     z.string().optional(),
    role:      z.enum(['owner', 'manager', 'tenant', 'vendor', 'admin']),
    password:  z.string().min(8, 'Password must be at least 8 characters'),
    confirm:   z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  });

type FormData = z.infer<typeof schema>;

function redirectPathForRole(role: AuthUser['role']): string {
  if (role === 'tenant') return '/portal';
  if (role === 'vendor') return '/workorders';
  return '/dashboard';
}

const roleOptions: { value: AuthUser['role']; label: string }[] = [
  { value: 'owner',   label: 'Property Owner' },
  { value: 'manager', label: 'Property Manager' },
  { value: 'tenant',  label: 'Tenant' },
  { value: 'vendor',  label: 'Vendor / Contractor' },
  { value: 'admin',   label: 'Admin' },
];

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'owner' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { confirm, ...payload } = data;
      const user = await registerUser(payload);
      toast.success('Account created successfully');
      navigate(redirectPathForRole(user.role), { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? 'Registration failed. Please try again.';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="font-display text-2xl font-bold text-primary-700 mb-1">PropertyHub</h1>
          <p className="text-sm text-gray-500 mb-8">Create your account</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First name
                </label>
                <input
                  {...register('firstName')}
                  type="text"
                  autoComplete="given-name"
                  placeholder="Jane"
                  className={inputClass}
                />
                {errors.firstName && (
                  <p className="text-xs text-danger-500 mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last name
                </label>
                <input
                  {...register('lastName')}
                  type="text"
                  autoComplete="family-name"
                  placeholder="Smith"
                  className={inputClass}
                />
                {errors.lastName && (
                  <p className="text-xs text-danger-500 mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={inputClass}
              />
              {errors.email && (
                <p className="text-xs text-danger-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone{' '}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                {...register('phone')}
                type="tel"
                autoComplete="tel"
                placeholder="+1 555 000 0000"
                className={inputClass}
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account type</label>
              <select {...register('role')} className={inputClass}>
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="text-xs text-danger-500 mt-1">{errors.role.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                {...register('password')}
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className={inputClass}
              />
              {errors.password && (
                <p className="text-xs text-danger-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <input
                {...register('confirm')}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className={inputClass}
              />
              {errors.confirm && (
                <p className="text-xs text-danger-500 mt-1">{errors.confirm.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors mt-2"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
