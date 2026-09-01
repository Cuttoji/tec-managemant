import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

type AlertVariant = 'error' | 'success' | 'info' | 'warning';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const styles: Record<AlertVariant, { wrap: string; icon: React.ReactNode }> = {
  error:   { wrap: 'bg-red-50  border-red-400  text-red-800',   icon: <XCircle     className="h-4 w-4 flex-shrink-0 mt-0.5" /> },
  success: { wrap: 'bg-green-50 border-green-400 text-green-800', icon: <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /> },
  info:    { wrap: 'bg-blue-50 border-blue-400 text-blue-800',  icon: <Info        className="h-4 w-4 flex-shrink-0 mt-0.5" /> },
  warning: { wrap: 'bg-amber-50 border-amber-400 text-amber-800', icon: <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /> },
};

export function Alert({ variant = 'info', className, children, ...props }: AlertProps) {
  const { wrap, icon } = styles[variant];
  return (
    <div
      className={cn('flex gap-2 rounded-lg border-l-4 px-4 py-3 text-sm', wrap, className)}
      role="alert"
      {...props}
    >
      {icon}
      <div>{children}</div>
    </div>
  );
}
