import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  size?: 'md' | 'lg';
  children?: ReactNode;
  footer?: ReactNode;
}

/** Modal com foco preso, fechamento por Esc e overlay. */
export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = dialogRef.current;
    const focusables = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => !el.hasAttribute('disabled'));
    (focusables()[0] ?? node)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const items = focusables();
        if (items.length === 0) return;
        const first = items[0]!;
        const last = items[items.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={cn(
          'flex w-full flex-col rounded-card bg-card outline-none',
          size === 'lg'
            ? 'max-w-[560px] gap-[22px] p-8'
            : 'max-w-[520px] gap-5 border border-line p-7',
        )}
      >
        <div className="flex flex-col gap-3">
          <h2
            id="modal-title"
            className={
              size === 'lg'
                ? 'text-section-title'
                : 'text-[22px] font-bold leading-[1.2] tracking-[-0.02em] text-ink'
            }
          >
            {title}
          </h2>
          {description && (
            <p className="text-[16px] leading-[1.55] text-ink-muted">{description}</p>
          )}
        </div>
        {children}
        {footer && (
          <div
            className={cn(
              'flex flex-wrap justify-end gap-3',
              size === 'lg' && 'border-t border-line pt-5',
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
