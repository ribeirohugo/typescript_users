import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { authApi } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormField, Input } from '@/components/auth/FormField';
import { Button } from '@/components/ui/Button';
import { passwordSchema, PASSWORD_HINT } from '@/lib/password';

const schema = z
  .object({
    name: z.string().optional(),
    email: z.string().email('Enter a valid email'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await authApi.register({
        email: values.email,
        password: values.password,
        name: values.name !== '' ? values.name : undefined,
      });
      const { accessToken } = await authApi.login({
        email: values.email,
        password: values.password,
      });
      await login(accessToken);
      void navigate('/', { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Registration failed');
    }
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Sign up to get started"
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField label="Name (optional)" error={errors.name?.message}>
          <Input type="text" placeholder="Jane Doe" autoComplete="name" {...register('name')} />
        </FormField>

        <FormField label="Email" error={errors.email?.message}>
          <Input
            type="email"
            placeholder="you@example.com"
            hasError={!!errors.email}
            autoComplete="email"
            {...register('email')}
          />
        </FormField>

        <FormField label="Password" error={errors.password?.message}>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder={PASSWORD_HINT}
              hasError={!!errors.password}
              autoComplete="new-password"
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </FormField>

        <FormField label="Confirm password" error={errors.confirmPassword?.message}>
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            hasError={!!errors.confirmPassword}
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
        </FormField>

        {serverError && (
          <p className="text-red-400 text-sm bg-red-900/20 border border-red-700/50 rounded-lg px-3 py-2">
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isSubmitting}
          icon={<UserPlus className="w-4 h-4" />}
        >
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
