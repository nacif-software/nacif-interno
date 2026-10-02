import { SkeletonCard } from '@/ui';
import { useServices } from '../../controllers/use-services';
import { useCurrentUser } from '../../controllers/use-session';
import { ServiceCard } from '../components/service-card';

export function HomePage() {
  const user = useCurrentUser();
  const services = useServices();
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <span className="text-eyebrow text-brand">Nacif · sistemas internos</span>
        <h1 className="text-section-title md:text-screen-title">Serviços</h1>
        <p className="text-[16px] leading-[1.55] text-ink-muted">
          Olá, {user.name.split(' ')[0]}. Escolha um serviço para começar.
        </p>
      </div>
      {services.isPending ? (
        <SkeletonCard />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.data?.map((s) => (
            <ServiceCard key={s.slug} service={s} />
          ))}
        </div>
      )}
    </div>
  );
}
