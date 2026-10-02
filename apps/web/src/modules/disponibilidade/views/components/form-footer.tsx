import type { ReactNode } from 'react';

export function FormFooter({ summary, children }: { summary?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[10px] md:flex-row md:items-center md:justify-between md:gap-6">
      {summary && <p className="hidden text-[15px] text-ink-muted md:block">{summary}</p>}
      <div className="flex flex-col-reverse gap-[10px] md:flex-row md:gap-3">{children}</div>
    </div>
  );
}
