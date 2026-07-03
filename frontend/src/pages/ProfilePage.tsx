import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { authApi } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

const inputCls =
  'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50';

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function initials(user: { name?: string | null; email: string }): string {
  if (user.name) {
    return user.name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return user.email.charAt(0).toUpperCase();
}

export function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [saved, setSaved] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutate, isPending, error } = useMutation({
    mutationFn: () =>
      authApi.updateProfile({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        password: password || undefined,
        currentPassword: currentPassword || undefined,
      }),
    onSuccess: async () => {
      await refreshUser();
      setPassword('');
      setPasswordConfirm('');
      setCurrentPassword('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (password && !currentPassword) {
      setValidationError('Current password is required to set a new password');
      return;
    }
    if (password && password.length < 8) {
      setValidationError('New password must be at least 8 characters');
      return;
    }
    if (password && password !== passwordConfirm) {
      setValidationError('Passwords do not match');
      return;
    }

    mutate();
  }

  if (!user) return null;

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-8">
      <div className="max-w-lg mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Profile</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage your account details</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold text-white shrink-0">
            {initials(user)}
          </div>
          <div>
            <p className="text-slate-100 font-semibold text-lg leading-tight">
              {user.name ?? user.email}
            </p>
            {user.name && <p className="text-slate-400 text-sm">{user.email}</p>}
            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-600/30">
              {user.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Personal info
            </h2>

            <Field label="Name">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className={inputCls}
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Security
            </h2>

            <Field label="Current password" hint="Required only when changing your password">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Your current password"
                className={inputCls}
              />
            </Field>

            <Field label="New password" hint="Leave blank to keep your current password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className={inputCls}
              />
            </Field>

            <Field label="Confirm new password">
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Repeat new password"
                className={inputCls}
              />
            </Field>
          </div>

          {(validationError ?? error) && (
            <p className="text-sm text-red-400">
              {validationError ?? error?.message ?? 'Something went wrong'}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" loading={isPending}>
              Save changes
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Saved
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
