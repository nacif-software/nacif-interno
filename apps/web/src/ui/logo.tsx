import { Link } from 'react-router';
import logo from '@/assets/nacif-logo.webp';
import { cn } from '@/lib/cn';

/** Marca Nacif (a mesma do site da empresa). Altura por tamanho; a largura segue a proporção. */
export function Logo({
  size = 'md',
  to = '/',
  className,
}: {
  size?: 'lg' | 'md' | 'sm';
  to?: string | null;
  className?: string;
}) {
  const image = (
    <img
      src={logo}
      alt="Nacif"
      width={498}
      height={80}
      className={cn(
        'w-auto select-none',
        size === 'lg' ? 'h-[26px]' : size === 'md' ? 'h-5' : 'h-[18px]',
      )}
    />
  );
  if (to === null) return <span className={cn('inline-flex', className)}>{image}</span>;
  return (
    <Link to={to} className={cn('inline-flex', className)} aria-label="Nacif, ir para o início">
      {image}
    </Link>
  );
}
