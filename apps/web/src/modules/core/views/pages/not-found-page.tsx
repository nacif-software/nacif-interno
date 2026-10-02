import { Link } from 'react-router';
import { Logo } from '@/ui';

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-10 text-center">
      <Logo size="lg" />
      <h1 className="text-section-title">Página não encontrada</h1>
      <Link to="/" className="text-[15px] font-semibold">
        Voltar ao início
      </Link>
    </div>
  );
}
