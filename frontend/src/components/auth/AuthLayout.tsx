import { KeyRound } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
          <p className="text-slate-400 text-sm">{subtitle}</p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl backdrop-blur-sm p-6 space-y-4">
          {children}
        </div>

        <div className="text-center text-sm text-slate-400">{footer}</div>
      </div>
    </div>
  );
}
