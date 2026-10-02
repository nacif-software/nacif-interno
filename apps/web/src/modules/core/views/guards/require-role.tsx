import type { Role } from '@nacif/shared';
import { Navigate, Outlet } from 'react-router';
import { useCurrentUser } from '../../controllers/use-session';

export function RequireRole({ roles }: { roles: Role[] }) {
  const user = useCurrentUser();
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
