import { useEffect } from 'react';
import { create } from 'zustand';
import { cn } from '@/lib/cn';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: number;
  variant: ToastVariant;
  message: string;
  action?: ToastAction;
  durationMs: number;
}

interface ToastState {
  toasts: Toast[];
  push: (input: Omit<Toast, 'id' | 'durationMs'> & { durationMs?: number }) => number;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (input) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, durationMs: 6000, ...input }] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function useToast() {
  const push = useToastStore((s) => s.push);
  const dismiss = useToastStore((s) => s.dismiss);
  return {
    success: (message: string, action?: ToastAction) =>
      push({ variant: 'success', message, action }),
    error: (message: string, action?: ToastAction) => push({ variant: 'error', message, action }),
    info: (message: string, action?: ToastAction, durationMs?: number) =>
      push({ variant: 'info', message, action, durationMs }),
    dismiss,
  };
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  useEffect(() => {
    const t = setTimeout(() => dismiss(toast.id), toast.durationMs);
    return () => clearTimeout(t);
  }, [toast.id, toast.durationMs, dismiss]);

  const dark = toast.variant !== 'info';
  return (
    <div
      role="status"
      className={cn(
        'flex w-full max-w-[420px] items-center gap-3 rounded-control px-[18px] py-4 text-[15px] font-medium shadow-float',
        dark ? 'bg-ink text-white' : 'border border-line bg-white text-ink',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-2 shrink-0 rounded-full',
          toast.variant === 'success'
            ? 'bg-success'
            : toast.variant === 'error'
              ? 'bg-danger'
              : 'bg-brand',
        )}
      />
      <span className="flex-1">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            dismiss(toast.id);
          }}
          className={cn(
            'text-[14px] font-medium cursor-pointer',
            dark ? 'text-brand-wash hover:text-white' : 'text-brand hover:text-ink',
          )}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] md:items-end md:p-6">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto w-full max-w-[420px]">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}
