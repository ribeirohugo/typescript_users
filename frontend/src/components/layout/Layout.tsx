import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { KeyRound, Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-950">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <KeyRound className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-slate-100 font-semibold text-sm">Auth Example</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 min-h-0 flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
