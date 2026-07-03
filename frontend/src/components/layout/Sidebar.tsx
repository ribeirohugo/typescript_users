import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, KeyRound, Users, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

type NavItem = {
  to: string;
  icon: React.ElementType;
  label: string;
  end: boolean;
  adminOnly: boolean;
};

const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true, adminOnly: false },
  { to: '/users', icon: Users, label: 'Users', end: false, adminOnly: true },
];

function initials(user: { name?: string | null; email: string }): string {
  if (user.name) return user.name.charAt(0).toUpperCase();
  return user.email.charAt(0).toUpperCase();
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    void navigate('/login', { replace: true });
  }

  return (
    <aside
      className={cn(
        'w-60 shrink-0 flex flex-col bg-slate-900 border-r border-slate-800 h-screen',
        'fixed inset-y-0 left-0 z-40 transition-transform duration-200',
        'md:sticky md:top-0 md:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="px-5 py-5 border-b border-slate-800">
        <NavLink to="/" onClick={onClose} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <KeyRound className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-slate-100 font-semibold text-sm leading-tight">Auth Example</p>
            <p className="text-slate-500 text-xs">Users &amp; authentication</p>
          </div>
        </NavLink>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          if (item.adminOnly && user?.role !== 'ADMIN') return null;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800 space-y-1">
        {user && (
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150',
                isActive
                  ? 'bg-indigo-600/20 border border-indigo-600/30'
                  : 'hover:bg-slate-800 border border-transparent',
              )
            }
          >
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {initials(user)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-slate-200 text-xs font-medium truncate">
                {user.name ?? user.email}
              </p>
              {user.name && <p className="text-slate-500 text-xs truncate">{user.email}</p>}
            </div>
          </NavLink>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-900/10 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
