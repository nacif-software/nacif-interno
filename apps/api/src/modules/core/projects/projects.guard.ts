import { ValidationError } from '../../../infra/http/errors';
import { projectsRepository } from './projects.repository';

/** Garante que todos os ids são de projetos ativos; devolve a lista sem repetição. */
export async function assertActiveProjects(projectIds: string[]): Promise<string[]> {
  const ids = [...new Set(projectIds)];
  const found = await projectsRepository.findActiveByIds(ids);
  const invalid = ids.filter((id) => !found.some((p) => p.id === id));
  if (invalid.length > 0) {
    throw new ValidationError('Projeto inválido ou inativo.', [
      { path: 'body.projectIds', message: 'Projeto inválido ou inativo.', invalid },
    ]);
  }
  return ids;
}
