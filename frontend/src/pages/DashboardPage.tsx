import { useAuth } from '@/hooks/useAuth';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-4 sm:p-8 space-y-2">
      <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
      <p className="text-slate-400 text-sm">
        Signed in as <span className="text-slate-200 font-medium">{user?.email}</span>
        {user?.role === 'ADMIN' && (
          <>
            {' '}
            &mdash; visit <span className="text-indigo-400">Users</span> in the sidebar to manage
            accounts.
          </>
        )}
      </p>
    </div>
  );
}
