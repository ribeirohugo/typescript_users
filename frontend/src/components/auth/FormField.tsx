import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, error, children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-slate-300 text-sm font-medium block">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function Input({ hasError, className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full px-3 py-2.5 bg-slate-900 border rounded-lg text-slate-200 text-sm placeholder-slate-500 transition-colors',
        'focus:outline-none focus:ring-1',
        hasError
          ? 'border-red-600/70 focus:border-red-500 focus:ring-red-500/30'
          : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/30',
        className,
      )}
      {...props}
    />
  );
}
