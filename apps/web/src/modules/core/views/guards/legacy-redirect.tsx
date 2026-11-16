import { generatePath, Navigate, useLocation, useParams } from 'react-router';

/**
 * Redireciona uma rota antiga (segmentos em português) para a nova, preservando parâmetros
 * (`:code`, `:userId`, `:token`), query string e hash. Temporário: links já distribuídos
 * (definição de senha, detalhes colados em conversas). Remover numa limpeza futura (issue #46).
 */
export function LegacyRedirect({ to }: { to: string }) {
  const params = useParams();
  const { search, hash } = useLocation();
  return <Navigate to={`${generatePath(to, params)}${search}${hash}`} replace />;
}
