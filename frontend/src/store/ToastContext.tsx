import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (params: { message: string; title?: string; variant?: ToastVariant }) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      message,
      title,
      variant = 'info',
    }: {
      message: string;
      title?: string;
      variant?: ToastVariant;
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, message, variant }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 5000);
    },
    []
  );

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-md flex-col gap-2.5 px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const isError = toast.variant === 'error' || toast.variant === 'warning';
          const borderStyle =
            toast.variant === 'success'
              ? 'border-l-4 border-l-emerald-600 border-stone-200'
              : toast.variant === 'error'
                ? 'border-l-4 border-l-rose-600 border-rose-200'
                : toast.variant === 'warning'
                  ? 'border-l-4 border-l-amber-600 border-amber-200'
                  : 'border-l-4 border-l-sky-600 border-stone-200';

          return (
            <div
              key={toast.id}
              role={isError ? 'alert' : 'status'}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-4 shadow-tactile-hover ${borderStyle}`}
            >
              <span className="mt-0.5 shrink-0">
                {toast.variant === 'success' && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                )}
                {(toast.variant === 'error' || toast.variant === 'warning') && (
                  <AlertCircle
                    className={`h-5 w-5 ${
                      toast.variant === 'error' ? 'text-rose-600' : 'text-amber-600'
                    }`}
                    aria-hidden="true"
                  />
                )}
                {toast.variant === 'info' && (
                  <Info className="h-5 w-5 text-sky-600" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                {toast.title && (
                  <p className="text-sm font-bold text-stone-900">{toast.title}</p>
                )}
                <p className="text-sm font-medium text-stone-700">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Đóng thông báo"
                className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
