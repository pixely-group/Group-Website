import type { ReactNode } from 'react';
import type { ValidationIssue } from '../../lib/validation';

interface FieldProps {
  label: string;
  htmlFor?: string | undefined;
  hint?: string | undefined;
  issue?: ValidationIssue | undefined;
  /** Inline parse error from the input itself (always an error). */
  inputError?: string | null | undefined;
  className?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, issue, inputError, className = '', children }: FieldProps) {
  const message = inputError ?? issue?.message;
  const severity = inputError ? 'error' : issue?.severity;
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-slate-600">
        {label}
      </label>
      {children}
      {message ? (
        <p className={`text-xs ${severity === 'error' ? 'text-red-600' : 'text-amber-600'}`} role={severity === 'error' ? 'alert' : undefined}>
          {message}
        </p>
      ) : hint ? (
        <p className="text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

export function inputClasses(severity?: 'error' | 'warning' | undefined): string {
  const ring =
    severity === 'error'
      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
      : severity === 'warning'
        ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-200'
        : 'border-slate-300 focus:border-slate-500 focus:ring-slate-200';
  return `h-9 w-full min-w-0 rounded-md border bg-white px-2.5 text-sm text-slate-900 shadow-xs outline-none transition focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500 ${ring}`;
}
