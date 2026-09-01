import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?:      string;
  title:      string;
  subtitle?:  string;
  className?: string;
  action?:    React.ReactNode;
}

export function EmptyState({ icon = '📭', title, subtitle, className, action }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center text-muted-foreground', className)}>
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-base font-medium text-gray-600">{title}</div>
      {subtitle && <div className="mt-1 text-sm">{subtitle}</div>}
      {action  && <div className="mt-4">{action}</div>}
    </div>
  );
}
