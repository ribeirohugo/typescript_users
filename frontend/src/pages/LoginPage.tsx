import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { authApi } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormField, Input } from '@/components/auth/FormField';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/';

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
      const { accessToken } = await authApi.login(values);
      await login(accessToken);
      void navigate(from, { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Sign in to your account"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
              placeholder="••••••••"
              hasError={!!errors.password}
              autoComplete="current-password"
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
          icon={<LogIn className="w-4 h-4" />}
        >
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
