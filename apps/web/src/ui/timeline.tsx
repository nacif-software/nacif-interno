import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TimelineStep {
  key: string;
  title: string;
  detail: ReactNode;
  tone: 'brand' | 'warning' | 'success' | 'danger' | 'pending' | 'neutral';
  extra?: ReactNode;
}

const DOT: Record<TimelineStep['tone'], string> = {
  brand: 'bg-brand',
  warning: 'bg-warning',
  success: 'bg-success',
  danger: 'bg-danger',
  neutral: 'bg-ink-muted',
  pending: 'border-2 border-line bg-white',
};

export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="flex flex-col">
      {steps.map((step, i) => (
        <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className="absolute top-4 left-[5px] h-[calc(100%-8px)] w-[2px] bg-line"
            />
          )}
          <span
            aria-hidden
            className={cn('mt-[3px] size-3 shrink-0 rounded-full', DOT[step.tone])}
          />
          <div className="flex flex-col gap-1">
            <p
              className={cn(
                'text-[15px] font-semibold',
                step.tone === 'pending' ? 'text-ink-muted' : 'text-ink',
              )}
            >
              {step.title}
            </p>
            <p className="text-[14px] leading-[1.5] text-ink-muted">{step.detail}</p>
            {step.extra}
          </div>
        </li>
      ))}
    </ol>
  );
}
