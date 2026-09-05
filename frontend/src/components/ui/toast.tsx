'use client';

import * as React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id:      string;
  type:    ToastType;
  message: string;
}

interface ToastCtx {
  success: (msg: string) => void;
  error:   (msg: string) => void;
  info:    (msg: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = React.createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const add = React.useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => {
      const next = [...prev, { id, type, message }];
      return next.length > 3 ? next.slice(next.length - 3) : next;
    });
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const ctx: ToastCtx = React.useMemo(() => ({
    success: (m) => add('success', m),
    error:   (m) => add('error',   m),
    info:    (m) => add('info',    m),
  }), [add]);

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Container */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t: any) => (
          <ToastItem
            key={t.id}
            toast={t}
            onDismiss={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const icons = { success: CheckCircle, error: AlertCircle, info: Info };
  const Icon  = icons[toast.type];
  const styles = {
    success: 'bg-green-50 border-green-400 text-green-800',
    error:   'bg-red-50  border-red-400  text-red-800',
    info:    'bg-blue-50 border-blue-400 text-blue-800',
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-3 min-w-[280px] max-w-sm',
        'rounded-lg border-l-4 px-4 py-3 shadow-lg',
        'animate-in slide-in-from-right-5 fade-in duration-200',
        styles[toast.type]
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1 text-sm">{toast.message}</span>
      <button
        onClick={onDismiss}
        className="opacity-60 hover:opacity-100 transition-opacity"
        aria-label="ปิด"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function useToast(): ToastCtx {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}
