import { Navigate, Outlet, useLocation } from 'react-router';
import { SkeletonCard } from '@/ui';
import { useSession } from '../../controllers/use-session';

export function RequireAuth() {
  const { user, isLoading } = useSession();
  const location = useLocation();
  if (isLoading) {
    return (
      <div className="mx-auto max-w-[720px] p-10">
        <SkeletonCard />
      </div>
    );
  }
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <Outlet />;
}
