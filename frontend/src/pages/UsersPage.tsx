import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, UserPlus, Pencil, UserX, UserCheck, X } from 'lucide-react';
import { usersApi } from '@/api/users';
import type { User } from '@/types';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { passwordSchema, PASSWORD_HINT } from '@/lib/password';

const createSchema = z.object({
  email: z.string().email('Invalid email'),
  password: passwordSchema,
  name: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']),
});

const editSchema = z.object({
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  password: passwordSchema.optional().or(z.literal('')),
  name: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']),
  isActive: z.boolean(),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        role === 'ADMIN'
          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/30'
          : 'bg-slate-700 text-slate-300 border border-slate-600',
      )}
    >
      {role}
    </span>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        isActive
          ? 'bg-green-900/30 text-green-400 border border-green-700/40'
          : 'bg-slate-800 text-slate-500 border border-slate-700',
      )}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50';

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'USER' },
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-slate-100 font-semibold">New User</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit((data: CreateForm) => mutate(data))}
          className="px-6 py-5 space-y-4"
        >
          <Field label="Email" error={errors.email?.message}>
            <input
              {...register('email')}
              type="email"
              placeholder="user@example.com"
              className={inputCls}
            />
          </Field>

          <Field label="Password" error={errors.password?.message}>
            <input
              {...register('password')}
              type="password"
              placeholder={PASSWORD_HINT}
              className={inputCls}
            />
          </Field>

          <Field label="Name (optional)" error={errors.name?.message}>
            <input {...register('name')} type="text" placeholder="Full name" className={inputCls} />
          </Field>

          <Field label="Role" error={errors.role?.message}>
            <select {...register('role')} className={inputCls}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </Field>

          {error && (
            <p className="text-sm text-red-400">
              {error instanceof Error
                ? error.message
                : ((error as { response?: { data?: { message?: string } } }).response?.data
                    ?.message ?? 'Something went wrong')}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              Create User
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose }: { user: User; onClose: () => void }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      email: user.email,
      name: user.name ?? '',
      role: user.role,
      isActive: user.isActive,
      password: '',
    },
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: EditForm) => {
      const payload = {
        ...data,
        password: data.password !== '' ? data.password : undefined,
        email: data.email !== '' ? data.email : undefined,
      };
      return usersApi.update(user.id, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-slate-100 font-semibold">Edit User</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit((data) => mutate(data))} className="px-6 py-5 space-y-4">
          <Field label="Email" error={errors.email?.message}>
            <input {...register('email')} type="email" className={inputCls} />
          </Field>

          <Field label="New Password (leave blank to keep)" error={errors.password?.message}>
            <input
              {...register('password')}
              type="password"
              placeholder={PASSWORD_HINT}
              className={inputCls}
            />
          </Field>

          <Field label="Name" error={errors.name?.message}>
            <input {...register('name')} type="text" className={inputCls} />
          </Field>

          <div className="flex gap-4">
            <Field label="Role" error={errors.role?.message}>
              <select {...register('role')} className={inputCls}>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </Field>

            <Field label="Active" error={errors.isActive?.message}>
              <div className="flex items-center h-9">
                <input
                  {...register('isActive')}
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                />
              </div>
            </Field>
          </div>

          {error && (
            <p className="text-sm text-red-400">
              {error instanceof Error
                ? error.message
                : ((error as { response?: { data?: { message?: string } } }).response?.data
                    ?.message ?? 'Something went wrong')}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RowActions({
  user,
  onEdit,
  onToggleActive,
}: {
  user: User;
  onEdit: () => void;
  onToggleActive: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={onEdit}
        title="Edit"
        className="p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-all"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onToggleActive}
        title={user.isActive ? 'Deactivate' : 'Activate'}
        className={cn(
          'p-1.5 rounded-md transition-all',
          user.isActive
            ? 'text-slate-500 hover:text-red-400 hover:bg-red-900/20'
            : 'text-slate-500 hover:text-green-400 hover:bg-green-900/20',
        )}
      >
        {user.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
  });

  const { mutate: toggleActive } = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersApi.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Users</h1>
          <p className="text-slate-400 text-sm mt-0.5">{users.length} total</p>
        </div>
        <Button icon={<UserPlus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
          New User
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider bg-slate-800/60 rounded-tl-xl">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider bg-slate-800/60">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider bg-slate-800/60">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider bg-slate-800/60">
                  Created
                </th>
                <th className="px-4 py-3 bg-slate-800/60 rounded-tr-xl" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    {search ? 'No users match your search' : 'No users found'}
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-600/40 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                          {(user.name ?? user.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          {user.name && (
                            <p className="text-slate-200 font-medium truncate">{user.name}</p>
                          )}
                          <p
                            className={cn(
                              'truncate',
                              user.name ? 'text-slate-500 text-xs' : 'text-slate-200',
                            )}
                          >
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge isActive={user.isActive} />
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <RowActions
                          user={user}
                          onEdit={() => setEditTarget(user)}
                          onToggleActive={() =>
                            toggleActive({
                              id: user.id,
                              isActive: !user.isActive,
                            })
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
      {editTarget && <EditUserModal user={editTarget} onClose={() => setEditTarget(null)} />}
    </div>
  );
}
