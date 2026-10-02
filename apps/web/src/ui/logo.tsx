import { Link } from 'react-router';
import { cn } from '@/lib/cn';

export function Logo({
  size = 'md',
  to = '/',
  className,
}: {
  size?: 'lg' | 'md' | 'sm';
  to?: string | null;
  className?: string;
}) {
  const cls = cn(
    'font-bold tracking-[-0.04em] leading-none text-brand hover:text-brand',
    size === 'lg' ? 'text-[26px]' : size === 'md' ? 'text-[20px]' : 'text-[18px]',
    className,
  );
  if (to === null) return <span className={cls}>NACIF</span>;
  return (
    <Link to={to} className={cls} aria-label="Nacif, ir para o início">
      NACIF
    </Link>
  );
}
