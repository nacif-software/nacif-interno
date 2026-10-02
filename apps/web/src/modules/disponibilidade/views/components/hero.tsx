import { MESSAGES } from '@nacif/shared';
import { Link } from 'react-router';
import { Button } from '@/ui';
import { paths } from '../../manifest';

export function Hero({ minNoticeDays }: { minNoticeDays: number }) {
  return (
    <section className="relative hidden overflow-hidden rounded-card border border-line bg-card px-9 py-8 md:block">
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-[280px] bg-dots opacity-70 [background-size:22px_22px]"
      />
      <div className="relative flex flex-col items-start gap-4">
        <h1 className="text-screen-title">Precisa se ausentar?</h1>
        <p className="text-[16px] leading-[1.55] text-ink-muted">
          {MESSAGES.heroSubtitle(minNoticeDays)}
        </p>
        <Link to={paths.create}>
          <Button variant="accent" size="lg" tabIndex={-1}>
            Nova comunicação de indisponibilidade
          </Button>
        </Link>
      </div>
    </section>
  );
}
