import type { ServiceDescriptor } from '@nacif/shared';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';
import { Badge, Card } from '@/ui';

export function ServiceCard({ service }: { service: ServiceDescriptor }) {
  const available = service.status === 'available';
  const body = (
    <Card
      className={cn(
        'flex h-full flex-col gap-3 p-7 transition-colors',
        available ? 'hover:border-brand' : 'opacity-70',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-card-title">{service.name}</h2>
        {!available && <Badge tone="neutral">Em breve</Badge>}
      </div>
      <p className="text-[15px] leading-[1.55] text-ink-muted">{service.description}</p>
      {available && (
        <span className="mt-auto pt-2 text-[14px] font-semibold text-brand">Abrir</span>
      )}
    </Card>
  );
  if (!available) return <div aria-disabled="true">{body}</div>;
  return (
    <Link to={service.path} className="text-inherit hover:text-inherit">
      {body}
    </Link>
  );
}
