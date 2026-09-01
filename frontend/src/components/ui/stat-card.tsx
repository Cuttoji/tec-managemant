import { cn } from '@/lib/utils';

interface StatCardProps {
  icon:      React.ReactNode;
  value:     number | string;
  label:     string;
  color?:    string;
  className?: string;
}

export function StatCard({ icon, value, label, color = 'bg-blue-100', className }: StatCardProps) {
  return (
    <div className={cn('flex items-start gap-4 rounded-xl border border-border bg-white p-4 shadow-sm', className)}>
      <div className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-xl', color)}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold leading-none">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
